# Tự dựng bản giống mẫu TV-01 bằng footage DU-AN-MAU (HyperFrames). Ra Videos/_TV01_dung_lai/hf + nhạc nắn theo đường cong mẫu.
# python dung_lai.py <template.json> <do_mau.json>
import json, os, subprocess, sys, shutil
from pathlib import Path
import numpy as np, soundfile as sf

T = json.load(open(sys.argv[1], encoding="utf-8")); DM = json.load(open(sys.argv[2], encoding="utf-8"))
SRC = Path(r"<HD_VIDEO_HOME>\Videos\DU-AN-MAU")
OUT = Path(r"<HD_VIDEO_HOME>\Videos\_TV01_dung_lai"); HF = OUT / "hf"
(HF / "assets" / "video").mkdir(parents=True, exist_ok=True); (HF / "assets" / "fonts").mkdir(parents=True, exist_ok=True)
DUR, CUTS = DM["thoi_luong"], DM["cat"]
shots = list(zip([0.0] + CUTS, CUTS + [DUR]))
# shot -> (clip, giây bắt đầu). Shot có người dẫn ở đúng chỉ số như mẫu (3, 9, 10, 14, 19, 25)
PLAN = ["0602:0.3", "0600:0.3", "0607:0.3", "0601:2.0", "0612:0.3", "0610:0.3", "0608:0.3", "0605:0.3", "0609:0.3",
        "0603:0.5", "0611:1.0", "0605:4.0", "0606:6.0", "0584:0.5", "0611:6.0", "0600:3.0", "0607:3.5", "0606:0.5",
        "0612:4.0", "0601:5.0", "0610:3.0", "0608:4.0", "0602:5.0", "0613:4.0", "0584:3.5", "0611:14.0"]
assert len(PLAN) == len(shots)
for c in {p.split(":")[0] for p in PLAN}:
    d = HF / "assets" / "video" / f"{c}.mp4"
    if not d.exists():
        os.link(SRC / "hf" / "assets" / "video" / f"{c}.mp4", d)
for f in ("Anton-Regular.ttf", "BeVietnamPro-Bold.ttf", "BeVietnamPro-ExtraBold.ttf", "PlayfairDisplay-BoldItalic.ttf"):
    shutil.copy2(SRC / "hf" / "assets" / "fonts" / f, HF / "assets" / "fonts" / f)
shutil.copy2(SRC / "hf" / "hyperframes.json", HF / "hyperframes.json"); shutil.copy2(SRC / "hf" / "package.json", HF / "package.json")
json.dump({"id": "hf", "name": "_TV01_dung_lai"}, open(HF / "meta.json", "w"))

# nhạc: nhạc 469 kéo 152 -> 161,5 BPM (atempo, giữ cao độ) rồi nắn độ to theo đường cong mẫu (0,5s/điểm)
A = OUT / "work"; A.mkdir(exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SRC / "work" / "audio" / "music_loop.wav"), "-af", f"atempo={DM['bpm'] / 152:.5f}",
                "-ar", "48000", "-ac", "2", str(A / "nhac_keo.wav")], check=True)
x, sr = sf.read(A / "nhac_keo.wav", dtype="float32"); x = x[:int(DUR * sr)]
h = sr // 2
cur = np.array([20 * np.log10(np.sqrt((x[i:i + h] ** 2).mean()) + 1e-9) for i in range(0, len(x) - h + 1, h)])
tgt = np.array(DM["do_to_05s_db"][:len(cur)])
g = np.clip(tgt - cur[:len(tgt)], -18, 18)
g = np.convolve(g, np.ones(3) / 3, "same")
env = np.interp(np.arange(len(x)) / sr, (np.arange(len(g)) + 0.5) * 0.5, g)
y = x * (10 ** (env / 20))[:, None]
y *= 0.89 / max(1e-6, np.abs(y).max())
sf.write(HF / "assets" / "nhac.wav", y, sr)

P = lambda v: f"{v:.3f}"
vids, tl = [], []
for i, ((a, b), p) in enumerate(zip(shots, PLAN)):
    c, ms = p.split(":")
    vids.append(f'<video id="v{i}" class="clip v" src="assets/video/{c}.mp4" muted playsinline data-start="{P(a)}" data-duration="{P(b - a)}" '
                f'data-media-start="{ms}" data-track-index="{i % 2}"></video>')
CC = {d["chuyen_canh"]["ma"]: d["chuyen_canh"]["giay"] for d in T["doan"] if d["chuyen_canh"].get("ma") not in (None, "cut")}
iw = next(i for i, (a, b) in enumerate(shots) if abs(a - 18.17) < 0.05)
tl.append(f'tl.fromTo("#v{iw}",{{filter:"blur(22px)",xPercent:-14}},{{filter:"blur(0px)",xPercent:0,duration:0.25,ease:"power3.out"}},{P(shots[iw][0])});')
for k, t0 in enumerate(d["chuyen_canh"]["giay"] for d in T["doan"] if d["chuyen_canh"].get("ma") == "light_leak"):
    tl.append(f'tl.set("#lk{k}",{{opacity:1}},{P(t0 - 0.034)}); tl.to("#lk{k}",{{opacity:0,duration:0.3,ease:"sine.out"}},{P(t0 + 0.034)});')   # mẫu: khung sáng kín bật đột ngột đúng cú cắt rồi mờ ra (đo 24,1s: #FBFCB3 kín khung)
