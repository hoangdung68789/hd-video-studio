"""Gán nhãn 3 trục cho mọi SFX trong catalog → library/sfx-tags.json (+ báo nhóm thiếu).

Dùng: python sfx_tag.py [--catalog "<HD_VIDEO_HOME>/sfx-catalog/catalog.json"] [--out ../library/sfx-tags.json]

Trục 1 — VAI (chức năng trong khung):
  du_bao (dâng trước điểm nhấn) · cham_manh (va/đập) · nhan_chu (chữ bật/hiện) · lap_lanh (ánh sáng, đuôi)
  chuyen_canh (lướt) · bien_mat (chữ đi ra) · danh_sach (tick từng mục) · giao_dien (thông báo, nút) · foley (tiếng thật của vật/việc)
  sai (sai/cảnh báo) · ket_cau (lắp ghép, cơ khí) · xoay (xoay, vòng)
Trục 2 — CẢM XÚC: nang_luong (nhe|vua|manh) × sac_thai (am_ap|sang_trong|vui_tuoi|tin_cay|kich_tinh|cong_nghe|hai_huoc)
Trục 3 — NGHĨA (vật/việc mô tả): tien, so_lieu, giay_to, ban_do, xe, dien_thoai, camera, xay_dung, chuong_cua,
  thang_may, dong_ho, kinh, xac_nhan, phep_mau, anh_sang, thong_bao, ban_phim, sai_lam
Luật lấy từ nhóm thư mục + từ khóa tên file + số đo (shape, bright, dur, peak_t). Nhãn là suy luận từ tên/số đo,
chưa nghe từng file → cột "tin_cay" = "ten_file" | "so_do". Dũng nghe chỉnh → sửa tay trong sfx-tags.json, giữ khóa "sua_tay": true.
"""
import argparse, json, os, re, sys

