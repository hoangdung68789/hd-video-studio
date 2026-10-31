# Build the BĐS review edit (template from DU-AN-MAU v3, Dũng duyệt 26/10/2026): beat-grid shot list, spliced music bed,
# voice timeline, per-shot subtitles (SRT wording), stacked-left keyword text, satellite map scene.
# Outputs: hf/index.html, work/plan.json, work/cutlist.md, work/audio/voice_tl.wav, work/audio/music_tl.wav,
#          work/sfx/moments.json, work/sfx/words.json
import json, math, re, subprocess, unicodedata, difflib
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
HF = ROOT / "hf"
import sys; sys.path.insert(0, str(ROOT))
from project import *              # every project-specific value (footage, sections, keys, map, notes)
SR = 48000
VOFF = 0.10                       # voice starts this long after its section starts
MAP_SUB_BEATS = globals().get("MAP_SUB_BEATS", 2)   # subtitle windows on the map shot (DU-AN-MAU at 152 BPM: 4 = one bar)
BEATS = np.load(ROOT / "work" / "audio" / "beats.npy")
DOWN = BEATS[1::4]                # strongest onset phase = bar starts


def bi(t):                        # beat index of the downbeat nearest t
    d = DOWN[np.argmin(abs(DOWN - t))]
    return int(np.argmin(abs(BEATS - d)))


# SECTIONS, MUSIC_ANCHOR, KEYS, HILITE, COMPOUNDS, POIS ... live in project.py


def nfc(s): return unicodedata.normalize("NFC", s)


def joined(a, b): return f"{norm(a)} {norm(b)}" in COMPOUNDS
def norm(w): return re.sub(r"[^\w]", "", nfc(w).lower())


def dur(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                                capture_output=True, text=True).stdout)


# ---------------------------------------------------------------- timeline in beats
def build_timeline():
    # music beat index for each section start
    idx = {}
    n = len(SECTIONS)
    # anchored sections get their index; others chain forward from the previous section, except a voice
    # section directly before an anchored bridge is chained BACKWARD from that anchor (the splice hides under voice)
    for i, s in enumerate(SECTIONS):
        if s["id"] in MUSIC_ANCHOR:
            idx[i] = bi(MUSIC_ANCHOR[s["id"]])
    for i in range(n):
        if i in idx:
            continue
        if i + 1 < n and (i + 1) in idx and "voice" in SECTIONS[i]:
            idx[i] = idx[i + 1] - SECTIONS[i]["beats"]
        else:
            idx[i] = idx[i - 1] + SECTIONS[i - 1]["beats"]
    T = 0.0
    out = []
    for i, s in enumerate(SECTIONS):
        k0 = idx[i]
        bt = BEATS[k0:k0 + s["beats"] + 1]
        assert len(bt) == s["beats"] + 1, f"music runs out in {s['id']}"
        rel = bt - bt[0]
        out.append({**s, "T": T, "len": float(rel[-1]), "m_in": float(bt[0]), "beat_rel": rel.tolist()})
        T += float(rel[-1])
    # resolve open voice ends: a section with (a, None) fills its length; the next (None, b) continues from there
    for i, s in enumerate(out):
        v = s.get("voice")
        if v and v[0][1] is None:
            v[0] = (v[0][0], v[0][0] + s["len"] - s.get("voff", VOFF))
            nxt = out[i + 1]["voice"]
            nxt[0] = (v[0][1], nxt[0][1])
    return out, T


# ---------------------------------------------------------------- words (SRT wording, whisper timing)
def srt_words(cid):
    srt = next((HOSTDIR).glob(f"*{cid}*/*.srt")).read_text(encoding="utf-8")
    blocks = [b for b in re.split(r"\n\s*\n", srt.strip()) if b.strip()]
    toks = []
    for b in blocks:
        lines = b.strip().splitlines()
        a, c = re.findall(r"(\d+):(\d+):(\d+),(\d+)", lines[1])
        t0 = int(a[0]) * 3600 + int(a[1]) * 60 + int(a[2]) + int(a[3]) / 1000
        t1 = int(c[0]) * 3600 + int(c[1]) * 60 + int(c[2]) + int(c[3]) / 1000
        ws = " ".join(lines[2:]).split()
        for j, w in enumerate(ws):
            toks.append({"w": nfc(w), "s": t0 + (t1 - t0) * j / len(ws), "line": len(toks) and 0})
    wh = json.load(open(ROOT / "transcripts" / f"{cid}.json", encoding="utf-8"))
    sm = difflib.SequenceMatcher(None, [norm(t["w"]) for t in toks], [norm(w["w"]) for w in wh], autojunk=False)
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            toks[a + k]["s"] = wh[b + k]["s"]
    # keep monotonic
    for k in range(1, len(toks)):
        toks[k]["s"] = max(toks[k]["s"], toks[k - 1]["s"] + 0.05)
    return toks


def vmap(sec, t):                 # media time of the host clip -> section-relative time (None if cut out)
    acc = sec.get("voff", VOFF)
    for a, b in sec["voice"]:
        if a - 0.02 <= t < b:
            return acc + (t - a)
        acc += b - a
    return None


def tmap(sec, rel):               # section-relative time -> host media time
    acc = sec.get("voff", VOFF)
    for a, b in sec["voice"]:
        if rel <= acc + (b - a) + 1e-6:
            return a + max(0.0, rel - acc)
        acc += b - a
    return sec["voice"][-1][1]


# ---------------------------------------------------------------- luminance of the text areas
LUMA_CACHE = {}


def luma(cid, t):
    key = (cid, round(t, 2))
    if key in LUMA_CACHE:
        return LUMA_CACHE[key]
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", str(HF / "assets" / "video" / f"{cid}.mp4"),
                          "-frames:v", "1", "-vf", "scale=108:192,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(192, 108).astype(float)
    top = a[int(192 * 300 / 1920):int(192 * 720 / 1920), int(108 * 60 / 1080):int(108 * 700 / 1080)].mean()
    bot = a[int(192 * 1260 / 1920):int(192 * 1420 / 1920), int(108 * 80 / 1080):int(108 * 920 / 1080)].mean()
    LUMA_CACHE[key] = (top, bot)
    return top, bot


