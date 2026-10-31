# Per-clip exposure trim on top of the master LUT (Dũng nudged some clips' brightness in CapCut).
# Fits a per-channel gain on the LUT output against project.LUT_REF, bakes luts/clip/<id>.cube.
import json, numpy as np
from fit_lut import ORDER, CUTS, SKIP, REF, frames, src_path, ROOT, P

N = 33
lines = [l for l in open(ROOT / P.MASTER_LUT) if l[:1].isdigit() or l[:1] == "-"]
lut = np.array([[float(x) for x in l.split()] for l in lines[-N ** 3:]])


def apply(s):
    g = s * (N - 1); i0 = np.clip(np.floor(g).astype(int), 0, N - 2); f = g - i0
    p = np.zeros_like(s)
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                p += w[:, None] * lut[(i0[:, 0] + dx) + (i0[:, 1] + dy) * N + (i0[:, 2] + dz) * N * N]
    return p


rep = {}
(ROOT / "luts" / "clip").mkdir(exist_ok=True)
for i, cid in enumerate(ORDER):
    if cid in SKIP:
        gain = np.ones(3)
    else:
        d = CUTS[i + 1] - CUTS[i] - 0.4
        s = frames(src_path(cid), 0.2, d); r = frames(REF, CUTS[i] + 0.2, d)
        n = min(len(s), len(r)); s = s[:n].reshape(-1, 3); r = r[:n].reshape(-1, 3)
        p = apply(s)
        m = (p.max(1) < 0.97) & (r.max(1) < 0.97)  # ignore clipped highlights
        gain = (p[m] * r[m]).sum(0) / (p[m] ** 2).sum(0)
        gain = np.full(3, gain.mean()) if np.ptp(gain) < 0.02 else gain
        err = np.abs(np.clip(p * gain, 0, 1) - r).mean() * 255
        rep[cid] = {"gain": [round(float(g), 3) for g in gain], "mae8_after": round(float(err), 2)}
    out = np.clip(lut * gain, 0, 1)
    with open(ROOT / "luts" / "clip" / f"{cid}.cube", "w", newline="\n") as fh:
        fh.write(f'TITLE "{P.NAME} {cid} CapCut match"\nLUT_3D_SIZE {N}\n')
        for v in out:
            fh.write(f"{v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
json.dump(rep, open(ROOT / "work" / "clip_trims.json", "w"), indent=1)
print(json.dumps(rep))
