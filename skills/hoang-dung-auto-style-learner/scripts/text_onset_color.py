# mốc xuất hiện/biến mất của pixel theo màu, 10 fps. dùng: mau_do.py video y0 y1 kieu(cyan|red) nguong
import sys, subprocess, numpy as np
src, y0, y1, k, th = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4], float(sys.argv[5])
W, H = 108, 192
raw = subprocess.run(["ffmpeg","-v","error","-i",src,"-vf",f"fps=10,scale={W}:{H}","-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)[:, int(y0*H):int(y1*H)].astype(int)
r, g, b = f[..., 0], f[..., 1], f[..., 2]
m = ((g > 170) & (b > 160) & (r < 110)) if k == "cyan" else ((r > 190) & (g < 90) & (b < 90))
cov = m.mean((1, 2)); on = cov > th; out = []
for i in range(1, len(on)):
    if on[i] != on[i-1]: out.append(f"{'+' if on[i] else '-'}{i/10:.1f}")
print(" ".join(out))
