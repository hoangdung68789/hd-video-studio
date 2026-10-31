# Lập template.json cho TV-07 từ số đo (do_mau/do.json + SFX Antigravity + khung 1 fps + trang video/bình luận, 30/10/2026).
# Dùng: python lap_template.py do_mau/do.json template.json
import json, sys
import numpy as np

do = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
DUR, CUTS, BEATS, LOUD = do["thoi_luong"], do["cat"], do["phach"], do["do_to_05s_db"]
SFX_DO = [(4.74, "pop", 5.1), (8.72, "pop", 4.8), (10.74, "hit", 7.3), (11.6, "pop", 4.4), (14.98, "hit", 7.4), (15.76, "pop", 4.3),
          (18.28, "swish", 4.1), (21.06, "pop", 4.0), (21.48, "riser", 7.6), (21.88, "swish", 7.1), (24.24, "pop", 4.3), (25.72, "riser", 5.8),
          (26.18, "pop", 6.0), (31.46, "swish", 5.8), (35.58, "pop", 4.8), (37.26, "pop", 6.0), (38.82, "riser", 5.6), (46.14, "swish", 5.3), (48.16, "hit", 7.6)]


def dien_bien(a, b):
    x = LOUD[int(a * 2):max(int(a * 2) + 2, int(b * 2))]
    h = len(x) // 2
    d = np.mean(x[h:]) - np.mean(x[:h])
    return "len" if d > 1.5 else "ha" if d < -1.5 else "giu"


def phach(a, b):
    return [c for c in CUTS if a <= c < b and BEATS and min(abs(c - x) for x in BEATS) <= 0.08]


shots = list(zip([0.0] + CUTS, CUTS + [DUR]))
HOST = 46.02   # shot duy nhất có người


def broll(a, b, loai, ly):
    return [{"giay": s0, "loai": loai, "thoi_luong": round(s1 - s0, 2), "lech_loi_s": 0, "muc_dich": "doi_nhip_giu_chan", "ly_do": ly, "gan_loi": "khong_loi_nhac"}
            for s0, s1 in shots if a <= s0 < b and s0 != HOST]


B = [0, 6.4, 27.12, 37.23, 46.02, 54.65, DUR]
TIEU_DE = {"giay": 0.3, "ma": "tieu_de_trang_nho", "vai_tro": "ten_can_ho", "font": "sans (chưa rõ tên)", "co_pct": 2.5, "vi_tri_pct": [25, 18], "mau": "#FFFFFF",
           "vao": "hien (mốc ±0,5 s)", "ra": "cat_cung theo canh 1,73 s", "muc_dich": "dinh_vi", "ly_do": "chỉ ghi tên căn và khu, không ghi giá — người xem phải hỏi"}
