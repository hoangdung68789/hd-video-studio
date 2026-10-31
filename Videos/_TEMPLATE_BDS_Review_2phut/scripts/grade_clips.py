# Bake the look into graded, silent H.264 clips for HyperFrames (hf/assets/video/<id>.mp4).
# Per-clip LUT luts/clip/<id>.cube when clip_trims.py made one, else the approved master LUT (project.MASTER_LUT).
# usage: grade_clips.py [ids…]   (default: every DJI clip in FOOTAGE and HOSTDIR)
import subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import project as P

clips = sorted(P.FOOTAGE.glob("DJI_*.MP4")) + sorted(P.HOSTDIR.glob("*/DJI_*.MP4"))
want = set(sys.argv[1:])
for f in clips:
    cid = f.stem.split("_")[2]
    if want and cid not in want:
        continue
    cube = ROOT / "luts" / "clip" / f"{cid}.cube"
    cube = cube if cube.exists() else (ROOT / P.MASTER_LUT if P.MASTER_LUT else None)
    lut = cube.relative_to(ROOT).as_posix() if cube else None
    vf = f"format=gbrp16le,lut3d=file={lut}:interp=tetrahedral,format=yuv420p" if lut else "format=yuv420p"   # Rec.709 source: no LUT
    vf = "scale=1728:3072:flags=lanczos," + vf                      # canvas size (blur_plates.py works at 1728x3072)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-map", "0:v:0", "-an",
                    "-vf", vf,
                    "-c:v", "h264_nvenc", "-preset", "p6", "-rc", "vbr", "-cq", "16", "-b:v", "90M", "-maxrate", "130M", "-g", "10",
                    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                    str(ROOT / "hf" / "assets" / "video" / f"{cid}.mp4")], check=True, cwd=ROOT)
    print("ok", cid, lut)
print("GRADE_DONE")
