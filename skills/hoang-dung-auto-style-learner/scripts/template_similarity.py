#!/usr/bin/env python3
"""Chấm độ giống giữa template ĐO TỪ VIDEO MẪU và template ĐO LẠI TỪ BẢN TỰ DỰNG (cùng định dạng template.json).
Dùng: python template_similarity.py <mau.json> <ban_dung.json> [--out diem.json]
Thang 100 (8 thành phần, Dũng 03/11). So theo thời gian TƯƠNG ĐỐI (0–1 thời lượng) nên video khác độ dài vẫn so được.
100 điểm chỉ khi mọi lớp nằm trong dung sai; in bảng lệch từng lớp để sửa ở vòng sau (tối đa 3 vòng)."""
import json, sys

TOL_T = 0.03      # lệch thời điểm tương đối cho phép (3% thời lượng)
TOL_POS = 5.0     # lệch vị trí % khung
TOL_RGB = 25.0    # lệch màu (khoảng cách RGB)
W = {"text": 15, "sfx": 10, "vfx": 10, "motion_graphics": 15, "effect": 10, "bgm": 10, "a_b_roll": 15, "bo_cuc": 15}


def load(p):
    t = json.load(open(p, encoding="utf-8"))
    dur = float(t["thong_so"]["thoi_luong"])
    seg = sorted(t.get("doan", []), key=lambda d: d["tu"])
    ev = {k: [] for k in ("cat", "chu", "mg", "aroll", "broll", "an", "vfx", "effect", "sfx", "cc")}
    for d in seg:
        for k in ("aroll", "vfx", "effect"):
            ev[k] += [dict(x, r=x["giay"] / dur) for x in d.get(k, [])]
        ev["cat"] += [c / dur for c in d.get("cat", [])]
        ev["chu"] += [dict(c, r=c["giay"] / dur) for c in d.get("chu", [])]
        ev["mg"] += [dict(m, r=m["giay"] / dur) for m in d.get("mg", [])]
        ev["broll"] += [dict(b, r=b["giay"] / dur) for b in d.get("broll", [])]
        ev["an"] += [dict(a, r=a["giay"] / dur) for a in d.get("an", [])]
        ev["sfx"] += [dict(s, r=s["giay"] / dur) for s in d.get("sfx", [])]
        cc = d.get("chuyen_canh") or {}
        if cc.get("ma"):
            ev["cc"].append(dict(cc, r=cc.get("giay", d["tu"]) / dur))
    roles = [(d["tu"] / dur, d["den"] / dur, d.get("vai_tro")) for d in seg]
    return t, dur, ev, roles


def match(a, b, key=lambda x: x["r"] if isinstance(x, dict) else x):
    """ghép cặp gần nhất trong dung sai thời gian; trả (số cặp, danh sách cặp)"""
    used, pairs = set(), []
    for x in a:
        best = min(((abs(key(x) - key(y)), j) for j, y in enumerate(b) if j not in used), default=None)
        if best and best[0] <= TOL_T:
            used.add(best[1]); pairs.append((x, b[best[1]]))
    return pairs


def ratio(a, b, pairs):
    n = max(len(a), len(b))
    return 1.0 if n == 0 else len(pairs) / n


def rgb(h):
    h = (h or "").lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) if len(h) == 6 else None


def layer(em, eb, k, fields, lech):
    """điểm một lớp: số lần + giờ + các trường phải trùng"""
    p = match(em[k], eb[k])
    same = sum(1 for x, y in p if all(x.get(f) == y.get(f) for f in fields))
    s = ratio(em[k], eb[k], p) * (same / len(p) if p else (1 if not em[k] else 0))
    if s < 1: lech.append(f"{k}: mẫu {len(em[k])}, bản dựng {len(eb[k])}, khớp giờ {len(p)}, trùng {'/'.join(fields)} {same}")
    return s


