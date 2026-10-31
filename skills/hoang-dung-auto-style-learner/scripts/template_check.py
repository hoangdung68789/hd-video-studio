#!/usr/bin/env python3
"""Cổng 'không bỏ sót' cho Template video trọn bộ (TV).
Dùng: python template_check.py <template.json>
In PASS/FAIL và danh sách lỗi; mã thoát 0 khi đạt, 1 khi chưa đạt."""
import json, sys

def main(path):
    t = json.load(open(path, encoding="utf-8"))
    err = []
    dur = float(t.get("thong_so", {}).get("thoi_luong") or 0)
    seg = sorted(t.get("doan", []), key=lambda d: d.get("tu", 0))
    if dur <= 0:
        err.append("thong_so.thoi_luong chưa có")
    if not seg:
        err.append("chưa có doan nào")
    else:
        if abs(seg[0]["tu"]) > 0.2:
            err.append(f"đoạn đầu bắt đầu ở {seg[0]['tu']}s, phải từ 0")
        for a, b in zip(seg, seg[1:]):
            if abs(a["den"] - b["tu"]) > 0.2:
                err.append(f"hở/chồng giữa {a['den']}s và {b['tu']}s")
        if dur and abs(seg[-1]["den"] - dur) > 0.2:
            err.append(f"đoạn cuối kết thúc {seg[-1]['den']}s ≠ thời lượng {dur}s")

    cnt = {"cat": 0, "chu": 0, "mg": 0, "broll": 0, "an": 0, "chuyen_canh": 0, "sfx": 0, "phach_manh": 0}
    sfx_t = []
    chu_t = []
    for d in seg:
        name = f"đoạn {d.get('tu')}–{d.get('den')}s"
        cnt["cat"] += len(d.get("cat", []))
        cnt["chu"] += len(d.get("chu", []))
        cnt["mg"] += len(d.get("mg", []))
        cnt["broll"] += len(d.get("broll", []))
        cnt["an"] += len(d.get("an", []))
        # Dũng 30/10: mỗi b-roll / animation / MG / chữ phải có mục đích + lý do mẫu đặt ở đó (gắn câu nào, giữ chân gì)
        for k in ("broll", "an", "mg", "chu"):
            for x in d.get(k, []):
                if not x.get("muc_dich") or not x.get("ly_do"):
                    err.append(f"{name}: {k} ở {x.get('giay')}s thiếu muc_dich/ly_do")
        cc = d.get("chuyen_canh")
        if cc and cc.get("ma"):
            cnt["chuyen_canh"] += 1
        cnt["sfx"] += len(d.get("sfx", []))
        cnt["phach_manh"] += len((d.get("nhac") or {}).get("phach", []))
        sfx_t += [s.get("giay", -99) for s in d.get("sfx", [])]
        chu_t += [c.get("giay", -99) for c in d.get("chu", [])]
        if not (d.get("canh") or {}).get("co"):
            err.append(f"{name}: thiếu mô tả cảnh")
        if not (d.get("nhac") or {}).get("dien_bien"):
            err.append(f"{name}: thiếu diễn biến nhạc")
        has_event = d.get("chu") or d.get("mg") or d.get("broll") or d.get("an") or d.get("cat") or (cc and cc.get("ma"))
        if not has_event and not d.get("ly_do_tinh"):
            err.append(f"{name}: không có sự kiện nào và không ghi ly_do_tinh")
        if not d.get("vai_tro"):
            err.append(f"{name}: thiếu vai_tro")

    for c in chu_t:
        if not any(abs(c - s) <= 0.15 for s in sfx_t):
            err.append(f"chữ ở {c}s không có SFX trong ±0,15s")

    measured = t.get("su_kien_do_duoc", {})
    for k, v in cnt.items():
        m = measured.get(k)
        if m is None:
            err.append(f"su_kien_do_duoc.{k} chưa ghi số đo")
        elif m != v:
            err.append(f"{k}: đo được {m} nhưng template có {v} (thiếu {m - v})" if m > v
                       else f"{k}: template có {v} > đo được {m} (thừa/trùng)")

    g = t.get("giu_chan", {})
    if not g.get("hook"):
        err.append("giu_chan.hook trống")
    if not g.get("open_loops"):
        err.append("giu_chan.open_loops trống (cần ≥1 câu nhử)")
    if not (g.get("keu_goi_theo_doi") or {}).get("giay"):
        err.append("giu_chan.keu_goi_theo_doi chưa có mốc")

    total = sum(cnt.values())
    print(f"Sự kiện trong template: {total} ({', '.join(f'{k}={v}' for k, v in cnt.items())})")
    if err:
        print(f"FAIL — {len(err)} lỗi:")
        for e in err:
            print(" -", e)
        return 1
    print("PASS — phủ 100% số đo, không bỏ sót")
    return 0

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
