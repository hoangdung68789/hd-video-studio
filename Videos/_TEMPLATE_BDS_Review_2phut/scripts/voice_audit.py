# Find pauses and non-word sounds (fillers: à, ừm, ờ…) inside the kept voice ranges of each host clip.
# Re-transcribes each clip with a filler-biased prompt, then compares word coverage with the energy envelope.
import glob, json, os, sys
for p in glob.glob(os.path.join(sys.prefix, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(p); os.environ["PATH"] = p + os.pathsep + os.environ["PATH"]
from pathlib import Path
import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
import sys; sys.path.insert(0, str(ROOT))
import project as P
RANGES = {c: P.VOICE_AUDIT_RANGES.get(c, [(0.0, 1e9)]) for c in P.HOSTS}
model = WhisperModel("large-v3", device="cuda", compute_type="float16")
rep = {}
for cid, rngs in RANGES.items():
    wav = ROOT / "work" / "audio" / f"voice_{cid}.wav"
    segs, _ = model.transcribe(str(wav), language="vi", beam_size=5, word_timestamps=True,
                               initial_prompt="Ừm, à, ờ, ừ, thì, à thì, ờ ờ. Nói tự nhiên có ậm ừ.", vad_filter=False)
    words = [(w.start, w.end, w.word.strip()) for s in segs for w in s.words]
    x, sr = sf.read(wav, dtype="float32")
    hop = int(0.01 * sr)
    rms = np.sqrt(np.convolve(x ** 2, np.ones(hop * 3) / (hop * 3), "same"))[::hop]
    db = 20 * np.log10(rms + 1e-9)
    thr = np.percentile(db, 90) - 24          # 24 dB under speech level = silence
    voiced = db > thr
    cover = np.zeros_like(voiced)
    for s, e, _ in words:
        cover[int((s - 0.04) * 100):int((e + 0.04) * 100)] = True
    out = {"words": " ".join(f"{w}@{s:.2f}-{e:.2f}" for s, e, w in words if any(a <= s < b for a, b in rngs)),
           "pauses": [], "unworded": [], "fillers": []}
    for a, b in rngs:
        ws = [w for w in words if a <= w[0] < b]
        for (s0, e0, w0), (s1, e1, w1) in zip(ws, ws[1:]):
            # real silence inside the gap
            g = voiced[int(e0 * 100):int(s1 * 100)]
            if s1 - e0 > 0.25:
                out["pauses"].append({"from": round(e0, 2), "to": round(s1, 2), "len": round(s1 - e0, 2),
                                      "silent": round(float((~g).mean()) if len(g) else 0, 2), "between": f"{w0} | {w1}"})
        for w in ws:
            if w[2].lower().strip(",.") in ("à", "ừm", "ờ", "ừ", "ừ.", "à,", "ờ,", "á", "ơ", "hừm", "ừm,"):
                out["fillers"].append({"t": round(w[0], 2), "e": round(w[1], 2), "w": w[2]})
        # voiced but no word for > 0.15 s
        i, n = int(a * 100), min(int(b * 100), len(voiced))
        while i < n:
            if voiced[i] and not cover[i]:
                j = i
                while j < n and voiced[j] and not cover[j]:
                    j += 1
                if j - i >= 15:
                    out["unworded"].append({"from": i / 100, "to": j / 100})
                i = j
            i += 1
    rep[cid] = out
json.dump(rep, open(ROOT / "work" / "voice_audit.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for cid, o in rep.items():
    print("==", cid)
    print(" words:", o["words"])
    print(" pauses:", [(p["from"], p["to"], p["len"], p["silent"], p["between"]) for p in o["pauses"]])
    print(" fillers:", o["fillers"], " unworded:", o["unworded"])
