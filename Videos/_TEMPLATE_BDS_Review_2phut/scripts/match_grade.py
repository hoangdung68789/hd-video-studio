# Clip gốc (phẳng) chưa có trong bản CapCut -> học đường cong màu từng kênh từ các cặp cùng cảnh (gốc ↔ đoạn CapCut đã chỉnh)
# rồi ghi luts/clip/<id>.cube để grade_clips.py dùng. usage: match_grade.py <id mới> <gốc>:<đoạn capcut> ...
import subprocess, sys
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT)); import project as P
ORIG = P.ORIG_DIR          # thư mục clip gốc (chưa chỉnh màu)
def px(path):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf", "fps=2,scale=108:192", "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
                       capture_output=True, check=True).stdout
    return np.frombuffer(b, np.uint8).reshape(-1, 3).astype(np.float32) / 255
new, pairs = sys.argv[1], [p.split(":") for p in sys.argv[2:]]
A = np.concatenate([px(next(ORIG.glob(f"DJI_*_{o}_D.MP4"))) for o, _ in pairs])
B = np.concatenate([px(ROOT / "hf" / "assets" / "video" / f"{c}.mp4") for _, c in pairs])
q = np.linspace(0, 1, 257)
curves = [np.interp(np.linspace(0, 1, 33), np.quantile(A[:, k], q), np.quantile(B[:, k], q)) for k in range(3)]
out = ROOT / "luts" / "clip" / f"{new}.cube"; out.parent.mkdir(parents=True, exist_ok=True)
L = ["TITLE \"match %s\"" % new, "LUT_3D_SIZE 33"]
for bi in range(33):
    for gi in range(33):
        for ri in range(33):
            L.append(f"{curves[0][ri]:.6f} {curves[1][gi]:.6f} {curves[2][bi]:.6f}")
out.write_text("\n".join(L) + "\n")
print("ok", out, [round(float(c[16]), 3) for c in curves])
