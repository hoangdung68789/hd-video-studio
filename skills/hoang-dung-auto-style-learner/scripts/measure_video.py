#!/usr/bin/env python3
"""Bộ đo dùng chung cho video mẫu VÀ bản tự dựng (cùng thước để template_similarity so công bằng).
Dùng: python measure_video.py <video> <out.json> [--thresh 0.3]
Ra: thời lượng, fps, cú cắt (scene + lược đồ màu), BPM + phách, độ to theo 0,5s, khung giữa mỗi shot (frames/)."""
import json, subprocess, sys, re
from pathlib import Path
import numpy as np
START_BPM = 150


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")


def main(src, out, th=0.3):
    out = Path(out); fr = out.parent / "frames"; fr.mkdir(parents=True, exist_ok=True)
    pr = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration",
                         "-of", "json", src]).stdout)
    dur = float(pr["format"]["duration"])
    v = next(s for s in pr["streams"] if s["codec_type"] == "video")
    # cú cắt: scene score trên bản nhỏ (ổn định giữa bản gốc và bản dựng)
    log = run(["ffmpeg", "-v", "info", "-i", src, "-vf", f"scale=144:256,select='gt(scene,{th})',showinfo", "-an", "-f", "null", "-"]).stderr
    cuts = [round(float(m), 2) for m in re.findall(r"pts_time:([\d.]+)", log)]
    cuts = [c for i, c in enumerate(cuts) if c > 0.2 and (i == 0 or c - cuts[i - 1] > 0.25)]
    # âm: BPM + phách + độ to
    wav = out.parent / "_a.wav"
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "22050", str(wav)])
    bpm, beats, loud = 0, [], []
    if wav.exists() and wav.stat().st_size > 1000:
        import librosa
        y, sr = librosa.load(str(wav), sr=22050)
        # start_bpm=150: tránh nhầm bậc nhịp (2/3, 1/2) với nhạc TikTok nhanh; dùng CÙNG giá trị cho mẫu và bản dựng
        t, b = librosa.beat.beat_track(y=y, sr=sr, units="time", start_bpm=START_BPM)
        bpm, beats = round(float(np.atleast_1d(t)[0]), 1), [round(float(x), 2) for x in b]
        h = sr // 2
        loud = [round(float(20 * np.log10(np.sqrt((y[i:i + h] ** 2).mean()) + 1e-9)), 1) for i in range(0, len(y) - h, h)]
        wav.unlink()
    on_beat = sum(1 for c in cuts if beats and min(abs(c - x) for x in beats) <= 0.08) / max(1, len(cuts))
    shots = list(zip([0.0] + cuts, cuts + [dur]))
    for i, (a, b) in enumerate(shots):
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{(a + b) / 2:.2f}", "-i", src, "-frames:v", "1", "-vf", "scale=270:480",
             str(fr / f"s{i:02d}_{(a + b) / 2:05.1f}.jpg")])
    res = {"src": src, "thoi_luong": round(dur, 2), "khung": f"{v['width']}x{v['height']}", "fps": v["r_frame_rate"],
           "cat": cuts, "so_shot": len(shots), "shot_tb": round(dur / len(shots), 2), "bpm": bpm, "phach": beats,
           "ty_le_cat_dung_phach": round(on_beat, 2), "do_to_05s_db": loud}
    json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{dur:.1f}s · {len(cuts)} cắt · shot TB {res['shot_tb']}s · {bpm} BPM · cắt đúng phách {on_beat:.0%}")


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 2:
        print(__doc__); sys.exit(2)
    main(a[0], a[1], float(a[a.index("--thresh") + 1]) if "--thresh" in a else 0.3)
