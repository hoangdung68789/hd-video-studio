# Đo chữ trên video bằng dò khung chữ (RapidOCR, chỉ phần dò) — dùng chung cho VIDEO MẪU và BẢN DỰNG.
# python do_chu.py <video> <out.json> [--crop x,y,w,h theo tỉ lệ 0–1] [--fps 10]
# Ra: mỗi vệt chữ: vao, ra (giây), hop (x,y,w,h % khung), mau (hex trung vị nét chữ), kieu_vao/kieu_ra (đo từ khung).
import json, subprocess, sys, argparse
import numpy as np
from rapidocr_onnxruntime import RapidOCR

ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("out")
ap.add_argument("--crop", default=None); ap.add_argument("--fps", type=float, default=10)
A = ap.parse_args()
W = 540
vf = f"fps={A.fps}"
if A.crop:
    x, y, w, h = [float(v) for v in A.crop.split(",")]
    vf += f",crop=iw*{w}:ih*{h}:iw*{x}:ih*{y}"
vf += f",scale={W}:-2"
pr = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", A.video], capture_output=True, text=True).stdout.split(",")
iw, ih = int(pr[0]), int(pr[1])
cw, ch = (iw * w, ih * h) if A.crop else (iw, ih)
H = int(round(W * ch / cw / 2) * 2)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", A.video, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
eng = RapidOCR()
boxes = []  # (khung, x0,y0,x1,y1)
for i, f in enumerate(fr):
    res, _ = eng(f[:, :, ::-1], use_det=True, use_cls=False, use_rec=False)
    for b in (res or []):
        p = np.array(b if not isinstance(b[0][0], (list, tuple)) else b[0])
        x0, y0 = p.min(0); x1, y1 = p.max(0)
        if (x1 - x0) * (y1 - y0) > 80: boxes.append((i, float(x0), float(y0), float(x1), float(y1)))
def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0])); iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - ix * iy
    return ix * iy / u if u else 0
tracks = []
for k, *bb in boxes:
    best = None
    for t in tracks:
        if 0 < k - t["k"][-1] <= 3 and iou(t["b"][-1], bb) > 0.25 and t["k"][-1] != k:
            best = t; break
    if best: best["k"].append(k); best["b"].append(bb)
    else: tracks.append(dict(k=[k], b=[bb]))
def mau(k, b):
    x0, y0, x1, y1 = [int(v) for v in b]; px = fr[k, max(0, y0):y1, max(0, x0):x1].reshape(-1, 3).astype(float)
    if len(px) < 10: return None
    lum = px @ [0.299, 0.587, 0.114]; med = np.median(lum)
    sel = px[np.abs(lum - med) > 40]  # nét chữ = điểm ảnh khác nền nhiều nhất
    sel = sel[np.argsort(-np.abs(sel @ [0.299, 0.587, 0.114] - med))][: max(10, len(sel) // 3)] if len(sel) else px
    return "#%02X%02X%02X" % tuple(int(v) for v in np.median(sel, 0))
def kieu(bs, dau=True):
    if len(bs) < 3: return "cat_cung"
    seq = bs[:5] if dau else bs[-5:][::-1]
    w0, w1 = seq[0][2] - seq[0][0], seq[-1][2] - seq[-1][0]
    cx0, cx1 = (seq[0][0] + seq[0][2]) / 2, (seq[-1][0] + seq[-1][2]) / 2
    cy0, cy1 = (seq[0][1] + seq[0][3]) / 2, (seq[-1][1] + seq[-1][3]) / 2
    if abs(seq[0][0] - seq[-1][0]) < 4 and w0 < 0.7 * w1: return "go_chu_trai_sang_phai"
    if w0 < 0.85 * w1 and abs(cx0 - cx1) < 6: return "phong_to" if dau else "thu_nho"
    if abs(cy0 - cy1) > 8: return ("truot_len" if cy0 > cy1 else "truot_xuong") if dau else ("truot_len" if cy0 < cy1 else "truot_xuong")
    if abs(cx0 - cx1) > 8: return ("truot_trai" if cx0 > cx1 else "truot_phai")
    return "hien_tai_cho"
out = []
for t in tracks:
    if len(t["k"]) < 4: continue  # <0,4 s là nhiễu
    b = np.median(np.array(t["b"]), 0)
    mid = t["k"][len(t["k"]) // 2]
    out.append(dict(vao=round(t["k"][0] / A.fps, 2), ra=round((t["k"][-1] + 1) / A.fps, 2),
                    hop=[round(b[0] / W * 100, 1), round(b[1] / H * 100, 1), round((b[2] - b[0]) / W * 100, 1), round((b[3] - b[1]) / H * 100, 1)],
                    mau=mau(mid, t["b"][len(t["k"]) // 2]), kieu_vao=kieu(t["b"]), kieu_ra=kieu(t["b"], False)))
# gộp các dòng cùng xuất hiện (±0,15 s) và chồng dọc gần nhau thành một cụm chữ
out.sort(key=lambda o: (o["vao"], o["hop"][1]))
cum = []
for o in out:
    c = next((c for c in cum if abs(c["vao"] - o["vao"]) <= 0.15 and abs(c["dong"][-1]["hop"][1] - o["hop"][1]) < 25), None)
    (c["dong"].append(o) if c else cum.append(dict(vao=o["vao"], dong=[o])))
for c in cum: c["ra"] = max(d["ra"] for d in c["dong"])
json.dump(dict(video=A.video, fps=A.fps, crop=A.crop, so_cum=len(cum), cum=cum), open(A.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("vệt", len(out), "· cụm chữ", len(cum))