CAT_RULES = {
    "Riser": (["du_bao"], "manh", "kich_tinh", []),
    "Transition strong": (["cham_manh", "du_bao"], "manh", "kich_tinh", []),
    "Highlight": (["cham_manh", "lap_lanh"], "vua", "sang_trong", []),
    "GLEAM": (["lap_lanh"], "vua", "sang_trong", ["anh_sang"]),
    "Magic": (["lap_lanh", "cham_manh"], "vua", "sang_trong", ["phep_mau"]),
    "Pop": (["nhan_chu"], "nhe", "vui_tuoi", []),
    "Appear & Disappear": (["nhan_chu"], "nhe", "vui_tuoi", []),
    "Click digital": (["danh_sach", "nhan_chu"], "nhe", "cong_nghe", []),
    "UI": (["giao_dien", "nhan_chu"], "nhe", "cong_nghe", []),
    "Futuristic": (["giao_dien"], "nhe", "cong_nghe", ["thong_bao"]),
    "Technology Sound": (["foley"], "nhe", "cong_nghe", []),
    "Sine": (["nhan_chu", "danh_sach"], "nhe", "tin_cay", ["ban_do"]),
    "Bell": (["xac_nhan_vai", "lap_lanh"], "vua", "tin_cay", ["xac_nhan"]),
    "Paper": (["foley"], "nhe", "tin_cay", ["giay_to"]),
    "Swipe & Swish": (["chuyen_canh", "nhan_chu"], "nhe", "vui_tuoi", []),
    "Spin": (["xoay"], "vua", "vui_tuoi", []),
    "Wrong": (["sai"], "vua", "hai_huoc", ["sai_lam"]),
    "Glitch": (["chuyen_canh"], "manh", "cong_nghe", []),
    "whoosh": (["chuyen_canh"], "vua", "kich_tinh", []),
}
KW = [  # (regex trên đường dẫn, vai thêm, nghĩa thêm, sắc thái ép, năng lượng ép)
    (r"cash|money|coin|register", ["cham_manh"], ["tien"], "sang_trong", None),
    (r"star \d", ["cham_manh"], ["anh_sang"], "sang_trong", "manh"),
    (r"camera|shutter|focus|flash pot", [], ["camera"], None, None),
    (r"keyboard|typing|telemetry typing", ["danh_sach"], ["ban_phim"], None, None),
    (r"phone|telephone|call ring", [], ["dien_thoai"], None, None),
    (r"shop door|door", [], ["chuong_cua"], "am_ap", None),
    (r"elevator|lift", [], ["thang_may"], None, None),
    (r"clock|ticking", ["danh_sach"], ["dong_ho"], None, None),
    (r"glass", ["cham_manh"], ["kinh"], "kich_tinh", None),
    (r"correct|affirmation|tick idea|yes", ["xac_nhan_vai"], ["xac_nhan"], "tin_cay", None),
    (r"build|pull together|mechanical|mech", ["ket_cau"], ["xay_dung"], "cong_nghe", None),
    (r"notification|bubble|bubbly", ["giao_dien"], ["thong_bao"], "vui_tuoi", None),
    (r"car_whoosh|car whoosh", [], ["xe"], None, None),
    (r"boom|bass drop|hit|impact|stinger", ["cham_manh"], [], "kich_tinh", "manh"),
    (r"soft", [], [], "am_ap", "nhe"),
    (r"low", [], [], None, "vua"),
    (r"reverse", ["du_bao"], [], None, None),
    (r"sine fall", ["nhan_chu"], ["ban_do"], "tin_cay", "nhe"),
    (r"sine rise|rising graph", ["du_bao"], ["so_lieu"], None, None),
    (r"graph|data", [], ["so_lieu"], "cong_nghe", None),
    (r"glockenspiel|chime|twinkle|sparkle|shimmer", ["lap_lanh"], ["phep_mau"], "sang_trong", None),
    (r"tuned", ["danh_sach"], [], None, None),
    (r"jingle|christmas", [], [], "vui_tuoi", None),
    (r"chalk", ["foley"], [], None, None),
    (r"air|airy|breeze|wind", [], ["gio"], "am_ap", None),
    (r"paper|page turn|scroll", ["foley"], ["giay_to"], "tin_cay", None),
    (r"jail lock|lock", ["cham_manh"], ["xac_nhan"], "tin_cay", None),
    (r"wrong|fail|error", ["sai"], ["sai_lam"], "hai_huoc", None),
]
MISSING_FOLEY = {  # nghĩa hay gặp trong video BĐS mà kho chưa có tiếng thật
    "cua_mo_dong": "mở/đóng cửa, cửa cuốn, cổng",
    "buoc_chan": "bước chân lên cầu thang, sàn gỗ",
    "nuoc": "nước chảy, hồ bơi, vòi sen",
    "thien_nhien": "chim, gió, lá cây (sân vườn, view thoáng)",
    "chia_khoa": "chùm chìa khóa (bàn giao nhà)",
    "cong_tac_den": "bật công tắc đèn (nhà sáng)",
    "pho_xa": "tiếng phố, xe máy nhẹ (mặt tiền, hẻm)",
}


