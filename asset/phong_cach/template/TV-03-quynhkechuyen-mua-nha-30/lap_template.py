# Lập template.json cho TV-03 từ số đo (do_mau/do.json + loi_whisper.srt + dải phụ đề 4 fps + SFX Antigravity + đo pixel, 30/10/2026).
# Dùng: python lap_template.py do_mau/do.json template.json
import json, sys
import numpy as np

do = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
DUR, CUTS, BEATS, LOUD = do["thoi_luong"], do["cat"], do["phach"], do["do_to_05s_db"]


def dien_bien(a, b):
    x = LOUD[int(a * 2):max(int(a * 2) + 2, int(b * 2))]
    h = len(x) // 2
    d = np.mean(x[h:]) - np.mean(x[:h])
    return "len" if d > 1.5 else "ha" if d < -1.5 else "giu"


def phach(a, b):
    return [c for c in CUTS if a <= c < b and BEATS and min(abs(c - x) for x in BEATS) <= 0.08]


# SFX tách được khỏi giọng (trùng sự kiện hình). 30 sự kiện khác nằm trong giọng nói → Không đo được.
SFX_DO = [(4.42, "whoosh_chop_sang", 5.7), (16.52, "whoosh", 11.6), (16.88, "riser_cuoi_hai", 12.5)]
TRANG, CAM = "#E6F6F7", "#FA7602"   # phụ đề trắng (viền đen mảnh); số nhấn cam (khung 4,9 s / 1,9 s)


def pd(t, vt, md, ly):
    return {"giay": t, "ma": "phu_de_cum_tu", "vai_tro": vt, "font": "sans thường (chưa rõ tên)", "co_pct": 2.6,
            "vi_tri_pct": [50, 63], "mau": TRANG, "vao": "cat_cung theo cụm lời", "ra": "cat_cung",
            "muc_dich": md, "ly_do": ly}


def so(t, vt, ly):
    return {"giay": t, "ma": "so_nhan_cam_pop", "vai_tro": vt, "font": "sans đậm (chưa rõ tên)", "co_pct": 6,
            "vi_tri_pct": [82, 70], "mau": CAM, "vao": "pop", "ra": "cat_cung cùng phụ đề",
            "muc_dich": "nhan_gia", "ly_do": ly}


def sfx_cho(a, b, chu_ts):
    s = [{"giay": t, "vai_tro": v, "gan_voi": "chuyen_canh" if t < 5 else "an", "db_so_voi_nhac": db, "nguon": "do_mau"}
         for t, v, db in SFX_DO if a <= t < b]
    for c in chu_ts:
        if not any(abs(c - x["giay"]) <= 0.15 for x in s):
            s.append({"giay": c, "vai_tro": "pop_nhe" if c in (1.62, 4.62) else "tick_nhe", "gan_voi": "chu",
                      "db_so_voi_nhac": 3, "nguon": "them_theo_luat_dung_video (không đo được ở mẫu)"})
    return sorted(s, key=lambda x: x["giay"])


