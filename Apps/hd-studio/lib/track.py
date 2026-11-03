# Bộ tracking của HD Studio: theo vật thể, theo cảnh quay (camera), theo người dẫn.
# Đọc cấu hình JSON, in tiến độ "P <phần trăm>", ghi kết quả ra tệp JSON.
# Mọi tọa độ tính theo đơn vị chiều rộng khung video, để không phụ thuộc độ phân giải phân tích.
import json
import math
import subprocess
import sys

import cv2
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")


def say(pc):
    print(f"P {int(pc)}", flush=True)


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:stream_side_data=rotation", "-of", "json", path], capture_output=True)
    s = json.loads(r.stdout)["streams"][0]
    w, h = s["width"], s["height"]
    rot = next((d.get("rotation", 0) for d in s.get("side_data_list", []) if "rotation" in d), 0)
    return (h, w) if abs(int(rot)) % 180 == 90 else (w, h)


def channel_of(bgr, name):
    if name == "sat":
        return cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[:, :, 1]
    if name == "red":
        return bgr[:, :, 2]
    if name == "green":
        return bgr[:, :, 1]
    if name == "blue":
        return bgr[:, :, 0]
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)


def read_frames(cfg, width):
    vw, vh = probe(cfg["video"])
    w = min(width, vw) & ~1
    h = int(round(vh * w / vw)) & ~1
    dur = max(0.04, cfg["t1"] - cfg["t0"])
    fps = float(cfg.get("fps") or 30)
    # Đoạn dài thì giảm nhịp phân tích để không tràn bộ nhớ.
    fps = min(fps, 1500 / dur)
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{cfg['t0']:.3f}", "-t", f"{dur:.3f}", "-i", cfg["video"], "-an", "-vf", f"fps={fps:.4f},scale={w}:{h}", "-pix_fmt", "bgr24", "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    size = w * h * 3
    want = max(1, int(dur * fps))
    frames, colors = [], {}
    every = max(1, int(fps * 0.25))
    keep_color = cfg.get("mode") in ("person", "scene")
    while True:
        b = p.stdout.read(size)
        if len(b) < size:
            break
        bgr = np.frombuffer(b, np.uint8).reshape(h, w, 3)
        frames.append(channel_of(bgr, cfg.get("channel", "luma")))
        if keep_color and (len(frames) - 1) % every == 0:
            colors[len(frames) - 1] = cv2.resize(bgr, (240, max(2, int(h * 240 / w))))
        if len(frames) % 15 == 0:
            say(min(25, 25 * len(frames) / want))
    p.wait()
    if not frames:
        raise RuntimeError("Không đọc được khung hình nào từ video")
    return frames, colors, w, h, fps


LK = dict(maxLevel=3, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))


def flow(prev, cur, pts, win):
    """Dò điểm từ khung trước sang khung sau, bỏ điểm không đi về được chỗ cũ."""
    if pts is None or len(pts) < 3:
        return None, None
    p1, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, pts, None, winSize=(win, win), **LK)
    p0, st2, _ = cv2.calcOpticalFlowPyrLK(cur, prev, p1, None, winSize=(win, win), **LK)
    good = (st.ravel() == 1) & (st2.ravel() == 1) & (np.abs(pts - p0).reshape(-1, 2).max(1) < 1.2)
    if good.sum() < 3:
        return None, None
    return pts[good], p1[good]


def similarity(a, b):
    """Ma trận dời, phóng, xoay từ tập điểm a sang b, kèm tỉ lệ điểm tin được."""
    if a is None or len(a) < 3:
        return None, 0.0, None
    m, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=300, confidence=0.99)
    if m is None:
        return None, 0.0, None
    keep = inl.ravel() == 1
    return m, float(keep.mean()), b[keep].reshape(-1, 1, 2)


def to3(m):
    return np.vstack([m, [0, 0, 1]])


