# Lập template.json cho TV-04 từ số đo (do_mau/do.json + do_mau/sfx.json + loi_whisper.srt + mốc chữ xanh ngọc 10 fps + đo pixel, 30/10/2026).
# Dùng: python lap_template.py do_mau/do.json template.json
import json, sys
import numpy as np

do = json.load(open(sys.argv[1], encoding="utf-8"))
out = sys.argv[2]
DUR, CUTS, BEATS, LOUD = do["thoi_luong"], do["cat"], do["phach"], do["do_to_05s_db"]
EV = json.load(open("do_mau/sfx.json", encoding="utf-8"))["sfx_timeline_events"]   # 119 sự kiện, lẫn giọng nói


def dien_bien(a, b):
    x = LOUD[int(a * 2):max(int(a * 2) + 2, int(b * 2))]
    h = len(x) // 2
    d = np.mean(x[h:]) - np.mean(x[:h])
    return "len" if d > 1.5 else "ha" if d < -1.5 else "giu"


def phach(a, b):
    return [c for c in CUTS if a <= c < b and BEATS and min(abs(c - x) for x in BEATS) <= 0.08]


XANH, TRANG = "#00F8ED", "#FFFCF8"   # khung 20 s


def chu(t, vt, md, ly, pos=(45, 55)):
    return {"giay": t, "ma": "tieu_de_2_tang_xanh_trang", "vai_tro": vt, "font": "sans đậm in hoa (chưa rõ tên)", "co_pct": 4,
            "vi_tri_pct": list(pos), "mau": f"{XANH} dòng 1 / {TRANG} dòng 2", "vao": "pop từng dòng lệch ~0,2 s",
            "ra": "cat_cung ~2–2,5 s", "muc_dich": md, "ly_do": ly}


SU_KIEN_HINH = []   # gom mốc mọi sự kiện hình để ghép SFX đo được


def sfx_cho(a, b, ts):
    s = []
    for t in ts:
        e = min(EV, key=lambda e: abs(e["peak_s"] - t))
        if abs(e["peak_s"] - t) <= 0.15:
            s.append({"giay": e["peak_s"], "vai_tro": e["acoustic_class"], "gan_voi": "su_kien_hinh",
                      "db_so_voi_nhac": e["db_above_music"], "nguon": "do_mau (trùng sự kiện hình, có thể lẫn giọng) [Ước đoán]"})
        else:
            s.append({"giay": t, "vai_tro": "pop_nhe", "gan_voi": "su_kien_hinh", "db_so_voi_nhac": 4,
                      "nguon": "them_theo_luat_dung_video (không tách được ở mẫu)"})
    return sorted(s, key=lambda x: x["giay"])


