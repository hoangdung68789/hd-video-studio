"""Đo chữ hiệu ứng + SFX trong một clip (mẫu gốc hoặc bản tái hiện) → measure.json + khung khóa.

Dùng:
  python measure.py <video> --out <thư mục> [--bg nền.png | --bg-frame 0] [--mode diff|luma] [--thr 30]
                    [--group word|char|line] [--t0 giây --t1 giây]

Cách tách chữ:
  diff (mặc định): mặt nạ = |khung − nền sạch| > thr (nền tĩnh; nền lấy từ --bg hoặc khung --bg-frame).
  luma: mặt nạ = độ sáng > thr (chữ sáng trên nền tối, nền động).
Nền động + chữ tối → không đo được đúng: ghi rõ trong spec, chấm trên mặt nạ do Dũng/agent cắt tay.

Đầu ra (trong --out):
  measure.json  — fps, kích thước, mốc (in_start, touch, peak, rest, out_start, out_end), số đo từng khung
                  (tâm, bbox, scale, opacity-proxy, xoay, độ nét), màu nghỉ (RGB/Lab), bán kính glow,
                  độ trễ từng cụm chữ, sự kiện âm thanh (onset/đỉnh/thời lượng/đường bao/loại/độ to).
  key_in.png, key_peak.png, key_rest.png (+ mask_*.png) — khung khóa toàn khung hình.
"""
import argparse, json, os, subprocess, sys
import numpy as np
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
from colorlab import rgb_to_lab  # noqa: E402


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate,nb_frames:format=duration", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    s = j["streams"][0]
    n, d = s["r_frame_rate"].split("/")
    has_audio = bool(json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
                                                 "stream=index", "-of", "json", path], capture_output=True, text=True).stdout).get("streams"))
    return int(s["width"]), int(s["height"]), float(n) / float(d), float(j["format"]["duration"]), has_audio


def frames(path, w, h, t0=None, t1=None):
    cmd = ["ffmpeg", "-v", "error"]
    if t0 is not None:
        cmd += ["-ss", str(t0)]
    cmd += ["-i", path]
    if t1 is not None:
        cmd += ["-t", str(t1 - (t0 or 0))]
    cmd += ["-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = w * h * 3
    while True:
        b = p.stdout.read(size)
        if len(b) < size:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)
    p.wait()


def read_image(path):
    from PIL import Image
    return np.asarray(Image.open(path).convert("RGB"))


def save_png(arr, path):
    from PIL import Image
    Image.fromarray(arr).save(path)


def gray(rgb):
    return (rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114).astype(np.float32)


def iou(a, b):
    u = np.logical_or(a, b).sum()
    return float(np.logical_and(a, b).sum() / u) if u else 1.0