def features(img, box, count=120):
    h, w = img.shape
    x, y, bw, bh = box
    x0, y0 = max(0, int(x)), max(0, int(y))
    x1, y1 = min(w, int(x + bw)), min(h, int(y + bh))
    if x1 - x0 < 4 or y1 - y0 < 4:
        return None
    mask = np.zeros_like(img)
    mask[y0:y1, x0:x1] = 255
    return cv2.goodFeaturesToTrack(img, count, 0.01, max(2, min(bw, bh) / 20), mask=mask, blockSize=5)


def crop(img, cx, cy, bw, bh):
    h, w = img.shape
    x0, y0 = int(round(cx - bw / 2)), int(round(cy - bh / 2))
    x1, y1 = x0 + int(bw), y0 + int(bh)
    if x0 < 0 or y0 < 0 or x1 > w or y1 > h or x1 - x0 < 4 or y1 - y0 < 4:
        return None
    return img[y0:y1, x0:x1]


def ncc(a, b):
    if a is None or b is None:
        return 0.0
    if a.shape != b.shape:
        b = cv2.resize(b, (a.shape[1], a.shape[0]))
    return float(cv2.matchTemplate(b, a, cv2.TM_CCOEFF_NORMED)[0][0])


def search_match(img, tpl, cx, cy, reach):
    """Tìm mẫu quanh vị trí cũ khi vùng không đủ điểm đặc trưng."""
    th, tw = tpl.shape
    h, w = img.shape
    x0, y0 = max(0, int(cx - tw / 2 - reach)), max(0, int(cy - th / 2 - reach))
    x1, y1 = min(w, int(cx + tw / 2 + reach)), min(h, int(cy + th / 2 + reach))
    if x1 - x0 < tw or y1 - y0 < th:
        return None
    r = cv2.matchTemplate(img[y0:y1, x0:x1], tpl, cv2.TM_CCOEFF_NORMED)
    _, v, _, loc = cv2.minMaxLoc(r)
    return x0 + loc[0] + tw / 2, y0 + loc[1] + th / 2, float(v)


class Faces:
    """Tìm mặt người dẫn. Vùng nghi là mặt phải có màu da, tránh nhận nhầm tường, bầu trời, dây điện."""

    def __init__(self):
        d = cv2.data.haarcascades
        self.front = cv2.CascadeClassifier(d + "haarcascade_frontalface_default.xml")
        self.side = cv2.CascadeClassifier(d + "haarcascade_profileface.xml")
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    @staticmethod
    def skin(color, box, w):
        if color is None:
            return True
        k = color.shape[1] / w
        x, y, bw, bh = [v * k for v in box]
        # Lấy phần giữa khung mặt, bỏ tóc và nền ở rìa.
        x0, y0 = int(x + bw * 0.25), int(y + bh * 0.25)
        x1, y1 = int(x + bw * 0.75) + 1, int(y + bh * 0.75) + 1
        part = color[max(0, y0):y1, max(0, x0):x1]
        if part.size == 0:
            return False
        ycc = cv2.cvtColor(part, cv2.COLOR_BGR2YCrCb)
        cr, cb = ycc[:, :, 1], ycc[:, :, 2]
        return float(np.mean((cr >= 133) & (cr <= 178) & (cb >= 75) & (cb <= 130))) >= 0.3

    def find(self, img, near=None, color=None):
        h, w = img.shape
        k = min(1.0, 480 / w)
        small = cv2.resize(img, None, fx=k, fy=k) if k < 1 else img
        small = cv2.equalizeHist(small)
        lo, hi = int(small.shape[1] * 0.05), int(small.shape[1] * 0.6)
        found = []
        for c in (self.front, self.side):
            hits = c.detectMultiScale(small, 1.1, 6, minSize=(lo, lo), maxSize=(hi, hi))
            found += [tuple(float(v) / k for v in b) for b in hits] if len(hits) else []
            found = [b for b in found if self.skin(color, b, w)]
            if found:
                break
        if not found:
            rects, weights = self.hog.detectMultiScale(small, winStride=(8, 8), padding=(8, 8), scale=1.06)
            # Dáng người: đầu nằm ở phần trên khung người.
            heads = [((x + bw * 0.3) / k, (y + bh * 0.04) / k, bw * 0.4 / k, bh * 0.16 / k) for (x, y, bw, bh), g in zip(rects, weights) if float(g) > 0.8]
            found = [b for b in heads if self.skin(color, b, w)]
        if not found:
            return None
        if near is not None:
            return min(found, key=lambda b: math.hypot(b[0] + b[2] / 2 - near[0], b[1] + b[3] / 2 - near[1]))
        return max(found, key=lambda b: b[2] * b[3])


