# Mix: voice -14 LUFS; music bed -28 LUFS under speech, -26 (low, Dũng 26/10) under the hook line, -11 LUFS in music-only bridges
# (Dũng's approved levels for DU-AN-MAU, 25/10); ramps up 0.6s into bridges, drops fast when he speaks again.
# usage: mix.py normvoice   -> work/audio/voice_n.wav
#        mix.py mix         -> hf/assets/audio/mix.wav (+ work/audio/music_bed.wav) and per-lane loudness report
import json, re, subprocess, sys, tempfile, os
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
A = ROOT / "work" / "audio"
SR = 48000
TARGET = {"voice": -28.0, "hook": -26.0, "music": -11.0}


def lufs(x):
    f = tempfile.NamedTemporaryFile(suffix=".wav", delete=False); f.close()
    sf.write(f.name, x, SR)
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", f.name, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    os.unlink(f.name)
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)[-1])
    return i, tp


def db(x): return 10 ** (x / 20)


if sys.argv[1] == "normvoice":
    v, _ = sf.read(A / "voice_tl.wav", dtype="float32")
    lanes = [L for L in json.load(open(A / "lanes.json")) if L["kind"] != "music"]
    groups = [[L["t0"], L["t1"]] for L in lanes]
    for t0, t1 in groups:  # each take to -14 LUFS so the sections match
        sl = slice(int(t0 * SR), int(t1 * SR))
        i, _ = lufs(v[sl])
        v[sl] *= db(-14.0 - i)
        print(f"voice {t0:.1f}-{t1:.1f}: {i:.1f} -> -14.0 LUFS")
    sf.write(A / "voice_n.wav", v, SR)
    sys.exit()

v, _ = sf.read(A / "voice_n.wav", dtype="float32")
m, _ = sf.read(A / "music_tl.wav", dtype="float32")
s, _ = sf.read(ROOT / "work" / "sfx" / "sfx.wav", dtype="float32")
n = len(m)
v = np.pad(v, (0, max(0, n - len(v))))[:n]
s = s if s.ndim == 2 else np.stack([s, s], 1)
s = np.pad(s, ((0, max(0, n - len(s))), (0, 0)))[:n]
lanes = json.load(open(A / "lanes.json"))
words = json.load(open(ROOT / "work" / "sfx" / "words.json", encoding="utf-8"))

# per-lane gain (dB) measured on that lane's own music
gain = []
for L in lanes:
    seg = m[int(L["t0"] * SR):int(L["t1"] * SR)]
    i, _ = lufs(seg)
    gain.append(TARGET[L["kind"]] - i)
env = np.zeros(n, np.float32)
for L, g in zip(lanes, gain):
    env[int(L["t0"] * SR):int(L["t1"] * SR)] = g
env[int(lanes[-1]["t1"] * SR):] = gain[-1]
# transitions: speech -> bridge ramps up over 0.6s ending on the downbeat (never before the last word ends);
# bridge -> speech drops in 0.12s ending as the voice starts; hook -> speech eases down 0.6s
for k in range(1, len(lanes)):
    a, b = lanes[k - 1], lanes[k]
    t = b["t0"]
    if b["kind"] == "music":
        last = max([w[1] for w in words if w[0] < t] or [t - 0.6])
        t0 = max(t - 0.6, min(last, t - 0.15))
        r0, r1 = t0, t
    elif a["kind"] == "music":
        r0, r1 = t - 0.02, t + 0.10
    else:
        r0, r1 = t, t + 0.6
    i0, i1 = int(r0 * SR), int(r1 * SR)
    g0, g1 = gain[k - 1], gain[k]
    env[i0:i1] = g0 + (g1 - g0) * (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, i1 - i0)))
# light dips under each SFX hit so it sits ≥4.5 dB above the bed (dung-text-fx 08-sfx: down 0.25s, hold +0.6s, up 0.8s)
plan = json.load(open(ROOT / "work" / "sfx" / "sfx_plan.json", encoding="utf-8"))
hits = sorted({round(e["t"], 3) for e in plan["events"] if e["layer"] == "dan"})
dip = np.zeros(n, np.float32)
for t in hits:
    depth = -5.0 if any(L["kind"] != "voice" and L["t0"] - 0.3 <= t < L["t1"] for L in lanes) else -3.0
    for a, b, g0, g1 in ((t - 0.25, t, 0, depth), (t, t + 0.6, depth, depth), (t + 0.6, t + 1.4, depth, 0)):
        i0, i1 = max(0, int(a * SR)), min(n, int(b * SR))
        if i1 > i0:
            seg = g0 + (g1 - g0) * (0.5 - 0.5 * np.cos(np.linspace(0, np.pi, i1 - i0)))
            dip[i0:i1] = np.minimum(dip[i0:i1], seg)
env = env + dip
bed = m * db(env)[:, None]
sf.write(A / "music_bed.wav", bed, SR)
mix = bed + v[:, None] + s
sf.write(A / "mix_raw.wav", mix, SR, subtype="FLOAT")
(ROOT / "hf" / "assets" / "audio").mkdir(parents=True, exist_ok=True)
out = ROOT / "hf" / "assets" / "audio" / "mix.wav"   # brick-wall limiter at -1 dBFS instead of turning the whole mix down
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(A / "mix_raw.wav"), "-af", "alimiter=limit=0.89:attack=2:release=40:level=false",
                "-c:a", "pcm_s24le", str(out)], check=True)
mix, _ = sf.read(out, dtype="float32")

rep = {"mix": lufs(mix)}
for L in lanes:
    sl = slice(int((L["t0"] + 0.3) * SR), int((L["t1"] - 0.3) * SR))
    rep[f'{L["kind"]}@{L["t0"]:.1f}'] = {"music": round(lufs(bed[sl])[0], 1), "voice": round(lufs(v[sl])[0], 1) if L["kind"] != "music" else None}
json.dump(rep, open(A / "loudness.json", "w"), indent=1)
print(json.dumps(rep))