def audio_events(path, fps, t0=None, t1=None):
    sr = 48000
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", str(t0)] if t0 is not None else []) + ["-i", path]
    cmd += (["-t", str(t1 - (t0 or 0))] if t1 is not None else []) + ["-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    if x.size == 0 or np.abs(x).max() < 1e-5:
        return [], sr
    hop = sr / fps
    nfr = int(len(x) // hop)
    env = np.array([np.sqrt(np.mean(x[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-12) for i in range(nfr)])
    db = 20 * np.log10(env)
    peak_db = db.max()
    act = db > max(peak_db - 35, -60)
    # gom đoạn hoạt động, nối khe < 3 khung
    events, i = [], 0
    while i < nfr:
        if act[i]:
            j = i
            gap = 0
            while j + 1 < nfr and (act[j + 1] or gap < 3):
                gap = 0 if act[j + 1] else gap + 1
                j += 1
            while j > i and not act[j]:
                j -= 1
            events.append((i, j))
            i = j + 1
        else:
            i += 1
    out = []
    for a, b in events:
        seg = x[int(a * hop):int((b + 1) * hop)]
        e = env[a:b + 1]
        pk = a + int(np.argmax(e))
        spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) if len(seg) > 16 else np.zeros(2)
        fr = np.fft.rfftfreq(len(seg), 1 / sr) if len(seg) > 16 else np.zeros(2)
        cen = float((spec * fr).sum() / (spec.sum() + 1e-9))
        dur = (b - a + 1) / fps
        att = (pk - a) / fps
        if dur < 0.12 and att < 0.04:
            kind = "click"
        elif (pk - a) > 0.7 * (b - a) and dur > 0.8:
            kind = "riser"
        elif cen > 4500 and dur > 1.0:
            kind = "shimmer"
        elif att <= 0.05 and dur < 0.7:
            kind = "pop" if cen > 2500 else "hit"
        elif att > 0.06 and dur < 1.6:
            kind = "whoosh"
        else:
            kind = "hit" if att <= 0.05 else "swell"
        out.append({"onset": a, "peak": pk, "end": b, "dur_s": round(dur, 4), "attack_s": round(att, 4),
                    "centroid_hz": round(cen, 1), "rms_db": round(float(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)), 2),
                    "peak_db": round(float(db[pk]), 2), "kind": kind,
                    "envelope": [round(float(v), 5) for v in (e / (e.max() + 1e-12))]})
    return out, sr


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", required=True)
    ap.add_argument("--bg")
    ap.add_argument("--bg-frame", type=int, default=0)
    ap.add_argument("--mode", default="diff", choices=["diff", "luma"])
    ap.add_argument("--thr", type=float, default=30)
    ap.add_argument("--group", default="word", choices=["word", "char", "line"])
    ap.add_argument("--t0", type=float)
    ap.add_argument("--t1", type=float)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    W, H, fps, dur, has_audio = probe(a.video)

    bg = None
    if a.mode == "diff":
        if a.bg:
            bg = read_image(a.bg).astype(np.int16)
        else:
            for k, fr in enumerate(frames(a.video, W, H, a.t0, a.t1)):
                if k == a.bg_frame:
                    bg = fr.astype(np.int16)
                    break
    bg_gray = gray(bg) if bg is not None else None

    masks, stats = [], []
    prev = None
    for k, fr in enumerate(frames(a.video, W, H, a.t0, a.t1)):
        if a.mode == "diff":
            d = np.abs(fr.astype(np.int16) - bg).max(axis=2)
        else:
            d = gray(fr)
        m = d > a.thr
        m = ndimage.binary_opening(m, iterations=1)
        g = gray(fr)
        area = int(m.sum())
        st = {"f": k, "area": area, "iou_prev": iou(m, prev) if prev is not None else 0.0}
        if area:
            ys, xs = np.nonzero(m)
            st.update(cx=float(xs.mean()), cy=float(ys.mean()), x0=int(xs.min()), x1=int(xs.max()),
                      y0=int(ys.min()), y1=int(ys.max()))
            cov = np.cov(np.vstack([xs, ys])) if area > 2 else np.eye(2)
            st["angle"] = float(np.degrees(0.5 * np.arctan2(2 * cov[0, 1], cov[0, 0] - cov[1, 1])))
            dm = ndimage.binary_dilation(m, iterations=2)
            gy, gx = np.gradient(g)
            st["sharp"] = float(np.hypot(gx, gy)[dm].mean())
            st["energy"] = float(d[m].astype(np.float32).sum())
        masks.append(np.packbits(m))
        stats.append(st)
        prev = m
    n = len(stats)
    unpack = lambda i: np.unpackbits(masks[i])[:H * W].reshape(H, W).astype(bool)
    areas = np.array([s["area"] for s in stats])
    if areas.max() == 0:
        print("Không tìm thấy chữ (mặt nạ rỗng) — kiểm --bg/--mode/--thr")
        sys.exit(3)

    # nghỉ = giữa đoạn ổn định dài nhất (IoU khung liền kề ≥ 0.97, diện tích ≥ 50% cực đại)
    stable = [(s["iou_prev"] >= 0.97 and s["area"] >= 0.5 * areas.max()) for s in stats]
    best, cur, bs = (0, 0), 0, 0
    for i, ok in enumerate(stable):
        if ok:
            if cur == 0:
                bs = i
            cur += 1
            if cur > best[1] - best[0]:
                best = (bs, i + 1)
        else:
            cur = 0
    rest = (best[0] + best[1]) // 2 if best[1] > best[0] else int(np.argmax(areas))
    mr = unpack(rest)
    ra = areas[rest]
    on = np.nonzero(areas > 0.02 * ra)[0]
    in_start, out_end = int(on[0]), int(on[-1])
    ious = np.array([iou(unpack(i), mr) for i in range(n)])
    touch = next(i for i in range(in_start, rest + 1) if ious[i] >= 0.9)
    out_start = rest
    while out_start + 1 < n and ious[out_start + 1] >= 0.9:
        out_start += 1
    energy = np.array([s.get("energy", 0) for s in stats])
    peak = int(in_start + np.argmax(energy[in_start:out_start + 1] * 1.0))
    in_mid = in_start + max(1, (touch - in_start) // 2) if touch > in_start else in_start

    R = stats[rest]
    rh, rw = R["y1"] - R["y0"] + 1, R["x1"] - R["x0"] + 1
    per = []
    for i in range(in_start, out_end + 1):
        s = stats[i]
        if not s["area"]:
            per.append({"f": i, "opacity": 0.0})
            continue
        e_rest = float(np.abs(0) + R["energy"])
        per.append({"f": i, "cx": s["cx"] / H, "cy": s["cy"] / H, "scale_h": (s["y1"] - s["y0"] + 1) / rh,
                    "scale_w": (s["x1"] - s["x0"] + 1) / rw, "opacity": min(1.5, s["energy"] / e_rest),
                    "angle": s["angle"] - R["angle"], "sharp": s["sharp"] / (R["sharp"] + 1e-9),
                    "iou_rest": float(ious[i])})

    # cụm chữ (từ/ký tự/dòng) và độ trễ xuất hiện
    k = {"char": (1, 1), "word": (max(2, int(rh * 0.18)), 1), "line": (max(2, int(rh * 0.6)), 1)}[a.group]
    lab, nl = ndimage.label(ndimage.binary_dilation(mr, structure=np.ones((1, 2 * k[0] + 1))))
    groups = []
    for gi in range(1, nl + 1):
        reg = (lab == gi) & mr
        sl = ndimage.find_objects((lab == gi).astype(int))[0]
        if reg.sum() < 0.002 * ra:
            continue
        cov_rest = reg.sum()
        app = None
        for i in range(in_start, rest + 1):
            mi = unpack(i)[sl]
            if (mi & reg[sl]).sum() >= 0.5 * cov_rest:
                app = i
                break
        groups.append({"x0": int(sl[1].start), "y0": int(sl[0].start), "appear": app})
    groups.sort(key=lambda g: (g["y0"] // max(1, rh // 2), g["x0"]))

    # khung khóa (RGB) + màu + glow
    keys = {"in": in_mid, "peak": peak, "rest": rest}
    rgb_keys = {}
    for kk, idx in keys.items():
        for j, fr in enumerate(frames(a.video, W, H, a.t0, a.t1)):
            if j == idx:
                rgb_keys[kk] = fr.copy()
                break
        save_png(rgb_keys[kk], os.path.join(a.out, f"key_{kk}.png"))
        save_png((unpack(idx) * 255).astype(np.uint8), os.path.join(a.out, f"mask_{kk}.png"))
    fr = rgb_keys["rest"]
    core = ndimage.binary_erosion(mr, iterations=2)
    if core.sum() < 20:
        core = mr
    ys = np.nonzero(core)[0]
    top = core & (np.arange(H)[:, None] <= np.percentile(ys, 20))
    bot = core & (np.arange(H)[:, None] >= np.percentile(ys, 80))
    cols = {nm: np.median(fr[mm], axis=0).tolist() for nm, mm in (("main", core), ("top", top), ("bottom", bot))}
    labs = {nm: rgb_to_lab(np.array(c)[None, :] / 255.0)[0].tolist() for nm, c in cols.items()}
    glow = 0
    if bg is not None:
        dd = np.abs(fr.astype(np.int16) - bg).max(axis=2).astype(np.float32)
        dist = ndimage.distance_transform_edt(~mr)
        base = dd[(dist > 0) & (dist <= 1.5)].mean() if ((dist > 0) & (dist <= 1.5)).any() else 0
        for r in range(1, 120):
            ring = (dist > r - 0.5) & (dist <= r + 0.5)
            if not ring.any() or dd[ring].mean() < max(4.0, 0.1 * base):
                glow = r
                break

    events, _ = audio_events(a.video, fps, a.t0, a.t1) if has_audio else ([], 0)
    res = {"video": os.path.abspath(a.video), "width": W, "height": H, "fps": fps, "frames": n,
           "mode": a.mode, "thr": a.thr, "group": a.group,
           "milestones": {"in_start": in_start, "touch": touch, "peak": peak, "rest": rest,
                          "out_start": out_start, "out_end": out_end, "in_mid": in_mid},
           "rest_box": {"x0": R["x0"], "y0": R["y0"], "w": rw, "h": rh},
           "color_rgb": cols, "color_lab": labs, "glow_px": glow,
           "groups": groups, "per_frame": per, "audio": events}
    json.dump(res, open(os.path.join(a.out, "measure.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    ms = res["milestones"]
    print(f"{os.path.basename(a.video)}: {W}x{H}@{fps:g} khung={n} mốc={ms} cụm={len(groups)} glow={glow}px "
          f"màu={[round(v) for v in cols['main']]} sfx={[(e['kind'], e['onset'], e['peak']) for e in events]}")


if __name__ == "__main__":
    main()