Q = "câu hỏi phỏng vấn hiện 2 tầng xanh/trắng đúng lúc người hỏi nói — người xem tắt tiếng vẫn biết đang ở câu mấy"
B = [0, 6.47, 19.0, 31.2, 40.4, 61.4, DUR]
doan = [
    {"tu": B[0], "den": B[1], "vai_tro": "hook",
     "canh": {"co": "trung", "goc": "ngang, host nói thẳng máy", "chuyen_dong_may": "cam_tay", "host": True},
     "loi": {"vai_tro": "gioi_thieu_series + nhan_vat", "o_dien": ""},
     "chu": [chu(0.1, "ten_series", "tao_to_mo", "tên series 'phỏng vấn best seller' ngay khung đầu + pháo giấy: hứa hẹn nhân vật giỏi", (35, 58))],
     "mg": [{"giay": 4.16, "ma": "anh_chen_pip", "mo_ta": "ảnh nhân vật chèn khung nhỏ dưới-phải", "thoi_luong": 0.6,
             "muc_dich": "minh_hoa_loi", "ly_do": "giới thiệu khách mời bằng ảnh khi host nhắc tên", "gan_loi": "giới thiệu khách mời", "ket_hop": ["whoosh +12 dB"]}],
     "broll": [{"giay": 4.73, "loai": "meme_phan_ung", "thoi_luong": 1.74, "lech_loi_s": 0, "muc_dich": "doi_nhip_giu_chan",
                "ly_do": "chèn mặt meme cười toàn màn hình ngay sau lời khen — gây cười, đổi nhịp ở giây 5", "gan_loi": "lời khen khách mời"}],
     "an": [], "chuyen_canh": {"giay": 0.0, "ma": "mo_dau_phao_giay", "so_khung": 0, "easing": ""}},
    {"tu": B[1], "den": B[2], "vai_tro": "mo_bai",
     "canh": {"co": "toan", "goc": "ngang, nhà mẫu", "chuyen_dong_may": "cam_tay theo host", "host": True},
     "loi": {"vai_tro": "chao + xin hoi 4 cau", "o_dien": ""}, "chu": [],
     "mg": [{"giay": 11.4, "ma": "the_poster_du_an", "mo_ta": "poster dự án/thành tích chèn góc trên-phải", "thoi_luong": 1.4,
             "muc_dich": "chung_minh_so_lieu", "ly_do": "khi host nhắc thành tích khách mời, hiện bằng chứng (poster) thay lời", "gan_loi": "thành tích bán hàng", "ket_hop": []}],
     "broll": [], "an": [], "chuyen_canh": {"giay": 6.47, "ma": "pixel_mosaic", "so_khung": 6, "easing": "cat"}},
    {"tu": B[2], "den": B[3], "vai_tro": "cau_hoi_1",
     "canh": {"co": "trung/can", "goc": "ngang, 2 người", "chuyen_dong_may": "dung", "host": True},
     "loi": {"vai_tro": "hoi: khach den tu dau → tra loi: kenh TikTok", "o_dien": ""},
     "chu": [chu(19.0, "cau_hoi", "chuyen_y", Q)],
     "mg": [{"giay": 24.56, "ma": "anh_chup_kenh", "mo_ta": "ảnh chụp trang hồ sơ kênh chèn góc trên-phải", "thoi_luong": 6.2,
             "muc_dich": "chung_minh_so_lieu", "ly_do": "câu trả lời 'khách từ kênh' được chứng minh bằng ảnh kênh thật", "gan_loi": "kênh bán hàng", "ket_hop": ["whoosh +14 dB"]}],
     "broll": [], "an": [], "chuyen_canh": {"giay": 19.0, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[3], "den": B[4], "vai_tro": "cau_hoi_2",
     "canh": {"co": "trung", "goc": "ngang, 2 người", "chuyen_dong_may": "dung", "host": True},
     "loi": {"vai_tro": "hoi: tai sao chon du an → gia hop ly, o hay dau tu", "o_dien": ""},
     "chu": [chu(31.2, "cau_hoi", "chuyen_y", Q),
             chu(35.2, "y_tra_loi", "nhan_gia", "ý chính câu trả lời (giá) hiện cùng kiểu câu hỏi — tóm tắt cho người lướt"),
             chu(38.3, "cau_hoi_phu", "tao_to_mo", "câu hỏi phụ hiện ngay để nối mạch")],
     "mg": [], "broll": [], "an": [], "chuyen_canh": {"giay": 30.8, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[4], "den": B[5], "vai_tro": "cau_hoi_3",
     "canh": {"co": "trung", "goc": "ngang, 2 người", "chuyen_dong_may": "dung", "host": True},
     "loi": {"vai_tro": "hoi: kho khan khi chot → chot trong ngay, 1/3 khach", "o_dien": ""},
     "chu": [chu(40.4, "cau_hoi", "chuyen_y", Q),
             chu(46.4, "y_tra_loi", "nhan_gia", "ý ấn tượng nhất (chốt trong ngày) được nhấn bằng chữ + sticker tiền")],
     "an": [{"giay": 47.16, "loai": "icon", "vi_tri_pct": [40, 60], "mau": "ảnh tiền", "vao": "pop bay", "ra": "cat_cung", "co_sfx": True,
             "muc_dich": "nhan_gia", "ly_do": "minh họa 'chốt nhanh = tiền về' đúng câu trả lời", "gan_loi": "chốt trong ngày"},
            {"giay": 50.86, "loai": "icon", "vi_tri_pct": [50, 65], "mau": "3 avatar hoạt hình", "vao": "pop lần lượt", "ra": "cat_cung", "co_sfx": True,
             "muc_dich": "chung_minh_so_lieu", "ly_do": "minh họa tỉ lệ '1 trong 3 khách' bằng 3 hình người", "gan_loi": "tỉ lệ khách"}],
     "mg": [], "broll": [], "chuyen_canh": {"giay": 39.17, "ma": "cut", "so_khung": 0, "easing": ""}},
    {"tu": B[5], "den": B[6], "vai_tro": "cau_hoi_4_chot",
     "canh": {"co": "trung", "goc": "ngang, 2 người → bắt tay", "chuyen_dong_may": "dung", "host": True},
     "loi": {"vai_tro": "loi khuyen cho sale → cam on, bat tay", "o_dien": ""},
     "chu": [chu(61.4, "cau_hoi", "chuyen_y", Q, (45, 25)),
             chu(69.8, "y_tra_loi", "keu_goi", "câu đúc kết thành khẩu hiệu — đoạn dễ chia sẻ", (45, 25))],
     "mg": [], "broll": [], "an": [], "chuyen_canh": {"giay": 60.8, "ma": "cut", "so_khung": 0, "easing": ""}},
]
for d in doan:
    ts = [c["giay"] for c in d["chu"]] + [m["giay"] for m in d["mg"]] + [a["giay"] for a in d["an"]]
    d["cat"] = [c for c in CUTS if d["tu"] <= c < d["den"]]
    d["sfx"] = sfx_cho(d["tu"], d["den"], ts)
    d["nhac"] = {"phach": phach(d["tu"], d["den"]), "dien_bien": dien_bien(d["tu"], d["den"]), "muc_so_voi_giong_db": None}
cnt = lambda k: sum(len(d.get(k, [])) for d in doan)
t = {"id": "TV-04", "ten": "Phỏng vấn sale giỏi 4 câu hỏi (tiêu đề câu hỏi 2 tầng xanh/trắng)", "the_loai": ["q&a", "chia se"],
     "nguon": {"url": "https://www.tiktok.com/@quyettranlux/video/7558268872336362759", "ngay_xem": "2026-10-30",
               "chi_so": "379,8K xem · 13K thích · 85 bình luận · 690 chia sẻ · đăng 07/10/2025 (video.info.json)", "nhan": "XM"},
     "thong_so": {"khung": "9:16", "fps": 30, "thoi_luong": DUR, "lufs": None, "bpm": do["bpm"], "shot_tb": do["shot_tb"],
                  "su_kien_moi_giay": round((len(CUTS) + cnt("chu") + cnt("mg") + cnt("an") + cnt("broll")) / DUR, 2)},
     "giu_chan": {"hook": "tên series 'best seller' + pháo giấy + ảnh khách mời + meme cười trong 6,5 s",
                  "open_loops": [{"mo": 13.8, "tra_loi": 69.8}], "doi_nhip_moi_giay": round(DUR / 9, 1), "cao_trao": 46.4,
                  "keu_goi_theo_doi": {"giay": 76.0, "cach": "bắt tay cảm ơn, không kêu gọi; 'series' ở hook gợi theo dõi tập sau [Ước đoán]"}},
     "doan": doan,
     "su_kien_do_duoc": {"cat": len(CUTS), "chu": 9, "mg": 3, "broll": 1, "an": 2, "chuyen_canh": 6,
                         "sfx": cnt("sfx"), "phach_manh": sum(len(d["nhac"]["phach"]) for d in doan)},
     "ghi_chu_do": {"sfx": "119 sự kiện âm lẫn giọng nói; chỉ giữ cái trùng sự kiện hình ±0,15 s",
                    "chu_do_tai": "mặt nạ màu xanh ngọc 10 fps (vùng y 12–75 %); MG/AN đo trên khung 1 fps + đỉnh SFX",
                    "loi": "whisper large-v3 53 câu, nhiều từ xác suất thấp — chỉ dùng vai trò"},
     "ket_hop": [{"dau_hieu_loi": "câu hỏi phỏng vấn / chuyển ý", "combo": "tiêu đề 2 tầng: dòng 1 xanh ngọc #00F8ED + dòng 2 trắng in hoa, pop lệch 0,2 s, giữa-trái khung, không nền hộp",
                  "thoi_diem": "đúng lúc người hỏi bắt đầu câu", "nguon": "https://www.tiktok.com/@quyettranlux/video/7558268872336362759 · 19/31,2/40,4/61,4 s"},
                 {"dau_hieu_loi": "nhắc kênh / thành tích / bằng chứng", "combo": "ảnh chụp thật (hồ sơ kênh, poster) chèn góc trên-phải + whoosh",
                  "thoi_diem": "+0,5 s sau từ khóa", "nguon": "https://www.tiktok.com/@quyettranlux/video/7558268872336362759 · 11,4 / 24,6 s"},
                 {"dau_hieu_loi": "tỉ lệ / con số người", "combo": "icon người hoạt hình pop lần lượt giữa khung + pop/whoosh",
                  "thoi_diem": "đúng câu nói", "nguon": "https://www.tiktok.com/@quyettranlux/video/7558268872336362759 · 50,9 s"}],
     "diem_yeu_da_sua": ["meme khuôn mặt người thật khác (bản quyền chân dung) → bản Dũng thay bằng phản ứng của chính người dẫn hoặc bỏ",
                         "chuyển cảnh pixel mosaic giữ nguyên được (không phải punch-in)",
                         "SFX không tách khỏi giọng → SFX thêm theo luật ghi rõ nguon"],
     "trang_thai": "Thu nghiem", "so_lan_dung": 0, "dung_cham": []}
json.dump(t, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("doan:", [(d["vai_tro"], len(d["cat"]), len(d["chu"]), len(d["sfx"])) for d in doan])
print("su_kien:", t["su_kien_do_duoc"])