leaks = "".join(f'<div id="lk{k}" class="leak"></div>' for k in range(2))
# chữ: nội dung từ lời Dũng, màu / vị trí % / kiểu vào theo template (vị trí y 30 -> 25 để không che đầu người dẫn: R-L026)
TXT = [(18.35, "5 TỶ", "#F9C945", "pop", (7, 27), 230, "AN"), (19.85, "750 TRIỆU · GIÁ CHÀO", "#FFFFFF", "go_chu", (40, 25), 34, "BVP"),
       (20.6, "hẻm 7m · DU-AN-MAU", "#FFFFFF", "go_chu", (8, 44), 34, "BVP"), (20.85, "NHÀ 4 TẦNG", "#8FDEC2", "pop", (10, 49), 150, "AN"),
       (21.6, "4,6 × 12M", "#FFFFFF", "hien_tung_ky_tu", (15, 65), 160, "AN"), (55.25, "NHÀ 4 TẦNG", "#6FE889", "truot_len", (30, 28), 150, "AN")]
ends = {18.35: 23.95, 19.85: 23.95, 20.6: 23.95, 20.85: 23.95, 21.6: 23.95, 55.25: DUR}
divs = []
for j, (t, s, col, vao, (px, py), fs, fam) in enumerate(TXT):
    inner = "".join(f'<span class="c">{ch if ch != " " else "&nbsp;"}</span>' for ch in s)
    divs.append(f'<div id="t{j}" class="tx {fam}" style="left:{px}%;top:{py}%;color:{col};font-size:{fs}px">{inner}</div>')
    if vao == "pop":
        tl.append(f'tl.fromTo("#t{j}",{{opacity:0,scale:1.35}},{{opacity:1,scale:1,duration:0.2,ease:"back.out(2)"}},{P(t)});')
    elif vao == "go_chu":
        tl.append(f'tl.set("#t{j}",{{opacity:1}},{P(t)}); tl.fromTo("#t{j} .c",{{opacity:0}},{{opacity:1,duration:0.01,stagger:0.03}},{P(t)});')
    elif vao == "hien_tung_ky_tu":
        tl.append(f'tl.set("#t{j}",{{opacity:1}},{P(t)}); tl.fromTo("#t{j} .c",{{opacity:0}},{{opacity:1,duration:0.01,stagger:0.12}},{P(t)});')
    else:
        tl.append(f'tl.fromTo("#t{j}",{{opacity:0,y:60}},{{opacity:1,y:0,duration:0.35,ease:"power3.out"}},{P(t)});')
    tl.append(f'tl.to("#t{j}",{{opacity:0,duration:0.1}},{P(ends[t])});')
divs.append('<div id="sig" class="tx PF" style="left:3%;top:42%;color:#FFFFFF;font-size:64px">Hoàng Dũng</div>')
tl.append('tl.fromTo("#sig",{opacity:0,x:-30},{opacity:1,x:0,duration:0.5,ease:"power2.out"},55.75);')
html = f'''<!doctype html>
<html lang="vi"><head><meta charset="UTF-8" /><meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
@font-face {{ font-family: "AN"; src: url("assets/fonts/Anton-Regular.ttf"); }}
@font-face {{ font-family: "BVP"; src: url("assets/fonts/BeVietnamPro-ExtraBold.ttf"); font-weight: 800; }}
@font-face {{ font-family: "PF"; src: url("assets/fonts/PlayfairDisplay-BoldItalic.ttf"); font-style: italic; }}
* {{ margin:0; padding:0; box-sizing:border-box; }} html,body {{ width:1080px; height:1920px; overflow:hidden; background:#000; }}
#root {{ position:relative; width:100%; height:100%; overflow:hidden; }}
.v {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }}
.tx {{ position:absolute; white-space:nowrap; opacity:0; line-height:1; padding-top:.12em; text-shadow:0 4px 12px rgba(0,0,0,.7), 0 0 26px rgba(0,0,0,.45); -webkit-text-stroke:5px rgba(10,10,10,.55); paint-order:stroke fill; transform-origin:0 50%; }}
.tx .c {{ display:inline-block; }} .AN {{ font-family:"AN"; }} .BVP {{ font-family:"BVP"; font-weight:800; }} .PF {{ font-family:"PF"; font-style:italic; }}
.leak {{ position:absolute; inset:0; opacity:0; background: radial-gradient(ellipse at 35% 40%, #FBFCB3 0%, #FBFCB3 45%, #F2B35E 100%); }}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{P(DUR)}" data-width="1080" data-height="1920" data-fps="30">
{chr(10).join(vids)}
{leaks}
{"".join(divs)}
<audio id="m" src="assets/nhac.wav" data-start="0" data-duration="{P(DUR)}" data-track-index="8" data-volume="1"></audio>
</div>
<script>window.__timelines = window.__timelines || {{}}; var tl = gsap.timeline({{ paused: true }});
{chr(10).join(tl)}
window.__timelines["main"] = tl; tl.seek(0);</script></body></html>'''
(HF / "index.html").write_text(html, encoding="utf-8")
print("ok", len(vids), "shot,", len(TXT) + 1, "chữ/MG", HF)
