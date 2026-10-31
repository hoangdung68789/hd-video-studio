# Word-level transcript of the host clips (fillers prompted so whisper keeps them). usage: transcribe.py [ids…] (default: project.HOSTS)
import glob, json, os, subprocess, sys
from pathlib import Path
for p in glob.glob(os.path.join(sys.prefix, "Lib", "site-packages", "nvidia", "*", "bin")):
    os.add_dll_directory(p); os.environ["PATH"] = p + os.pathsep + os.environ["PATH"]
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
import sys; sys.path.insert(0, str(ROOT))
import project as P
HOST = P.HOSTDIR
IDS = sys.argv[1:] or P.HOSTS
out = ROOT / "transcripts"; out.mkdir(exist_ok=True)
aud = ROOT / "work" / "audio"
model = WhisperModel("large-v3", device="cuda", compute_type="float16")
for mp4 in [p for p in sorted(HOST.glob("*/DJI_*.MP4")) if p.stem.split("_")[2] in IDS]:
    cid = mp4.stem.split("_")[2]
    wav = aud / f"voice_{cid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(mp4), "-map", "0:a:0", "-ac", "1", "-ar", "48000", str(wav)], check=True)
    srt = next(mp4.parent.glob("*.srt")).read_text(encoding="utf-8")
    prompt = "ừm, à, ờ, ừ. " + " ".join(l for l in srt.splitlines() if l and not l[0].isdigit())
    segs, _ = model.transcribe(str(wav), language="vi", beam_size=5, word_timestamps=True,
                               initial_prompt="ừm, à, ờ, ừ.", vad_filter=False)   # a long SRT prompt made whisper hallucinate (818); SRT wording is merged in build.py
    words = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in segs for w in s.words]
    json.dump(words, open(out / f"{cid}.json", "w", encoding="utf-8"), ensure_ascii=False)
    print(cid, " ".join(f"{w['w']}@{w['s']}" for w in words))