def main(pm, pb, out=None):
    tm, dm, em, rm = load(pm)
    tb, db, eb, rb = load(pb)
    S, lech = {}, []
    # 8 bố trí, cấu trúc, bố cục: nhịp cắt + vai trò đoạn + kiểu bố cục + giữ chân
    p = match(em["cat"], eb["cat"], key=lambda x: x)
    s_cat = ratio(em["cat"], eb["cat"], p)
    if s_cat < 1: lech.append(f"cú cắt: mẫu {len(em['cat'])}, bản dựng {len(eb['cat'])}, khớp giờ {len(p)}")
    ok = sum(1 for a0, a1, r in rm if any(b0 <= (a0 + a1) / 2 <= b1 and r == rr for b0, b1, rr in rb))
    s_vt = ok / max(1, len(rm))
    if s_vt < 1: lech.append(f"vai trò đoạn khớp {ok}/{len(rm)}")
    bm_ = [(d.get("bo_cuc") or {}).get("loai") for d in sorted(tm["doan"], key=lambda d: d["tu"])]
    bb_ = [(d.get("bo_cuc") or {}).get("loai") for d in sorted(tb["doan"], key=lambda d: d["tu"])]
    s_bc = sum(1 for a, b in zip(bm_, bb_) if a == b) / max(1, len(bm_), len(bb_))
    if s_bc < 1: lech.append(f"kiểu bố cục khớp {s_bc:.0%}")
    gm, gb = tm.get("giu_chan", {}), tb.get("giu_chan", {})
    lm = [o["mo"] / dm for o in gm.get("open_loops", [])]; lb = [o["mo"] / db for o in gb.get("open_loops", [])]
    s_gc = (0.5 if bool(gm.get("hook")) == bool(gb.get("hook")) else 0) + 0.5 * ratio(lm, lb, match(lm, lb, key=lambda x: x))
    if s_gc < 1: lech.append("giữ chân: hook/câu nhử chưa khớp giờ")
    S["bo_cuc"] = (s_cat + s_vt + s_bc + s_gc) / 4
    # 1 text: số lần + giờ + vị trí + màu + kiểu vào
    p = match(em["chu"], eb["chu"])
    sc = []
    for x, y in p:
        s = 1.0
        if x.get("vi_tri_pct") and y.get("vi_tri_pct") and max(abs(a - b) for a, b in zip(x["vi_tri_pct"], y["vi_tri_pct"])) > TOL_POS: s -= 0.3; lech.append(f"chữ {x['giay']}s lệch vị trí")
        cx, cy = rgb(x.get("mau")), rgb(y.get("mau"))
        if cx and cy and sum((a - b) ** 2 for a, b in zip(cx, cy)) ** .5 > TOL_RGB: s -= 0.3; lech.append(f"chữ {x['giay']}s lệch màu {x.get('mau')}≠{y.get('mau')}")
        if x.get("vao") and x.get("vao") != y.get("vao"): s -= 0.4; lech.append(f"chữ {x['giay']}s kiểu vào {x.get('vao')}≠{y.get('vao')}")
        sc.append(max(0, s))
    S["text"] = ratio(em["chu"], eb["chu"], p) * (sum(sc) / len(sc) if sc else (1 if not em["chu"] else 0))
    if len(p) < max(len(em["chu"]), len(eb["chu"])): lech.append(f"chữ: mẫu {len(em['chu'])}, bản dựng {len(eb['chu'])}, khớp {len(p)}")
    # 2 SFX: giờ + vai trò + gắn với gì
    S["sfx"] = layer(em, eb, "sfx", ("vai_tro", "gan_voi"), lech)
    # 3 VFX: giờ + loại + mục đích
    S["vfx"] = layer(em, eb, "vfx", ("loai", "muc_dich"), lech)
    # 4 Motion Graphics: thẻ/nhãn + animation minh họa
    S["motion_graphics"] = (layer(em, eb, "mg", ("muc_dich",), lech) + layer(em, eb, "an", ("muc_dich",), lech)) / 2
    # 5 Effect: hiệu ứng vào/ra + chuyển cảnh
    S["effect"] = (layer(em, eb, "effect", ("loai", "gan_voi"), lech) + layer(em, eb, "cc", ("ma",), lech)) / 2
    # 7 A-roll và B-roll: giờ + loại cảnh + mục đích
    S["a_b_roll"] = (layer(em, eb, "aroll", ("co", "muc_dich"), lech) + layer(em, eb, "broll", ("loai", "muc_dich"), lech)) / 2
    # 6 BGM: BPM + diễn biến theo đoạn
    bm, bb = tm["thong_so"].get("bpm") or 0, tb["thong_so"].get("bpm") or 0
    s_bpm = 1.0 if bm and bb and abs(bm - bb) / bm <= 0.05 else 0.0
    dm_ = [(d.get("nhac") or {}).get("dien_bien") for d in sorted(tm["doan"], key=lambda d: d["tu"])]
    db_ = [(d.get("nhac") or {}).get("dien_bien") for d in sorted(tb["doan"], key=lambda d: d["tu"])]
    s_db = sum(1 for a, b in zip(dm_, db_) if a == b) / max(1, len(dm_), len(db_))
    S["bgm"] = 0.5 * s_bpm + 0.5 * s_db
    if S["bgm"] < 1: lech.append(f"nhạc: BPM {bm}/{bb}, diễn biến khớp {s_db:.0%}")
    diem = {k: round(W[k] * v, 2) for k, v in S.items()}
    tong = round(sum(diem.values()), 2)
    print(f"TỔNG {tong}/100 | " + " | ".join(f"{k} {v}/{W[k]}" for k, v in diem.items()))
    for l in lech:
        print(" -", l)
    if out:
        json.dump({"tong": tong, "diem": diem, "lech": lech}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return 0 if tong >= 100 else 1


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 2:
        print(__doc__); sys.exit(2)
    o = a[a.index("--out") + 1] if "--out" in a else None
    sys.exit(main(a[0], a[1], o))
