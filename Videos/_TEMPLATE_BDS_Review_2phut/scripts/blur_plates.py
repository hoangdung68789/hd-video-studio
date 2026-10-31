# 2b: blur door plaques (possible house numbers) with simple NCC tracking. Boxes: project.BLUR.
# usage: blur_plates.py <clip id>. Rewrites hf/assets/video/<id>.mp4 from the graded clip; logs boxes to work/blur_<id>.json.
import json, subprocess, numpy as np
from pathlib import Path
from numpy.lib.stride_tricks import sliding_window_view as swv
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
import sys; sys.path.insert(0, str(ROOT))
import project as P
CID = sys.argv[1]
SRC = ROOT / "work" / f"{CID}_graded.mp4"
DST = ROOT / "hf" / "assets" / "video" / f"{CID}.mp4"
if not SRC.exists():                   # keep the clean graded clip once, blur from it every time
    import shutil; shutil.copy2(DST, SRC)
W, H = 1728, 3072
BOXES = P.BLUR[CID]["boxes"]  # x, y, w, h at frame START
START = P.BLUR[CID]["start"]
PAD = 0.2  # grow blur box 20%
S = 4      # tracking on 1/4 scale

dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(SRC), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
frames = []
while True:
    b = dec.stdout.read(W * H * 3)
    if len(b) < W * H * 3:
        break
    frames.append(np.frombuffer(b, np.uint8).reshape(H, W, 3))
small = [f[::S, ::S].mean(2).astype(np.float32) for f in frames]


def ncc_find(img, tpl, cx, cy, r=24):
    th, tw = tpl.shape
    x0, y0 = max(0, cx - r), max(0, cy - r)
    x1, y1 = min(img.shape[1] - tw, cx + r), min(img.shape[0] - th, cy + r)
    if x1 <= x0 or y1 <= y0:
        return None, 0
    win = swv(img[y0:y1 + th, x0:x1 + tw], (th, tw))
    t = (tpl - tpl.mean()) / (tpl.std() + 1e-6)
    m = win.mean((2, 3), keepdims=True); s = win.std((2, 3), keepdims=True) + 1e-6
    sc = (((win - m) / s) * t).mean((2, 3))
    iy, ix = np.unravel_index(sc.argmax(), sc.shape)
    return (x0 + ix, y0 + iy), float(sc.max())


track = {k: {} for k in BOXES}
for k, (x, y, w, h) in BOXES.items():
    # context template (3x box) tracks better than the tiny plaque itself
    cx, cy, cw, ch = (x - w) // S, (y - h) // S, 3 * w // S, 3 * h // S
    for direction in (1, -1):
        pos, tpl = (cx, cy), small[START][cy:cy + ch, cx:cx + cw]
        i = START
        while 0 <= i < len(frames):
            p, sc = ncc_find(small[i], tpl, *pos) if i != START else (pos, 1.0)
            if p is None or sc < 0.55:
                break
            pos = p
            track[k][i] = (int(p[0] * S + w), int(p[1] * S + h), w, h, round(sc, 2))
            tpl = 0.8 * tpl + 0.2 * small[i][p[1]:p[1] + ch, p[0]:p[0] + cw]  # slow template update
            i += direction

# after the tracker loses a plaque, keep blurring it on its last motion (wider box) until it leaves the frame,
# so the clip can be used as one ~5s shot (Dũng 26/10: street in front of the house)
for k, d in track.items():
    last = max(d)
    ks = sorted(i for i in d if i > last - 10)
    vx = (d[ks[-1]][0] - d[ks[0]][0]) / max(1, ks[-1] - ks[0]); vy = (d[ks[-1]][1] - d[ks[0]][1]) / max(1, ks[-1] - ks[0])
    x, y, w, h, _ = d[last]
    for i in range(last + 1, len(frames)):
        n = i - last
        nx, ny = int(x + vx * n), int(y + vy * n)
        grow = min(2.0, 1 + 0.02 * n)
        bw, bh = int(w * grow), int(h * grow)
        if nx + bw < 0 or nx > W:
            break
        d[i] = (nx - (bw - w) // 2, ny - (bh - h) // 2, bw, bh, 0.0)

# frames before START: the tracker can drift (plaque entering through the frame edge) -> use hand keyframes KEYS
# {frame: [x, y, w, h]} linearly interpolated up to START (project.BLUR[id]["keys"], optional)
KEYS = {int(f): v for f, v in P.BLUR[CID].get("keys", {}).items()}
if KEYS:
    for k, d in track.items():
        for i in [i for i in d if i < START]:
            del d[i]
        pts = sorted(KEYS.items()) + [(START, list(d[START][:4]))]
        for (f0, a), (f1, c) in zip(pts, pts[1:]):
            for i in range(f0, f1):
                u = (i - f0) / max(1, f1 - f0)
                d[i] = tuple(int(a[j] + (c[j] - a[j]) * u) for j in range(4)) + (0.0,)
FPS = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0",
                      str(SRC)], capture_output=True, text=True).stdout.strip()   # keep the source rate (was hard-coded 50 -> clip slowed)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", FPS,
                        "-i", "-", "-c:v", "h264_nvenc", "-preset", "p6", "-rc", "vbr", "-cq", "16", "-b:v", "90M", "-g", "10",
                        "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", str(DST)],
                       stdin=subprocess.PIPE)
for i, f in enumerate(frames):
    im = Image.fromarray(f)
    for k in track:
        if i in track[k]:
            x, y, w, h, _ = track[k][i]
            gx, gy = int(w * PAD), int(h * PAD)
            box = (max(0, x - gx), max(0, y - gy), min(W, x + w + gx), min(H, y + h + gy))
            if box[2] > box[0] and box[3] > box[1]:
                im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(14)), box[:2])
    enc.stdin.write(im.tobytes())
enc.stdin.close(); enc.wait()
json.dump({k: {str(i): v for i, v in d.items()} for k, d in track.items()}, open(ROOT / "work" / f"blur_{CID}.json", "w"))
print({k: (min(d), max(d)) if d else None for k, d in track.items()}, len(frames))