doan = [
    {"tu": B[0], "den": B[1], "vai_tro": "hook", "canh": {"co": "toan", "goc": "góc rộng, thấp", "chuyen_dong_may": "trượt", "host": False},
     "chu": [TIEU_DE], "broll": broll(B[0], B[1], "toan", "phòng khách đèn chùm rồi view đêm thành phố: khoe điểm đắt nhất ngay 6 s đầu"),
     "chuyen_canh": {}},
    {"tu": B[1], "den": B[2], "vai_tro": "bang_chung", "canh": {"co": "toan/chi_tiet", "goc": "góc rộng", "chuyen_dong_may": "trượt/xoay", "host": False},
     "chu": [], "broll": broll(B[1], B[2], "noi_that", "cảnh dài 2,5–6,5 s theo nhạc, xen view để không gian thở"),
     "chuyen_canh": {"giay": 6.4, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[2], "den": B[3], "vai_tro": "bang_chung", "canh": {"co": "toan", "goc": "góc rộng", "chuyen_dong_may": "trượt", "host": False},
     "chu": [], "broll": broll(B[2], B[3], "noi_that", "phòng ngủ phụ, phòng tắm sau màn đen ngắn: báo sang tầng/khu khác"),
     "chuyen_canh": {"giay": 28.5, "ma": "dip_den", "so_khung": 15, "easing": "inout"}},
    {"tu": B[3], "den": B[4], "vai_tro": "tien_ich", "canh": {"co": "toan", "goc": "từ cao", "chuyen_dong_may": "dung/trượt", "host": False},
     "chu": [], "broll": broll(B[3], B[4], "flycam", "view ngày, hồ bơi đêm, view hoàng hôn: bán tiện ích và tầm nhìn không cần lời"),
     "chuyen_canh": {"giay": 37.23, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[4], "den": B[5], "vai_tro": "bang_chung", "canh": {"co": "toan", "goc": "góc rộng", "chuyen_dong_may": "trượt", "host": True},
     "chu": [], "broll": broll(B[4], B[5], "noi_that", "bếp và bàn ăn sau cảnh có người đứng trên cầu thang để so tỉ lệ không gian"),
     "chuyen_canh": {"giay": 46.02, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[5], "den": B[6], "vai_tro": "chot", "canh": {"co": "toan", "goc": "ngước lên tòa nhà", "chuyen_dong_may": "dung", "host": False},
     "chu": [], "broll": broll(B[5], B[6], "toan", "tòa nhà ngày chuyển tối: khép tour, không giá, không kêu gọi"),
     "chuyen_canh": {"giay": 54.65, "ma": "cut", "so_khung": 0, "easing": ""}},
]
for d in doan:
    d["cat"] = [c for c in CUTS if d["tu"] <= c < d["den"]]
    d["sfx"] = [{"giay": t, "vai_tro": v, "gan_voi": "nhac", "db_so_voi_nhac": db, "nguon": "do_mau (có thể là tiếng trong bản nhạc) [Ước đoán]"} for t, v, db in SFX_DO if d["tu"] <= t < d["den"]]
    d["nhac"] = {"phach": phach(d["tu"], d["den"]), "dien_bien": dien_bien(d["tu"], d["den"]), "muc_so_voi_giong_db": None}
    d.update({"mg": [], "an": [], "loi": {"vai_tro": "khong_loi", "o_dien": ""}})
d0 = doan[0]
d0["sfx"].append({"giay": 0.3, "vai_tro": "pop_nhe", "gan_voi": "chu", "db_so_voi_nhac": 3, "nguon": "them_theo_luat_dung_video (mẫu không có)"})
d0["sfx"].sort(key=lambda x: x["giay"])
cnt = lambda k: sum(len(d.get(k, [])) for d in doan)
t = {"id": "TV-07", "ten": "Tour căn hộ không lời, giấu giá để khách hỏi", "the_loai": ["review nha"],
     "nguon": {"url": "https://www.tiktok.com/@huyle.bds/video/7503198750861479176", "ngay_xem": "2026-10-30",
               "chi_so": "91,5K xem · 2.962 thích · 51 bình luận · 536 chia sẻ · đăng 11/05/2025 (trang video + info.json khớp)", "nhan": "XM"},
     "thong_so": {"khung": "9:16", "fps": 30, "thoi_luong": DUR, "lufs": None, "bpm": do["bpm"], "shot_tb": do["shot_tb"],
                  "su_kien_moi_giay": round((len(CUTS) + cnt("chu")) / DUR, 2)},
     "giu_chan": {"hook": "tên căn hộ + phòng khách đèn chùm rồi view đêm trong 6 s", "open_loops": [{"mo": 0.3, "tra_loi": None, "ghi_chu": "giá không được nói; người xem hỏi ở bình luận"}],
                  "doi_nhip_moi_giay": do["shot_tb"], "cao_trao": 37.23,
                  "keu_goi_theo_doi": {"giay": 54.65, "cach": "không kêu gọi; bình luận xin giá đóng vai lời mời liên hệ"}},
     "doan": doan,
     "su_kien_do_duoc": {"cat": len(CUTS), "chu": 1, "mg": 0, "broll": cnt("broll"), "an": 0, "chuyen_canh": 5, "sfx": cnt("sfx"),
                         "phach_manh": sum(len(d["nhac"]["phach"]) for d in doan)},
     "binh_luan": {"nguon": "trang video, đọc 30/10/2026", "nhan": "Có bình luận", "dien_giai": "phần lớn bình luận đọc được là hỏi giá, tầng hoặc thuê"},
     "ghi_chu_do": {"sfx": "19 sự kiện đo được; video không lời nhưng có thể là âm trong bản nhạc", "tieu_de": "mốc tiêu đề từ khung 1 fps, sai số ±0,5 s"},
     "ket_hop": [{"dau_hieu_loi": "video tìm khách, không muốn công khai giá", "combo": "chỉ ghi tên căn và khu, tour đẹp không lời, không giá, để khách hỏi ở bình luận", "thoi_diem": "toàn video", "nguon": "https://www.tiktok.com/@huyle.bds/video/7503198750861479176 · bình luận"}],
     "diem_yeu_da_sua": ["không có chữ thông tin → bản Dũng thêm nhãn phòng/diện tích nếu Dũng cấp số", "giấu giá chỉ hợp video tìm khách; không áp cho video có mục tiêu nêu giá"],
     "trang_thai": "Thu nghiem", "so_lan_dung": 0, "dung_cham": []}
json.dump(t, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("su_kien:", t["su_kien_do_duoc"])
