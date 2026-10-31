# Music prep: project.MUSIC_SRC -> work/audio/bgm.wav (48 kHz stereo) + work/audio/beats.npy (beat times, s).
# beats.npy is rotated so BEATS[1::4] (what build.py treats as bar starts) is the strongest beat phase.
# Prints the loudest 4-bar stretches = candidates for MUSIC_ANCHOR (music-only bridges should land on a drop).
import subprocess, sys
from pathlib import Path
import numpy as np
import librosa

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import project as P

A = ROOT / "work" / "audio"; A.mkdir(parents=True, exist_ok=True)
wav = A / "bgm.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(P.MUSIC_SRC), "-map", "0:a:0", "-ac", "2", "-ar", "48000",
                "-c:a", "pcm_s16le", str(wav)], check=True)
y, sr = librosa.load(str(wav), sr=22050, mono=True)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
onset = librosa.onset.onset_strength(y=y, sr=sr)
beats = librosa.frames_to_time(frames, sr=sr)
phase = int(np.argmax([onset[frames[p::4]].mean() for p in range(4)]))
beats = beats[(phase - 1) % 4:]                       # strongest phase -> index 1
np.save(A / "beats.npy", beats)
print(f"tempo {float(np.atleast_1d(tempo)[0]):.1f} BPM, {len(beats)} beats, song {len(y) / sr:.1f}s")

down = beats[1::4]
rms = librosa.feature.rms(y=y)[0]; rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
score = [(float(rms[(rt >= d) & (rt < d + 4 * 4 * 60 / max(float(np.atleast_1d(tempo)[0]), 1))].mean()), float(d)) for d in down]
picked = []
for sc, d in sorted(score, reverse=True):
    if all(abs(d - q) > 9 for _, q in picked):
        picked.append((sc, d))
    if len(picked) == 8:
        break
print("MUSIC_ANCHOR candidates (downbeat s, loudness):", ", ".join(f"{d:.2f} ({20 * np.log10(sc + 1e-9):.1f} dB)" for sc, d in sorted(picked, key=lambda x: x[1])))
