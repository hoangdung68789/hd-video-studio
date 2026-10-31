# Lập template.json cho TV-01 từ số đo (do_mau/do.json + khung dày + đo pixel 30/10/2026).
# Dùng lại cho bản tự dựng: python lap_template.py <do.json> <out.json> [--ban-dung]  (cùng hàm dien_bien/phach => so công bằng)
import json, sys
import numpy as np

do = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
DUR, CUTS, BEATS, LOUD = do["thoi_luong"], do["cat"], do["phach"], do["do_to_05s_db"]
REL = DUR / 58.9 if "--ban-dung" in sys.argv else 1.0   # bản dựng cùng thời lượng; giữ tham số cho video khác độ dài


def dien_bien(a, b):
    """diễn biến nhạc của đoạn [a,b] = so độ to nửa đầu / nửa sau (cùng hàm cho mẫu và bản dựng)"""
    x = LOUD[int(a * 2):max(int(a * 2) + 2, int(b * 2))]
    h = len(x) // 2
    d = np.mean(x[h:]) - np.mean(x[:h])
    return "len" if d > 1.5 else "ha" if d < -1.5 else "giu"


def phach(a, b):
    return [c for c in CUTS if a <= c < b and BEATS and min(abs(c - x) for x in BEATS) <= 0.08]


S = lambda t: round(t * REL, 2)
HOST = {3, 9, 10, 14, 19, 25}          # shot có người dẫn (đo bằng mắt trên contact.jpg)
shots = list(zip([0.0] + CUTS, CUTS + [DUR]))


def broll(a, b, why):
    return [{"giay": round(s0, 2), "loai": "noi_that" if s0 > 3 else "toan", "thoi_luong": round(s1 - s0, 2), "lech_loi_s": 0,
             "muc_dich": "doi_nhip_giu_chan", "ly_do": why, "gan_loi": "khong_loi_nhac"}
            for i, (s0, s1) in enumerate(shots) if a <= s0 < b and i not in HOST]


def chu(t, vt, mau, vao, md, ly, pos):
    return {"giay": S(t), "ma": vao, "vai_tro": vt, "mau": mau, "vao": vao, "vi_tri_pct": pos, "muc_dich": md, "ly_do": ly}


def sfx(t):
    return {"giay": S(t), "vai_tro": "phach_nhac", "gan_voi": "nhac", "db_so_voi_nhac": 0}


