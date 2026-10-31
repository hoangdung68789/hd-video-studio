# Vùng đầu/mặt người dẫn theo thời gian (Dũng 29/10: cấm chữ che mặt người dẫn). Tách người bằng
# `hyperframes remove-background` (u2net_human_seg, chạy tại máy) trên proxy 4 fps 270x480, rồi lấy hộp đầu:
# đỉnh mặt nạ -> xuống 1,35 x bề ngang đầu (đo ở dải 6% chiều cao dưới đỉnh), nới 20%.
# Ra work/faces.json {clip: [[t, x0, y0, x1, y1], ...]} theo toạ độ UI 1080x1920. usage: face_zones.py <id>...
import json, subprocess, sys
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
W, H, FPS = 270, 480, 4
out = ROOT / "work" / "faces.json"
res = json.load(open(out)) if out.exists() else {}
tmp = ROOT / "work" / "faces"; tmp.mkdir(parents=True, exist_ok=True)
for cid in sys.argv[1:]:
    src = ROOT / "hf" / "assets" / "video" / f"{cid}.mp4"
    px, mov = tmp / f"{cid}_px.mp4", tmp / f"{cid}_fg.mov"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", f"fps={FPS},scale={W}:{H}", "-an", "-c:v", "libx264", "-crf", "18", str(px)], check=True)
    subprocess.run(f'npx --yes hyperframes@0.8.171 remove-background "{px}" -o "{mov}"', shell=True, check=True, cwd=ROOT / "hf")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mov), "-vf", "alphaextract,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W) > 128
    k = 1080 / W
    boxes = []
    for i, m in enumerate(fr):
        rows = np.where(m.sum(1) > 3)[0]
        if not len(rows):
            continue
        top = rows[0]
        band = m[top:top + int(0.06 * H)]
        cols = np.where(band.any(0))[0]
        hw = max(cols[-1] - cols[0], 20)
        cx = (cols[-1] + cols[0]) / 2
        x0, x1 = cx - hw * 0.6, cx + hw * 0.6
        y0, y1 = top - hw * 0.1, top + hw * 1.35 * 1.2
        boxes.append([round(i / FPS, 2), round(x0 * k), round(y0 * k), round(x1 * k), round(y1 * k)])
    res[cid] = boxes
    print(cid, len(boxes), "khung, ví dụ", boxes[::8][:5])
json.dump(res, open(out, "w"), indent=0)
