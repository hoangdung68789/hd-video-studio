# Lập template.json cho TV-02 từ số đo (do_mau/do.json + dải chữ 4 fps + SFX Antigravity + đo pixel, 30/10/2026).
# Dùng: python lap_template.py do_mau/do.json template.json
import json, sys
import numpy as np

do = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
DUR, CUTS, BEATS, LOUD = do["thoi_luong"], do["cat"], do["phach"], do["do_to_05s_db"]


def dien_bien(a, b):
    """cùng hàm TV-01: so độ to nửa đầu / nửa sau đoạn"""
    x = LOUD[int(a * 2):max(int(a * 2) + 2, int(b * 2))]
    h = len(x) // 2
    d = np.mean(x[h:]) - np.mean(x[:h])
    return "len" if d > 1.5 else "ha" if d < -1.5 else "giu"


def phach(a, b):
    return [c for c in CUTS if a <= c < b and BEATS and min(abs(c - x) for x in BEATS) <= 0.08]


# SFX đo thật (Antigravity listen_video_sfx, 48 kHz, đã loại phách nhạc) — đỉnh, vai, dB trên nhạc
SFX_DO = [(0.06, "click_go_chu", 7.7), (0.3, "man_trap", 6.0), (0.8, "man_trap", 9.6), (1.1, "riser_ngan", 5.6),
          (1.5, "riser_ngan", 8.7), (1.9, "riser_ngan", 6.3), (2.28, "riser_ngan", 11.1), (2.52, "click_go_chu", 9.9),
          (11.04, "riser_ngan", 4.1), (29.76, "hit_nhan", 4.0), (30.16, "hit_nhan", 4.5), (47.34, "riser_ngan", 4.0),
          (47.78, "click_go_chu", 4.3)]
CHU_TRANG = "#FDFBFB"   # trung vị pixel chữ, khung 25 s; viền/bóng đen #010000


def chu(t, vt, md, ly, pos=(50, 15), co=4.5):
    return {"giay": t, "ma": "go_chu_trang_vien_den", "vai_tro": vt, "font": "sans đậm nét tròn (chưa rõ tên)",
            "co_pct": co, "vi_tri_pct": list(pos), "mau": CHU_TRANG, "vao": "go_chu ~0,5s", "ra": "cat_cung theo canh",
            "muc_dich": md, "ly_do": ly}


def sfx_cho(a, b, chu_ts):
    """SFX đo được trong đoạn + SFX gõ chữ bổ sung theo luật /dung-video cho chữ mẫu không có SFX"""
    s = [{"giay": t, "vai_tro": v, "gan_voi": "chu" if "click" in v or "hit" in v else "chuyen_canh",
          "db_so_voi_nhac": db, "nguon": "do_mau"} for t, v, db in SFX_DO if a <= t < b]
    for c in chu_ts:
        if not any(abs(c - x["giay"]) <= 0.15 for x in s):
            s.append({"giay": c, "vai_tro": "click_go_chu", "gan_voi": "chu", "db_so_voi_nhac": 4,
                      "nguon": "them_theo_luat_dung_video (mẫu im)"})
    return sorted(s, key=lambda x: x["giay"])


def br(t, loai, d, ly):
    return {"giay": t, "loai": loai, "thoi_luong": d, "lech_loi_s": 0, "muc_dich": "minh_hoa_loi", "ly_do": ly,
            "gan_loi": "nhan_moc_gio (không lời)"}