def track_object(frames, ref, box, cfg, w, span, offset):
    """Trả về danh sách (M lũy kế so với khung gốc, tin cậy) theo một chiều, bắt đầu từ khung gốc."""
    order = range(ref, len(frames)) if span > 0 else range(ref, -1, -1)
    thr, low = float(cfg.get("conf", 0.6)), cfg.get("low", "adapt")
    bw, bh = box[2], box[3]
    cx0, cy0 = box[0] + bw / 2, box[1] + bh / 2
    win = int(max(11, min(61, min(bw, bh) * float(cfg.get("search", 1.5)) / 2))) | 1
    reach = max(bw, bh) * (float(cfg.get("search", 1.5)) - 1) + 4
    tpl = crop(frames[ref], cx0, cy0, bw, bh)
    pts = features(frames[ref], box)
    use_scale = bool(cfg.get("scale", True))
    use_rot = bool(cfg.get("rot", True))
    M = np.eye(3)
    out = {ref: (M.copy(), 1.0)}
    stopped = False
    vel = []
    last = ref
    for n, i in enumerate(order):
        if i == ref:
            continue
        say(offset + span * 35 * n / max(1, len(order)) * (1 if span > 0 else -1))
        if stopped:
            break
        prev, cur = frames[last], frames[i]
        a, b = flow(prev, cur, pts, win)
        m, part, kept = similarity(a, b)
        cx, cy = (M @ [cx0, cy0, 1])[:2]
        if m is None:
            hit = search_match(cur, tpl, cx, cy, reach) if tpl is not None else None
            if hit and hit[2] > 0.3:
                step = np.array([[1, 0, hit[0] - cx], [0, 1, hit[1] - cy], [0, 0, 1]], float)
                conf = hit[2]
            else:
                step, conf = np.eye(3), 0.0
            pts = None
        else:
            step = to3(m)
            if not use_scale or not use_rot:
                # Kênh không dùng thì bỏ khỏi ma trận, tránh sai số cộng dồn.
                s, r = math.hypot(step[0, 0], step[1, 0]), math.atan2(step[1, 0], step[0, 0])
                s = s if use_scale else 1.0
                r = r if use_rot else 0.0
                nx, ny = (step @ [cx, cy, 1])[:2]
                c, sn = s * math.cos(r), s * math.sin(r)
                step = np.array([[c, -sn, nx - (c * cx - sn * cy)], [sn, c, ny - (sn * cx + c * cy)], [0, 0, 1]])
            pts = kept
            nx, ny = (step @ [cx, cy, 1])[:2]
            conf = 0.5 * part + 0.5 * max(0.0, ncc(tpl, crop(cur, nx, ny, bw, bh)))
        # Xử lý khi độ tin cậy thấp, như mục "If Confidence is Below" của After Effects.
        if conf < thr:
            if low == "stop":
                stopped = True
                break
            if low == "extrapolate" and vel:
                dx, dy = np.mean(vel[-5:], axis=0)
                step = np.array([[1, 0, dx], [0, 1, dy], [0, 0, 1]], float)
        M = step @ M
        nx, ny = (M @ [cx0, cy0, 1])[:2]
        vel.append((nx - cx, ny - cy))
        s = math.hypot(M[0, 0], M[1, 0])
        if pts is None or len(pts) < 12 or (conf < thr and low == "adapt"):
            pts = features(cur, (nx - bw * s / 2, ny - bh * s / 2, bw * s, bh * s))
            if low == "adapt" and conf >= 0.3:
                fresh = crop(cur, nx, ny, bw, bh)
                tpl = fresh if fresh is not None else tpl
        out[i] = (M.copy(), float(max(0.0, min(1.0, conf))))
        last = i
    return out


