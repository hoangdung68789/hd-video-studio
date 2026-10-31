# project.py — FILE DUY NHẤT cần sửa cho một video review BĐS mới (mẫu dựng từ DU-AN-MAU, Dũng duyệt 26/10/2026).
# Giá trị bên dưới là VÍ DỤ của dự án DU-AN-MAU: thay bằng dữ liệu dự án mới (xem README.md).
from pathlib import Path

NAME = "DU-AN-MAU"                                   # tên dự án (dùng làm seed SFX, tên file xuất)

# ---- nguồn
FOOTAGE = Path(r"~\Downloads\DU-AN-MAU")              # b-roll DJI_*_<id>_D.MP4 (D-Log)
HOSTDIR = Path(r"~\Downloads\DU-AN-MAU\Nguoi dan 2 - Ao polo xam")  # mỗi clip người dẫn 1 thư mục + .srt
MUSIC_SRC = Path(r"~\Downloads\Savetik_1792933495.mp4")         # file lấy nhạc nền
HOSTS = ["0654", "0644", "0676", "0697", "0706"]              # clip người dẫn, theo thứ tự xuất hiện

# ---- màu: mặc định dùng LUT đã duyệt (D-Log -> màu CapCut của Dũng). Chỉ khi Dũng gửi bản CapCut đã chỉnh màu
#      của chính footage mới thì điền LUT_REF + LUT_CUTS + LUT_ORDER rồi chạy fit_lut.py / clip_trims.py.
MASTER_LUT = "luts/DLog_CapCut_Dung.cube"
LUT_REF = r"E:\CapCut\818.mp4"
LUT_CUTS = [0, 6.1, 13.466667, 21.766667, 29.766667, 36.466667, 40.866667, 45.933333, 58.133333,
            67.766667, 80.033333, 90.266667, 101.733333, 111.333333, 120.133333, 128.366667,
            136.333333, 157.4, 165.766667, 185.1, 202.533333, 215.5]
LUT_ORDER = ["0702", "0701", "0700", "0684", "0683", "0679", "0673", "0666", "0663", "0626", "0625",
             "0624", "0619", "0618", "0615", "0614", "0644", "0654", "0676", "0697", "0706"]
LUT_SKIP = {"0666"}

# ---- che số nhà (giai đoạn 2b): clip có bảng số nhà -> khung (x, y, w, h) tại khung hình START
BLUR = {"0614": {"start": 15, "boxes": {"plaque_L": [606, 2030, 54, 64], "plaque_R": [1036, 2094, 40, 40]}}}

# ---- lời: chỗ SRT + whisper cùng nghe sai (Dũng sửa) và khoảng rà lặng/vấp cho voice_audit.py
WORD_FIX = {"0654": (["Và", "rồi"], ["Tuyệt vời", "luôn"])}
VOICE_AUDIT_RANGES = {"0654": [(0.0, 6.25)], "0644": [(0.0, 18.15)], "0676": [(0.0, 17.45)],
                      "0697": [(0.70, 7.93), (8.85, 14.85)], "0706": [(0.0, 12.2)]}

# ---------------------------------------------------------------- sections
# voice pieces: (clip, media_in, media_out); shots: (src, beats) with src "H" = host lip-sync, "MAP", or (clip, media_start)
SECTIONS = [
    # order set by Dũng (26/10): 0654 opens, 0644 over the ground floor, kitchen 0676, bedroom 0697, CTA 0706.
    # Each speech section is followed by a music-only bridge of 2 long shots on a strong part of the song (Dũng 26/10);
    # b-roll shots ≥8 beats (~4.8s, Dũng 26/10: +2–3s) so viewers can take in the house. Voice pieces drop pauses / drawn-out hesitations
    # found by voice_audit.py (see work/cutlist.md).
    # Dũng 26/10: presenter takes run uncut (hook 0654, CTA 0706); every b-roll clip is used ONCE,
    # as one continuous ~5s piece (8–10 beats), so the interior details can be seen.
    {"id": "hook", "host": "0654", "voice": [(0.0, 6.08)], "beats": 11, "shots": [("H", 11)]},
    # Dũng 26/10: 0625 (walk through the living room) removed; street in front of the house (neighbours + wide road) instead
    {"id": "br1", "beats": 16, "shots": [(("0614", 0.4), 8), (("0624", 2.54), 8)]},   # v2 per Dũng's Studio trim: 11.32 / 5.12s / media 2.18
    {"id": "A", "host": "0644", "voice": [(0.0, 12.65), (12.85, 14.17), (15.12, 17.75)], "beats": 29, "shots": [
        ("H", 4), (("0615", 0.3), 11), (("0626L", 0.3), 8), ("MAP", 6)]},   # 0626L = 0626 graded in the old project (Dũng 26/10)
    # kitchen = Dũng's camera pans only, ≥5s each (26/10): 0663 whole pan on the music, 0666 pan under the kitchen lines
    {"id": "br2", "beats": 16, "shots": [(("0663", 0.0), 16)]},
    {"id": "C", "host": "0676", "voice": [(0.0, 5.4), (6.12, 6.95), (8.0, 17.45)], "beats": 27, "shots": [
        ("H", 4), (("0666", 3.5), 14), ("H", 9)]},
    {"id": "br3", "beats": 16, "shots": [(("0700", 0.3), 8), (("0701", 0.2), 8)]},
    {"id": "D", "host": "0697", "voice": [(0.70, 7.93), (8.85, 14.85)], "beats": 23, "shots": [
        ("H", 3), (("0702", 0.2), 8), (("0684", 2.7), 8), ("H", 4)]},
    {"id": "br4", "beats": 16, "shots": [(("0683", 1.5), 8), (("0618", 0.3), 8)]},
    {"id": "E", "host": "0706", "voice": [(0.0, 11.75)], "beats": 20, "shots": [("H", 20)]},
]
# music source: section id -> downbeat it must START on (speech before it is spliced so every bridge lands on a drop)
MUSIC_ANCHOR = {"br1": 57.0, "br2": 66.66, "br3": 116.6, "br4": 126.26}

