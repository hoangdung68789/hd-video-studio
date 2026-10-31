"""Dựng một recipe chữ hiệu ứng thành dự án HyperFrames chạy được (+ SFX đã canh đỉnh), tùy chọn render luôn.

Dùng:
  python build_recipe.py <recipe.html> --out <thư mục dự án> --bg <ảnh|video nền> [--bg-start 0]
         [--touch 1.0] [--duration 3.0] [--fps 60] [--set key=value ...] [--sfx-override role=path]
         [--shift-frames 0] [--no-sfx] [--render [--quality looks]]

Recipe = MỘT file .html gồm:
  <script type="application/json" id="recipe-meta">{...}</script>  — id, fonts, sfx, params, thời lượng
  <style>…</style> + markup trong <template id="fx"> + <script id="fx-js"> function FX(tl, T, P) {...} </script>
  Chữ trong markup dùng {{khóa}} lấy từ params (đổi bằng --set).
T = giây chữ "chạm" (đạt trạng thái đọc được). Mọi tween đặt theo T → seek được, không dùng đồng hồ thật.
"""
import argparse, html, json, os, re, shutil, subprocess, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX_ROOT = "~/Downloads/SOUNDEFFECT TAKING HEARD"
CATALOG = "<HD_VIDEO_HOME>/sfx-catalog/catalog.json"


def parse_recipe(path):
    src = open(path, encoding="utf-8").read()
    meta = json.loads(re.search(r'<script type="application/json" id="recipe-meta">(.*?)</script>', src, re.S).group(1))
    style = "\n".join(re.findall(r"<style>(.*?)</style>", src, re.S))
    markup = re.search(r'<template id="fx">(.*?)</template>', src, re.S).group(1)
    js = re.search(r'<script id="fx-js">(.*?)</script>', src, re.S).group(1)
    return meta, style, markup, js


def probe(path):
    out = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                     "stream=width,height", "-of", "json", path], capture_output=True, text=True).stdout)
    s = out["streams"][0]
    return s["width"], s["height"]