def track_scene(frames, ref, cfg, w, h, span, offset, avoid=None):
    """Chuyển động của cả cảnh: lấy điểm trên toàn khung, bỏ vùng có người để camera không bị kéo theo người."""
    order = range(ref, len(frames)) if span > 0 else range(ref, -1, -1)
    M = np.eye(3)
    out = {ref: (M.copy(), 1.0)}
    mask = np.full((h, w), 255, np.uint8)
    last = ref
    for n, i in enumerate(order):
        if i == ref:
            continue
        say(offset + span * 35 * n / max(1, len(order)) * (1 if span > 0 else -1))
        m_prev = mask.copy()
        if avoid is not None:
            x, y, bw, bh = avoid
            # Vùng người: từ đầu kéo xuống hết khung.
            m_prev[max(0, int(y - bh)):, max(0, int(x - bw)):min(w, int(x + bw * 2))] = 0
        pts = cv2.goodFeaturesToTrack(frames[last], 500, 0.01, 8, mask=m_prev, blockSize=5)
        a, b = flow(frames[last], frames[i], pts, 21)
        m, part, _ = similarity(a, b)
        if m is None:
            out[i] = (M.copy(), 0.0)
        else:
            M = to3(m) @ M
            out[i] = (M.copy(), float(part))
        last = i
    return out


def track_person(frames, colors, ref, cfg, w, h, faces):
    """Theo đầu người dẫn: mặt phải xuất hiện lặp lại đúng một vùng thì mới coi là có người."""
    fps = float(cfg["_fps"])
    every = max(1, int(fps * 0.25))
    checks = list(range(0, len(frames), every))
    hits = []
    for n, i in enumerate(checks):
        say(25 + 15 * n / max(1, len(checks)))
        b = faces.find(frames[i], None, colors.get(i))
        if b is not None:
            hits.append((i, b))
    # Gom các lần thấy mặt theo vị trí gần nhau, chỉ tin nhóm lặp lại đủ nhiều.
    best = []
    for i, b in hits:
        cx, cy = b[0] + b[2] / 2, b[1] + b[3] / 2
        near = [(j, q) for j, q in hits if abs(j - i) <= fps * 2 and math.hypot(q[0] + q[2] / 2 - cx, q[1] + q[3] / 2 - cy) < w * 0.15]
        if len(near) > len(best):
            best = near
    if len(best) < max(2, int(len(checks) * 0.2)):
        return None, None, None
    start, box = min(best, key=lambda x: abs(x[0] - ref))
    centers = {start: (box[0] + box[2] / 2, box[1] + box[3] / 2, box[2], 1.0)}
    for span, order in ((1, range(start + 1, len(frames))), (-1, range(start - 1, -1, -1))):
        cx, cy, size, _ = centers[start]
        pts = features(frames[start], (cx - size / 2, cy - size / 2, size, size), 60)
        last = start
        since = 0
        for n, i in enumerate(order):
            say((40 + 30 * n / max(1, len(order))) if span > 0 else (70 + 28 * n / max(1, len(order))))
            a, b = flow(frames[last], frames[i], pts, 21)
            # Mất mặt quá 1 giây thì đứng yên chờ, không trôi theo nền khi người dẫn đã ra khỏi khung.
            lost = since > fps
            if a is not None and len(a) >= 3:
                if not lost:
                    d = np.median(b.reshape(-1, 2) - a.reshape(-1, 2), axis=0)
                    cx, cy = cx + float(d[0]), cy + float(d[1])
                pts = b
            else:
                pts = None
            since += 1
            if i in colors:
                hit = faces.find(frames[i], (cx, cy), colors[i])
                if hit is not None:
                    hx, hy = hit[0] + hit[2] / 2, hit[1] + hit[3] / 2
                    if lost or math.hypot(hx - cx, hy - cy) < w * 0.25:
                        # Kéo dần về vị trí mặt vừa thấy để không giật; vừa thấy lại sau khi mất thì nhảy tới luôn.
                        pull = 1.0 if lost else 0.5
                        cx, cy = cx + (hx - cx) * pull, cy + (hy - cy) * pull
                        size = size + (hit[2] - size) * 0.3
                        since = 0
                        pts = features(frames[i], (cx - size / 2, cy - size / 2, size, size), 60)
            if pts is None or len(pts) < 6:
                pts = features(frames[i], (cx - size / 2, cy - size / 2, size, size), 60)
            # Càng lâu chưa thấy lại mặt thì càng kém tin cậy.
            centers[i] = (cx, cy, size, max(0.2, 1.0 - since / (fps * 2.5)))
            last = i
    return centers, start, box


