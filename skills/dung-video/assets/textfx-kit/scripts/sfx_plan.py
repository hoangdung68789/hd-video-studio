"""Lập kế hoạch SFX theo Ý ĐỊNH lời thoại → sfx_plan.json + sfx_plan.md (có lý do chọn từng âm).

Dùng:
  python sfx_plan.py --moments moments.json --out <thư mục> [--words words.json] [--fps 60] [--duration 56.3]
                     [--seed <tên video>] [--style bds|hype|tam_su] [--tags ../library/sfx-tags.json]

moments.json: [{"id":"m1","t":1.96,"text":"3 CĂN NHÀ","L":"L1"?, "tier":"T3"?, "group":"g1"?, "say":"cụm lời đang nói"?}]
  t = giây chữ CHẠM (đúng khung từ khóa bắt đầu được nói). L/tier bỏ trống → tự nhận từ chữ + lời + vị trí.
words.json (tùy chọn): [[bắt_đầu, kết_thúc, "từ"], ...] theo giờ timeline — dùng lấy cụm lời quanh mốc để nhận nghĩa.

Luật chọn (chi tiết + lý do: references/08-sfx.md):
  1 mốc = 1 âm DẪN (bắt buộc) + tối đa 1 lớp phụ nghe rõ (dự báo trước HOẶC đuôi lấp lánh sau, T3 được cả hai).
  Âm dẫn phải thuộc VAI được phép của ý định; ưu tiên NGHĨA khớp từ người dẫn đang nói; SẮC THÁI hợp cảm xúc.
  Chống lặp: mỗi file ≤ 2 lần/video, không 2 mốc liền dùng cùng file, không 3 mốc liền cùng họ (thư mục).
  Danh sách cùng group → "thang nốt" cùng một file, cao độ +0/+2/+4… nửa cung (tính 1 lần dùng).
  Canh: va/chuông/pop → ĐỈNH = khung chạm; riser → ĐỈNH(=điểm kết) = khung chạm; lướt → đỉnh sớm 0.03s; foley → ONSET = khung chạm.
  Mật độ: ≤ 2 mốc có âm trong 1 giây; âm rõ (T2–T3) cách nhau trung bình ≥ 3s, gần hơn thì hạ bậc âm; sau cú T3 chừa 0.5s.
"""
import argparse, hashlib, json, os, re, sys, unicodedata