def sfx_mix(entries, T, duration, out_wav):
    cat = {r["path"]: r for r in json.load(open(CATALOG, encoding="utf-8"))}
    inputs, filters, placed = [], [], []
    for i, e in enumerate(entries):
        m = cat[e["path"]]
        t = T + e.get("at", 0.0)
        lead = m["peak_t"] if e.get("align", "peak") == "peak" else m["onset"]
        start, mstart = t - lead, 0.0
        if start < 0:
            mstart, start = -start, 0.0
        length = e.get("dur") or min(m["dur"], max(0.25, m["onset"] + m["active"]))
        length = min(length, m["dur"] - mstart)
        gain = e.get("vol", 0.6) * 10 ** ((-12 - m["peak_db"]) / 20)
        inputs += ["-ss", f"{mstart:.4f}", "-t", f"{length:.4f}", "-i", os.path.join(SFX_ROOT, e["path"])]
        fade = f",afade=t=out:st={max(0, length - 0.12):.3f}:d=0.12" if length < m["dur"] - mstart - 0.05 else ""
        filters.append(f"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={gain:.4f}{fade},"
                       f"adelay={int(round(start * 1000))}|{int(round(start * 1000))}[s{i}]")
        placed.append({"path": e["path"], "role": e.get("role"), "peak_at": round(t, 4), "start": round(start, 4), "len": round(length, 4)})
    n = len(entries)
    filters.append("".join(f"[s{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0:duration=longest,apad,atrim=0:{duration}[out]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", "[out]",
                    "-ar", "48000", out_wav], check=True)
    return placed


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    ap = argparse.ArgumentParser()
    ap.add_argument("recipe")
    ap.add_argument("--out", required=True)
    ap.add_argument("--bg", required=True)
    ap.add_argument("--bg-start", type=float, default=0.0)
    ap.add_argument("--touch", type=float)
    ap.add_argument("--duration", type=float)
    ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--set", action="append", default=[])
    ap.add_argument("--sfx-override", action="append", default=[])
    ap.add_argument("--shift-frames", type=int, default=0)
    ap.add_argument("--no-sfx", action="store_true")
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--quality", default="looks")
    a = ap.parse_args()
    meta, style, markup, js = parse_recipe(a.recipe)
    P = dict(meta.get("params", {}))
    for kv in a.set:
        k, v = kv.split("=", 1)
        P[k] = v
    T = (a.touch if a.touch is not None else meta.get("touch", 1.0)) + a.shift_frames / a.fps
    D = a.duration or meta.get("duration", 3.0)
    os.makedirs(os.path.join(a.out, "assets", "fonts"), exist_ok=True)
    W, H = probe(a.bg)

    is_video = a.bg.lower().endswith((".mp4", ".mov", ".m4v", ".webm"))
    bg_name = "bg" + os.path.splitext(a.bg)[1].lower()
    shutil.copyfile(a.bg, os.path.join(a.out, "assets", bg_name))
    shutil.copyfile(os.path.join(SKILL, "vendor", "gsap.min.js"), os.path.join(a.out, "assets", "gsap.min.js"))
    faces = []
    for f in meta["fonts"]:
        shutil.copyfile(os.path.join(SKILL, "fonts", "files", f["file"]), os.path.join(a.out, "assets", "fonts", f["file"]))
        faces.append(f'@font-face {{ font-family: "{f["alias"]}"; src: url("assets/fonts/{f["file"]}"); '
                     f'font-weight: {f.get("weight", 400)}; font-style: {f.get("style", "normal")}; font-display: block; }}')

    body = markup
    for k, v in P.items():
        body = body.replace("{{" + k + "}}", html.escape(str(v)))
    if "{{" in body:
        sys.exit("Thiếu tham số: " + ", ".join(set(re.findall(r"\{\{(\w+)\}\}", body))))

    placed = []
    audio_tag = ""
    if not a.no_sfx and meta.get("sfx"):
        sfx = [dict(s) for s in meta["sfx"]]
        for ov in a.sfx_override:
            role, path = ov.split("=", 1)
            for s in sfx:
                if s.get("role") == role:
                    s["path"] = path
        placed = sfx_mix(sfx, T, D, os.path.join(a.out, "assets", "sfx.wav"))
        audio_tag = f'<audio id="sfx" src="assets/sfx.wav" data-start="0" data-duration="{D}" data-track-index="8" data-volume="1"></audio>'

    bg_tag = (f'<video id="bg" class="clip bgv" src="assets/{bg_name}" muted playsinline data-start="0" data-duration="{D}" '
              f'data-media-start="{a.bg_start}" data-track-index="0"></video>' if is_video else
              f'<img id="bg" class="clip bgv" src="assets/{bg_name}" data-start="0" data-duration="{D}" data-track-index="0">')
    page = f"""<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      {chr(10).join(faces)}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: #000; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; }}
      .bgv {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
      #fxl {{ position: absolute; inset: 0; }}
      {style}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{D}" data-width="{W}" data-height="{H}" data-fps="{a.fps}">
      {bg_tag}
      <div id="fxl" class="clip" data-start="0" data-duration="{D}" data-track-index="5" data-layout-allow-occlusion>{body}</div>
      {audio_tag}
    </div>
    <script>
      {js}
      window.__timelines = window.__timelines || {{}};
      var P = {json.dumps(P, ensure_ascii=False)};
      var tl = gsap.timeline({{ paused: true }});
      FX(tl, {T:.4f}, P);
      tl.set({{}}, {{}}, {D});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
"""
    open(os.path.join(a.out, "index.html"), "w", encoding="utf-8").write(page)
    json.dump({"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json", "paths": {"assets": "assets"}},
              open(os.path.join(a.out, "hyperframes.json"), "w"), indent=1)
    info = {"recipe": meta["id"], "touch": T, "duration": D, "fps": a.fps, "size": [W, H], "params": P,
            "fonts": meta["fonts"], "sfx_placed": placed}
    json.dump(info, open(os.path.join(a.out, "build.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"✅ dựng {meta['id']} → {a.out} (T={T:.3f}s, {W}x{H}@{a.fps}, sfx={len(placed)})")
    if a.render:
        out_mp4 = os.path.join(a.out, "out.mp4")
        r = subprocess.run(f'hyperframes render "{a.out}" --quality {a.quality} --output "{out_mp4}" --quiet', shell=True)
        if r.returncode or not os.path.exists(out_mp4):
            sys.exit("❌ render lỗi")
        print("✅ render", out_mp4)


if __name__ == "__main__":
    main()