def tag(r):
    p = r["path"]
    low = p.lower()
    vai, nl, st, ng = (list(x) if isinstance(x, list) else x for x in CAT_RULES.get(r["cat"], (["nhan_chu"], "nhe", "vui_tuoi", [])))
    vai, ng = list(vai), list(ng)
    forced_st, forced_nl, by = None, None, "so_do"
    for rx, v_add, n_add, s, e in KW:
        if re.search(rx, low):
            by = "ten_file"
            vai += [v for v in v_add if v not in vai]
            ng += [n for n in n_add if n not in ng]
            forced_st = forced_st or s
            forced_nl = forced_nl or e
    # năng lượng theo số đo khi tên không ép
    if not forced_nl:
        if r["shape"] == "hit" and r["peak_db"] > -8 and r["dur"] > 0.6:
            nl = "manh"
        elif r["shape"] == "soft" or r["dur"] < 0.25:
            nl = "nhe" if nl != "manh" else "vua"
    # whoosh: phân nhẹ/vừa/mạnh theo thư mục
    if r["cat"] == "whoosh":
        if "soft" in low or "long reverb" in low:
            nl, st = "nhe", "am_ap"
        elif "short" in low or "fast" in low:
            nl = "vua"
        elif "powerful" in low or "crunch" in low or "low" in low:
            nl = "manh"
    if re.search(r"shielddown|chimes down|descend|bass drop|\bfall\b|falling", low):
        vai = ["bien_mat"]  # âm đi xuống: không dùng cho điểm mạnh/chữ xuất hiện
    if re.search(r"(?<!appear )disappear", low):
        vai = ["bien_mat"]  # tiếng biến mất: chỉ dùng cho chữ đi ra, không dùng cho chữ xuất hiện
    if re.search(r"alarm|siren", low):
        vai, ng, forced_st = ["sai"], ["sai_lam"], "kich_tinh"  # chuông báo động = cảnh báo, không dùng cho CTA/đuôi
    if re.search(r"game|arcade|8.?bit|coin", low):
        forced_st = "hai_huoc"  # tiếng game: không cho giá/BĐS (sfx_plan chặn trừ style hype)
    vai = ["xac_nhan" if v == "xac_nhan_vai" else v for v in vai]
    return {"path": p, "cat": r["cat"], "ho": os.path.dirname(p) or r["cat"], "vai": vai, "game": bool(re.search(r"game|arcade|8.?bit|coin", low)),
            "nang_luong": forced_nl or nl, "sac_thai": forced_st or st, "nghia": ng,
            "dur": r["dur"], "onset": r["onset"], "peak_t": r["peak_t"], "active": r.get("active"),
            "peak_db": r["peak_db"], "shape": r["shape"], "bright": r["bright"], "tin_cay": by}