LEX = [  # (L, regex) — thứ tự = ưu tiên; xét trên chữ màn hình trước, rồi câu đang nói, rồi ngữ cảnh ±0.6s
    ("L5", r"không tốn|không mất|miễn phí|tiết kiệm"),  # phủ định chi phí = lợi ích, xét trước L11/L2
    ("L11", r"đừng|sai lầm|không nên|cẩn thận|rủi ro|lừa|mất tiền|tốn thêm|tốn kém|đội giá|\blỗ\b"),
    ("L7", r"sổ hồng|sổ đỏ|hoàn công|pháp lý|công chứng|chính chủ|giấy tờ"),
    ("L2", r"\btỷ\b|\btỉ\b|triệu|\bgiá\b|thương lượng"),
    ("L12", r"giải pháp|bí quyết|không ngờ|bất ngờ|duy nhất|hiếm|trời ơi"),
    ("L3", r"\d+\s*(m2|m²|mét|tầng|lầu|phòng|pn|wc)|diện tích|kết cấu"),
    ("L8", r"không gian|phòng khách|\bbếp\b|nhà tắm|vệ sinh|mời anh chị vào"),  # tên phòng = chuyển ý
    ("L6", r"chợ|trường|siêu thị|bệnh viện|công viên|tttm|aeon|ubnd|nhà thờ|chùa"),
    ("L9", r"bình luận|inbox|liên hệ|\bgọi\b|hotline|nhắn tin|theo dõi|follow|đăng ký|để lại"),
    ("L3", r"\d+\s*(m2|m²|mét|tầng|lầu|phòng|pn|wc)|diện tích|ngang|kết cấu|phòng ngủ|\btầng\b"),
    ("L4", r"đường|phường|quận|trung tâm|mặt tiền|hẻm|vị trí|cách|phút|ngay|gần"),
    ("L10", r"gia đình|ước mơ|an cư|tổ ấm|câu chuyện|bố mẹ|vợ|chồng|các con|tâm sự"),
    ("L5", r"tặng|nội thất|giường|tủ|máy lạnh|sofa|tivi|máy giặt|mới|đẹp|rộng|thoáng|sân thượng|ban công|gara|xe hơi|view|hiện đại|sang"),
]
MEANING = [  # từ người dẫn nói → nghĩa SFX (Foley/biểu tượng)
    (r"tiền|\btỷ\b|triệu|\bgiá\b", "tien"), (r"\bgọi\b|điện thoại|hotline|số máy", "dien_thoai"),
    (r"chụp|hình ảnh|camera", "camera"), (r"\bsổ\b|giấy|hoàn công|công chứng", "giay_to"),
    (r"thời gian|giờ giấc|đúng giờ", "dong_ho"), (r"xây|kết cấu|\btầng\b|lầu|móng", "xay_dung"),
    (r"thang máy", "thang_may"), (r"\bxe\b|ô tô|xe hơi|đường lớn", "xe"), (r"đèn|ánh sáng|sáng sủa|nắng", "anh_sang"),
    (r"bình luận|nhắn|inbox|follow|theo dõi", "thong_bao"), (r"liên hệ", "dien_thoai"), (r"thoáng|gió|mát", "gio"), (r"tặng|bất ngờ|quà", "phep_mau"),
    (r"bản đồ|vị trí|đường|phường|quận|gần|cách|\d+\s*phút", "ban_do"), (r"\d+\s*(m2|m²|mét|tầng|lầu|phòng|pn|wc|%|tỷ|triệu|căn)|\d+([.,]\d+)?\s*m\b", "so_lieu"),
    (r"cửa", "cua_mo_dong"), (r"bước|cầu thang", "buoc_chan"), (r"hồ bơi|nước", "nuoc"),
    (r"cây xanh|sân vườn|gió|chim", "thien_nhien"), (r"chìa khóa|bàn giao", "chia_khoa"),
]
# ý định → (vai DẪN được phép, sắc thái ưu tiên, nghĩa ưu tiên, sắc thái CẤM, vai CẤM, lớp phụ T3, lớp phụ T2)
INTENT = {
    "L1": (["cham_manh"], ["kich_tinh", "sang_trong"], ["anh_sang"], ["hai_huoc"], ["sai"], "du_bao+lap_lanh", "du_bao"),
    "L2": (["cham_manh", "foley"], ["sang_trong"], ["tien"], ["hai_huoc", "cong_nghe"], ["sai", "chuyen_canh"], "du_bao+lap_lanh", "lap_lanh"),
    "L3": (["danh_sach", "nhan_chu"], ["tin_cay"], ["xay_dung", "so_lieu"], ["hai_huoc", "cong_nghe"], ["sai"], "du_bao", None),
    "L4": (["nhan_chu", "danh_sach"], ["tin_cay"], ["ban_do"], ["hai_huoc", "cong_nghe"], ["sai"], None, None),
    "L5": (["nhan_chu", "lap_lanh", "cham_manh"], ["sang_trong", "vui_tuoi", "am_ap"], ["phep_mau", "anh_sang"], ["hai_huoc", "cong_nghe"], ["sai"], "lap_lanh", "lap_lanh"),
    "L6": (["danh_sach", "nhan_chu"], ["vui_tuoi", "tin_cay"], ["ban_do"], ["hai_huoc", "cong_nghe"], ["sai"], None, None),
    "L7": (["xac_nhan"], ["tin_cay"], ["giay_to", "xac_nhan"], ["hai_huoc", "kich_tinh"], ["sai", "chuyen_canh"], "foley", "foley"),
    "L8": (["chuyen_canh"], ["am_ap", "kich_tinh"], [], ["hai_huoc", "cong_nghe"], ["sai"], None, None),
    "L9": (["giao_dien", "xac_nhan", "nhan_chu"], ["vui_tuoi", "tin_cay"], ["thong_bao", "dien_thoai", "xac_nhan"], ["hai_huoc"], ["sai"], "lap_lanh", None),
    "L10": (["lap_lanh", "nhan_chu"], ["am_ap", "sang_trong"], ["anh_sang", "phep_mau"], ["hai_huoc", "cong_nghe", "kich_tinh"], ["sai", "cham_manh"], None, None),
    "L11": (["sai"], ["hai_huoc", "kich_tinh"], ["sai_lam"], ["sang_trong", "vui_tuoi", "am_ap"], [], "du_bao", None),
    "L12": (["cham_manh", "lap_lanh"], ["sang_trong", "kich_tinh"], ["anh_sang", "phep_mau"], ["hai_huoc"], ["sai"], "du_bao+lap_lanh", "lap_lanh"),
}
# âm mang nghĩa cụ thể chỉ được dùng khi lời/ý định có đúng nghĩa đó (tránh "tiếng tiền" cho chữ "tặng nội thất")
SPECIFIC = {"tien", "dien_thoai", "camera", "thang_may", "kinh", "xe", "ban_phim", "sai_lam", "chuong_cua", "dong_ho", "giay_to", "gio", "xac_nhan"}
VOL = {"T3": 0.75, "T2": 0.55, "T1": 0.40, "T0": 0.25, "pre": 0.45, "tail": 0.30}
REL_DB = {"T3": -2, "T2": -3, "T1": -4, "T0": -6, "pre": -6, "tail": -8}  # SFX to rõ nhưng KHÔNG to hơn giọng (Dũng 2026-10-23)
CREST_MAX = {"T3": 15, "T2": 15, "T1": 15}  # crest_db tối đa của âm dẫn theo bậc âm
TAIL_GAP = 0.15  # mọi lớp của mốc tắt trước mốc sau ≥ 0.15s