# stacked-left key text (only the important lines). (section, host media time of the line, [(line, style, media time)])
# style: "s" = small serif italic line, "m" = big bold line, "g" = big gold line, "p" = price
KEYS = [
    ("hook", 0.69, [("nhà đẹp", "s", 0.76), ("TỪ TRONG RA NGOÀI", "g", 1.18)]),
    ("hook", 2.30, [("có", "s", 2.0), ("THANG MÁY", "g", 2.16)]),
    ("hook", 4.30, [("đường trước nhà", "s", 4.06), ("XE TẢI TRÁNH", "g", 5.1)]),
    ("A", 2.95, [("chỗ đỗ", "s", 2.42), ("XE HƠI", "g", 2.74)]),
    ("A", 6.56, [("NGANG 4M", "m", 6.56), ("DÀI 20M", "g", 7.54)]),
    ("A", 8.96, [("tặng full", "s", 8.96), ("NỘI THẤT", "g", 9.3)]),   # Dũng 26/10: "tặng full nội thất"
    ("A", 11.46, [("nhà xây", "s", 11.14), ("5 TẦNG", "g", 11.46), ("4 PHÒNG NGỦ", "g", 12.98)]),
    ("C", 2.70, [("không gian", "s", 2.7), ("BẾP", "g", 3.12)]),
    ("C", 15.76, [("tặng luôn cả", "s", 15.76), ("TỦ LẠNH", "g", 16.34)]),
    ("D", 9.00, [("SỔ HỒNG RIÊNG", "g", 9.0), ("hoàn công đầy đủ", "s", 9.88)]),
    ("D", 11.60, [("chào giá", "s", 11.6), ("9 TỶ 9", "p", 12.32), ("vẫn còn thương lượng", "s", 12.78)]),
    ("E", 9.86, [("nhắn tin ngay cho", "s", 9.86), ("EM DŨNG", "g", 10.4)]),
]
# words (lower-case, no punctuation) highlighted gold inside the subtitle line
HILITE = ["xe hơi", "4m", "20m", "nội thất", "5 tầng", "4 phòng ngủ", "lê trọng tấn", "tân phú", "thang máy", "xe tải tránh",
          "bếp", "tủ kịch trần", "máy hút mùi", "bếp âm", "sang trọng", "tủ lạnh", "lệch tầng", "sổ hồng riêng", "hoàn công",
          "9 tỷ 9", "thương lượng", "bình luận", "em dũng"]


# two-word terms a subtitle line must never split
COMPOUNDS = {"không gian", "thiết kế", "phòng ngủ", "bình luận", "nhắn tin", "sân thượng", "thông tin", "căn nhà", "anh chị",
             "phụ nữ", "gia đình", "nấu nướng", "thương lượng", "khách hàng", "thiện chí", "nội thất", "xe tải", "xe hơi",
             "thang máy", "sang trọng", "tủ lạnh", "bàn ghế", "sổ hồng", "hoàn công", "đầy đủ", "lệch tầng", "phong cách",
             "cảm nhận", "ý kiến", "chào giá", "đặc biệt", "trục đường", "máy hút", "hút mùi", "bếp âm", "kịch trần", "xem xong",
             "tân phú", "trọng tấn", "4 phòng", "có 4", "vẫn còn", "9 tỷ", "tỷ 9", "chỗ đỗ", "phù hợp", "dọn vào", "tủ kịch", "thế nào", "chủ nhà", "cảm ơn"}


