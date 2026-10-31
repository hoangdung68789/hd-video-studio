# Nhật ký kiểm chứng — dung-text-fx

Bằng chứng (thư mục tạm của phiên): `S = ~\AppData\Local\Temp\claude\C--Users-Admin-HDRE-AI\0862decb-916a-49fa-b6ad-9ca34597eb17\scratchpad`
Bằng chứng giữ lâu: `<HD_VIDEO_HOME>\Videos\DU-AN-MAU\sfx-moi-preview\`

## A. Quy trình SFX theo ý nghĩa (`references/08-sfx.md`) — 2026-10-23

### Vòng 1 — Tham chiếu ✅ (lần 2)
- Lần 1 ❌: `sfx_tag.py --help`, `sfx_render.py --help` lỗi `UnicodeEncodeError: 'gbk'` (console Windows); 08-sfx.md mục 4 bước 5 ghi `audio-gate.md` thiếu tiền tố.
- Sửa: mọi script gọi `sys.stdout.reconfigure(encoding="utf-8")` đầu `main()`; đổi thành `dung-video/references/audio-gate.md`.
- Lần 2: 9/9 script `--help` OK; mọi đường dẫn trong 08-sfx.md tồn tại (`Test` bằng bash `-e`); xác nhận memory ghi sai `Downloads\whisper-20250625\sfx-catalog` (không tồn tại) — đường dẫn đúng `HDRE AI\sfx-catalog`.
- `hoang-dung-bds-video-master/SKILL.md` dòng 549 = "Bước 4.7: Đa dạng hóa âm thanh hiệu ứng" (nguồn luật nghề được dẫn).

### Vòng 2 — Chạy thật trên 2 dự án BĐS thật ✅
| Dự án | Mốc | Lớp âm | File khác nhau | Điểm | Scorecard |
|---|---|---|---|---|---|
| DU-AN-MAU (56.33s) | 16 | 27 | 25 | **100/100** | `S\sfxtest\demo\sfx-scorecard.json` (bản sao: `sfx-moi-preview\sfx-scorecard.json`) |
| DU-AN-MAU (76.35s) | 18 | 29 | 29 | **100/100** | `S\sfxtest2\sfx-scorecard.json` |
| Bộ SFX CŨ của DU-AN-MAU (cùng bộ chấm, chỉ phần kế hoạch) | 16 | 41 | 36 | **72.57/100** | `sfx-moi-preview\sfx-cu-scorecard.json` |
Đo độ to SFX cũ tại âm dẫn (stem thật `work/audio/sfx.wav` vs `voice.wav`): −0.9…−8.2 dB, **12/15 ngoài dải −16…−6 dB**.
Bản trộn preview (ffmpeg ebur128, peak=true): giọng −14.2 LUFS; BGM ducking −19.6 LUFS; SFX −22.9 LUFS; mix −13.6 LUFS, true peak −1.6 dBFS. BGM `video-449-29-HL2/hf/assets/music/opt-b-upbeat.mp3` (fade in 0.8s / out 1.5s).
File: `SAU_sfx-moi_720p.mp4` và `TRUOC_sfx-cu_720p.mp4` — 720x1280, 60fps, 56.33s (ffprobe).

### Vòng 3 — Rà lỗi theo luật (lỗi tìm thấy khi rà và đã sửa) ✅
| # | Lỗi | Sửa |
|---|---|---|
| 1 | nghĩa "số liệu" gán cho mọi mốc (timestamp trong cột nguồn có số) | bỏ timestamp; số liệu = số + đơn vị |
| 2 | ngữ cảnh ±1.2s quá rộng → "TẶNG HẾT NỘI THẤT" thành vị trí | ưu tiên chữ màn hình → câu nói → ngữ cảnh ±0.6s |
| 3 | âm công nghệ cho điểm mạnh nhà | L5 cấm sắc thái công nghệ |
| 4 | họ "Star" 5 lần | phạt họ đã dùng + trần 30% |
| 5 | riser bị bỏ (chọn file đỉnh muộn) | lọc riser theo khoảng trống phía trước |
| 6 | "tiếng tiền" cho "tặng nội thất", "Mới 100%" | luật nghĩa cụ thể (SPECIFIC) |
| 7 | tiếng "disappear" cho chữ xuất hiện | vai `bien_mat` |
| 8 | `peak_db` catalog sai (trung vị +6.9 dB) → stem +3.2 dBFS | chuẩn hoá theo đỉnh mẫu thật |
| 9 | `peak_t` catalog lệch >1 khung ở 423/863 file (tới 38s) | đo lại toàn kho (`sfx_tag.py`) |
| 10 | file 2 đỉnh (UI Clicks) | `peak_t` = đỉnh đầu tiên trong 1 dB |
| 11 | ffmpeg nhiều nguồn từng treo (ghi trong mix.py cũ) | giải mã từng file + cộng numpy |
| 12 | SFX gần bằng giọng | độ to theo giọng thật từng mốc, cả cụm |
| 13 | `ffmpeg -ac 1` cao hơn ~2.8 dB so với cách đo | đọc giọng bằng soundfile, trung bình kênh |
| 14 | "Sổ hồng riêng" nhận thành giá; "TỐN THÊM" thành hook sang trọng; "GIẢI PHÁP" thành chuyển cảnh | thứ tự ưu tiên LEX; hook "nỗi đau" giữ L11; thêm L12 |
| 15 | âm dài tràn sang mốc sau; đuôi/lớp nghĩa cướp điểm chạm | âm dẫn tắt trước mốc sau 0.15s; lớp phụ +0.08s và ≤ −9 dB so với âm dẫn |
Kiểm luật trên 2 bản 100 điểm: mỗi file ≤ 2 lần, không 2 mốc liền cùng file, không 3 mốc liền cùng họ, ≤ 2 mốc/1s, âm rõ cách ≥ 3s, 0.5s sau T3 — đều đạt (mục đa dạng 20/20, mật độ 15/15).

### Vòng 4 — Đáp án biết trước (lỗi cố ý) ✅
Từ bản 100/100 của DU-AN-MAU, tạo 5 bản lỗi (`S\sfxtest\demo\faults\`), trộn thật rồi chấm:
| Lỗi cố ý | Tổng | Mục bị trừ (đúng mục) | Mục khác |
|---|---|---|---|
| a. mọi lớp lệch +3 khung | 90.0 | đồng bộ 10/20 ("lệch 3.0 khung") | giữ nguyên |
| b. tiếng FAIL WRONG cho "TẶNG HẾT NỘI THẤT" | 98.19 | đúng nghĩa 23.75/25 (vai sai + sắc thái cấm) | đồng bộ −0.56 (đỉnh file khác) |
| c. 4 mốc liền cùng `POP 3.wav` | 86.67 | đa dạng 7.5/20 (dùng 4 lần, 3 cặp liền) | đúng nghĩa −0.83 (mất nghĩa số liệu ở m8) |
| d. chen 2 mốc trong 0.5s sau m1 | 82.5 | mật độ 0/15 | đa dạng −2.5 (2 mốc chèn cùng file) |
| e. âm dẫn chỉ thấp hơn giọng 2 dB | 96.25 | độ to 6.25/10 (đo −2.0 dB) | giữ nguyên |

### Vòng 5 — Độc lập, lần 1 ❌ KHÔNG ĐẠT (agent độc lập #1)
Tái lập 2 dự án ra 100/100 (tất định, `sfx.wav` khác 0.0), preview I −13.6 LUFS / TP −1.3 dBFS đạt; NHƯNG:
- NẶNG: `sfx_audit.py` crash (`StopIteration`) khi một mốc mất âm dẫn → mục Phủ đủ không bao giờ chạy tới.
- Lệch 9 khung chỉ bị trừ 0.84 (chấm theo lớp, không theo mốc).
- 6 chỗ tài liệu ↔ code lệch (Foley −0.12s/+0; L3 sắc thái; luật 0.5s sau T3 chỉ ghi chú; trần họ 30% sai khi < 7 mốc; dự phòng phá luật ≤ 2 lần/file; vai > 50% chỉ xét vai đầu).
- Nhãn sai: `clock|tick` bắt "CORRECT TICK" → nghĩa đồng hồ; `chalk` → giấy tờ.
- Đuôi GLEAM ở 8/16 mốc; lớp nghĩa có thể tràn mốc sau; `ly_do` không tất định (set).
- Nhận định nghĩa: tiếng xu game cho "TỐN THÊM…", ShieldDown (đi xuống) cho điểm mạnh, chuỗi vị trí không thành thang nốt, chuông "đúng" cho "5–10 phút", tiếng phấn cho "Sổ hồng", "LIÊN HỆ NGAY" chỉ một swish, Cyberpunk cho "4 phòng ngủ", "Không gian bếp" nhận âm phép thuật.

### Sửa sau vòng 5 lần 1 (đều có trong code + 08-sfx.md)
1. Bộ chấm: mốc thiếu âm dẫn = trượt Phủ đủ/Đồng bộ/Đúng nghĩa, không crash; Đồng bộ chấm theo MỐC; vai > 50% xét vai phục vụ ý định; thêm "họ > 50% mọi lớp"; Độ to thêm đỉnh stem ≤ −3 dBFS.
2. Nhãn: `clock|ticking`; chalk bỏ nghĩa giấy; thêm nghĩa `gio` (air/airy/breeze/wind); âm đi xuống (ShieldDown, chimes down, descend, bass drop) → `bien_mat`; đo thêm `loud_end_t`, `multi_hit`, `crest_db` cho cả 863 file.
3. Kế hoạch: L3/L4/L6 cấm công nghệ; L11 cấm sang trọng/vui/ấm; tên phòng = L8; "liên hệ" = nghĩa điện thoại; chuông xác nhận chỉ cho pháp lý/CTA; 3 mốc liền cùng họ chặn cứng; trần họ round(30%); dự phòng giữ luật lặp; đuôi khác họ âm dẫn + xoay họ đuôi; thang nốt tự động L4/L6 < 4s; cảnh báo mật độ; lớp nghĩa không tràn; `ly_do` sắp xếp; âm dẫn phải một điểm chạm và T2–T3 crest ≤ 18 dB.
4. Trộn: lớp phụ vào sau khi âm dẫn hết vang to; đo điểm neo trên mẫu thật (±0.25s, lặp tới điểm cố định, |L|,|R| lớn nhất) rồi đặt đúng giây; sửa lỗi chia thời gian cho tỉ lệ cao độ (asetrate+atempo giữ độ dài; rubberband đo trễ 0.165s nên loại).

### Chạy lại vòng 1–4 sau sửa
- V1 ✅ 9/9 script `--help`; mọi tham chiếu trong 08-sfx.md tồn tại; SKILL.md ghi rõ 05/06/07 `[chưa có]`.
- V2 ✅ DU-AN-MAU **100/100** (16 mốc, 24 lớp, 22 file); DU-AN-MAU **100/100** (18 mốc, 31 lớp, 26 file). Preview mới: I −13.7 LUFS, TP −1.3 dBFS, 720x1280@60, 56.33s; giọng −14.2, BGM −19.6, SFX −25.1 LUFS.
- V3 ✅ luật mật độ/đa dạng đạt trong 2 scorecard; không cảnh báo mật độ; ⚠️ thiếu tiếng thật "thiên nhiên" ở DU-AN-MAU m12 (kho không có).
- V4 ✅ 7 lỗi cố ý (`S\sfxtest\demo\faults\`):
| Lỗi | Tổng | Mục bị trừ |
|---|---|---|
| a. lệch +3 khung | 90.0 | đồng bộ 10/20 |
| b. FAIL WRONG cho "TẶNG HẾT NỘI THẤT" | 97.5 | đúng nghĩa 23.75; đồng bộ 18.75 (đuôi lệch so với âm dẫn mới) |
| c. 4 mốc cùng POP 3 | 82.17 | đa dạng 5/20; đúng nghĩa 23.42 |
| d. chen 2 mốc trong 0.5s | 85.0 | mật độ 0/15 |
| e. âm dẫn dưới giọng 2 dB | 95.31 | độ to 5.31/10 |
| f. xóa âm dẫn m8 (lỗi agent #1) | 97.51 | phủ đủ 9.38, đúng nghĩa 23.75, đồng bộ 19.38 — không crash |
| g. riser m1 kết sớm 0.15s (lỗi agent #1) | 98.75 | đồng bộ 18.75 ("lệch 9.0 khung", stem 9.9) |
- Tất định: `PYTHONHASHSEED` 0/1/2 → cùng md5 `35c6c0490fbb…`.

### Vòng 5 — Độc lập, lần 2 (agent độc lập #2, chưa tham gia)
(đang chạy)

## B. PHẦN B — 19 repo cho dung-video (2026-10-23)
- Nguồn: README gốc (curl raw.githubusercontent.com, lưu `%TEMP%\readmes\`), `npm view <gói> version`, file thật trên máy.
- Sao lưu trước khi sửa: `dung-video\SKILL.md.bak-2026-10-23-truoc-repos`, `references\routing.md.bak-2026-10-23-truoc-repos`, `references\engines.md.bak-2026-10-23-truoc-repos`.
- Đã sửa: tạo `references\repos.md`; thêm bảng "Thư viện hỗ trợ MG" vào routing.md; 2 dòng 3D/Lottie vào engines.md; 1 dòng trỏ repos.md trong mục Tham chiếu của SKILL.md. Luật cứng, G1–G7, luồng 8 giai đoạn không đổi.
- Kiểm chứng PHẦN B: chưa chạy vòng 5 độc lập riêng (để chung với lần xuất bản phần chữ hiệu ứng).

## A-v6 — Vòng 5 lần 2 (agent #2) KHÔNG ĐẠT → sửa + luật độ to mới của Dũng (2026-10-23)
Lỗi agent #2 tìm ra (đều đã sửa, kiểm bằng lỗi cố ý):
1. Riser nhiều cú (Whoosh Reverse 01/05 chứa ~5 whoosh) phát hết file → tiếng lạc ở chỗ không có chữ. Sửa: chọn riser bỏ `multi_hit`; render cắt riser 0.06s sau điểm neo. Đo stem v6: khoảng trống 11.6–18.8s (DU-AN-MAU) và 59.5–68.9s (DU-AN-MAU) chỉ còn đuôi tự nhiên của mốc liền kề.
2. Bộ chấm không kiểm hình âm dẫn → thêm (nhiều cú, đỉnh > 0.6s, onset > 0.3s, crest > 15/17 dB).
3. Đổi cao độ lách luật chống lặp → thang nốt chỉ hợp lệ khi có `group` (cả nốt gốc).
4. Tràn qua mốc sau → plan tự cắt mọi lớp; audit chấm tràn trên vị trí đã trộn (mật độ 4/4/3/4).
5. SINE FALL làm âm dẫn điểm mạnh → `fall` = `bien_mat` (cả nhãn sửa tay). Chuông báo động = `sai`; tiếng game = hài hước.
6. Lệch tài liệu: đo |L|,|R| (đo lại 863 file), SPECIFIC thêm gio/xac_nhan (khớp ⊆), "phút" = bản đồ, glitch theo `--style hype`, L7 giấy trước chuông, dự phòng giữ fam_cap/crest, bỏ ket_cau khỏi L3, trần đỉnh −3.0 (render −3.2), docstring đúng code.
Luật mới của Dũng: "SFX luôn phải to và rõ nhưng không được to hơn tiếng người dẫn; đang bị giọng và nhạc nền đè". → REL_DB T3 −2/T2 −3/T1 −4/T0 −6 (đạt −6…−1 dB); `sfx_mix.py` nhạc né giọng (−8 dB) và né SFX (−10 dB); chấm SFX nổi ≥ 8 dB trên nhạc.
Kết quả v6: DU-AN-MAU 100/100, DU-AN-MAU 100/100 (SFX − giọng −5.3…−2.0 dB; SFX − nhạc +10.4…+24.6 dB). Mix: I −13.9 / −13.6 LUFS, nhạc đã né −26.7 / −27.3 LUFS.
Lỗi cố ý (6/6 bị trừ đúng mục): A âm dẫn nhiều cú 97.13 · B pitch lách 95 · C tràn 99 · D riser nhiều cú 99.5 · E to hơn giọng 95 · F nhạc không né 98.
Lưu ý khi nối /video: audio-gate ghi "nhạc dưới giọng −18…−22 LUFS"; nhạc đã né theo luật mới đo −27 LUFS → cần Dũng chọn ngưỡng.
Preview mới: `Videos\DU-AN-MAU\sfx-moi-preview\SAU_sfx-moi_720p.mp4` (I −13.9 LUFS, đỉnh −1.2 dBFS); bản cũ trong `_ban-cu-v5\`.

## A-v7 — Vòng 5 lần 3 (agent #3) KHÔNG ĐẠT + luật nhạc nền mới của Dũng (2026-10-23)
Dũng: "giữ nguyên mức nhạc cũ… nhạc nền cứ lớn nhỏ liên tục, yêu cầu đồng đều và chỉ giảm nhẹ những lúc quan trọng sau đó tăng âm lượng trở lại".
→ `sfx_mix.py --plan`: bỏ né theo giọng; nhạc −19 LUFS (sau hạ ≈ −20.3/−20.5 LUFS); 11 lần hạ nhẹ ≤ 6 dB quanh mốc, cosin, gộp khi cách < 2s.
Agent #3 tìm ra (đã sửa): audit tin nhãn L/tier/nghĩa trong plan (nay nhận lại từ `src`/`ctx`); group giả; đuôi cùng họ + trần họ 30% không chấm; âm lạ ngoài mốc trong stem; cú chạm thứ hai; tiếng game cho L11; L7 thiếu giấy khi lời không nói "giấy"; onset −20 vs −30 dB; riser tính chỗ trống từ giây mốc trước; seed (sửa tài liệu cho đúng: chỉ phá hòa); "3,6 m" thiếu nghĩa số liệu; "Còn thương lượng" cấm kịch tính; code thừa.
Kết quả v7: DU-AN-MAU 98.88, DU-AN-MAU 99.0 — mọi mục đủ trừ "SFX nổi ≥ 8 dB trên nhạc" (p1 6/16, p2 8/18 mốc chỉ nổi 4.7–7.9 dB) → mâu thuẫn giữa "nhạc mức cũ, chỉ hạ nhẹ" và ngưỡng 8 dB; KHÔNG nới ngưỡng, chờ Dũng nghe và quyết.
Lỗi cố ý 11/11 bị trừ đúng mục (A–F cũ + G sửa nhãn, H group giả, I đuôi cùng họ, J chạm lần hai, K âm lạ trong stem).
Preview: SAU_sfx-moi_720p.mp4 = v7 (I −13.6 LUFS, đỉnh −1.0 dBFS); v6 trong `_ban-cu-v6-nhac-nhap-nho`.

## A-v8/v9 — Vòng 5 lần 4 và 5 (agent #4, #5) KHÔNG ĐẠT → đã vá (2026-10-23)
Lần 4: thừa lớp phụ, dời mốc lệch lời, đuôi nghĩa/sắc thái cấm, riser che cú chạm thứ hai, thiếu riser T3, đuôi không xoay họ, docstring. Vá: kiểm MỌI lớp, đếm lớp phụ, so `src.t`, `multi_hit` định nghĩa lại (bật lại ≥ 6 dB tới trong 3 dB), `peak_spread` (đỉnh mơ hồ), plan chặn vai > 50%, crest T1 ≤ 15.
Lần 5: nhạc −30 LUFS vẫn 100; lớp phụ −6 dB lọt; xóa mốc / dời cả src.t lọt. Vá: đo LUFS nhạc −19 ±1; lớp phụ chấm theo đỉnh riêng (≥ 9 dB); stem dựng lại từ plan so từng mẫu; plan lưu đường dẫn + sha256 moments/words, audit đọc lại.
Kết quả: DU-AN-MAU 100/100, DU-AN-MAU 100/100; 22/22 lỗi cố ý chạy được đều bị trừ (11 cũ + 6 của agent #4 + X1–X4 của agent #5; X5 không áp được cho DU-AN-MAU vì không có mốc L2, đã bắt ở lần trước).
Chưa có lần kiểm 5 độc lập nào ĐẠT trọn — mỗi lần tìm thêm lỗ mới; đã vá hết lỗ đã biết.

## A-final — Lần chạy cuối các lỗi đã xác định (Dũng yêu cầu, 2026-10-23)
Tái lập: DU-AN-MAU 100/100 (md5 stem c6e8ab9678c1, trùng lần trước), DU-AN-MAU 100/100.
24/24 lỗi cố ý bị trừ: A 96.13 · B 95.0 · C 99.0 · D 99.5 · E 95.94 · F 98.62 · G 99.46 · H 93.55 · I 91.05 · J 93.84 · K 98.0 · N1 99.5 · N2 99.38 · N3 97.83 · N4 99.5 · N5 99.5 · N6 99.5 · X1 99.38 · X2 98.0 · X2b 96.88 · X3 99.38 · X4 99.0 · X5 94.0 (chạy trên DU-AN-MAU; vá thêm: audit luôn dùng kho nhãn chính thức).
