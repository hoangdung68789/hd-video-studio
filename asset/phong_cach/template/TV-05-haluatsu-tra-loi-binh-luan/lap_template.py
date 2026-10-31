# Lập template.json cho TV-05 từ số đo (do_mau/do.json + loi_whisper.srt + mốc hộp chữ đỏ 10 fps + đo pixel, 30/10/2026).
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


DO, TRANG = "#EA3F40", "#FFFCFA"   # hộp đỏ + chữ trắng, khung 35 s


def chu(t, vt, md, ly):
    return {"giay": t, "ma": "hop_do_chu_trang (mẫu)", "vai_tro": vt, "font": "sans thường (chưa rõ tên)", "co_pct": 3,
            "vi_tri_pct": [50, 75], "mau": f"{TRANG} trên hộp {DO}", "vao": "cat_cung", "ra": "cat_cung",
            "muc_dich": md, "ly_do": ly}


def sfx(t):
    return [{"giay": t, "vai_tro": "pop_nhe", "gan_voi": "chu", "db_so_voi_nhac": 4,
             "nguon": "them_theo_luat_dung_video (mẫu chỉ có giọng, không tách được)"}]


CANH = {"co": "can_trung", "goc": "ngang, nói thẳng máy, văn phòng", "chuyen_dong_may": "dung (1 cảnh liền 154,7 s)", "host": True}
B = [0, 12.2, 29.4, 49.4, 78.0, 101.4, DUR]
TINH = "1 cảnh liền không cắt; giữ chân bằng nội dung chuyên môn + tay diễn tả, chữ chỉ ở 3 ý then chốt"
doan = [
    {"tu": B[0], "den": B[1], "vai_tro": "hook", "loi": {"vai_tro": "nhac lai cau hoi cua nguoi xem", "o_dien": ""},
     "chu": [chu(0.0, "tieu_de_cau_hoi", "tao_to_mo", "câu hỏi tóm 1 dòng hiện ngay từ đầu, khớp thẻ bình luận — người cùng hoàn cảnh dừng xem")],
     "mg": [{"giay": 0.0, "ma": "the_tra_loi_binh_luan", "mo_ta": "thẻ bình luận trắng của người hỏi ở góc trên, suốt video", "thoi_luong": DUR,
             "muc_dich": "dinh_vi", "ly_do": "dạng 'trả lời bình luận': chứng minh câu hỏi thật, kéo người hỏi + người cùng hoàn cảnh", "gan_loi": "toàn video", "ket_hop": ["tiêu đề câu hỏi"]}],
     "sfx": sfx(0.0)},
    {"tu": B[1], "den": B[2], "vai_tro": "phan_tich_tinh_huong", "loi": {"vai_tro": "hai cach thuong gap (chuyen nhuong / uy quyen)", "o_dien": ""},
     "chu": [], "mg": [], "sfx": [], "ly_do_tinh": TINH},
    {"tu": B[2], "den": B[3], "vai_tro": "can_cu_phap_ly", "loi": {"vai_tro": "dan dieu khoan", "o_dien": ""},
     "chu": [chu(29.4, "trich_dan_luat", "chung_minh_so_lieu", "điều khoản hiện suốt lúc nói (20 s) để người xem chụp màn hình/ghi lại — tăng lưu")],
     "mg": [], "sfx": sfx(29.4)},
    {"tu": B[3], "den": B[4], "vai_tro": "huong_dan", "loi": {"vai_tro": "cac buoc nop ho so", "o_dien": ""},
     "chu": [], "mg": [], "sfx": [], "ly_do_tinh": TINH},
    {"tu": B[4], "den": B[5], "vai_tro": "giai_phap", "loi": {"vai_tro": "loi khuyen chinh: khoi kien + de nghi ngan chan", "o_dien": ""},
     "chu": [chu(78.0, "giai_phap_chinh", "chung_minh_so_lieu", "lời khuyên quan trọng nhất hiện đúng lúc nói, giữ 23 s — trả lời câu hỏi ở hook")],
     "mg": [], "sfx": sfx(78.0)},
    {"tu": B[5], "den": B[6], "vai_tro": "chot", "loi": {"vai_tro": "truong hop khac + ket", "o_dien": ""},
     "chu": [], "mg": [], "sfx": [], "ly_do_tinh": TINH},
]
for d in doan:
    d.update({"canh": CANH, "broll": [], "an": [], "cat": [], "chuyen_canh": {}})
    d["nhac"] = {"phach": [], "dien_bien": dien_bien(d["tu"], d["den"]), "muc_so_voi_giong_db": None}
