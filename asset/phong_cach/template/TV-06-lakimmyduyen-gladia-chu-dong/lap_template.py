# Lập template.json cho TV-06 từ số đo (do_mau/do.json + do_mau/sfx.json + dải chữ 4 fps + đo pixel + trang video/bình luận, 30/10/2026).
# Dùng: python lap_template.py do_mau/do.json template.json
import json, sys
import numpy as np

do = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
DUR, CUTS, BEATS, LOUD = do["thoi_luong"], do["cat"], do["phach"], do["do_to_05s_db"]
EV = json.load(open("do_mau/sfx.json", encoding="utf-8"))["sfx_timeline_events"]   # lẫn giọng nói


def dien_bien(a, b):
    x = LOUD[int(a * 2):max(int(a * 2) + 2, int(b * 2))]
    h = len(x) // 2
    d = np.mean(x[h:]) - np.mean(x[:h])
    return "len" if d > 1.5 else "ha" if d < -1.5 else "giu"


def phach(a, b):
    return [c for c in CUTS if a <= c < b and BEATS and min(abs(c - x) for x in BEATS) <= 0.08]


def chu(t, vt, kieu, mau, pos, co, md, ly, sau_nguoi=False):
    return {"giay": t, "ma": kieu, "vai_tro": vt, "font": kieu, "co_pct": co, "vi_tri_pct": list(pos), "mau": mau,
            "vao": "hiện từng cụm theo từ, lệch 0,25–0,75 s", "ra": "cat_cung/nhòe theo cảnh", "sau_nguoi": sau_nguoi,
            "muc_dich": md, "ly_do": ly}


def mg(t, ma, mo_ta, d, md, ly, loi):
    return {"giay": t, "ma": ma, "mo_ta": mo_ta, "thoi_luong": d, "muc_dich": md, "ly_do": ly, "gan_loi": loi, "ket_hop": []}


def sfx_cho(ts):
    s = []
    for t in ts:
        e = min(EV, key=lambda e: abs(e["peak_s"] - t))
        if abs(e["peak_s"] - t) <= 0.15:
            s.append({"giay": e["peak_s"], "vai_tro": e["acoustic_class"], "gan_voi": "su_kien_hinh", "db_so_voi_nhac": e["db_above_music"],
                      "nguon": "do_mau (trùng sự kiện hình, có thể lẫn giọng) [Ước đoán]"})
        else:
            s.append({"giay": t, "vai_tro": "pop_nhe", "gan_voi": "su_kien_hinh", "db_so_voi_nhac": 4, "nguon": "them_theo_luat_dung_video (không tách được ở mẫu)"})
    return sorted(s, key=lambda x: x["giay"])


VIET_TAY, IN = "viet_tay_nghieng (chưa rõ tên)", "sans_in (chưa rõ tên)"
DO, XANH_BIEN, XANH_DUONG, DONG, LA, TRANG = "#CE2B3F", "#25638F", "#201FF0", "#B68A48", "#2E6053", "#FFFFFF"
shots = list(zip([0.0] + CUTS, CUTS + [DUR]))
KHONG_HOST = lambda a: 11.63 <= a < 24.55 or 34.13 <= a < 44.3 or 57.47 <= a < 61.25


def broll(a, b, ly):
    return [{"giay": s0, "loai": "noi_that" if s0 > 15 else "toan", "thoi_luong": round(s1 - s0, 2), "lech_loi_s": 0, "muc_dich": "minh_hoa_loi", "ly_do": ly, "gan_loi": "lời mô tả không gian"}
            for s0, s1 in shots if a <= s0 < b and KHONG_HOST(s0)]