B = [0, 3.0, 15.5, 29.7, 41.2, 43.8, DUR]
L_TIEU_DE = "nhãn mốc giờ gõ chữ ngay đầu cảnh mới để người xem biết đang ở khoảnh khắc nào trong ngày — thay lời dẫn"
doan = [
    {"tu": B[0], "den": B[1], "vai_tro": "hook",
     "canh": {"co": "trung", "goc": "ngang/selfie", "chuyen_dong_may": "cam_tay", "host": True},
     "chu": [chu(0.38, "tieu_de_hook", "tao_to_mo", "tiêu đề + dòng phụ dạng câu hỏi gõ ra ngay 0,4s: hứa hẹn 'xem 1 ngày của sale BĐS' (câu nhử)", (50, 22), 7)],
     "broll": [], "an": [], "mg": [],
     "chuyen_canh": {"giay": 0.4, "ma": "cat_nhanh_man_trap", "so_khung": 0, "easing": ""},
     "ly_do_dung": "montage 8 cảnh trong 3 s (shot 0,25–0,7 s), mỗi cú cắt có màn trập/riser ngắn — teaser cả ngày"},
    {"tu": B[1], "den": B[2], "vai_tro": "mo_bai",
     "canh": {"co": "toan/trung", "goc": "ngang", "chuyen_dong_may": "dung (máy đặt cố định)", "host": True},
     "chu": [chu(3.12, "moc_gio", "dinh_vi", L_TIEU_DE), chu(4.12, "moc_gio", "dinh_vi", L_TIEU_DE)],
     "broll": [], "an": [], "mg": [],
     "chuyen_canh": {"giay": 13.4, "ma": "dip_den", "so_khung": 6, "easing": "cat"},
     "ly_do_dung": "đoạn thay đồ 8 s một góc máy: giữ chân bằng thay trang phục liên tục (biến đổi trong khung)"},
    {"tu": B[2], "den": B[3], "vai_tro": "bang_chung",
     "canh": {"co": "trung/toan", "goc": "ngang, đi theo", "chuyen_dong_may": "cam_tay theo người", "host": True},
     "chu": [chu(15.62, "moc_gio", "dinh_vi", L_TIEU_DE), chu(23.12, "moc_gio_2_dong", "dinh_vi", "nhãn 2 dòng nêu tên dự án khi vào buổi training — chứng minh công việc thật", (50, 15), 4.5)],
     "broll": [br(22.4, "chi_tiet", 0.6, "cận máy chấm công vân tay: chi tiết 'đi làm đúng giờ' thay lời"),
               br(23.02, "toan", 1.56, "toàn cảnh hội trường đông người mở mốc training — cho thấy quy mô dự án")],
     "an": [], "mg": [], "chuyen_canh": {"giay": 15.5, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[3], "den": B[4], "vai_tro": "bang_chung",
     "canh": {"co": "trung", "goc": "ngang", "chuyen_dong_may": "dung/cam_tay", "host": True},
     "chu": [chu(29.88, "moc_gio", "dinh_vi", "nhãn telesale đi cùng SFX hit 29,76 s đúng cú cắt — đổi nhịp giữa video"),
             chu(32.88, "moc_gio", "dinh_vi", L_TIEU_DE)],
     "broll": [br(36.83, "chi_tiet", 1.54, "cận sa bàn dự án khi dẫn khách xem nhà mẫu — bằng chứng sản phẩm")],
     "an": [], "mg": [], "chuyen_canh": {"giay": 29.73, "ma": "cut_hit", "so_khung": 0, "easing": ""}},
    {"tu": B[4], "den": B[5], "vai_tro": "cao_trao",
     "canh": {"co": "chi_tiet", "goc": "từ trên", "chuyen_dong_may": "cam_tay", "host": False},
     "chu": [chu(41.38, "chu_thich_hanh_dong", "chung_minh_so_lieu", "chú thích nhỏ giữa khung + emoji tay viết: kết quả của ngày (chốt cọc) — trả lời câu nhử", (50, 18), 3.5)],
     "broll": [br(41.18, "chi_tiet", 1.67, "cận tay viết giá + giấy chốt cọc: cao trào 'có khách chốt'")],
     "an": [], "mg": [], "chuyen_canh": {"giay": 41.18, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[5], "den": B[6], "vai_tro": "chot",
     "canh": {"co": "trung", "goc": "selfie gương thang máy / theo sau", "chuyen_dong_may": "cam_tay", "host": True},
     "chu": [chu(43.88, "moc_gio", "dinh_vi", L_TIEU_DE, (50, 22)), chu(44.88, "moc_gio_2_dong", "chuyen_y", "chuyển sang đời sống cá nhân (pickleball) — kết mềm, tạo thiện cảm", (50, 22), 3.5)],
     "broll": [], "an": [], "mg": [], "chuyen_canh": {"giay": 43.8, "ma": "cut", "so_khung": 0, "easing": ""}},
]
for d in doan:
    d["cat"] = [c for c in CUTS if d["tu"] <= c < d["den"]]
    d["sfx"] = sfx_cho(d["tu"], d["den"], [c["giay"] for c in d["chu"]])
    d["nhac"] = {"phach": phach(d["tu"], d["den"]), "dien_bien": dien_bien(d["tu"], d["den"]), "muc_so_voi_giong_db": None}
    d["loi"] = {"vai_tro": "khong_loi (whisper: 0 câu)", "o_dien": ""}
cnt = lambda k: sum(len(d.get(k, [])) for d in doan)
t = {"id": "TV-02", "ten": "Vlog 1 ngày đi làm của sale BĐS (nhãn mốc giờ gõ chữ, không lời)", "the_loai": ["vlog"],
     "nguon": {"url": "https://www.tiktok.com/@_honghanhbds/video/7628195579390102804", "ngay_xem": "2026-10-30",
               "chi_so": "394,7K xem · 9,4K thích · 183 bình luận · 1,3K chia sẻ · đăng 13/04/2026 (video.info.json)", "nhan": "XM"},
     "thong_so": {"khung": "9:16", "fps": 30, "thoi_luong": DUR, "lufs": None, "bpm": do["bpm"], "shot_tb": do["shot_tb"],
                  "su_kien_moi_giay": round((len(CUTS) + cnt("chu") + cnt("broll")) / DUR, 2)},
     "giu_chan": {"hook": "montage 8 cảnh/3 s + tiêu đề câu hỏi gõ chữ + màn trập theo cú cắt",
                  "open_loops": [{"mo": 0.38, "tra_loi": 41.38}], "doi_nhip_moi_giay": round(DUR / len(B[1:]), 1),
                  "cao_trao": 41.18,
                  "keu_goi_theo_doi": {"giay": 44.88, "cach": "không có lời kêu gọi; kết bằng đời sống cá nhân để tạo thiện cảm [Ước đoán]"}},
     "doan": doan,
     "su_kien_do_duoc": {"cat": len(CUTS), "chu": 10, "mg": 0, "broll": 4, "an": 0, "chuyen_canh": 6,
                         "sfx": cnt("sfx"), "phach_manh": sum(len(d["nhac"]["phach"]) for d in doan)},
     "ghi_chu_do": {"sfx_mau_do_that": len(SFX_DO), "sfx_them_theo_luat": cnt("sfx") - len(SFX_DO),
                    "chu_do_tai": "dải 4 fps vùng y 6–26 % (do_mau/chu_4fps.jpg), sai số ±0,13 s",
                    "loi": "whisper large-v3 (Antigravity) ra 0 câu → video chỉ nhạc"},
     "ket_hop": [{"dau_hieu_loi": "chuyển sang việc/khoảnh khắc mới trong ngày", "combo": "cú cắt + nhãn mốc giờ trắng viền đen gõ chữ ~0,5 s ở y≈15 % + click gõ phím",
                  "thoi_diem": "+0,1–0,3 s sau cú cắt", "nguon": "https://www.tiktok.com/@_honghanhbds/video/7628195579390102804 · 3,1/15,6/23,1/29,9/32,9 s"},
                 {"dau_hieu_loi": "hook mở video dạng nhật ký", "combo": "8 cảnh cắt 0,25–0,7 s + màn trập/riser ngắn mỗi cắt + tiêu đề 2 tầng (chữ to + dòng phụ câu hỏi)",
                  "thoi_diem": "0–3 s", "nguon": "https://www.tiktok.com/@_honghanhbds/video/7628195579390102804 · 0–3 s"},
                 {"dau_hieu_loi": "kết quả / chốt khách", "combo": "b-roll cận tay viết giấy cọc + chú thích nhỏ giữa khung + emoji",
                  "thoi_diem": "đúng cú cắt +0,2 s", "nguon": "https://www.tiktok.com/@_honghanhbds/video/7628195579390102804 · 41,2–42,8 s"}],
     "diem_yeu_da_sua": ["mẫu chỉ 3/10 lần chữ có SFX → thêm click gõ chữ theo luật /dung-video (ghi nguon)",
                         "mẫu đặt '16h tan làm' trước '15h pickleball' (sai thứ tự giờ) → áp cho Dũng giữ đúng thứ tự thời gian",
                         "nhãn mốc giờ ở y≈15 % nằm trong vùng an toàn TikTok trên; tiêu đề hook y≈22 % OK",
                         "đoạn 6h30 dài 11 s một góc máy — bản Dũng chia ≤4 s/cảnh (luật nhịp)"],
     "trang_thai": "Thu nghiem", "so_lan_dung": 0, "dung_cham": []}
json.dump(t, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("doan:", [(d["vai_tro"], d["nhac"]["dien_bien"], len(d["cat"]), len(d["chu"]), len(d["sfx"])) for d in doan])
print("su_kien:", t["su_kien_do_duoc"])