# ---------------------------------------------------------------- main
def main():
    secs, total = build_timeline()
    shots, used = [], {}
    clipdur = {p.stem: dur(p) for p in (HF / "assets" / "video").glob("0*.mp4") if "_" not in p.stem}
    for s in secs:
        k = 0
        assert sum(b for _, b in s["shots"]) == s["beats"], f"{s['id']} beats mismatch"
        for src, nb in s["shots"]:
            t0, t1 = s["beat_rel"][k], s["beat_rel"][k + nb]
            k += nb
            sh = {"sec": s["id"], "T": round(s["T"] + t0, 4), "len": round(t1 - t0, 4), "beats": nb}
            if src == "H":
                sh.update(clip=s["host"], ms=round(tmap(s, t0), 3), kind="host")
                assert tmap(s, t1 - 0.01) - sh["ms"] < t1 - t0 + 0.05, f"host shot spans a voice splice in {s['id']}"
            elif src == "MAP":
                sh.update(clip="map", ms=0, kind="map")
            else:
                ms = min(src[1], round(clipdur[src[0]] - 0.06 - sh["len"], 2))   # pull back to fit the clip end
                sh.update(clip=src[0], ms=ms, kind="broll")
                for (a, b) in used.get(src[0], []):
                    assert ms >= b - 1e-6 or ms + sh["len"] <= a + 1e-6, f"reuse overlap {src} ({ms:.2f}) vs {a:.2f}-{b:.2f}"
                used.setdefault(src[0], []).append((ms, ms + sh["len"]))
            shots.append(sh)

    # words on the global timeline
    words = []
    for s in secs:
        if "voice" not in s:
            continue
        for w in srt_words(s["host"]):
            ms = w["s"]
            for k, (a, b) in enumerate(s["voice"]):
                # a word whisper/SRT starts just before a kept piece really belongs to it (e.g. D "Với", C "chủ")
                if (k == 0 and a > 0.5 and a - 0.8 <= ms < a) or (k > 0 and a - 0.6 <= ms < a):
                    ms = a
            r = vmap(s, ms)
            if r is not None:
                words.append({"w": w["w"], "t": round(s["T"] + r, 3), "sec": s["id"], "key": (s["host"], round(w["s"], 3))})
    for host, (old, new) in WORD_FIX.items():   # words the SRT and whisper both got wrong, corrected by Dũng
        hw = [w for w in sorted(words, key=lambda w: w["t"]) if w["key"][0] == host]
        for k in range(len(hw) - len(old) + 1):
            if [norm(w["w"]) for w in hw[k:k + len(old)]] == [norm(x) for x in old]:
                for w, x in zip(hw[k:k + len(old)], new):
                    w["w"] = x
                break
    for sid in ("hook",):           # capitalise the hook's first word
        hw = [w for w in words if w["sec"] == sid]
        first = hw[0]
        first["w"] = first["w"][:1].upper() + first["w"][1:]
    seen, uniq = set(), []
    for w in sorted(words, key=lambda w: w["t"]):
        if w["key"] not in seen:
            seen.add(w["key"]); uniq.append(w)
    words = [{k: v for k, v in w.items() if k != "key"} for w in uniq]
    for prev, w in zip(words, words[1:]):
        if prev["w"][-1:] in ".?!" and w["sec"] == prev["sec"]:
            w["w"] = w["w"][:1].upper() + w["w"][1:]

    # subtitles: one chunk per shot (map shot split on its 2-beat grid) so text never crosses a cut
    windows = []
    for sh in shots:
        if sh["kind"] == "map":
            sec = next(s for s in secs if s["id"] == sh["sec"])
            base = sh["T"] - sec["T"]
            grid = [r for r in sec["beat_rel"] if base - 1e-3 <= r <= base + sh["len"] + 1e-3][::MAP_SUB_BEATS]
            for a, b in zip(grid, grid[1:]):
                windows.append((sec["T"] + a, sec["T"] + b, sh))
        else:
            windows.append((sh["T"], sh["T"] + sh["len"], sh))
    subs = []
    def win_of(t):                     # a word starting in the last 0.12s of a shot is shown with the next shot
        for j, (a, b, _) in enumerate(windows):
            if a - 1e-6 <= t + 0.12 < b:
                return j
        return len(windows) - 1
    owner = {}
    for w in words:
        owner.setdefault(win_of(w["t"]), []).append(w)
    # a word said in the last 0.5s of a shot reads better with the words that follow it on the next shot
    for j in range(len(windows) - 1):
        ws, nx = owner.get(j, []), owner.get(j + 1, [])
        while len(ws) > 1 and nx and nx[0]["t"] - ws[-1]["t"] < 0.9 and (
                (windows[j][1] - ws[-1]["t"] < 0.5 and ws[-1]["w"][-1:] not in ",.?!") or joined(ws[-1]["w"], nx[0]["w"]) or ws[-1]["w"][:1].isupper()):
            nx.insert(0, ws.pop())
        owner[j + 1] = nx
    for j, (a, b, sh) in enumerate(windows):
        groups, cur = [], []
        lst = owner.get(j, [])
        for i, w in enumerate(lst):
            cur.append(w)
            nxt = lst[i + 1] if i + 1 < len(lst) else None
            if nxt is None or joined(w["w"], nxt["w"]):
                continue
            if (w["w"][-1:] in ",.?!" and len(cur) >= 3) or len(cur) >= 6 or (nxt["t"] - w["t"] > 0.55 and len(cur) >= 3):
                groups.append(cur); cur = []
        if cur:
            if groups and len(cur) <= 2:
                groups[-1] += cur
            else:
                groups.append(cur)
        for g, ws in enumerate(groups):
            t0 = max(a, ws[0]["t"] - 0.06)
            t1 = (groups[g + 1][0]["t"] - 0.08) if g + 1 < len(groups) else b - 0.05
            subs.append({"t0": round(t0, 3), "t1": round(t1, 3), "text": " ".join(w["w"] for w in ws), "shot": sh})
    # a chunk squeezed to nothing (its words were pulled into the next window) joins the chunk after it
    for i in range(len(subs) - 2, -1, -1):
        s, n = subs[i], subs[i + 1]
        if s["t1"] - s["t0"] < 0.25 and n["t0"] - s["t0"] < 0.3:
            n["t0"], n["text"] = min(s["t0"], n["t0"]), s["text"] + " " + n["text"]
            del subs[i]
    # chunks shorter than 0.7s can't be read: join a neighbour on the same shot (≤8 words)
    for i in range(len(subs) - 1, -1, -1):
        if i >= len(subs) or subs[i]["t1"] - subs[i]["t0"] >= 0.7:
            continue
        s = subs[i]
        n = subs[i + 1] if i + 1 < len(subs) else None
        if n is not None and n["shot"] is s["shot"] and len((s["text"] + " " + n["text"]).split()) > 8 \
                and n["t1"] - (s["t0"] + 0.75) >= 0.6:    # too many words to join: borrow time from the next chunk
            s["t1"] = round(s["t0"] + 0.75, 3); n["t0"] = round(s["t1"] + 0.05, 3)
            continue
        for j, cap in ((i + 1, 8), (i - 1, 8), (i + 1, 10), (i - 1, 10)):
            if 0 <= j < len(subs) and subs[j]["shot"] is s["shot"] and len((s["text"] + " " + subs[j]["text"]).split()) <= cap:
                a, b = sorted((i, j))
                subs[a] = {"t0": subs[a]["t0"], "t1": subs[b]["t1"], "text": subs[a]["text"] + " " + subs[b]["text"], "shot": s["shot"]}
                del subs[b]
                break

    # Dũng 29/10: nói hết câu rồi mới chuyển cảnh — từ cuối mỗi đoạn lời phải xong trước khi cảnh sau bắt đầu mờ vào
    for s in secs:
        if "voice" not in s or s is secs[-1]:
            continue
        last = max(w["t"] for w in words if w["sec"] == s["id"])
        vend = s["T"] + s.get("voff", VOFF) + sum(b - a for a, b in s["voice"])
        cut_fade = s["T"] + s["len"] - (0 if s.get("hard_out") else 0.36)   # hard_out: cắt thẳng đúng phách, không mờ chuyển
        assert cut_fade >= min(vend, last + 0.35) + 0.1, f"{s['id']}: chuyển cảnh lúc {cut_fade:.2f}s khi câu chưa nói xong ({vend:.2f}s) -> thêm phách"
        print(f"cắt {s['id']}: lời xong {vend:.2f}s, cảnh sau mờ vào {cut_fade:.2f}s (dư {cut_fade - vend:+.2f}s)")
    # key texts -> the shot that contains the anchor time
    keys = []
    for sid, anchor, lines in KEYS:
        s = next(x for x in secs if x["id"] == sid)
        ta = s["T"] + vmap(s, anchor)
        sh = next(x for x in shots if x["T"] - 1e-6 <= ta < x["T"] + x["len"])
        nxt = shots[shots.index(sh) + 1] if shots.index(sh) + 1 < len(shots) else None
        if sh["T"] + sh["len"] - ta < 0.7 and nxt and nxt["kind"] != "map":   # too little left: start on the next cut
            sh = shots[shots.index(sh) + 1]
            ta = sh["T"]
        t0 = max(sh["T"] + 0.04, ta - 0.05)
        t1 = min(sh["T"] + sh["len"] - 0.06, t0 + 3.6)   # long shots: the key clears after ~3.6s
        ls = []
        for ln in lines:
            txt, st, tv = ln[:3]
            opt = ln[3] if len(ln) > 3 else {}
            tl = s["T"] + vmap(s, tv)
            ls.append({"text": txt, "st": st, "t": round(min(max(t0, tl - 0.05), t1 - 0.35), 3), **opt})
        keys.append({"sec": sid, "t0": round(t0, 3), "t1": round(t1, 3), "lines": ls, "shot": sh})
        assert t1 - t0 >= 0.6, f"key {lines} too short on screen ({t1 - t0:.2f}s)"
    # long shots can hold two key texts: the earlier one clears before the next comes in
    for k, n in zip(keys, keys[1:]):
        if n["shot"] is k["shot"]:
            k["t1"] = round(n["t0"] - 0.12, 3)
            for ln in k["lines"]:
                ln["t"] = round(min(ln["t"], k["t1"] - 0.35), 3)
            assert k["t1"] - k["t0"] >= 0.6, f"key {k['lines'][-1]['text']} too short on screen"

    # Dũng 29/10: CẤM chữ che mặt người dẫn. Vùng đầu theo thời gian = work/faces.json (face_zones.py). Khối chữ trên cảnh
    # người dẫn: thử vị trí mặc định -> trên đầu -> cột phải -> dưới đầu (trên phụ đề); không chỗ nào trống thì thu nhỏ dần.
    FACES = json.load(open(ROOT / "work" / "faces.json")) if (ROOT / "work" / "faces.json").exists() else {}
    SUB_TOP, SAFE_TOP, SAFE_R = 1920 - globals().get('SUB_BOTTOM', 500) - 140, 230, 920
    def kbox(k, s=1.0):                # ước lượng khung khối chữ (UI px)
        hs, ws = 0, 0
        for l in k["lines"]:
            parts = l["text"].split("|")
            px = {"s": (54, 0.5), "m": (112, 0.47), "g": (112, 0.47), "p": (150, 0.5), "q": (150, 0.5)}[l["st"]]
            hs += len(parts) * px[0] * 1.12 * s
            ws = max(ws, max(len(x) for x in parts) * px[0] * px[1] * s)
        return ws + (0 if all(l["st"] == "q" for l in k["lines"]) else 34), hs
    def face_union(sh, a, z):
        fb = [f for f in FACES.get(sh["clip"], []) if sh["ms"] + (a - sh["T"]) - 0.3 <= f[0] <= sh["ms"] + (z - sh["T"]) + 0.3]
        return (min(f[1] for f in fb), min(f[2] for f in fb), max(f[3] for f in fb), max(f[4] for f in fb)) if fb else None
    def hit(a, c):
        return not (a[2] <= c[0] or c[2] <= a[0] or a[3] <= c[1] or c[3] <= a[1])
    for k in keys:
        sh = k["shot"]
        q = all(l["st"] == "q" for l in k["lines"])
        k["pos"] = None
        fu = face_union(sh, k["t0"], k["t1"]) if sh["kind"] == "host" else None
        if not fu:
            continue
        fu = (fu[0] - 30, fu[1] - 30, fu[2] + 30, fu[3] + 30)
        for s in (1.0, 0.85, 0.72, 0.6):
            w, h = kbox(k, s)
            cands = ([((1080 - w) / 2, 560), ((1080 - w) / 2, fu[1] - h), ((1080 - w) / 2, fu[3])] if q else
                     [(66, globals().get('KEY_TOP', 330)), (66, 330), (66, fu[1] - h), (SAFE_R - w, globals().get('KEY_TOP', 330)), (66, fu[3])])
            ok = [(x, y) for x, y in cands if y >= SAFE_TOP and y + h <= SUB_TOP and x >= 40 and x + w <= SAFE_R + 40
                  and not hit((x, y, x + w, y + h), fu)]
            if ok:
                k["pos"] = (round(ok[0][0]), round(ok[0][1]), s)
                break
        assert k["pos"], f"không tìm được chỗ cho chữ {k['lines'][0]['text']} mà không che mặt"
        print("né mặt:", k["lines"][-1]["text"], "->", k["pos"], "vùng đầu", [round(v) for v in fu])

    for s in subs:                     # phụ đề nâng cao; chạm vùng đầu người dẫn thì hạ về 500
        s["bot"] = globals().get("SUB_BOTTOM", 500)
        if s["shot"]["kind"] == "host":
            h = 70 * (1 + len(s["text"]) // 30)
            fu = face_union(s["shot"], s["t0"], s["t1"])
            if fu and fu[3] + 30 > 1920 - s["bot"] - h:
                s["bot"] = 500
                print("phụ đề hạ để né mặt:", s["text"])
    # light/dark text style from the frame under the text
    for sh in shots:
        if sh["kind"] == "map":
            sh["top"], sh["bot"] = 120.0, 120.0
        else:
            sh["top"], sh["bot"] = luma(sh["clip"], sh["ms"] + sh["len"] / 2)

    plan = {"total": round(total, 3), "sections": [{k: s[k] for k in ("id", "T", "len", "m_in", "beats")} for s in secs],
            "shots": shots, "subs": [{k: v for k, v in x.items() if k != "shot"} for x in subs],
            "keys": [{k: v for k, v in x.items() if k != "shot"} for x in keys]}
    (ROOT / "work").mkdir(exist_ok=True)
    json.dump(plan, open(ROOT / "work" / "plan.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    write_cutlist(secs, shots)
    write_audio(secs, total)
    write_sfx_inputs(secs, keys, words, shots)
    write_html(plan, secs, shots, subs, keys, total)
    # reference copy: before rendering, `cmp hf/index.html work/index_built.html` catches Studio writing back a stale copy
    (ROOT / "work" / "index_built.html").write_text((HF / "index.html").read_text(encoding="utf-8"), encoding="utf-8")
    print(f"total {total:.2f}s, {len(shots)} shots, {len(subs)} subtitle chunks, {len(keys)} key texts")
    # checklist aids (LOI_CAN_TRANH.md): reused b-roll, short subtitles
    used = {}
    for sh in shots:
        if sh["kind"] == "broll":
            used.setdefault(sh["clip"], []).append(round(sh["ms"], 2))
    print("b-roll used more than once:", {c: v for c, v in used.items() if len(v) > 1} or "none")
    print("subtitles under 0.7s:", [(s["t0"], s["text"]) for s in subs if s["t1"] - s["t0"] < 0.7] or "none")


def write_cutlist(secs, shots):
    L = ["| # | Phần | T bắt đầu | Dài | Nguồn | Lý do |", "|---|---|---|---|---|---|"]
    why = {"host": "người dẫn nói (khớp môi)", "map": MAP_WHY, "broll": "cảnh nhà khớp lời / nhịp nhạc"}
    for i, sh in enumerate(shots, 1):
        L.append(f"| {i} | {sh['sec']} | {sh['T']:.2f} | {sh['len']:.2f} | {sh['clip']}@{sh['ms']:.2f} | {why[sh['kind']]} |")
    L += [""] + CUT_NOTES
    (ROOT / "work" / "cutlist.md").write_text("\n".join(L), encoding="utf-8")


def write_audio(secs, total):
    n = int(math.ceil((total + 0.5) * SR))
    voice = np.zeros(n, np.float32)
    for s in secs:
        if "voice" not in s:
            continue
        x, sr = sf.read(ROOT / "work" / "audio" / f"voice_{s['host']}.wav", dtype="float32")
        assert sr == SR
        acc = s["T"] + s.get("voff", VOFF)
        for a, b in s["voice"]:
            seg = x[int(round(a * SR)):int(round(b * SR))].copy()
            f = int(0.02 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
            i0 = int(round(acc * SR)); voice[i0:i0 + len(seg)] += seg
            acc += b - a
    sf.write(ROOT / "work" / "audio" / "voice_tl.wav", voice, SR)
    m, sr = sf.read(ROOT / "work" / "audio" / "bgm.wav", dtype="float32")
    assert sr == SR
    music = np.zeros((n, 2), np.float32)
    xf = int(0.04 * SR)
    for s in secs:
        i0, L = int(round(s["T"] * SR)), int(round(s["len"] * SR))
        seg = m[int(round(s["m_in"] * SR)):int(round(s["m_in"] * SR)) + L + xf].copy()
        seg[:xf] *= np.linspace(0, 1, xf)[:, None]; seg[-xf:] *= np.linspace(1, 0, xf)[:, None]
        music[i0:i0 + len(seg)] += seg[:n - i0]
    tail = int(1.2 * SR); e = int(total * SR)
    music[e - tail:e] *= np.linspace(1, 0, tail)[:, None]; music[e:] = 0
    sf.write(ROOT / "work" / "audio" / "music_tl.wav", music, SR)
    # music gain lanes: speech = low bed, music-only = climax
    lanes = []
    for s in secs:
        lanes.append({"t0": s["T"], "t1": s["T"] + s["len"], "kind": "hook" if s["id"] == "hook" else "voice" if "voice" in s else "music"})
    json.dump(lanes, open(ROOT / "work" / "audio" / "lanes.json", "w"), indent=1)


def write_sfx_inputs(secs, keys, words, shots):
    d = ROOT / "work" / "sfx"; d.mkdir(parents=True, exist_ok=True)
    mom = []
    for i, k in enumerate(keys):
        g = [l for l in k["lines"] if l["st"] in ("g", "p", "q", "m")][0]
        say = " ".join(w["w"] for w in words if k["t0"] - 1.5 <= w["t"] <= k["t1"])
        L, T = (globals().get("SFX_INTENT") or [(None, None)] * len(keys))[i]
        mom.append({"id": f"k{i + 1}", "t": g["t"], **({"L": L, "tier": T} if L else {}), "text": " ".join(l["text"].replace("|", " ") for l in k["lines"]), "say": say})
    json.dump(mom, open(d / "moments.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump([[w["t"], w["t"] + 0.2, w["w"]] for w in words], open(d / "words.json", "w", encoding="utf-8"),
              ensure_ascii=False)
    trans = [{"t": s["T"], "id": s["id"]} for s in secs if "voice" not in s]
    mp = next(x for x in shots if x["kind"] == "map")
    json.dump({"bridges": trans, "map": mp["T"]}, open(d / "transitions.json", "w"), indent=1)


# ---------------------------------------------------------------- HTML
MAP = json.load(open(HF / "assets" / "map" / "map.json"))
PIN_UI = (470.0, 900.0)
S_END = 0.62                       # UI px per z16 px at the final map framing (2 km ring ≈ 528 UI px)
S_START = 0.26
def poi_ui(p):
    la0, lo0 = MAP["pin"]
    dx = (p["lon"] - lo0) * 111320 * math.cos(math.radians(la0))
    dy = (p["lat"] - la0) * 110574
    k = S_END / MAP["z16"]["mpp"]
    return PIN_UI[0] + dx * k, PIN_UI[1] - dy * k


ICONS = {
    "school": '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zm-7 9.2v4L12 20l7-3.8v-4L12 16l-7-3.8z"/></svg>',
    "mall": '<svg viewBox="0 0 24 24"><path fill="#fff" d="M7 7V6a5 5 0 0 1 10 0v1h3l-1 14H5L4 7h3zm2 0h6V6a3 3 0 0 0-6 0v1z"/></svg>',
    "cart": '<svg viewBox="0 0 24 24"><path fill="#fff" d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5.2 4l.9 2H21l-3.4 7H8.1l-.9 2H19v2H4l2.2-4.2L3 4H1V2h3.3z"/></svg>',
}


def chars(t):
    return "".join(f'<span class="c">{esc(ch) if ch != " " else "&nbsp;"}</span>' for ch in t)


def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;")


def sub_html(text):
    low = nfc(text).lower()
    spans = []
    for h in HILITE:
        for m in re.finditer(r"(?<!\w)" + re.escape(h) + r"(?!\w)", low):
            spans.append((m.start(), m.end()))
    spans.sort(); out, i = [], 0
    for a, b in spans:
        if a < i:
            continue
        out.append(esc(text[i:a])); out.append(f'<b>{esc(text[a:b])}</b>'); i = b
    out.append(esc(text[i:]))
    return "".join(out)


def write_html(plan, secs, shots, subs, keys, total):
    P = lambda x: f"{x:.3f}"
    vids, tl = [], []
    # Dũng 26/10: smooth transitions on the rhythm — each shot dissolves in over XF (~0.6 beat) and is fully in ON the beat,
    # (the incoming clip starts XF earlier with its media pulled back by XF, so the picture at the cut is unchanged)
    XF = 0.36
    for i, sh in enumerate(shots):
        if sh["kind"] == "map":
            continue
        lead = min(XF, sh["ms"]) if i > 0 else 0.0   # cả cảnh sau bản đồ cũng mờ vào chồng lúc bản đồ mờ ra (trước đây hở đen 0,36s)
        if i > 0 and shots[i - 1]["sec"] != sh["sec"] and next(x for x in secs if x["id"] == shots[i - 1]["sec"]).get("hard_out"):
            lead = 0.0
        vids.append(f'<video id="v{i}" class="clip v" src="assets/video/{sh["clip"]}.mp4" muted playsinline '
                    f'data-start="{P(sh["T"] - lead)}" data-duration="{P(sh["len"] + lead)}" data-media-start="{P(sh["ms"] - lead)}" '
                    f'data-track-index="{i % 2}"></video>')
        if lead > 0.05:
            tl.append(f'tl.fromTo("#v{i}",{{opacity:0}},{{opacity:1,duration:{lead:.3f},ease:"sine.inOut",immediateRender:false}},{P(sh["T"] - lead)});')
    # white flash on every bridge downbeat + the teaser -> speech hand-off
    flashes = [s["T"] for s in secs if s["id"].startswith("br")]
    for t in flashes[:0]:   # Dũng 26/10: the white flash read as flicker -> off (the dissolve carries the transition)
        tl.append(f'tl.fromTo("#flash",{{opacity:0.55}},{{opacity:0,duration:0.22,ease:"power2.out",immediateRender:false}},{P(t)});')
    # subtitles
    sub_divs = []
    for j, s in enumerate(subs):
        dark = s["shot"]["bot"] > 175
        bot = s.get("bot", globals().get("SUB_BOTTOM", 500))
        sub_divs.append(f'<div id="s{j}" class="sub{" dk" if dark else ""}" style="bottom:{bot}px"><span>{sub_html(s["text"])}</span></div>')
        tl.append(f'tl.fromTo("#s{j}",{{opacity:0,y:14}},{{opacity:1,y:0,duration:0.14,ease:"power2.out"}},{P(s["t0"])});')
        tl.append(f'tl.to("#s{j}",{{opacity:0,duration:0.05,ease:"none"}},{P(s["t1"] - 0.05)});')
    # chữ nhấn (Dũng 29/10: theo mẫu viral, có điểm giữ chân) — nguồn mẫu: xếp tầng trái vàng/trắng @quynhanhbds/7676404843660987655;
    # slam phóng to–nhòe vào = recipe dung-text-fx r01-hook-kinetic-slam; chữ nghiêng hiện dần kiểu đánh máy @vietnamhousetour/7557630369000951048 0–3s;
    # giá số chạy lên (số giá to ở hook @lamgiaorealty/7690586383311719688); câu hỏi slam giữa khung = câu nhử bình luận
    def chars(t):
        return "".join(f'<span class="c">{esc(ch) if ch != " " else "&nbsp;"}</span>' for ch in t)
    def money(t):                      # "5 TỶ 750" -> 5750 (triệu), "5 TỶ" -> 5000
        m = re.match(r"(\d+) TỶ ?(\d+)?", t)
        return int(m.group(1)) * 1000 + int(m.group(2) or 0) if m else None
    key_divs = []
    for j, k in enumerate(keys):
        q = all(l["st"] == "q" for l in k["lines"])
        inner = ""
        for n, l in enumerate(k["lines"]):
            if l["st"] == "q":
                body = "<br>".join(chars(x) for x in l["text"].split("|"))
            elif l["st"] == "p" and money(l["text"]):
                body = f'<span class="num" id="k{j}_{n}n">{esc(l["text"])}</span>'
            else:
                body = chars(l["text"])
            col = f' style="color:{l["c"]}"' if l.get("c") and l["st"] != "q" else ""
            ul = " ul" if l.get("a") == "underline" else ""
            inner += f'<div class="ln {l["st"]}{ul}" id="k{j}_{n}"{col}>{body}</div>'
        bar = "" if q else f'<div class="bar" id="k{j}b"></div>'
        pos = ""
        if k.get("pos"):
            x, y, s = k["pos"]
            pos = (f' style="left:{x}px;top:{y}px;transform:scale({s});transform-origin:0 0"' if not q else
                   f' style="top:{y}px;transform:scale({s});transform-origin:50% 0"')
        key_divs.append(f'<div id="k{j}" class="key dk{" q" if q else ""}"{pos} data-layout-allow-overlap>{bar}{inner}</div>')
        tl.append(f'tl.set("#k{j}",{{opacity:1,x:0}},{P(k["t0"])});')
        if not q:
            tl.append(f'tl.fromTo("#k{j}b",{{scaleY:0}},{{scaleY:1,duration:0.22,ease:"power3.out"}},{P(k["t0"])});')
        for n, l in enumerate(k["lines"]):
            sel, t, a = f"#k{j}_{n}", l["t"], l.get("a")
            if l["st"] == "s":            # typewriter
                tl.append(f'tl.fromTo("{sel} .c",{{opacity:0}},{{opacity:1,duration:0.01,stagger:0.03,ease:"none"}},{P(t)});')
            elif l["st"] == "q":          # slam giữa khung + sóng màu
                tl.append(f'tl.fromTo("{sel}",{{opacity:0,scale:1.8,filter:"blur(14px)"}},{{opacity:1,scale:1,filter:"blur(0px)",duration:0.28,ease:"expo.out"}},{P(t - 0.28)});')
                tl.append(f'tl.to("{sel}",{{scale:1.06,duration:0.08,ease:"power2.out"}},{P(t)}); tl.to("{sel}",{{scale:1,duration:0.18,ease:"power2.inOut"}},{P(t + 0.08)});')
                tl.append(f'tl.fromTo("{sel} .c",{{color:"#ffffff"}},{{color:"{l.get("c", "#ffd36b")}",duration:0.01,stagger:0.025}},{P(t + 0.1)});')
                tl.append(f'tl.fromTo("{sel} .c",{{y:0}},{{y:-14,duration:0.12,ease:"sine.out",stagger:{{each:0.025,yoyo:true,repeat:1}}}},{P(t + 0.1)});')
            elif l["st"] == "p" and money(l["text"]):   # giá: số chạy lên, slam, nháy sáng
                v = money(l["text"])
                tl.append(f'tl.fromTo("{sel}",{{opacity:0,scale:1.6,filter:"blur(12px)"}},{{opacity:1,scale:1,filter:"blur(0px)",duration:0.26,ease:"expo.out"}},{P(t - 0.26)});')
                tl.append(f'tl.fromTo(cnt{j}_{n}={{v:{round(v * 0.6)}}},{{v:{round(v * 0.6)}}},{{v:{v},duration:0.55,ease:"power3.out",onUpdate:function(){{money("{sel}n",this.targets()[0].v)}}}},{P(t - 0.26)});')
                tl.append(f'tl.to("{sel}",{{scale:1.08,duration:0.08,ease:"power2.out"}},{P(t + 0.3)}); tl.to("{sel}",{{scale:1,duration:0.2,ease:"power2.inOut"}},{P(t + 0.38)});')
                tl.append(f'tl.fromTo("{sel}",{{textShadow:"0 0 0px rgba(255,200,61,0)"}},{{textShadow:"0 0 46px rgba(255,200,61,.95)",duration:0.18,yoyo:true,repeat:1,ease:"sine.inOut"}},{P(t + 0.3)});')
            elif a == "wipe":             # quét lộ trái -> phải (theo nét MG)
                tl.append(f'tl.fromTo("{sel}",{{clipPath:"inset(-20% 100% -20% 0)"}},{{clipPath:"inset(-20% 0% -20% 0)",duration:0.42,ease:"power2.inOut"}},{P(t)});')
            elif a == "flip":             # lật từng ký tự
                tl.append(f'tl.fromTo("{sel} .c",{{opacity:0,rotationX:-95,transformOrigin:"50% 100%"}},{{opacity:1,rotationX:0,duration:0.34,ease:"back.out(2)",stagger:0.035}},{P(t)});')
            elif a == "bounce":           # nảy đàn hồi
                tl.append(f'tl.fromTo("{sel} .c",{{opacity:0,y:-90,scale:0.6}},{{opacity:1,y:0,scale:1,duration:0.55,ease:"elastic.out(1,0.5)",stagger:0.03}},{P(t)});')
            elif a == "slide":            # trượt theo thước quét ngang
                tl.append(f'tl.fromTo("{sel}",{{opacity:0,x:520,skewX:-18,filter:"blur(8px)"}},{{opacity:1,x:0,skewX:0,filter:"blur(0px)",duration:0.36,ease:"power4.out"}},{P(t)});')
            elif a == "stamp":            # đóng dấu
                tl.append(f'tl.fromTo("{sel}",{{opacity:0,scale:2.4,rotation:-9}},{{opacity:1,scale:1,rotation:-4,duration:0.22,ease:"power4.in"}},{P(t - 0.1)});')
                tl.append(f'tl.to("{sel}",{{scale:1.05,duration:0.06,yoyo:true,repeat:1}},{P(t + 0.12)});')
            elif a == "underline":        # bật chữ + gạch chân vẽ ra
                tl.append(f'tl.fromTo("{sel} .c",{{opacity:0,y:30}},{{opacity:1,y:0,duration:0.2,ease:"power3.out",stagger:0.04}},{P(t)});')
                tl.append(f'tl.fromTo("{sel}",{{backgroundSize:"0% 10px"}},{{backgroundSize:"100% 10px",duration:0.4,ease:"power2.out"}},{P(t + 0.3)});')
            else:                         # chữ to: bật từng ký tự
                tl.append(f'tl.fromTo("{sel} .c",{{opacity:0,y:70,scale:1.5,filter:"blur(10px)"}},{{opacity:1,y:0,scale:1,filter:"blur(0px)",duration:0.3,ease:"expo.out",stagger:0.03}},{P(t)});')
        tl.append(f'tl.to("#k{j}",{{opacity:0,x:{0 if q else -30},duration:0.12,ease:"power2.in"}},{P(k["t1"] - 0.12)});')
    # nhãn phòng (project.LABELS): hiện 0,3s sau cú cắt, tắt trước cú cắt sau
    lab_divs = []
    for i, sh in enumerate(shots):
        txt = globals().get("LABELS", {}).get(sh["clip"])
        if not txt or sh["kind"] != "broll":
            continue
        lab_divs.append(f'<div id="lb{i}" class="lab">{chars(txt)}</div>')
        tl.append(f'tl.set("#lb{i}",{{opacity:1}},{P(sh["T"] + 0.3)});')
        tl.append(f'tl.fromTo("#lb{i} .c",{{opacity:0,y:18}},{{opacity:1,y:0,duration:0.22,ease:"power2.out",stagger:0.025}},{P(sh["T"] + 0.3)});')
        tl.append(f'tl.to("#lb{i}",{{opacity:0,duration:0.2}},{P(sh["T"] + sh["len"] - 0.35)});')
    # MG theo lời (project.MG): mặt bằng vẽ nét / thước mặt đường, chỉ trong cảnh của clip đó
    mg_divs = []
    for i, sh in enumerate(shots):
        cfg = globals().get("MG", {}).get(sh["clip"])
        if not cfg or sh["kind"] != "broll":
            continue
        at = [next((l["t"] for k in keys for l in k["lines"] if l["text"] == x and sh["T"] <= l["t"] < sh["T"] + sh["len"]), sh["T"] + 0.3)
              for x in cfg["at"]]
        end = sh["T"] + sh["len"] - 0.3
        at = [max(x, sh["T"] + 0.5) for x in at]        # MG không hiện trước khi cảnh của nó bắt đầu
        if cfg["kind"] == "plan":       # khung nhà ngang x dài, góc phải, dưới vùng chữ nhấn
            H = 470; W = round(H * cfg["w"] / cfg["l"]); X = 900 - W; Y = 470
            mg_divs.append(f'<svg id="mg{i}" class="mg" viewBox="0 0 1080 1920">'
                           f'<rect id="mg{i}r" x="{X}" y="{Y}" width="{W}" height="{H}" pathLength="1" />'
                           f'<path id="mg{i}w" d="M{X} {Y - 34}H{X + W}M{X} {Y - 50}v32M{X + W} {Y - 50}v32" pathLength="1" />'
                           f'<path id="mg{i}l" d="M{X - 34} {Y}V{Y + H}M{X - 50} {Y}h32M{X - 50} {Y + H}h32" pathLength="1" /></svg>')
            tl.append(f'tl.set("#mg{i}",{{opacity:1}},{P(at[0] - 0.5)});')
            tl.append(f'tl.fromTo("#mg{i}r",{{strokeDashoffset:1}},{{strokeDashoffset:0,duration:0.5,ease:"power2.inOut"}},{P(at[0] - 0.5)});')
            tl.append(f'tl.fromTo("#mg{i}w",{{strokeDashoffset:1}},{{strokeDashoffset:0,duration:0.3,ease:"power2.out"}},{P(at[0])});')
            tl.append(f'tl.fromTo("#mg{i}l",{{strokeDashoffset:1}},{{strokeDashoffset:0,duration:0.3,ease:"power2.out"}},{P(at[1])});')
        else:                           # thước vắt ngang mặt đường
            Y = cfg["y"]
            mg_divs.append(f'<svg id="mg{i}" class="mg" viewBox="0 0 1080 1920">'
                           f'<path id="mg{i}w" d="M120 {Y}H900M120 {Y - 26}v52M900 {Y - 26}v52" pathLength="1" /></svg>')
            tl.append(f'tl.set("#mg{i}",{{opacity:1}},{P(at[0] - 0.2)});')
            tl.append(f'tl.fromTo("#mg{i}w",{{strokeDashoffset:1}},{{strokeDashoffset:0,duration:0.45,ease:"power2.out"}},{P(at[0] - 0.2)});')
        tl.append(f'tl.to("#mg{i}",{{opacity:0,duration:0.2,ease:"power2.in"}},{P(end)});')
    # map
    mp = next(x for x in shots if x["kind"] == "map")
    M0, ML = mp["T"], mp["len"]
    z15, z16 = MAP["z15"], MAP["z16"]
    pois = []
    for p in POIS:
        x, y = poi_ui(p)
        p["x"], p["y"] = round(x, 1), round(y, 1)
        pois.append(p)
    poi_html = "".join(
        f'<div class="poi" id="p_{p["id"]}" style="left:{p["x"]}px;top:{p["y"]}px"><i class="ic {p["icon"]}">{ICONS[p["icon"]]}</i>'
        f'<div class="pl {"lf" if p["x"] > 600 else ""}"><b>{esc(p["name"])}</b><span>{p["km"]}</span></div></div>' for p in pois)
    lines_svg = "".join(
        f'<line id="l_{p["id"]}" x1="{PIN_UI[0]}" y1="{PIN_UI[1]}" x2="{p["x"]}" y2="{p["y"]}" pathLength="1" />' for p in pois)
    tl.append(f'tl.fromTo("#map",{{opacity:0}},{{opacity:1,duration:{XF:.3f},ease:"sine.inOut",immediateRender:false}},{P(M0 - XF)}); '
              f'tl.to("#map",{{opacity:0,duration:{XF:.3f},ease:"sine.inOut"}},{P(M0 + ML - XF)});')
    tl.append(f'tl.set("#mapui",{{opacity:1}},{P(M0)});')
    tl.append(f'tl.fromTo(cam,{{s:{S_START}}},{{s:{S_END},duration:1.3,ease:"power3.inOut",onUpdate:place}},{P(M0)});')
    tl.append(f'tl.fromTo("#pin",{{y:-260,opacity:0}},{{y:0,opacity:1,duration:0.45,ease:"bounce.out"}},{P(M0 + 1.05)});')
    tl.append(f'tl.fromTo("#pinlab",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.25,ease:"power2.out"}},{P(M0 + 1.35)});')
    tl.append(f'tl.fromTo("#ring",{{scale:0,opacity:1}},{{scale:1,opacity:1,duration:0.9,ease:"power2.out"}},{P(M0 + 1.6)});')
    tl.append(f'tl.fromTo("#ringlab",{{opacity:0}},{{opacity:1,duration:0.25}},{P(M0 + 2.2)});')
    for p in pois:
        tl.append(f'tl.fromTo("#l_{p["id"]}",{{strokeDashoffset:1}},{{strokeDashoffset:0,duration:0.35,ease:"power2.out"}},{P(M0 + p["t"] - 0.2)});')
        tl.append(f'tl.fromTo("#p_{p["id"]}",{{opacity:0,scale:0.4}},{{opacity:1,scale:1,duration:0.28,ease:"back.out(2)"}},{P(M0 + p["t"])});')
    tl.append(f'tl.to("#mapui",{{opacity:0,duration:0.18}},{P(M0 + ML - 0.22)});')
    tl.append(f'tl.fromTo("#fade",{{opacity:0}},{{opacity:1,duration:0.5,ease:"none"}},{P(total - 0.5)});')
    ring_r = 2000 / MAP["z16"]["mpp"] * S_END

    html = f'''<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1728, height=3072" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face {{ font-family: "BVP"; src: url("assets/fonts/BeVietnamPro-Bold.ttf"); font-weight: 700; }}
      @font-face {{ font-family: "BVP"; src: url("assets/fonts/BeVietnamPro-ExtraBold.ttf"); font-weight: 800; }}
      @font-face {{ font-family: "BVP"; src: url("assets/fonts/BeVietnamPro-Black.ttf"); font-weight: 900; }}
      @font-face {{ font-family: "PF"; src: url("assets/fonts/PlayfairDisplay-BoldItalic.ttf"); font-weight: 700; font-style: italic; }}
      @font-face {{ font-family: "AN"; src: url("assets/fonts/Anton-Regular.ttf"); }}
      :root {{ {" ".join(f"--{k}: {v};" for k, v in globals().get("PALETTE", {}).items())} }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1728px; height: 3072px; overflow: hidden; background: #000; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "BVP", sans-serif; }}
      .v {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
      #flash, #fade {{ position: absolute; inset: 0; opacity: 0; pointer-events: none; }}
      #flash {{ background: #fff; }} #fade {{ background: #000; }}
      #ui {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; transform: scale(1.6); transform-origin: 0 0; }}
      /* phụ đề: theo lời, mỗi cảnh một cụm, không nền */
      .sub {{ position: absolute; left: 70px; width: 860px; bottom: 500px; text-align: center; opacity: 0; }}
      .sub span {{ font-weight: 800; font-size: 50px; line-height: 1.28; color: #fff; padding-top: .12em; display: inline-block;
        -webkit-text-stroke: 7px rgba(10,10,10,.78); paint-order: stroke fill;
        text-shadow: 0 2px 4px rgba(0,0,0,.85), 0 0 18px rgba(0,0,0,.55); }}
      .sub b {{ -webkit-text-stroke: 7px rgba(10,10,10,.78); paint-order: stroke fill; }}
      .sub b {{ color: #ffd36b; font-weight: 900; }}
      .sub.dk span {{ color: #fff; text-shadow: 0 2px 3px rgba(0,0,0,.95), 0 0 14px rgba(0,0,0,.85), 0 0 30px rgba(0,0,0,.5); }}
      /* chữ to xếp tầng bên trái (vàng/trắng, nét đậm) */
      .key {{ position: absolute; left: 66px; top: {globals().get('KEY_TOP', 330)}px; padding-left: 26px; opacity: 0; }}
      .key .bar {{ position: absolute; left: 0; top: 10px; bottom: 10px; width: 8px; background: #f2c14e; border-radius: 4px; transform-origin: 50% 0; }}
      .key .ln {{ display: block; white-space: nowrap; padding-top: .14em; }}
      .key .s {{ margin-bottom: 4px; }} .key .s + .s, .key .g + .s, .key .m + .s, .key .p + .s {{ margin-top: 10px; }}
      .key .s {{ font-family: "PF", serif; font-style: italic; font-weight: 700; font-size: 50px; line-height: 1.1; color: #fff;
        text-shadow: 0 2px 6px rgba(0,0,0,.8), 0 0 22px rgba(0,0,0,.5); }}
      .key .m, .key .g, .key .p {{ font-family: "AN", "BVP", sans-serif; font-size: 112px; line-height: 1.02; letter-spacing: .01em;
        text-shadow: 0 4px 10px rgba(0,0,0,.6), 0 0 30px rgba(0,0,0,.35); }}
      .key .m {{ color: #fff; }} .key .g {{ color: #ffd36b; }}
      .key .p {{ font-size: 150px; color: #ffd36b; }}
      .key.dk .s {{ font-size: 54px; -webkit-text-stroke: 6px rgba(10,10,10,.8); paint-order: stroke fill;
        text-shadow: 0 2px 4px rgba(0,0,0,.95), 0 0 20px rgba(0,0,0,.75); }}
      .key.dk .m, .key.dk .g, .key.dk .p {{ -webkit-text-stroke: 8px rgba(10,10,10,.7); paint-order: stroke fill;
        text-shadow: 0 4px 10px rgba(0,0,0,.85), 0 0 34px rgba(0,0,0,.6); }}
      /* bản đồ vệ tinh kiểu Google Maps */
      #map {{ position: absolute; inset: 0; opacity: 0; overflow: hidden; background: #6b7a6b; }}
      #map img {{ position: absolute; left: 0; top: 0; transform-origin: 0 0; }}
      #mapui {{ position: absolute; inset: 0; }}
      #ring {{ position: absolute; left: {PIN_UI[0] - ring_r:.1f}px; top: {PIN_UI[1] - ring_r:.1f}px; width: {2 * ring_r:.1f}px; height: {2 * ring_r:.1f}px;
        border-radius: 50%; border: 4px solid rgba(26,115,232,.95); background: rgba(26,115,232,.12); transform: scale(0); }}
      #ringlab {{ position: absolute; left: {PIN_UI[0] + ring_r * 0.70:.1f}px; top: {PIN_UI[1] - ring_r * 0.71 - 40:.1f}px; opacity: 0;
        font-weight: 800; font-size: 34px; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,.9); }}
      #pin {{ position: absolute; left: {PIN_UI[0] - 34}px; top: {PIN_UI[1] - 92}px; width: 68px; height: 92px; opacity: 0; }}
      #pinlab {{ position: absolute; left: {PIN_UI[0] - 300}px; width: 600px; top: {PIN_UI[1] - 210}px; text-align: center; opacity: 0;
        text-shadow: 0 2px 6px rgba(0,0,0,.95), 0 0 18px rgba(0,0,0,.7); color: #fff; }}
      #pinlab b {{ display: block; font-weight: 900; font-size: 56px; padding-top: .12em; }}
      #pinlab span {{ display: block; font-family: "PF", serif; font-style: italic; font-size: 38px; color: #ffd36b; }}
      svg.links {{ position: absolute; inset: 0; width: 1080px; height: 1920px; }}
      svg.links line {{ stroke: #fff; stroke-width: 4; stroke-dasharray: .03 .02; stroke-dashoffset: 1; filter: drop-shadow(0 1px 2px rgba(0,0,0,.8)); }}
      .poi {{ position: absolute; width: 0; height: 0; opacity: 0; }}
      .poi .ic {{ position: absolute; left: -26px; top: -26px; width: 52px; height: 52px; border-radius: 50%; border: 4px solid #fff;
        display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,.55); }}
      .poi .ic svg {{ width: 28px; height: 28px; }}
      .ic.school {{ background: #1a73e8; }} .ic.mall {{ background: #e8710a; }} .ic.cart {{ background: #188038; }}
      .poi .pl {{ position: absolute; left: 38px; top: -38px; white-space: nowrap; color: #fff; text-shadow: 0 2px 5px rgba(0,0,0,.95), 0 0 16px rgba(0,0,0,.7); }}
      .poi .pl.lf {{ left: auto; right: 38px; text-align: right; }}
      .poi .pl b {{ display: block; font-weight: 800; font-size: 36px; padding-top: .1em; }}
      .poi .pl span {{ display: block; font-weight: 700; font-size: 32px; color: #ffd36b; }}
      svg.mg {{ position: absolute; inset: 0; width: 1080px; height: 1920px; opacity: 0; }}
      svg.mg rect, svg.mg path {{ fill: none; stroke: #fff; stroke-width: 6; stroke-linecap: round; stroke-dasharray: 1 1; stroke-dashoffset: 1;
        filter: drop-shadow(0 2px 3px rgba(0,0,0,.9)) drop-shadow(0 0 10px rgba(0,0,0,.5)); }}
      svg.mg path {{ stroke: #ffd36b; }}
      .key .c {{ display: inline-block; }}
      .key {{ perspective: 900px; }}
      .key .ln.ul {{ display: inline-block; background: linear-gradient(currentColor,currentColor) 0 96%/0% 10px no-repeat; }}
      .key.q {{ left: 0; width: 1080px; top: 560px; padding-left: 0; text-align: center; }}
      .key .q {{ display: inline-block; font-family: "AN", "BVP", sans-serif; font-size: 150px; line-height: 1.04; color: #fff; white-space: nowrap;
        -webkit-text-stroke: 9px rgba(10,10,10,.75); paint-order: stroke fill; text-shadow: 0 6px 14px rgba(0,0,0,.7), 0 0 40px rgba(0,0,0,.45); }}
      .key .p .num {{ display: inline-block; }}
      .key .ln {{ transform-origin: 0 60%; }} .key .q {{ transform-origin: 50% 50%; }}
      .lab {{ position: absolute; left: 0; width: 1080px; top: 470px; text-align: center; opacity: 0; font-weight: 800; font-size: 46px;
        color: var(--nhan-phong, #fff); padding-top: .12em; text-shadow: 0 2px 6px rgba(0,0,0,.9), 0 0 20px rgba(0,0,0,.6); }}
      .lab .c {{ display: inline-block; }}
      #attr {{ position: absolute; right: 170px; top: 240px; font-size: 20px; color: rgba(255,255,255,.9); text-shadow: 0 1px 3px #000; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{P(total)}" data-width="1728" data-height="3072" data-fps="50">
      {chr(10).join("      " + v for v in vids).strip()}
      <div id="map">
        <img id="z15" src="assets/map/z15.jpg" width="{z15['w']}" height="{z15['h']}" />
        <img id="z16" src="assets/map/z16.jpg" width="{z16['w']}" height="{z16['h']}" />
      </div>
      <div id="flash"></div>
      <div id="ui">
        <div id="mapui" style="opacity:0">
          <div id="ring"></div><div id="ringlab">2km</div>
          <svg class="links" viewBox="0 0 1080 1920">{lines_svg}</svg>
          {poi_html}
          <svg id="pin" viewBox="0 0 68 92"><path d="M34 2C17 2 3 15.5 3 33c0 22 31 57 31 57s31-35 31-57C65 15.5 51 2 34 2z" fill="#ea4335" stroke="#a50e0e" stroke-width="3"/><circle cx="34" cy="33" r="11" fill="#7a0b0b"/></svg>
          <div id="pinlab"><b>{MAP_LABEL[0]}</b><span>{MAP_LABEL[1]}</span></div>
          <div id="attr">© Esri · © OpenStreetMap</div>
        </div>
        {"".join(lab_divs)}
        {"".join(mg_divs)}
        {"".join(key_divs)}
        {"".join(sub_divs)}
      </div>
      <div id="fade"></div>
      <audio id="mix" src="assets/audio/mix.wav" data-start="0" data-duration="{P(total)}" data-track-index="8" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      var tl = gsap.timeline({{ paused: true }});
      var Z = {{ w15: {z15['w']}, h15: {z15['h']}, w16: {z16['w']}, h16: {z16['h']} }};
      var PX = {PIN_UI[0]} * 1.6, PY = {PIN_UI[1]} * 1.6;   // pin on the 1728x3072 canvas
      var cam = {{ s: {S_START} }};
      function money(id, v) {{ v = Math.round(v); var t = Math.floor(v / 1000), r = v % 1000;
        document.getElementById(id.slice(1)).textContent = t + " TỶ" + (r ? " " + String(r).padStart(3, "0") : ""); }}
      function place() {{
        var s = cam.s * 1.6;                                 // canvas px per z16 px
        var a = document.getElementById("z16"), b = document.getElementById("z15");
        a.style.transform = "translate(" + (PX - Z.w16 / 2 * s) + "px," + (PY - Z.h16 / 2 * s) + "px) scale(" + s + ")";
        b.style.transform = "translate(" + (PX - Z.w15 * s) + "px," + (PY - Z.h15 * s) + "px) scale(" + (2 * s) + ")";
        var k = Math.min(1, Math.max(0, (cam.s - 0.5) / 0.08));   // z16 only once it covers the frame
        a.style.opacity = k;
      }}
      place();
      {chr(10).join("      " + x for x in tl).strip()}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
'''
    (HF / "index.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
