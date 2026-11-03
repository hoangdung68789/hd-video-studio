# So chữ mẫu (spec đã lọc chữ cảnh) với bản dựng (do_chu.py đo lại) — cùng thước OCR. In bảng lệch + % dòng đạt.
# python so_chu.py <spec.json> <chu_dung.json> [--out lech.json]
import json, sys
import numpy as np

sp = json.load(open(sys.argv[1], encoding="utf-8"))
bd = [d | dict(cum_vao=c["vao"]) for c in json.load(open(sys.argv[2], encoding="utf-8"))["cum"] for d in c["dong"]]
TOL = dict(gio=0.15, vitri=2.5, co=0.10, mau=30)
def rgb(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float) if h else None
used, rows = set(), []
for o in sp:
    x, y, w, h = o["hop"]
    cand = [(abs(b["vao"] - o["vao"]) + abs(b["hop"][1] - y) / 10 + abs(b["hop"][0] - x) / 10, k) for k, b in enumerate(bd)
            if k not in used and abs(b["vao"] - o["vao"]) <= 0.6 and abs(b["hop"][1] - y) <= 6]
    if not cand: rows.append(dict(o=o, b=None, loi=["không thấy trên bản dựng"])); continue
    _, k = min(cand); used.add(k); b = bd[k]; loi = []
    if abs(b["vao"] - o["vao"]) > TOL["gio"]: loi.append(f"giờ vào lệch {b['vao'] - o['vao']:+.2f}s")
    if abs(b["ra"] - o["ra"]) > TOL["gio"] + 0.1: loi.append(f"giờ ra lệch {b['ra'] - o['ra']:+.2f}s")
    if max(abs(b["hop"][0] - x), abs(b["hop"][1] - y)) > TOL["vitri"]: loi.append(f"vị trí lệch x{b['hop'][0] - x:+.1f} y{b['hop'][1] - y:+.1f}%")
    if abs(b["hop"][3] / h - 1) > TOL["co"]: loi.append(f"cao chữ {b['hop'][3] / h:.2f}×")
    if abs(b["hop"][2] / w - 1) > TOL["co"]: loi.append(f"rộng chữ {b['hop'][2] / w:.2f}×")
    m0, m1 = rgb(o["mau"]), rgb(b["mau"])
    if m0 is not None and m1 is not None and np.linalg.norm(m0 - m1) > TOL["mau"]: loi.append(f"màu {o['mau']}≠{b['mau']}")
    if b["kieu_vao"] != o["kieu_vao"]: loi.append(f"kiểu vào {b['kieu_vao']}≠{o['kieu_vao']}")
    rows.append(dict(o=o, b=b, loi=loi))
dat = sum(1 for r in rows if not r["loi"])
print(f"ĐẠT {dat}/{len(rows)} dòng ({dat / len(rows):.0%}) · chữ thừa trên bản dựng: {len(bd) - len(used)}")
from collections import Counter
print("loại lỗi:", Counter(l.split(" ")[0] + " " + l.split(" ")[1] for r in rows for l in r["loi"]).most_common())
for r in rows:
    if r["loi"]: print(f"  #{r['o']['cum']} {r['o']['vao']}s «{r['o']['chu'][:20]}»: " + "; ".join(r["loi"]))
if "--out" in sys.argv:
    json.dump([dict(cum=r["o"]["cum"], chu=r["o"]["chu"], loi=r["loi"], bd=r["b"]) for r in rows], open(sys.argv[sys.argv.index("--out") + 1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