def intent(L, text):
    """Luật của ý định; "Còn thương lượng" (giá không có con số) cấm thêm sắc thái kịch tính."""
    need, pst, png, bst, bvai, l3, l2 = INTENT[L]
    if L == "L2" and not re.search(r"\d", text or ""):
        bst = bst + ["kich_tinh"]
    return need, pst, png, bst, bvai, l3, l2


def sec_offset(lead):
    """Giây sau khung chạm mà lớp đuôi/nghĩa được vào: sau khi âm dẫn hết vang to (≥ −6 dB), tối thiểu 0.08s, tối đa 0.4s."""
    return round(min(0.4, max(0.08, lead.get("loud_end_t", lead["peak_t"]) - lead["peak_t"] + 0.02)), 4)


def nfc(s):
    return unicodedata.normalize("NFC", s or "").lower()


def detect(m, ctx, t, dur):
    say = re.sub(r"\b[a-z]?\d+\s*@\s*[\d.]+|@\s*[\d.]+|\blời\b|\bc\d+\b|\b0\d{3}\b", " ", nfc(m.get("say", "")))
    own = nfc(m.get("text", "")) + " | " + say
    txt = own + " | " + ctx
    L = m.get("L")
    if not L:
        # chữ trên màn hình + câu người dẫn đang nói quyết định; ngữ cảnh ±0.6s chỉ dùng khi hai nguồn đó không khớp gì
        scr = nfc(m.get("text", ""))
        L = (next((l for l, rx in LEX if re.search(rx, scr)), None) or next((l for l, rx in LEX if re.search(rx, say)), None)
             or next((l for l, rx in LEX if re.search(rx, ctx)), None))
        if t < 5.0 and m.get("tier", "T3") == "T3" and L not in ("L2", "L11"):  # hook "nỗi đau" giữ âm cảnh báo
            L = "L1"
        if not L:
            L = "L9" if dur and t > dur - 6 else "L8"
    if not m.get("tier") and L == "L2" and not re.search(r"\d", nfc(m.get("text", ""))):
        m = dict(m, tier="T2")  # nói về giá nhưng chữ không có con số (vd "Còn thương lượng")
    tier = m.get("tier") or {"L1": "T3", "L2": "T3", "L9": "T3", "L3": "T2", "L5": "T2", "L7": "T2", "L10": "T2",
                             "L12": "T2", "L11": "T3" if t < 5.0 else "T2", "L4": "T1", "L6": "T1", "L8": "T1"}[L]
    # nghĩa lấy từ chữ trên màn hình; chữ không mang nghĩa nào thì mới lấy từ câu đang nói
    scr = nfc(m.get("text", ""))
    nghia = [n for rx, n in MEANING if re.search(rx, scr)] or [n for rx, n in MEANING if re.search(rx, say)]
    return L, tier, nghia


def hval(*parts):
    return int(hashlib.md5("|".join(parts).encode()).hexdigest()[:8], 16)