# ---- bản đồ vệ tinh: tâm = link Google Maps Dũng gửi (không phải số nhà); tiện ích thật từ OSM trong 2km
MAP_PIN = (10.7769, 106.7009)
MAP_LABEL = ("DU-AN-MAU", "giáp Tân Phú")                  # nhãn ghim: đường lớn + khu vực (không số nhà/hẻm)
MAP_WHY = "bản đồ vị trí đúng câu 'trục đường DU-AN-MAU'"
MAP_SAY = "nhà nằm ngay tại trục đường DU-AN-MAU, giáp với Tân Phú"   # câu nói lúc hiện bản đồ (chọn SFX)
POIS = [  # real OSM points (work/map/osm_poi.json), distance from the map reference point, rounded to 0.1 km
    {"id": "school", "lat": 10.7769, "lon": 106.7009, "name": "THPT DU-AN-MAU", "km": "~0,3km", "icon": "school", "t": 2.1},
    {"id": "aeon", "lat": 10.7769, "lon": 106.7009, "name": "AEON Mall Tân Phú", "km": "~0,8km", "icon": "mall", "t": 2.5},
    {"id": "coop", "lat": 10.7769, "lon": 106.7009, "name": "Co.opmart Thắng Lợi", "km": "~1,8km", "icon": "cart", "t": 2.9},
]


# ---- ghi chú cắt lời (in vào work/cutlist.md)
CUT_NOTES = ["Lời thoại: 0654 0.00–6.08 ('Tuyệt vời luôn anh chị ơi…' giữ nguyên theo Dũng 26/10, chỉ bỏ lặng/hơi thở cuối) · 0644 0.00–12.65 + 12.85–14.17 + 15.12–17.75 (rút lặng 0,4s→0,2s; bỏ 'nhà…' kéo dài 1s; bỏ hơi thở cuối) · 0676 0.00–5.40 + 6.12–6.95 + 8.00–17.45 ('bỏ…' ngập ngừng 0,7s; 'Thì' mở câu + 2 khoảng lặng) · 0697 0.70–7.93 + 8.85–14.85 (lặng 1,2s) · 0706 0.00–11.75 (hơi thở cuối).", "Bỏ: 0644 18.15–21.06 (lặng), 0654 6.25–8.34 (lặng), 0676 17.45–19.35 ('Rồi.' + lặng), 0697 0–0.70 / 7.93–8.85 / 14.85–17.43 (lặng), 0706 12.20–12.95 (lặng).", '0614 chỉ dùng 0.4–1.6 và 5.2–7.0 (bảng số nhà đã che mờ bám theo ở 0–4.9s).']


# ---------------------------------------------------------------- thêm 30/10/2026 (từ dự án DU-AN-MAU, Dũng duyệt)
ORIG_DIR = None          # thư mục clip gốc phẳng; chỉ cần khi lấy thêm cảnh chưa có trong bản CapCut (scripts/match_grade.py)
# MUSIC_LOOP = (A, B, N, "work/audio/music_src.wav")   # bài nhạc ngắn hơn video -> scripts/loop_music.py, rồi MUSIC_SRC = work/audio/music_loop.wav
SUB_BOTTOM = 600         # phụ đề cao vừa (đáy 600/1920); chạm mặt người dẫn thì tự hạ về 500
KEY_TOP = 540            # chữ nhấn giữa khung cạnh người (mẫu @quynhanhbds); né mặt tự dời theo work/faces.json (scripts/face_zones.py)
MAP_SUB_BEATS = 2        # cửa sổ phụ đề trên bản đồ (số phách); nhạc nhanh >140 BPM dùng 4
# màu chữ theo vai = biến CSS ở :root (đổi trong Studio). Bộ màu đo từ mẫu: asset/phong_cach/mau_chu/bang_mau.json (đang dùng KV4)
PALETTE = {"gia": "#FAE7A7", "so-lieu": "#DEC093", "nhan": "#FFFFFF", "nhan-vang": "#FAE7A7", "vi-tri": "#F9FFFF",
           "cau-hoi": "#E39B52", "phong": "#DEC093", "phap-ly": "#FAE7A7", "tot": "#DEC093", "cta": "#E39B52", "nhan-phong": "#FDFEFD"}
# dòng chữ trong KEYS có thể thêm {"c": "var(--gia)", "a": "flip|wipe|bounce|slide|stamp|underline"}; kiểu "q" = câu hỏi slam giữa khung ("|" xuống dòng)
LABELS = {}              # nhãn phòng trên cảnh nhà {clip: "Bếp"} (mẫu @vietnamhousetour) — chỉ cảnh chắc tên phòng
MG = {}                  # MG minh họa theo lời {clip: {"kind": "plan"|"ruler", ...}} — không SFX
SFX_INTENT = None        # [(L, T)] theo thứ tự KEYS; None = sfx_plan.py tự nhận
SFX_EXCLUDE = ["Sine/"]  # Dũng 29/10: không dùng họ SINE trừ khi Dũng yêu cầu
SFX_OVERRIDE = {}        # {"k4": "Swipe & Swish/SWISH 5.wav"} khi Dũng muốn đổi âm 1 mốc
# section voice có thể thêm "hard_out": True = cắt thẳng đúng phách (khi không đủ chỗ mờ chuyển mà câu chưa nói xong)
