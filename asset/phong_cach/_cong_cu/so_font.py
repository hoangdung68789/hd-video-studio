# So font: vẽ đúng câu chữ bằng từng font ứng viên, so độ trùng nét (IoU) với chữ cắt từ khung video.
# python so_font.py <anh.png> "<câu chữ>" <sang|toi> [thư mục font ...] -> in 8 font khớp nhất
# anh.png: ảnh đã cắt sát cụm chữ (một dòng). sang = chữ sáng trên nền tối, toi = chữ tối trên nền sáng.
import sys, glob, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

img, text, mode = sys.argv[1], sys.argv[2], sys.argv[3]
dirs = sys.argv[4:] or [r"<HD_VIDEO_HOME>\Fonts\capcut"]
a = np.asarray(Image.open(img).convert("L")).astype(float)
thr = np.percentile(a, 80 if mode == "sang" else 20)
m = (a >= thr) if mode == "sang" else (a <= thr)
ys, xs = np.where(m); m = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
H, Wd = m.shape
def render(fp):
    try: f = ImageFont.truetype(fp, 200)
    except Exception: return None
    im = Image.new("L", (200 * len(text) + 200, 400), 0); d = ImageDraw.Draw(im)
    d.text((50, 50), text, font=f, fill=255)
    r = np.asarray(im) > 127
    if not r.any(): return None
    ys, xs = np.where(r); r = r[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return np.asarray(Image.fromarray(r.astype(np.uint8) * 255).resize((Wd, H))) > 127, r.shape[1] / r.shape[0]
res = []
for d in dirs:
    for fp in glob.glob(os.path.join(d, "*.[ot]t[fc]")) + glob.glob(os.path.join(d, "*.TTF")):
        r = render(fp)
        if r is None: continue
        g, ratio = r
        iou = (g & m).sum() / max(1, (g | m).sum())
        ar = min(ratio, Wd / H) / max(ratio, Wd / H)  # tỉ lệ ngang/dọc phải gần mẫu
        res.append((iou * ar, iou, ar, os.path.basename(fp)))
for s, i, ar, n in sorted(res, reverse=True)[:8]:
    print(f"{s:.3f}  iou={i:.3f} tỉ_lệ={ar:.2f}  {n}")
