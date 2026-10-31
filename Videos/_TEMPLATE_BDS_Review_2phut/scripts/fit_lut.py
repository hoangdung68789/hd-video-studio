# OPTIONAL: fit a new 3D LUT raw D-Log -> Dũng's CapCut grade of THIS footage (project.LUT_REF).
# LUT_REF = all clips graded in CapCut; LUT_CUTS = cut times in it; LUT_ORDER = clip id per segment.
import subprocess, sys, json, numpy as np
from pathlib import Path
from scipy.sparse import coo_matrix, vstack, identity
from scipy.sparse.linalg import lsqr

ROOT = Path(__file__).resolve().parents[1]
import sys; sys.path.insert(0, str(ROOT))
import project as P
FOOT, HOST, REF = P.FOOTAGE, P.HOSTDIR, P.LUT_REF
W, H = 108, 192
CUTS, ORDER, SKIP = P.LUT_CUTS, P.LUT_ORDER, P.LUT_SKIP


def src_path(cid):
    m = list(FOOT.glob(f"DJI_*_{cid}_D.MP4")) or list(HOST.glob(f"*/DJI_*_{cid}_D.MP4"))
    return str(m[0])


def frames(path, ss, dur):
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{ss:.3f}", "-t", f"{dur:.3f}", "-i", path,
           "-map", "0:v:0", "-vf", f"fps=2,scale={W}:{H}:flags=area", "-pix_fmt", "rgb48le", "-f", "rawvideo", "-"]
    b = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(b, np.uint16).reshape(-1, H, W, 3).astype(np.float32) / 65535
    return a


def collect():
    X, Y, per = [], [], {}
    for i, cid in enumerate(ORDER):
        if cid in SKIP:
            continue
        d = CUTS[i + 1] - CUTS[i] - 0.4
        s = frames(src_path(cid), 0.2, d)
        r = frames(REF, CUTS[i] + 0.2, d)
        n = min(len(s), len(r))
        s, r = s[:n], r[:n]
        # drop pixels where neighbours disagree a lot (motion / edges)
        X.append(s.reshape(-1, 3)); Y.append(r.reshape(-1, 3)); per[cid] = (s.reshape(-1, 3), r.reshape(-1, 3))
        print(cid, n, "frames", file=sys.stderr)
    return np.concatenate(X), np.concatenate(Y), per


def fit(X, Y, N=33, lam=0.5):
    g = X * (N - 1)
    i0 = np.clip(np.floor(g).astype(int), 0, N - 2)
    f = g - i0
    rows, cols, vals = [], [], []
    M = len(X)
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                idx = (i0[:, 0] + dx) + (i0[:, 1] + dy) * N + (i0[:, 2] + dz) * N * N
                rows.append(np.arange(M)); cols.append(idx); vals.append(w)
    A = coo_matrix((np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(M, N ** 3)).tocsr()
    # smoothness: second differences along each axis
    L = []
    ids = np.arange(N ** 3).reshape(N, N, N)  # [b][g][r] since idx = r + g*N + b*N*N
    for ax in range(3):
        a = np.moveaxis(ids, ax, 0)
        c0, c1, c2 = a[:-2].ravel(), a[1:-1].ravel(), a[2:].ravel()
        k = len(c0)
        L.append(coo_matrix((np.concatenate([np.ones(k), -2 * np.ones(k), np.ones(k)]),
                             (np.tile(np.arange(k), 3), np.concatenate([c0, c1, c2]))), shape=(k, N ** 3)))
    L = vstack(L).tocsr()
    s = np.sqrt(lam * M / N ** 3)
    Aall = vstack([A, L * s]).tocsr()
    out = np.zeros((N ** 3, 3))
    for ch in range(3):
        b = np.concatenate([Y[:, ch], np.zeros(L.shape[0])])
        out[:, ch] = lsqr(Aall, b, atol=1e-7, btol=1e-7, iter_lim=3000)[0]
    return np.clip(out, 0, 1), A


def write_cube(path, lut, N, title):
    with open(path, "w", newline="\n") as fh:
        fh.write(f'TITLE "{title}"\nLUT_3D_SIZE {N}\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\n')
        for v in lut:
            fh.write(f"{v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")


if __name__ == "__main__":
    N = 33
    X, Y, per = collect()
    sel = np.random.default_rng(1).choice(len(X), min(len(X), 600000), replace=False)
    lut, _ = fit(X[sel], Y[sel], N)
    out = ROOT / P.MASTER_LUT
    out.parent.mkdir(exist_ok=True)
    write_cube(out, lut, N, f"{P.NAME} D-Log to CapCut grade (Dung)")
    # per-clip error (mean abs, 8-bit units)
    rep = {}
    for cid, (s, r) in per.items():
        g = s * (N - 1); i0 = np.clip(np.floor(g).astype(int), 0, N - 2); f = g - i0
        p = np.zeros_like(s)
        for dx in (0, 1):
            for dy in (0, 1):
                for dz in (0, 1):
                    w = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                    p += w[:, None] * lut[(i0[:, 0] + dx) + (i0[:, 1] + dy) * N + (i0[:, 2] + dz) * N * N]
        rep[cid] = {"mae8": round(float(np.abs(p - r).mean() * 255), 2),
                    "bias8": [round(float(x * 255), 2) for x in (p - r).mean(0)]}
    json.dump(rep, open(ROOT / "work" / "lut_fit_report.json", "w"), indent=1)
    print(json.dumps(rep))
