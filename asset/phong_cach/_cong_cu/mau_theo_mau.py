# Màu "theo video mẫu" (lựa chọn 2 trong luật màu 02/11) — hai bước, dùng cho mọi template:
#   python mau_theo_mau.py do <video_mau.mp4> <out_mau.json> [--crop x,y,w,h]   → đo thống kê Lab (trung bình, độ lệch) của hình mẫu
#   python mau_theo_mau.py lut <mau.json> <footage.mp4> <out.cube>                → LUT 33³ đưa thống kê footage về đúng mẫu (Reinhard, Lab)
# Không tự áp: /dung-video vẫn hỏi Dũng 3 lựa chọn màu; file .cube chỉ dùng khi Dũng chọn "theo video mẫu".
import json, subprocess, sys
import numpy as np

def frames(v, crop=None, n=60):
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", v], capture_output=True, text=True).stdout)
    vf = (f"crop=iw*{crop[2]}:ih*{crop[3]}:iw*{crop[0]}:ih*{crop[1]}," if crop else "") + f"fps={n / d},scale=96:-2"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(float) / 255
def srgb2lab(c):
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], 1)
def lab2srgb(L):
    fy = (L[:, 0] + 16) / 116; fx = fy + L[:, 1] / 500; fz = fy - L[:, 2] / 200
    f = np.stack([fx, fy, fz], 1); xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.95047, 1.0, 1.08883])
    M = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]])
    c = np.clip(xyz @ M.T, 0, 1)
    return np.where(c > 0.0031308, 1.055 * c ** (1 / 2.4) - 0.055, 12.92 * c)
if sys.argv[1] == "do":
    crop = [float(x) for x in sys.argv[sys.argv.index("--crop") + 1].split(",")] if "--crop" in sys.argv else None
    lab = srgb2lab(frames(sys.argv[2], crop))
    json.dump(dict(nguon=sys.argv[2], tb=lab.mean(0).round(3).tolist(), lech=lab.std(0).round(3).tolist(), nhan="Đã đo (Lab, 60 khung đều)"),
              open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("Lab TB", lab.mean(0).round(1), "lệch", lab.std(0).round(1))
else:
    M = json.load(open(sys.argv[2], encoding="utf-8")); src = srgb2lab(frames(sys.argv[3]))
    mu_s, sd_s, mu_t, sd_t = src.mean(0), src.std(0) + 1e-6, np.array(M["tb"]), np.array(M["lech"])
    N = 33; g = np.linspace(0, 1, N); b, gg, r = np.meshgrid(g, g, g, indexing="ij")
    rgb = np.stack([r.ravel(), gg.ravel(), b.ravel()], 1)
    out = lab2srgb((srgb2lab(rgb) - mu_s) / sd_s * sd_t + mu_t)
    with open(sys.argv[4], "w") as f:
        f.write(f'TITLE "theo_video_mau"\nLUT_3D_SIZE {N}\n')
        for p in out: f.write(f"{p[0]:.6f} {p[1]:.6f} {p[2]:.6f}\n")
    print("đã ghi", sys.argv[4])