B = [0, 3.88, 11.63, 24.55, 34.13, 44.3, 53.6, DUR]
doan = [
    {"tu": B[0], "den": B[1], "vai_tro": "hook", "canh": {"co": "toan", "goc": "ngang, trước biệt thự", "chuyen_dong_may": "lùi theo người", "host": True},
     "loi": {"vai_tro": "3 lợi ích + câu nhử giá", "o_dien": ""},
     "chu": [chu(0.0, "loi_ich_1", IN, XANH_BIEN, (50, 22), 12, "tao_to_mo", "lợi ích pháp lý bật to ngay khung đầu, kèm chữ nhỏ viết tay"),
             chu(1.3, "loi_ich_2", IN, DO, (25, 62), 12, "tao_to_mo", "lợi ích 2 đặt sau người để chữ và người cùng khối, thấy rõ chiều sâu", True),
             chu(2.1, "cau_nhu_gia", VIET_TAY, "#C4303F", (45, 40), 18, "tao_to_mo", "chữ viết tay rất to cho từ 'giá' — mở câu nhử"),
             chu(2.6, "cau_nhu_gia_2", IN, TRANG, (45, 55), 6, "tao_to_mo", "phủ định bất ngờ, kéo người xem đợi con số")],
     "mg": [], "broll": [], "an": [], "chuyen_canh": {}},
    {"tu": B[1], "den": B[2], "vai_tro": "vi_tri", "canh": {"co": "toan", "goc": "ngang", "chuyen_dong_may": "lùi theo người", "host": True},
     "loi": {"vai_tro": "ten du an + chu dau tu + ke hoach", "o_dien": ""},
     "chu": [chu(5.4, "dinh_vi", VIET_TAY + " + " + IN, TRANG, (45, 50), 7, "dinh_vi", "cụm viết tay nhỏ rồi chữ in to: tách tầng thông tin"),
             chu(8.6, "dinh_vi_2", IN + " + " + VIET_TAY, DO, (30, 58), 10, "tao_to_mo", "số/chữ đỏ to đi cùng viết tay vàng: định vị 'không dành cho số đông'", True)],
     "mg": [mg(3.88, "logo_du_an", "logo dự án xanh đậm trên trời, giữ 4,5 s", 4.5, "dinh_vi", "logo đặt vào vùng trời trống, không che người", "tên dự án"),
            mg(7.12, "logo_chu_dau_tu", "2 logo chủ đầu tư trượt vào dưới cụm chữ", 1.3, "chung_minh_so_lieu", "uy tín chủ đầu tư đúng lúc nói tên", "chủ đầu tư")],
     "broll": [], "an": [], "chuyen_canh": {"giay": 10.6, "ma": "zoom_nhoe", "so_khung": 30, "easing": "inout"}},
    {"tu": B[2], "den": B[3], "vai_tro": "bang_chung", "canh": {"co": "chi_tiet/toan", "goc": "đa góc", "chuyen_dong_may": "trượt/xoay nhẹ", "host": False},
     "loi": {"vai_tro": "mo ta khong gian", "o_dien": ""}, "chu": [], "mg": [], "an": [],
     "broll": broll(B[2], B[3], "tour 1–3 s/cảnh để khoe vật liệu, không chữ cho mắt nghỉ sau hook dày chữ"),
     "chuyen_canh": {"giay": 11.63, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[3], "den": B[4], "vai_tro": "cam_xuc", "canh": {"co": "toan→trung", "goc": "ngang, phòng khách", "chuyen_dong_may": "lùi theo người", "host": True},
     "loi": {"vai_tro": "doi tu vat chat sang cam giac song", "o_dien": ""},
     "chu": [chu(25.0, "doi_goc_nhin", VIET_TAY + " + " + IN, DO, (40, 25), 8, "chuyen_y", "phủ định để đổi góc nhìn sang cảm xúc"),
             chu(27.4, "dan_dat", IN, TRANG, (40, 25), 5, "chuyen_y", "chữ hiện dần theo từng từ, đi cùng lời"),
             chu(29.6, "dan_dat_2", IN + " + " + VIET_TAY, LA, (40, 27), 6, "tao_to_mo", "chữ viết tay xanh lá tiệp nội thất"),
             chu(31.4, "tu_khoa", VIET_TAY, DONG, (50, 55), 7, "minh_hoa_loi", "từ khóa màu đồng đặt thấp ngang người, chốt ý", True)],
     "mg": [mg(28.4, "logo_du_an", "logo dự án lặp lại trong câu nói", 1.0, "dinh_vi", "logo thay chữ tên dự án trong câu, nhắc nhận diện", "tên dự án")],
     "broll": [], "an": [], "chuyen_canh": {"giay": 24.55, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[4], "den": B[5], "vai_tro": "bang_chung", "canh": {"co": "toan/chi_tiet", "goc": "đa góc", "chuyen_dong_may": "trượt/xoay", "host": False},
     "loi": {"vai_tro": "mo ta tang tren", "o_dien": ""}, "chu": [], "mg": [], "an": [],
     "broll": broll(B[4], B[5], "tour phòng ngủ, tủ đồ, phòng tắm: kéo dài mong đợi trước màn giá"),
     "chuyen_canh": {"giay": 34.13, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[5], "den": B[6], "vai_tro": "gia", "canh": {"co": "trung", "goc": "ngang, ngồi sofa", "chuyen_dong_may": "dung", "host": True},
     "loi": {"vai_tro": "thong so → gia", "o_dien": ""},
     "chu": [chu(44.4, "loai_nha", IN + " + " + VIET_TAY, DO, (50, 18), 7, "dinh_vi", "loại nhà ngay đầu màn thông số"),
             chu(45.6, "dien_tich_dat", IN, DONG, (50, 40), 13, "chung_minh_so_lieu", "số diện tích to gradient đồng, đặt sau đầu ngang vai (không che mặt)", True),
             chu(47.4, "dien_tich_xd", IN, "#C65B57", (50, 40), 13, "chung_minh_so_lieu", "đổi màu đỏ để phân biệt số thứ hai", True),
             chu(49.4, "so_tang", IN, TRANG, (50, 62), 3, "minh_hoa_loi", "chữ nhỏ từng ý trên người, nhịp nhanh theo lời"),
             chu(49.9, "so_lau", IN, TRANG, (50, 62), 3, "minh_hoa_loi", "như trên"),
             chu(50.4, "so_phong", IN, TRANG, (50, 62), 3, "minh_hoa_loi", "như trên"),
             chu(51.4, "dan_gia", IN, TRANG, (40, 22), 6, "tao_to_mo", "từ dẫn hiện trước số 0,7 s để tạo căng"),
             chu(52.1, "gia", IN, XANH_DUONG, (50, 40), 18, "nhan_gia", "giá lớn nhất video, màu xanh dương tương phản: trả lời câu nhử ở hook", True)],
     "mg": [], "broll": [], "an": [], "chuyen_canh": {"giay": 44.3, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[6], "den": B[7], "vai_tro": "chot", "canh": {"co": "trung/chi_tiet", "goc": "bếp + nội thất", "chuyen_dong_may": "trượt", "host": True},
     "loi": {"vai_tro": "ket + goi y tim hieu", "o_dien": ""}, "chu": [],
     "mg": [mg(61.25, "logo_ket", "logo nhà sản xuất giữa màn đen", 1.2, "keu_goi", "kết sạch bằng nhận diện đơn vị sản xuất", "kết")],
     "broll": broll(B[6], B[7], "5 cảnh ~0,75 s dồn nhịp kết"), "an": [],
     "chuyen_canh": {"giay": 53.6, "ma": "nhoe_lia", "so_khung": 10, "easing": "inout"}},
]
for d in doan:
    d["cat"] = [c for c in CUTS if d["tu"] <= c < d["den"]]
    d["sfx"] = sfx_cho([x["giay"] for x in d["chu"]] + [x["giay"] for x in d["mg"]])
    d["nhac"] = {"phach": phach(d["tu"], d["den"]), "dien_bien": dien_bien(d["tu"], d["den"]), "muc_so_voi_giong_db": None}
cnt = lambda k: sum(len(d.get(k, [])) for d in doan)
t = {"id": "TV-06", "ten": "Review biệt thự chữ động sang (viết tay + chữ in, số/giá to, logo)", "the_loai": ["review nha"],
     "nguon": {"url": "https://www.tiktok.com/@lakimmyduyen/video/7622295518382804245", "ngay_xem": "2026-10-30",
               "chi_so": "166K xem · 5.105 thích · 136 bình luận · 1.448 chia sẻ · đăng 28/03/2026 (trang video + info.json khớp)", "nhan": "XM"},
     "thong_so": {"khung": "9:16", "fps": 30, "thoi_luong": DUR, "lufs": None, "bpm": do["bpm"], "shot_tb": do["shot_tb"],
                  "su_kien_moi_giay": round((len(CUTS) + cnt("chu") + cnt("mg")) / DUR, 2)},
     "giu_chan": {"hook": "3 lợi ích bật liên tiếp trong 3,9 s, kết bằng câu nhử về giá", "open_loops": [{"mo": 2.1, "tra_loi": 52.1}],
                  "doi_nhip_moi_giay": round(DUR / 7, 1), "cao_trao": 52.1,
                  "keu_goi_theo_doi": {"giay": 61.25, "cach": "logo đơn vị sản xuất, không có lời kêu gọi theo dõi"}},
     "doan": doan,
     "su_kien_do_duoc": {"cat": len(CUTS), "chu": 18, "mg": 4, "broll": cnt("broll"), "an": 0, "chuyen_canh": 6, "sfx": cnt("sfx"),
                         "phach_manh": sum(len(d["nhac"]["phach"]) for d in doan)},
     "binh_luan": {"nguon": "trang video, đọc 30/10/2026", "nhan": "Có bình luận",
                   "khen": ["sound design được khen", "chuyển cảnh kiểu teleport được nhắc tới"], "che": ["1 bình luận chê chữ núp sau người khó đọc"]},
     "gu_dung": {"ngay": "2026-10-30", "nhan_xet": "thích kiểu này: chuyên nghiệp, cuốn hút", "luat": "chữ được đặt sau người như mẫu, chỉ không che khuôn mặt"},
     "ghi_chu_do": {"chu_do_tai": "dải 4 fps đoạn 0–12, 25–34, 44–54 s (±0,13 s); các đoạn còn lại khung 1 fps",
                    "cum_chu": "nhiều cụm hiện từng phần, đếm 1 sự kiện cho mỗi cụm; 'và', 'đang' ở 50,9–51,1 s không đếm",
                    "sfx": "chỉ giữ SFX trùng sự kiện hình ±0,15 s; còn lại Không đo được",
                    "co_pct_vi_tri": "Ước đoán trên contact sheet; màu đo pixel, gradient lấy trung vị"},
     "ket_hop": [{"dau_hieu_loi": "liệt kê lợi ích ở hook", "combo": "mỗi lợi ích 1 kiểu chữ + màu khác nhau, 1,2 s/ý, chữ in to + chữ viết tay nhỏ", "thoi_diem": "đúng từ khóa", "nguon": "https://www.tiktok.com/@lakimmyduyen/video/7622295518382804245 · 0–3,9 s"},
                 {"dau_hieu_loi": "diện tích / thông số", "combo": "số rất to sau đầu người, ngang vai, mỗi số một màu, không che mặt", "thoi_diem": "đúng số ±0,2 s", "nguon": "https://www.tiktok.com/@lakimmyduyen/video/7622295518382804245 · 45,6 / 47,4 s"},
                 {"dau_hieu_loi": "giá chào bán", "combo": "từ dẫn trắng trước 0,7 s, rồi giá to nhất video màu tương phản sau người", "thoi_diem": "đúng từ", "nguon": "https://www.tiktok.com/@lakimmyduyen/video/7622295518382804245 · 51,4–53,5 s"},
                 {"dau_hieu_loi": "tên dự án / chủ đầu tư", "combo": "logo thật đặt vùng trời trống + logo đối tác trượt vào đúng lúc nói tên", "thoi_diem": "đúng tên", "nguon": "https://www.tiktok.com/@lakimmyduyen/video/7622295518382804245 · 3,9 / 7,1 s"}],
     "diem_yeu_da_sua": ["1 bình luận chê chữ núp sau khó đọc → giữ kiểu tách nền (Dũng chốt), nhưng số/từ chính vẫn phải đọc được và không che mặt",
                         "font viết tay + logo thuộc dự án mẫu → bản Dũng dùng font trong kho có đủ dấu, logo thật của dự án Dũng"],
     "trang_thai": "Thu nghiem", "so_lan_dung": 0, "dung_cham": []}
json.dump(t, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("su_kien:", t["su_kien_do_duoc"])