B = [0, S(3.2), S(18.17), S(24.03), S(54.1), DUR]
T1 = S(18.17)
doan = [
    {"tu": B[0], "den": B[1], "vai_tro": "hook", "canh": {"co": "toan", "goc": "ngang", "chuyen_dong_may": "dung", "host": True},
     "broll": [], "chu": [], "mg": [], "an": [], "sfx": [], "chuyen_canh": {},
     "ly_do_tinh": "hook bằng hình: bóng người trước kính nhìn toàn cảnh thành phố 3,2s, không chữ — gây tò mò 'ai, ở đâu'"},
    {"tu": B[1], "den": B[2], "vai_tro": "van_de", "canh": {"co": "trung", "goc": "ngang", "chuyen_dong_may": "lia_cham", "host": False},
     "broll": broll(B[1], B[2], "teaser nội thất ~1,5s/cảnh đúng phách để khoe nhanh nhiều không gian, giữ người xem tới màn tiết lộ giá"),
     "chu": [], "mg": [], "an": [], "sfx": [], "chuyen_canh": {"giay": B[1], "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[2], "den": B[3], "vai_tro": "gia", "canh": {"co": "trung", "goc": "ngang", "chuyen_dong_may": "theo_nguoi", "host": True},
     "broll": [], "mg": [], "an": [],
     "chu": [chu(18.35, "gia", "#F9C945", "pop", "nhan_gia", "con số đắt nhất bật 0,2s sau cú cắt, đúng phách: trả lời câu nhử ở caption", [7, 27]),
             chu(19.85, "phu_gia", "#FFFFFF", "go_chu", "nhan_gia", "dòng nhỏ giải thích con số, hiện sau 1,5s để mắt đọc xong số trước", [40, 30]),
             chu(20.6, "phu", "#FFFFFF", "go_chu", "chuyen_y", "dòng nhỏ nối sang loại nhà", [8, 44]),
             chu(20.85, "loai_nha", "#8FDEC2", "pop", "nhan_gia", "tên loại nhà màu khác (xanh ngọc) để tách tầng thông tin với giá vàng", [10, 49]),
             chu(21.6, "dien_tich", "#FFFFFF", "hien_tung_ky_tu", "chung_minh_so_lieu", "diện tích hiện dần từng ký tự như bộ đếm — bằng chứng cho giá", [15, 65])],
     "sfx": [sfx(18.35), sfx(19.85), sfx(20.6), sfx(20.85), sfx(21.6)],
     "chuyen_canh": {"giay": B[2], "ma": "whip_blur", "so_khung": 15, "easing": "out"}},
    {"tu": B[3], "den": B[4], "vai_tro": "bang_chung", "canh": {"co": "trung", "goc": "ngang", "chuyen_dong_may": "lia_cham", "host": True},
     "broll": broll(B[3], B[4], "thân video: tour nội thất 1–4,5s/cảnh trên đoạn nhạc lớn, xen người dẫn để giữ yếu tố con người"),
     "chu": [], "mg": [], "an": [], "sfx": [], "chuyen_canh": {"giay": B[3], "ma": "light_leak", "so_khung": 15, "easing": "inout"}},
    {"tu": B[4], "den": B[5], "vai_tro": "cta", "canh": {"co": "trung", "goc": "ngang", "chuyen_dong_may": "dung", "host": True},
     "broll": [], "an": [],
     "chu": [chu(55.25, "loai_nha", "#6FE889", "truot_len", "keu_goi", "nhắc lại loại nhà trên đầu người dẫn ở cảnh kết để chốt trí nhớ", [30, 28])],
     "mg": [{"giay": S(55.75), "ma": "chu_ky", "mo_ta": "chữ ký viết tay thương hiệu bên trái", "thoi_luong": 3, "muc_dich": "keu_goi",
             "ly_do": "khép video bằng nhận diện người bán thay vì lời kêu gọi", "gan_loi": "khong_loi_nhac", "ket_hop": ["chu loai_nha"]}],
     "sfx": [sfx(55.25)], "chuyen_canh": {"giay": B[4], "ma": "light_leak", "so_khung": 15, "easing": "inout"}},
]
for d in doan:
    d["cat"] = [c for c in CUTS if d["tu"] <= c < d["den"]]
    d["nhac"] = {"phach": phach(d["tu"], d["den"]), "dien_bien": dien_bien(d["tu"], d["den"]), "muc_so_voi_giong_db": 0}
    d["loi"] = {"vai_tro": "khong_loi", "o_dien": ""}
cnt = lambda k: sum(len(d.get(k, [])) for d in doan)
t = {"id": "TV-01", "ten": "Penthouse tiết lộ giá giữa video (không lời, nhạc dâng)", "the_loai": ["review nha"],
     "nguon": {"url": "https://www.tiktok.com/@quynhanhbds/video/7676404843660987655", "ngay_xem": "2026-10-30",
               "chi_so": "2,9M xem · 267,9K thích · 6,3K bình luận · 137,8K chia sẻ (video.info.json)", "nhan": "XM"},
     "thong_so": {"khung": "9:16", "fps": 30, "thoi_luong": DUR, "lufs": None, "bpm": do["bpm"], "shot_tb": do["shot_tb"],
                  "su_kien_moi_giay": round((len(CUTS) + cnt("chu") + cnt("mg")) / DUR, 2)},
     "giu_chan": {"hook": "bóng người trước kính nhìn toàn cảnh 0–3,2s + caption câu nhử",
                  "open_loops": [{"mo": 0, "tra_loi": S(18.35)}], "doi_nhip_moi_giay": do["shot_tb"], "cao_trao": S(24.03),
                  "keu_goi_theo_doi": {"giay": S(55.75), "cach": "chữ ký thương hiệu, không có lời kêu gọi"}},
     "doan": doan,
     "su_kien_do_duoc": {"cat": len(CUTS), "chu": cnt("chu"), "mg": cnt("mg"), "broll": cnt("broll"), "an": 0,
                         "chuyen_canh": sum(1 for d in doan if d["chuyen_canh"].get("ma")), "sfx": cnt("sfx"),
                         "phach_manh": sum(len(d["nhac"]["phach"]) for d in doan)},
     "ket_hop": [{"dau_hieu_loi": "giá (video không lời: màn tiết lộ)", "combo": "shot người dẫn dài nhất + whip vào + chữ giá vàng pop → dòng nhỏ gõ → loại nhà xanh ngọc → diện tích đếm ký tự + light leak ra",
                  "thoi_diem": "31% thời lượng, chữ đầu +0,2s sau cú cắt", "nguon": "https://www.tiktok.com/@quynhanhbds/video/7676404843660987655 · 18,2–24,0s"}],
     "diem_yeu_da_sua": ["mẫu không SFX cho chữ (dùng phách nhạc) — áp cho Dũng thì thêm SFX theo phân loại (luật /dung-video)",
                         "khung mẫu 720p 30fps — bản Dũng 1728x3072 60fps"],
     "trang_thai": "Thu nghiem", "so_lan_dung": 0, "dung_cham": []}
json.dump(t, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("doan:", [(d["vai_tro"], d["nhac"]["dien_bien"], len(d["cat"]), len(d["broll"]), len(d["chu"])) for d in doan])
print("su_kien:", t["su_kien_do_duoc"])
