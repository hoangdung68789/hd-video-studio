# Bài nhạc ngắn hơn video: giữ phần đầu, lặp đoạn cao trào A–B (số ô nhịp nguyên, nối 40 ms) N lần.
# project.MUSIC_LOOP = (A, B, N, "nguồn.wav"); DU-AN-MAU: (15.58, 32.86, 4) = phách 38–82 = 11 ô nhịp. Ra work/audio/music_loop.wav.
import numpy as np, soundfile as sf
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
import sys; sys.path.insert(0, str(ROOT)); import project as P
A, B, N, SRC = P.MUSIC_LOOP
x, sr = sf.read(ROOT / SRC, dtype="float32")
if x.ndim == 1: x = np.stack([x, x], 1)
xf = int(0.04 * sr)
out = x[:int(B * sr)].copy()
seg = x[int(A * sr) - xf:int(B * sr)].copy()
for _ in range(N):
    ramp = np.linspace(0, 1, xf)[:, None]
    out[-xf:] = out[-xf:] * (1 - ramp) + seg[:xf] * ramp
    out = np.concatenate([out, seg[xf:]])
sf.write(ROOT / "work/audio/music_loop.wav", out, sr)
print(f"{len(out)/sr:.1f}s")