L_PD = "phụ đề cắt theo cụm lời, đổi đúng lúc câu đổi — người xem tắt tiếng vẫn theo được câu chuyện"
B = [0, 2.62, 5.38, 14.33, 16.27, DUR]
doan = [
    {"tu": B[0], "den": B[1], "vai_tro": "hook",
     "canh": {"co": "toan", "goc": "ngang, quay lưng nhìn qua cửa kính", "chuyen_dong_may": "dung", "host": True},
     "loi": {"vai_tro": "hook_hua_hen (bí quyết mua nhà trước 30 tuổi)", "o_dien": ""},
     "chu": [pd(0.05, "phu_de", "tao_to_mo", "câu hứa hẹn hiện ngay khung đầu"),
             so(1.62, "so_tuoi", "số tuổi bật cam đúng lúc nói — con số làm hook dễ nhớ")],
     "broll": [], "an": [], "mg": [], "chuyen_canh": {}, "ly_do_tinh": "một cảnh tĩnh 6,9 s, nhịp do phụ đề + số pop"},
    {"tu": B[1], "den": B[2], "vai_tro": "giai_phap",
     "canh": {"co": "toan", "goc": "ngang, ban công nhìn dự án", "chuyen_dong_may": "dung", "host": True},
     "loi": {"vai_tro": "ke_hoach_buoc_1 (trả trước %)", "o_dien": ""},
     "chu": [pd(2.62, "phu_de", "minh_hoa_loi", L_PD),
             so(4.62, "phan_tram", "tỉ lệ trả trước bật cam ngay sau chớp sáng — nhấn con số tài chính")],
     "broll": [], "an": [], "mg": [],
     "chuyen_canh": {"giay": 4.38, "ma": "chop_sang_tach_mau", "so_khung": 6, "easing": "cat"}},
    {"tu": B[2], "den": B[3], "vai_tro": "bang_chung",
     "canh": {"co": "chi_tiet", "goc": "từ trên bàn ký", "chuyen_dong_may": "cam_tay", "host": False},
     "loi": {"vai_tro": "ke_hoach_buoc_2_3 (cho thuê → trả góp → twist)", "o_dien": ""},
     "chu": [pd(5.38, "phu_de", "chuyen_y", "cụm 'sau đó' tách riêng 0,5 s — ngắt nhịp trước twist"),
             pd(5.88, "phu_de", "minh_hoa_loi", L_PD), pd(8.38, "phu_de", "minh_hoa_loi", L_PD),
             pd(10.62, "phu_de", "minh_hoa_loi", L_PD),
             pd(12.12, "phu_de", "tao_to_mo", "câu twist 'vừa có nhà vừa có bạn trai' — điểm gây cười/cao trào")],
     "broll": [{"giay": 6.93, "loai": "chi_tiet", "thoi_luong": 1.64, "lech_loi_s": 1.05, "muc_dich": "minh_hoa_loi",
                "ly_do": "cảnh ký hợp đồng có túi quà chủ đầu tư — biến kế hoạch thành 'thật', vào trễ ~1 s sau câu (L-cut)", "gan_loi": "thuê nhà"},
               {"giay": 8.57, "loai": "chi_tiet", "thoi_luong": 3.03, "lech_loi_s": 0.2, "muc_dich": "minh_hoa_loi",
                "ly_do": "cận tay ký đúng câu tiền thuê/trả góp", "gan_loi": "tiền thuê hằng tháng"},
               {"giay": 11.6, "loai": "chi_tiet", "thoi_luong": 2.73, "lech_loi_s": 0.5, "muc_dich": "chung_minh_so_lieu",
                "ly_do": "cận giấy tờ + mã QR: bằng chứng giao dịch trước câu twist", "gan_loi": "trả góp căn nhà"}],
     "an": [], "mg": [], "chuyen_canh": {"giay": 6.93, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[3], "den": B[4], "vai_tro": "chot",
     "canh": {"co": "trung", "goc": "ngang, ngồi ghế bành đọc sách", "chuyen_dong_may": "dung", "host": True},
     "loi": {"vai_tro": "punchline", "o_dien": ""},
     "chu": [pd(14.38, "phu_de", "keu_goi", "câu chốt ngắn trên cảnh 'người thành đạt' — đối lập hài")],
     "broll": [], "an": [], "mg": [], "chuyen_canh": {"giay": 14.33, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[4], "den": B[5], "vai_tro": "cta",
     "canh": {"co": "trung", "goc": "ban công, cười ngả người", "chuyen_dong_may": "cam_tay", "host": True},
     "loi": {"vai_tro": "loi_cam_on_ket", "o_dien": ""},
     "chu": [], "mg": [],
     "an": [{"giay": 16.38, "loai": "icon", "vi_tri_pct": [25, 80], "mau": "#FB8A1B", "vao": "pop rải nhiều chữ cười nghiêng",
             "ra": "cat_cung", "co_sfx": True, "muc_dich": "doi_nhip_giu_chan",
             "ly_do": "sticker cười cam rải góc dưới-trái + SFX mạnh (+12 dB) báo 'đây là đùa' — kết vui, kích bình luận/chia sẻ",
             "gan_loi": "sau punchline"}],
     "broll": [], "chuyen_canh": {"giay": 16.27, "ma": "cut", "so_khung": 0, "easing": ""}},
]
for d in doan:
    d["cat"] = [c for c in CUTS if d["tu"] <= c < d["den"]]
    d["sfx"] = sfx_cho(d["tu"], d["den"], [c["giay"] for c in d["chu"]])
    d["nhac"] = {"phach": phach(d["tu"], d["den"]), "dien_bien": dien_bien(d["tu"], d["den"]), "muc_so_voi_giong_db": None}
cnt = lambda k: sum(len(d.get(k, [])) for d in doan)
t = {"id": "TV-03", "ten": "Kể chuyện hài 'mua nhà trước 30 tuổi' (lời + phụ đề cụm + số cam + twist)", "the_loai": ["ke chuyen", "chia se"],
     "nguon": {"url": "https://www.tiktok.com/@quynhkechuyennha/video/7424415111038700807", "ngay_xem": "2026-10-30",
               "chi_so": "327,5K xem · 4,8K thích · 161 bình luận · 1,5K chia sẻ · đăng 11/10/2024 (video.info.json)", "nhan": "XM"},
     "thong_so": {"khung": "9:16", "fps": 30, "thoi_luong": DUR, "lufs": None, "bpm": do["bpm"], "shot_tb": do["shot_tb"],
                  "su_kien_moi_giay": round((len(CUTS) + cnt("chu") + cnt("an") + cnt("broll")) / DUR, 2)},
     "giu_chan": {"hook": "câu hứa 'cách mua nhà trước 30 tuổi' + số tuổi bật cam trong 2 s đầu",
                  "open_loops": [{"mo": 0.05, "tra_loi": 12.12}], "doi_nhip_moi_giay": round(DUR / 5, 1), "cao_trao": 12.12,
                  "keu_goi_theo_doi": {"giay": 16.27, "cach": "lời cảm ơn + sticker cười; không kêu gọi theo dõi [Ước đoán: kích bình luận]"}},
     "doan": doan,
     "su_kien_do_duoc": {"cat": len(CUTS), "chu": 10, "mg": 0, "broll": 3, "an": 1, "chuyen_canh": 4,
                         "sfx": cnt("sfx"), "phach_manh": sum(len(d["nhac"]["phach"]) for d in doan)},
     "ghi_chu_do": {"sfx_mau_tach_duoc": len(SFX_DO), "sfx_khong_do_duoc": "30 sự kiện nằm trong giọng nói, không tách được",
                    "sfx_them_theo_luat": cnt("sfx") - len(SFX_DO), "loi": "whisper large-v3 12 câu (do_mau/loi_whisper.srt), chỉ dùng vai trò",
                    "chu_do_tai": "dải 4 fps vùng y 60–82 % (do_mau/chu_4fps.jpg), sai số ±0,13 s"},
     "ket_hop": [{"dau_hieu_loi": "con số (tuổi, %, giá) trong câu kể", "combo": "phụ đề trắng giữa khung + số cam #FA7602 pop bên phải dưới phụ đề + pop nhẹ",
                  "thoi_diem": "đúng từ ±0,1 s", "nguon": "https://www.tiktok.com/@quynhkechuyennha/video/7424415111038700807 · 1,6 s / 4,6 s"},
                 {"dau_hieu_loi": "kế hoạch tài chính / giao dịch", "combo": "b-roll cận ký hợp đồng + giấy tờ, vào trễ ~1 s (L-cut), phụ đề cụm giữ nguyên",
                  "thoi_diem": "+0,2–1 s sau câu", "nguon": "https://www.tiktok.com/@quynhkechuyennha/video/7424415111038700807 · 6,9–14,3 s"},
                 {"dau_hieu_loi": "câu đùa / punchline kết", "combo": "cắt sang cảnh người dẫn cười + sticker chữ cười cam rải góc + whoosh/riser mạnh",
                  "thoi_diem": "+0,1 s sau cú cắt", "nguon": "https://www.tiktok.com/@quynhkechuyennha/video/7424415111038700807 · 16,3–17,9 s"}],
     "diem_yeu_da_sua": ["phụ đề trắng nhỏ (~2,6 % cao) dễ chìm trên tường trắng → bản Dũng dùng font có dấu cỡ lớn hơn, viền/bóng, không nền hộp",
                         "cảnh mở 6,9 s một góc → bản Dũng chia ≤4 s",
                         "mẫu không có SFX tách được cho phụ đề → thêm tick/pop nhẹ theo luật, chỉ ở số nhấn nếu Dũng thấy ồn",
                         "lời mẫu là chuyện đùa — chỉ học cấu trúc kể (hứa → kế hoạch → twist → cười), không chép lời"],
     "trang_thai": "Thu nghiem", "so_lan_dung": 0, "dung_cham": []}
json.dump(t, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("doan:", [(d["vai_tro"], d["nhac"]["dien_bien"], len(d["cat"]), len(d["chu"]), len(d["sfx"])) for d in doan])
print("su_kien:", t["su_kien_do_duoc"])