def main():
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    mode = cfg.get("mode", "object")
    width = 960 if mode == "object" else 640
    frames, colors, w, h, fps = read_frames(cfg, width)
    cfg["_fps"] = fps
    say(25)
    ref = min(len(frames) - 1, max(0, int(round((cfg["tref"] - cfg["t0"]) * fps))))
    direction = cfg.get("dir", "both")
    samples = {}
    info = {}
    faces = Faces() if mode in ("person", "scene") else None
    if mode == "person":
        centers, start, box = track_person(frames, colors, ref, cfg, w, h, faces)
        if centers is None:
            raise RuntimeError("Không thấy người trong đoạn này. Hãy chọn Vật thể và vẽ khung quanh người dẫn.")
        rx, ry, rs = centers[ref if ref in centers else start][:3]
        for i, (cx, cy, size, conf) in centers.items():
            s = 1.0 if not cfg.get("scale") else size / rs
            samples[i] = {"a": s, "b": 0.0, "tx": (cx - s * rx) / w, "ty": (cy - s * ry) / w, "cx": cx / w, "cy": cy / w, "c": conf}
        info["ref"] = {"cx": rx / w, "cy": ry / w, "w": rs / w, "h": rs / w}
    else:
        if mode == "scene":
            near = min(colors, key=lambda i: abs(i - ref)) if colors else None
            avoid = faces.find(frames[ref], None, colors.get(near)) if cfg.get("avoid", True) else None
            f = track_scene(frames, ref, cfg, w, h, 1, 25, avoid) if direction != "back" else {}
            g = track_scene(frames, ref, cfg, w, h, -1, 95, avoid) if direction != "forward" else {}
            cx0, cy0 = w / 2, h / 2
            info["ref"] = {"cx": cx0 / w, "cy": cy0 / w, "w": 1.0, "h": h / w}
        else:
            bx = cfg["box"]
            box = (bx[0] * w, bx[1] * w, bx[2] * w, bx[3] * w)
            f = track_object(frames, ref, box, cfg, w, 1, 25) if direction != "back" else {}
            g = track_object(frames, ref, box, cfg, w, -1, 95) if direction != "forward" else {}
            cx0, cy0 = box[0] + box[2] / 2, box[1] + box[3] / 2
            info["ref"] = {"cx": cx0 / w, "cy": cy0 / w, "w": box[2] / w, "h": box[3] / w}
        for src in (g, f):
            for i, (M, conf) in src.items():
                cx, cy = (M @ [cx0, cy0, 1])[:2]
                samples[i] = {"a": float(M[0, 0]), "b": float(M[1, 0]), "tx": float(M[0, 2]) / w, "ty": float(M[1, 2]) / w, "cx": float(cx) / w, "cy": float(cy) / w, "c": conf}
    if not samples:
        raise RuntimeError("Chưa theo được khung nào")
    rows = []
    for i in sorted(samples):
        s = samples[i]
        rows.append({"t": round(cfg["t0"] + i / fps, 4), **{k: round(v, 5) for k, v in s.items()}})
    conf = [r["c"] for r in rows]
    out = {"ok": True, "mode": mode, "fps": round(fps, 3), "width": w, "height": h, "aspect": round(h / w, 5), "samples": rows, "conf": round(float(np.mean(conf)), 3), "low": int(sum(1 for c in conf if c < float(cfg.get("conf", 0.6)))), **info}
    with open(cfg["out"], "w", encoding="utf-8") as fh:
        json.dump(out, fh)
    say(100)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"E {e}", flush=True)
        sys.exit(1)