def measure_true(path, dur=8.0, root="~/Downloads/SOUNDEFFECT TAKING HEARD", sr=48000):
    """Đo lại bằng mẫu thật (catalog.json đo trên đường bao thô: peak_t lệch tới ~0.7s, peak_db lệch tới ~12 dB)."""
    import subprocess
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-t", f"{max(8.0, dur + 0.5):.2f}", "-i", os.path.join(root, path), "-ac", "2", "-ar", str(sr),
                          "-f", "f32le", "-"], capture_output=True, timeout=60).stdout
    x = np.abs(np.frombuffer(raw, np.float32)[: len(raw) // 8 * 2].reshape(-1, 2)).max(axis=1)  # |L|,|R| lớn nhất (cùng cách sfx_render/sfx_audit)
    if x.size < 64 or x.max() < 1e-6:
        return None
    hop = int(sr * 0.005)
    env = np.array([x[i:i + hop].max() for i in range(0, len(x) - hop + 1, hop)])
    pk = int(np.argmax(env >= env.max() * 0.891))  # đỉnh ĐẦU TIÊN trong 1 dB của mức lớn nhất = điểm chạm tai nghe thấy
    db = 20 * np.log10(env + 1e-12)
    top = db[pk]
    on = int(np.argmax(db > top - 30))
    tail = len(db) - 1 - int(np.argmax(db[::-1] > top - 40))
    loud = np.nonzero(env >= env.max() * 0.5)[0]
    # nhiều cú chạm (cùng định nghĩa với sfx_audit "cú chạm thứ hai"): sau đỉnh ≥ 0.2s có chỗ BẬT LẠI
    # ≥ 6 dB trên chỗ lõm trước nó và tới ngang đỉnh (trong 3 dB); âm ngân/dâng liền mạch không tính
    run = np.minimum.accumulate(env[pk + 10:]) if env.size > pk + 10 else np.zeros(0)
    tail_e = env[pk + 10:]
    multi = bool(any(tail_e[i] >= env.max() * 0.708 and tail_e[i] >= 2 * run[i - 1] for i in range(30, tail_e.size)))
    # hệ số đỉnh 0.2s đầu từ onset (dB): âm quá nhọn không đạt được độ to RMS dưới trần đỉnh
    seg = x[on * hop: on * hop + int(0.2 * sr)]
    crest = float(20 * np.log10(seg.max() / (np.sqrt(np.mean(seg ** 2)) + 1e-12))) if seg.size else 0.0
    return {"peak_t": round(pk * 0.005, 4), "onset": round(on * 0.005, 4), "peak_dbfs": round(float(top), 2),
            "end_t": round(tail * 0.005, 4), "loud_end_t": round(int(loud[-1]) * 0.005, 4),
            "multi_hit": multi, "crest_db": round(crest, 2), "do_that": True,
            "peak_spread": round(float(np.nonzero(env[pk:pk + 50] >= env.max() * 0.891)[0].max()) * 0.005, 4)}  # đỉnh mơ hồ: vùng ≥ −1 dB kéo dài


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    ap = argparse.ArgumentParser()
    ap.add_argument("--remeasure", action="store_true", help="đo lại toàn bộ (bỏ số đo cũ)")
    ap.add_argument("--no-measure", action="store_true", help="bỏ đo lại bằng mẫu thật (nhanh, kém chính xác)")
    ap.add_argument("--catalog", default="<HD_VIDEO_HOME>/sfx-catalog/catalog.json")
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--out", default=os.path.join(here, "..", "library", "sfx-tags.json"))
    a = ap.parse_args()
    cat = json.load(open(a.catalog, encoding="utf-8"))
    old = {}
    if os.path.exists(a.out):
        old = {t["path"]: t for t in json.load(open(a.out, encoding="utf-8"))["files"] if t.get("sua_tay")}
    prev = {}
    if os.path.exists(a.out):
        prev = {t["path"]: t for t in json.load(open(a.out, encoding="utf-8"))["files"] if t.get("do_that") and not a.remeasure}
    files = []
    for r in cat:
        t = old.get(r["path"]) or tag(r)
        low = r["path"].lower()
        if t.get("sua_tay") and re.search(r"\bfall\b|falling", low):
            t["vai"] = ["bien_mat"]  # luật âm đi xuống thắng cả nhãn sửa tay
        t["game"] = bool(re.search(r"game|arcade|8.?bit|coin", low))
        if t.get("sua_tay") and re.search(r"alarm|siren", low):
            t["vai"], t["nghia"], t["sac_thai"] = ["sai"], ["sai_lam"], "kich_tinh"
        if not a.no_measure and (a.remeasure or not t.get("do_that")):
            keys = ("peak_t", "onset", "peak_dbfs", "end_t", "loud_end_t", "multi_hit", "crest_db", "do_that", "peak_spread")
            mt = ({k: prev[r["path"]][k] for k in keys} if r["path"] in prev and "peak_spread" in prev[r["path"]]
                  else measure_true(r["path"], r["dur"]))
            if mt:
                t.update({"catalog_peak_t": r["peak_t"], "catalog_onset": r["onset"]}, **mt)
                t["active"] = round(max(0.05, mt["end_t"] - mt["onset"]), 4)
        files.append(t)
    from collections import Counter
    vc = Counter(v for f in files for v in f["vai"])
    nc = Counter(n for f in files for n in f["nghia"])
    sc = Counter(f["sac_thai"] for f in files)
    thieu = {k: v for k, v in MISSING_FOLEY.items()}
    for v in ("du_bao", "lap_lanh", "xac_nhan", "foley"):
        if vc[v] < 6:
            thieu["vai_" + v] = f"chỉ {vc[v]} file"
    json.dump({"catalog": a.catalog, "tong": len(files), "dem_vai": vc, "dem_nghia": nc, "dem_sac_thai": sc,
               "nhom_thieu": thieu, "files": files}, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"✅ {len(files)} file → {os.path.abspath(a.out)}")
    print("VAI:", dict(vc.most_common()))
    print("NGHĨA:", dict(nc.most_common()))
    print("SẮC THÁI:", dict(sc.most_common()))
    print("THIẾU:", "; ".join(f"{k}: {v}" for k, v in thieu.items()))


if __name__ == "__main__":
    main()