cnt = lambda k: sum(len(d.get(k, [])) for d in doan)
t = {"id": "TV-05", "ten": "Luật sư trả lời bình luận (1 cảnh liền, chữ ở 3 ý then chốt)", "the_loai": ["phap ly", "q&a"],
     "nguon": {"url": "https://www.tiktok.com/@haluatsu/video/7223355603610012934", "ngay_xem": "2026-10-30",
               "chi_so": "251K xem · 5,1K thích · 156 bình luận · 667 chia sẻ · đăng 18/04/2023 (video.info.json)", "nhan": "XM"},
     "thong_so": {"khung": "9:16", "fps": 30, "thoi_luong": DUR, "lufs": None, "bpm": None, "shot_tb": DUR,
                  "su_kien_moi_giay": round((cnt("chu") + cnt("mg")) / DUR, 3)},
     "giu_chan": {"hook": "thẻ bình luận thật + câu hỏi tóm 1 dòng ngay giây 0",
                  "open_loops": [{"mo": 0.0, "tra_loi": 78.0}], "doi_nhip_moi_giay": round(DUR / 6, 1), "cao_trao": 78.0,
                  "keu_goi_theo_doi": {"giay": 101.4, "cach": "không kêu gọi; dạng trả lời bình luận mời người xem hỏi tiếp [Ước đoán]"}},
     "doan": doan,
     "su_kien_do_duoc": {"cat": 0, "chu": 3, "mg": 1, "broll": 0, "an": 0, "chuyen_canh": 0, "sfx": cnt("sfx"), "phach_manh": 0},
     "ghi_chu_do": {"cat": "0 cú cắt (scene > 0,3)", "chu_do_tai": "mặt nạ màu đỏ 10 fps vùng y 60–90 %: 0–12,2 · 29,4–49,4 · 78,0–101,4 s",
                    "sfx": "294 sự kiện âm đều là giọng nói; không có nhạc nền rõ (BPM đo được là nhịp giọng, bỏ)",
                    "loi": "whisper large-v3 114 câu — chỉ dùng vai trò"},
     "ket_hop": [{"dau_hieu_loi": "câu hỏi của người xem (Q&A)", "combo": "thẻ bình luận thật góc trên suốt video + câu hỏi tóm 1 dòng dưới khung",
                  "thoi_diem": "giây 0", "nguon": "https://www.tiktok.com/@haluatsu/video/7223355603610012934 · 0–12 s"},
                 {"dau_hieu_loi": "dẫn điều luật / lời khuyên chính", "combo": "chữ hiện suốt lúc nói (20 s+) để chụp màn hình; bản Dũng: không hộp, chữ viền/bóng + pop nhẹ",
                  "thoi_diem": "đúng câu ±0,2 s", "nguon": "https://www.tiktok.com/@haluatsu/video/7223355603610012934 · 29,4 / 78,0 s"}],
     "diem_yeu_da_sua": ["mẫu dùng hộp đỏ sau chữ → bản Dũng bỏ nền hộp (luật), giữ màu đỏ #EA3F40 làm màu chữ nhấn/viền",
                         "1 cảnh 154 s không đổi nhịp, không nhạc → bản Dũng thêm nhạc nền nhẹ (luật luôn có BGM) và b-roll giấy tờ ở đoạn dài không chữ",
                         "câu trả lời chính đến ở 50 % thời lượng → bản Dũng đưa sớm hơn hoặc hứa ở hook"],
     "trang_thai": "Thu nghiem", "so_lan_dung": 0, "dung_cham": []}
json.dump(t, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("su_kien:", t["su_kien_do_duoc"])