def pick(files, need_vai, pref_st, pref_ng, ban_st, ban_vai, energy, used, prev_paths, prev_fams, seed, mid, maxdur=None,
         maxpeak=None, fam_cap=None, loi_ng=(), ban_fams=(), lead_clear=False, glitch=False, full_vai=()):
    best, why = None, None
    for f in files:
        if used.get(f["path"], 0) >= 2 or f["path"] in prev_paths:
            continue
        if not set(f["vai"]) & set(need_vai) or set(f["vai"]) & set(ban_vai) or f["sac_thai"] in ban_st:
            continue
        if f.get("game") and not glitch:
            continue  # tiếng game: chỉ cho style=hype
        if f["cat"] == "Glitch" and not glitch:
            continue  # glitch chỉ cho style=hype
        if list(need_vai) == ["du_bao"] and f.get("multi_hit"):
            continue  # riser nhiều cú (file chứa nhiều whoosh) → lọt tiếng lạc
        if maxdur and "du_bao" not in need_vai and (f["peak_t"] > 0.6 or f["onset"] > 0.3 or f.get("multi_hit") or f.get("peak_spread", 0) > 0.025):
            continue  # âm dẫn phải chạm nhanh; đuôi dài được cắt khi trộn (dur = đỉnh + 0.8s)
        if maxpeak and f["peak_t"] > maxpeak:
            continue
        if maxdur and f.get("crest_db", 0) > CREST_MAX.get(lead_clear, 99):
            continue  # âm dẫn quá nhọn: không đạt độ to sát giọng khi giữ trần đỉnh −3 dBFS
        spec = set(f["nghia"]) & SPECIFIC
        if spec and not spec <= set(pref_ng):  # MỌI nghĩa cụ thể của file phải có trong lời
            continue
        if full_vai and next((v for v in f["vai"] if v in need_vai), None) in full_vai:
            continue  # vai này đã phục vụ đủ 50% số mốc
        ng_hit = [n for n in f["nghia"] if n in pref_ng]
        loi_hit = [n for n in f["nghia"] if n in loi_ng]
        s = 4 * bool(loi_hit) + 2 * bool(ng_hit) + 2 * (f["sac_thai"] in pref_st) + 1 * (f["nang_luong"] == energy)
        s -= 3 * used.get(f["path"], 0) + 2 * (prev_fams[-2:].count(f["ho"])) + 1.5 * prev_fams.count(f["ho"])
        if fam_cap and prev_fams.count(f["ho"]) >= fam_cap:
            continue
        if len(prev_fams) >= 2 and prev_fams[-1] == prev_fams[-2] == f["ho"]:
            continue  # không 3 mốc liền cùng họ (chặn cứng)
        if f["ho"] in ban_fams:
            continue
        key = (s, hval(seed, mid, f["path"]))
        if best is None or key > best[0]:
            best = (key, f)
            why = (f"vai {','.join(sorted(set(f['vai']) & set(need_vai)))}" + (f" · nghĩa {','.join(ng_hit)}" if ng_hit else "")
                   + f" · sắc thái {f['sac_thai']}" + f" · năng lượng {f['nang_luong']}")
    return (best[1], why) if best else (None, None)


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    ap = argparse.ArgumentParser()
    ap.add_argument("--moments", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--words")
    ap.add_argument("--fps", type=float, default=60)
    ap.add_argument("--duration", type=float)
    ap.add_argument("--seed", default="video")
    ap.add_argument("--style", default="bds", choices=["bds", "hype", "tam_su"])
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--tags", default=os.path.join(here, "..", "library", "sfx-tags.json"))
    a = ap.parse_args()
    files = json.load(open(a.tags, encoding="utf-8"))["files"]
    tags_by_path = {f["path"]: f for f in files}
    moments = sorted(json.load(open(a.moments, encoding="utf-8")), key=lambda m: m["t"])
    words = json.load(open(a.words, encoding="utf-8")) if a.words else []
    fps = a.fps
    snap = lambda x: round(round(x * fps) / fps, 4)

    used, prev_paths, prev_fams, events, rows, missing = {}, [], [], [], [], []
    tail_fams, warn = [], []
    last_t3 = -99.0
    auto_group, prev_L = None, None
    last_clear = -99.0
    last_end = -99.0
    from collections import Counter
    vai_cnt = Counter()
    group_file = {}
    for i, m in enumerate(moments):
        t = snap(m["t"])
        ctx = " ".join(nfc(w[2]) for w in words if t - 0.6 <= w[0] <= t + 0.6)
        L, tier, nghia = detect(m, ctx, t, a.duration)
        if a.style == "tam_su" and L in ("L1", "L5", "L12"):
            L = "L10"
        need, pst, png, bst, bvai, lay3, lay2 = intent(L, m.get("text", ""))
        pref_ng = list(dict.fromkeys(nghia + png))
        # khoảng cách âm rõ: < 3s sau âm rõ trước → hạ bậc âm (giữ chữ, không bỏ SFX)
        sound_tier = tier
        if tier in ("T2", "T3") and t - last_clear < 3.0:
            sound_tier = "T1"
        energy = {"T3": "manh", "T2": "vua", "T1": "nhe", "T0": "nhe"}[sound_tier]
        g = m.get("group")
        # vị trí/tiện ích liên tiếp (< 4s) = một danh sách → thang nốt tự động
        if not g and L in ("L4", "L6") and prev_L in ("L4", "L6") and t - moments[i - 1]["t"] < 4.0 and rows and rows[-1].get("events"):
            g = auto_group or "auto_" + moments[i - 1]["id"]
            if g not in group_file:
                first = next(e for e in rows[-1]["events"] if e["layer"] == "dan")
                group_file[g] = {"f": tags_by_path[first["path"]], "n": 0}
                first["group"] = g  # nốt gốc cũng thuộc thang
            auto_group = g
        elif not g:
            auto_group = None
        prev_L = L
        pitch = 0
        if g and g in group_file:
            lead, why = group_file[g]["f"], "thang nốt cùng nhóm danh sách"
            group_file[g]["n"] += 1
            pitch = 2 * group_file[g]["n"]
        else:
            cap = max(1, round(0.3 * len(moments)))
            full = [v for v, c in vai_cnt.items() if c + 1 > 0.5 * len(moments)]
            lead, why = pick(files, need, pst, pref_ng, bst, bvai, energy, used, prev_paths[-1:], prev_fams, a.seed, m["id"], maxdur=1.6, fam_cap=cap, loi_ng=nghia,
                             lead_clear=sound_tier, glitch=a.style == "hype", full_vai=full)
            if lead is None:
                lead, why = pick(files, need, pst, pref_ng, bst, bvai, None, used, prev_paths[-1:], prev_fams, a.seed, m["id"], maxdur=2.5,
                                 fam_cap=cap, lead_clear=sound_tier, glitch=a.style == "hype", full_vai=full)
            if lead is None:
                rows.append({"id": m["id"], "loi": "không tìm được âm hợp lệ"})
                continue
            used[lead["path"]] = used.get(lead["path"], 0) + 1
            if g:
                group_file[g] = {"f": lead, "n": 0}
        align = "onset" if "foley" in lead["vai"] and not set(lead["vai"]) & {"cham_manh", "xac_nhan"} else "peak"
        at = -0.03 if "chuyen_canh" in lead["vai"] and not set(lead["vai"]) & {"cham_manh", "nhan_chu"} else 0.0
        ev = [{"moment": m["id"], "layer": "dan", "path": lead["path"], "align": align, "t": round(t + at, 4),
               "vol": VOL[sound_tier], "rel_voice_db": REL_DB[sound_tier], "pitch": pitch, "ly_do": why}]
        if g:
            ev[0]["group"] = g
        nxt = moments[i + 1]["t"] if i + 1 < len(moments) else 1e9
        prv = moments[i - 1]["t"] if i else -1e9
        cap_len = lead["peak_t"] + (nxt - t) - 0.15  # tắt trước mốc sau 0.15s
        if lead["dur"] > 1.6 or lead["dur"] > cap_len:
            ev[0]["dur"] = round(max(lead["peak_t"] + 0.12, min(lead["peak_t"] + 0.8, cap_len)), 3)
        layers = (lay3 if sound_tier == "T3" else lay2 if sound_tier == "T2" else None) or ""
        for lay in [x for x in layers.split("+") if x]:
            if lay == "du_bao":
                room = min(2.0, t - max(prv + 0.3, last_end + 0.05))  # riser bắt đầu sau khi âm mốc trước tắt
                f, w = pick(files, ["du_bao"], ["kich_tinh", "sang_trong"], [], bst + ["hai_huoc"], ["sai"], None, used,
                            [lead["path"]], prev_fams, a.seed, m["id"] + "pre", maxpeak=room) if room > 0.3 else (None, None)
                if f:
                    used[f["path"]] = used.get(f["path"], 0) + 1
                    ev.insert(0, {"moment": m["id"], "layer": "du_bao", "path": f["path"], "align": "peak", "t": t,
                                  "dur": round(f["peak_t"] + 0.06, 3), "vol": VOL["pre"], "rel_voice_db": REL_DB["pre"], "pitch": 0, "ly_do": "dâng trước, điểm kết = khung chạm · " + w})
            elif lay == "lap_lanh":
                f, w = pick(files, ["lap_lanh"], ["sang_trong", "am_ap"], list(dict.fromkeys(nghia + ["anh_sang", "phep_mau"])), bst,
                            ["sai", "cham_manh"], None, used, [lead["path"]], tail_fams, a.seed, m["id"] + "tail", loi_ng=nghia,
                            ban_fams=[lead["ho"]], fam_cap=max(2, round(0.4 * sum(1 for x in moments) / 2)))
                if f:
                    tail_fams.append(f["ho"])
                if f and nxt - t > 0.8 + sec_offset(lead):
                    used[f["path"]] = used.get(f["path"], 0) + 1
                    ev.append({"moment": m["id"], "layer": "duoi", "path": f["path"], "align": "onset", "t": round(t + sec_offset(lead), 4),
                               "vol": VOL["tail"], "rel_voice_db": REL_DB["tail"], "pitch": 0, "dur": round(min(1.4, nxt - t - 0.3), 3),
                               "ly_do": "đuôi ánh sáng sau cú chạm · " + w})
            elif lay == "foley":
                f, w = pick(files, ["foley"], ["tin_cay"], ["giay_to"], bst, ["sai"], None, used, [lead["path"]], prev_fams, a.seed, m["id"] + "fol")
                if f:
                    used[f["path"]] = used.get(f["path"], 0) + 1
                    ev.insert(0, {"moment": m["id"], "layer": "foley", "path": f["path"], "align": "onset", "t": round(t - 0.12, 4),
                                  "vol": VOL["tail"], "rel_voice_db": REL_DB["tail"], "pitch": 0, "dur": 0.6, "ly_do": "tiếng thật đúng nghĩa · " + w})
        have = {n for e in ev for n in tags_by_path[e["path"]]["nghia"]}
        want = [n for n in nghia if (n in SPECIFIC or n in png) and n not in have
                and any(n in f["nghia"] and f["sac_thai"] not in bst for f in files)]
        if want and not any(e["layer"] in ("foley", "nghia") for e in ev):
            f, w = pick(files, sorted({v for f in files for v in f["vai"]}), [], want, bst, ["sai"] if L != "L11" else [], None, used,
                        [lead["path"]], [], a.seed, m["id"] + "nghia", maxpeak=1.0, loi_ng=want)
            if f and want[0] in f["nghia"] and L == "L7" and "foley" in f["vai"]:
                used[f["path"]] = used.get(f["path"], 0) + 1
                ev.insert(0, {"moment": m["id"], "layer": "foley", "path": f["path"], "align": "onset", "t": round(t - 0.12, 4),
                              "vol": VOL["tail"], "rel_voice_db": REL_DB["tail"], "pitch": 0, "dur": 0.6,
                              "ly_do": f"tiếng thật '{want[0]}' vào trước chuông 0.12s · " + w})
            elif f and want[0] in f["nghia"]:
                used[f["path"]] = used.get(f["path"], 0) + 1
                ev.append({"moment": m["id"], "layer": "nghia", "path": f["path"], "align": "onset", "t": round(t + sec_offset(lead), 4),
                           "vol": VOL["tail"], "rel_voice_db": REL_DB["tail"], "pitch": 0,
                           "dur": round(max(0.2, min(0.9, nxt - t - 0.23)), 3), "ly_do": f"tiếng đúng nghĩa '{want[0]}' trong lời · " + w})
        for e in ev:  # không lớp nào kêu qua mốc sau: kết thúc ≤ mốc sau − 0.15s
            tg = tags_by_path[e["path"]]
            anc = tg["peak_t"] if e["align"] == "peak" else tg["onset"]
            r = 2 ** (e.get("pitch", 0) / 12)
            ln = e.get("dur") or tg["dur"]
            room = (nxt - TAIL_GAP - e["t"]) * r + anc  # độ dài tối đa (tính theo file gốc) để tắt trước mốc sau
            if ln > room:
                e["dur"] = round(max(anc + 0.1, room), 3)
        if L == "L7" and not any(e["layer"] == "foley" for e in ev):  # pháp lý luôn có tiếng giấy trước chuông
            f, w = pick(files, ["foley"], ["tin_cay"], ["giay_to"], bst, ["sai"], None, used, [lead["path"]], [], a.seed,
                        m["id"] + "fol", loi_ng=["giay_to"])
            if f and "giay_to" in f["nghia"]:
                used[f["path"]] = used.get(f["path"], 0) + 1
                ev.insert(0, {"moment": m["id"], "layer": "foley", "path": f["path"], "align": "onset", "t": round(t - 0.12, 4),
                              "vol": VOL["tail"], "rel_voice_db": REL_DB["tail"], "pitch": 0, "dur": 0.6,
                              "ly_do": "tiếng giấy trước chuông (pháp lý) · " + w})
        for e in ev:
            tg = tags_by_path[e["path"]]
            r = 2 ** (e.get("pitch", 0) / 12)
            anc = tg["peak_t"] if e["align"] == "peak" else tg["onset"]
            last_end = max(last_end, e["t"] - anc / r + min(e.get("dur") or tg["dur"], tg["dur"]) / r)
        if t - last_t3 < 0.5:
            warn.append(f"{m['id']}: chen trong 0.5s sau cú T3 → dời chữ hoặc gộp mốc")
        if sum(1 for mm in moments if t - 1.0 < mm["t"] <= t) > 2:
            warn.append(f"{m['id']}: > 2 mốc trong 1s → gộp mốc")
        if sound_tier == "T3":
            last_t3 = t
        if sound_tier in ("T2", "T3"):
            last_clear = t
        prev_paths.append(lead["path"])
        vai_cnt[next((v for v in lead["vai"] if v in need), lead["vai"][0])] += 1
        if not pitch:
            prev_fams.append(lead["ho"])  # thang nốt (danh sách) chỉ tính 1 lần cho họ
        miss = [n for n in nghia if n in ("cua_mo_dong", "buoc_chan", "nuoc", "thien_nhien", "chia_khoa")]
        if miss:
            missing.append({"moment": m["id"], "nghia_thieu": miss})
        events += ev
        rows.append({"id": m["id"], "t": t, "text": m.get("text", ""), "L": L, "tier": tier, "tier_am": sound_tier,
                     "nghia_loi": nghia, "events": ev, "src": m, "ctx": ctx})
    import hashlib as _h
    sha = lambda p: _h.sha256(open(p, "rb").read()).hexdigest() if p else None
    plan = {"fps": fps, "seed": a.seed, "duration": a.duration,
            "nguon": {"moments": os.path.abspath(a.moments), "moments_sha256": sha(a.moments),
                      "words": os.path.abspath(a.words) if a.words else None, "words_sha256": sha(a.words)}, "style": a.style, "moments": rows, "events": events, "thieu_foley": missing, "canh_bao": warn,
            "tags": os.path.abspath(a.tags)}
    os.makedirs(a.out, exist_ok=True)
    json.dump(plan, open(os.path.join(a.out, "sfx_plan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    md = ["| Mốc | Giây | Chữ | Ý định | Bậc chữ/âm | Nghĩa trong lời | SFX (lớp → file) | Lý do |", "|---|---|---|---|---|---|---|---|"]
    for r in rows:
        if "events" not in r:
            md.append(f"| {r['id']} | – | – | – | – | – | ⚠️ {r['loi']} | – |")
            continue
        sf = "<br>".join(f"{e['layer']} → `{e['path']}`" + (f" (+{e['pitch']} nửa cung)" if e["pitch"] else "") for e in r["events"])
        ld = "<br>".join(e["ly_do"] for e in r["events"])
        md.append(f"| {r['id']} | {r['t']:.2f} | {r['text']} | {r['L']} | {r['tier']}/{r['tier_am']} | {', '.join(r['nghia_loi']) or '–'} | {sf} | {ld} |")
    if warn:
        md.append("\n⚠️ Mật độ: " + "; ".join(warn))
    if missing:
        md.append("\n⚠️ Thiếu tiếng thật trong kho: " + "; ".join(f"{x['moment']}: {', '.join(x['nghia_thieu'])}" for x in missing))
    open(os.path.join(a.out, "sfx_plan.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
    print(f"✅ {len(rows)} mốc, {len(events)} lớp âm, {len(set(e['path'] for e in events))} file khác nhau → {a.out}")


if __name__ == "__main__":
    main()
