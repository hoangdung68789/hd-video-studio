# Quy trình đo & dựng lại video mẫu (Chế độ B chi tiết)

## Chế độ B — Phân tích & dựng lại 1 video mẫu

### B0. Phạm vi
Nạp sổ tay (mục Sổ tay, Nạp) để gợi ý đúng lựa chọn đầu. Gọi riêng (không qua /dung-video) → hỏi MỘT lần, chỉ phần chưa rõ:
1. **Phân tích gì** (chọn nhiều): `Toàn bộ video` | `Hiệu ứng & chuyển cảnh` | `Nhạc nền & âm thanh` | `Font & kiểu chữ` (thêm: màu, nhịp, một đoạn cụ thể "giây 3-7").
2. **Mục tiêu:** `Chỉ phân tích` | `Phân tích + làm lại hiệu ứng` | `Nhân bản cấu trúc lên cảnh quay của anh` (B3b → dung-video) | `Viết prompt dựng lại giống mẫu` (B10; tự mở rộng thành `Toàn bộ video`).
Phiên không người xem: `Toàn bộ` + `Chỉ phân tích`, ghi rõ đã chọn. Video mẫu đã có trong `analysis_log.md` → dùng lại kết quả cũ, chỉ đo bổ sung phần hỏi thêm.

### B1. Nhận video
- File tải lên: xử lý trong môi trường làm việc. Đường dẫn trên máy: dùng công cụ kết nối máy; không có thì nhờ Dũng mở cuộc trò chuyện trong app Claude desktop hoặc tải file lên.
- Link TikTok/Reels/YouTube/Facebook công khai: Bước 0 của `hoang-dung-auto-style-learner` (nạp `watch` từ fork `<TAI_KHOAN>/claude-video`), rồi `watch <link> --engine local --resolution 1080 --out-dir <thư mục tạm>` → file video trong `<out-dir>/watch-*/` dùng cho mọi lệnh B2. Ghi thêm tiêu đề, tên âm thanh từ trang. Không tải video riêng tư/cần đăng nhập, không dùng công cụ vượt chặn; tải lỗi thì nhờ Dũng lưu video hoặc quay màn hình rồi gửi file. File gốc xóa sau khi xong phiếu đo, không đăng lại, không ghép vào sản phẩm.

### B2. Thu dữ liệu đo được
- `ffprobe`: độ phân giải, fps, thời lượng, tỷ lệ khung.
- Điểm cắt: `ffmpeg -i in.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null -` → mốc cắt, độ dài từng shot, nhịp trung bình.
- Sự kiện thị giác (chữ, đồ họa, chuyển cảnh) bằng ngưỡng thấp `select='gt(scene,0.06)'` — nhịp video BĐS thường đến từ đồ họa chứ không chỉ từ cú cắt.
- Khung hình: contact sheet toàn video; quanh mỗi điểm cắt và mỗi lần chữ/đồ họa xuất hiện trích dày 10-30 khung/giây trong ±0,5 giây.
- Màu: `signalstats` theo từng shot (độ sáng, bão hòa, ám màu).
- Âm thanh: `ebur128`, khoảng lặng, nhạc so với giọng; BPM ước lượng (librosa nếu cài được, không thì numpy).
- Lời thoại: ưu tiên bản lời có mốc giây trong báo cáo `watch` (phụ đề gốc, hoặc WhisperX nếu đã cài); không có thì faster-whisper trên máy Dũng (`language="vi"`, `word_timestamps=True`, `vad_filter=True`); môi trường đám mây bị chặn tải mô hình thì nhờ Dũng gửi `.srt`/`.txt` (CapCut tự tạo phụ đề) hoặc đọc phụ đề in trên khung (1 khung/giây), ghi rõ đoạn thiếu lời.
- Video hậu trường (thành phẩm giữa nền mờ, timeline bên dưới): cắt riêng vùng thành phẩm trước khi đo (bộ ME4REAL 576×1024: `crop=380:673:98:47`); phóng to timeline đọc tên file nhạc/SFX làm bằng chứng (R-L008, R-L009).
- AI "xem" qua khung trích và "nghe" qua số đo — nói rõ khi kết luận phụ thuộc vào đó.

### B3. Hiệu ứng & chuyển cảnh
Soi: chuyển cảnh (hard cut, whip, zoom, mask, match cut, glitch…); chuyển động khung (zoom/pan giả lập, rung nhịp, speed ramp, freeze); chữ (cách xuất hiện, nhấn từ khóa, phụ đề); MG (thẻ, bản đồ, line, 3D, chữ bám vật thể); lớp phủ (ánh sáng, hạt, khung); đồng bộ nhạc (cắt theo beat, SFX).
Bảng: `| Mốc | Loại | Mô tả | Bằng chứng (khung/số đo) | Độ tin cậy | Cách làm lại (HyperFrames/Remotion/FFmpeg/CapCut) | Mã E/MG/TR hoặc mã Từ điển |`; chưa có mã thì "MỚI" và thêm dòng vào Từ điển hiệu ứng theo nhãn tên của auto-style-learner. Hiệu ứng punch-in/rung footage chỉ ghi nhận, khi dựng cho Dũng thay bằng chữ động.

### B3b. Bản đồ cấu trúc (khi "Nhân bản cấu trúc", khi gọi từ /dung-video, hoặc trước B10)
1. Chia video mẫu theo vai trò (Hook, vị trí, nhà, giá/pháp lý, bằng chứng, CTA).
2. Ghi `HDRE_Library/structures/<ten-video-mau>.md`: `| Đoạn | Giây | Vai trò | Shot TB | Sự kiện thị giác/giây | Chữ/MG (mã) | Chuyển cảnh (TR) | SFX | Nhạc (phách, cao trào) | Host trên hình |` + tổng: thời lượng, nhịp TB, LUFS, công thức F1-F4 gần nhất.
3. Ghi điểm yếu của mẫu (chữ quá nhanh, che chủ thể, rối, dấu bị cắt, thiếu câu nhử…) để bản dựng cho Dũng sửa luôn.
4. Chuyển bản đồ cho `dung-video` ghép take và cảnh của Dũng.

### B4. Nhạc nền & âm thanh
1. **Tên bài:** theo luật cứng 4; chưa có nguồn → `[Chưa xác minh tên bài]`.
2. **Đặc điểm đo được:** BPM, cao trào/drop, có lời hay không, thể loại và cảm xúc (nhận định), mức nhạc so với giọng, chỗ hạ nhạc, tỷ lệ cú cắt trùng nhịp, SFX và vị trí.
3. **Gợi ý dùng:** từ khóa tìm bài tương tự (hook từ giây đầu, dễ viral — H-am_thanh-001). Không chép lời bài; không tách nhạc từ video người khác để dùng lại (đo BPM/LUFS trên file `watch` đã tải là được, chỉ để đo). SFX cho video của Dũng do `dung-video` chọn theo nghĩa lời (`textfx-kit`).

### B5. Tìm đúng tên font & phiếu font
Tìm **đúng tên font** (họ + độ đậm) cho từng kiểu chữ; chưa đủ bằng chứng thì nói rõ mức tin cậy và vẫn đưa font thay thế có tiếng Việt.
1. **Lấy mẫu chữ:** mỗi kiểu một mẫu ở khung chữ đứng yên; cắt sát, phóng 3-4 lần (`crop=…,scale=iw*4:-1:flags=lanczos`); chữ 3D nghiêng thì nắn thẳng. Ưu tiên chữ đặc trưng: a, g, t, y, R, G, Q, số 1/3/4/7 và chữ có dấu chồng (ầ ố ệ ự ỷ).
2. **Mô tả nét:** có chân/không chân, hình học hay mềm, độ đậm, độ rộng, viền, bóng, màu, cách tô từ khóa. Dấu hiệu nhanh: `a` một/hai tầng; đầu `t` cắt xiên/bằng; `G` có cựa; đuôi `y`, `g`; số `1` có cờ; `O` tròn hay ô van; khoảng cách chữ.
3. **Phép thử dấu tiếng Việt:** dấu chồng khớp nét → font có hỗ trợ tiếng Việt. Tra subset của ứng viên (vd `gwfh.mranftl.com/api/fonts/<tên>`); ứng viên gốc không có `vietnamese` mà video vẫn đúng dấu → "bản Việt hóa hoặc font tích hợp trong phần mềm" (R-L010).
4. **Ứng viên (3-6 font):** font tích hợp trong CapCut/DaVinci…; Google Fonts có subset `vietnamese`; font Việt hóa SVN-/UTM-/iCiel (chỉ ghi tên, kèm cảnh báo giấy phép); kết quả công cụ nhận dạng ở mục 6.
5. **So dựng chữ song song (bước quyết định):** gõ đúng câu trong video bằng từng ứng viên cùng cỡ, đặt cạnh mẫu (`hstack`/`vstack`), loại ứng viên lệch (R-L011). Font có sẵn: môi trường làm việc, máy Dũng (chỉ đọc `C:\Windows\Fonts`, `%LOCALAPPDATA%\Microsoft\Windows\Fonts`), `dung-video/assets/textfx-kit/fonts/files/`, hoặc file Dũng gửi. Đám mây bị chặn tải font → dùng có sẵn: Inter/Inter Display, TeX Gyre Chorus, Lora; Poppins có sẵn nhưng KHÔNG có dấu tiếng Việt.
6. **Công cụ nhận dạng (Dũng tự chạy, AI chuẩn bị ảnh):** WhatTheFont, Font Squirrel Matcherator, WhatFontIs; ảnh 1 dòng chữ, nền tương phản, đã nắn thẳng, ít dấu. Kết quả vẫn phải qua mục 5.
7. **Độ tin cậy:** Cao = khớp ≥5 dấu hiệu + qua phép thử dấu, hoặc có nguồn xác nhận; Trung bình = cùng dáng, khớp 2-4; Thấp = chỉ cùng nhóm. Trung bình/Thấp không trình bày như tên chính xác.
8. **Phiếu font** (mỗi kiểu chữ một dòng): `| Vai trò | Tên font + độ đậm | Độ tin cậy | Tiếng Việt | Giấy phép | Nguồn tải chính thức | Thay thế có tiếng Việt |`. Kèm cách cài (chỉ link nguồn chính thức, không gửi file font): Windows chuột phải `.ttf`/`.otf` → "Install for all users" → mở lại phần mềm; Mac nhấp đúp → "Install Font"; CapCut máy tính/DaVinci/Premiere dùng font hệ thống sau khi mở lại; CapCut điện thoại dùng font có sẵn hoặc mục nhập font. Câu thử sau cài: "ẤN TƯỢNG · đầu tư · Quận Tân Phú · 1,3 TỶ · nhà hẻm xe hơi". Khi dựng bằng code: chạy `dung-video/assets/textfx-kit/scripts/vn_font_gate.py`.
9. **Giấy phép (thông tin):** Google Fonts (OFL) dùng thương mại được; SVN-/UTM- thường không rõ quyền → ghi cảnh báo và luôn kèm một font OFL thay thế.
10. **Ghi lại** vào `HDRE_Library/fonts.md`; Dũng nhắn "Font đúng là <tên>" → ghi kiểm chứng (Sổ tay, Đối chiếu).

### B6. Báo cáo (khi gọi riêng; chỉ phần Dũng đã chọn)
Thứ tự: Tóm tắt 3 dòng → Bảng hiệu ứng → Nhạc → Phiếu font → Màu & nhịp → **Áp dụng cho video BĐS của Dũng** (học gì, bỏ gì, mã E/MG/TR, loại BĐS nào) → Điều chưa chắc. Gọn, đọc được trên điện thoại.
Câu hỏi cuối (bỏ qua nếu đã chọn B10 ở B0 hoặc đã trả lời cho cùng video): "Anh có cần em viết **prompt dựng lại video giống toàn bộ cấu trúc mẫu** này không?" `Không cần` | `Có`. Phiên không người xem: không tự viết, để câu hỏi cuối báo cáo.

### B7. Tái tạo & cải tiến (khi Dũng chọn, hoặc /dung-video cần hiệu ứng chưa có công thức)
1. Chọn 1-3 hiệu ứng đáng học nhất theo giá trị bán hàng và tính khả thi, nêu lý do. Dũng thích "hiệu ứng và bố cục chữ" cả bộ → dựng lại toàn bộ hệ chữ (như E1-E9).
2. Công thức: thời lượng, easing, vị trí, cỡ chữ (% chiều cao khung), màu theo nhận diện Dũng.
3. Làm thử trên footage của Dũng (hoặc nền ghi rõ "nền minh họa"): clip ≤10s/hiệu ứng, ≥720p, fps theo khung xuất, có SFX ngay bản đầu, -16 LUFS. Cách dựng nhanh đã kiểm chứng: trang HTML có `render(t)` + Playwright chụp từng khung 60fps → ffmpeg ghép; hoặc recipe HyperFrames `dung-video/assets/textfx-kit/recipes/`. Mẫu sẵn: `HDRE_Library/mg_kit/hieu_ung_chu/fx.html`, `sfx.py`.
4. So song song bản gốc và bản làm lại cùng thời điểm; khi có script thì chấm bằng `measure.py`/`score.py`.
5. Ghi dự đoán điểm rồi tự chấm 1-5 theo 5 tiêu chí: giống thời gian/nhịp; giống chuyển động; dễ đọc (dấu không cắt, vùng an toàn); hợp nhận diện; phục vụ thông điệp bán hàng.
6. Trình MỘT bản: giống mẫu và sửa luôn điểm yếu của mẫu (chữ quá nhanh, che chủ thể, rối, dấu bị cắt, sai vùng an toàn), ghi rõ đã sửa gì. Không đưa hai bản để chọn.
7. Ghi vào sổ tay; hiệu ứng Dũng duyệt → đề xuất mã mới cho thư viện (chờ Dũng duyệt).

### B10. Prompt dựng lại video giống mẫu
Mục tiêu: một prompt **tự đứng được** mô tả toàn bộ cấu trúc mẫu tới từng mốc, để dựng ra video cùng nhịp, bố cục, kiểu chữ, chuyển cảnh, hiệu ứng, âm thanh, màu — với nội dung, cảnh quay, nhạc của Dũng.
1. **Hỏi một lần (chỉ phần chưa rõ):** dùng cho đâu: `Claude dựng bằng code (/dung-video)` | `CapCut máy tính` | `AI tạo video (Higgsfield/Seedance/Kling…)` | `Đủ cả 3` (mặc định code + CapCut); nội dung: `Cảnh quay + lời thoại của anh` | `Thông số căn nhà, chưa quay` (kèm danh sách cảnh cần quay) | `Để trống`. Prompt cho Claude/CapCut viết tiếng Việt; prompt cho AI tạo video viết tiếng Anh, chữ trên hình giữ tiếng Việt có dấu.
2. **Điều kiện:** có số đo toàn bộ video (B2-B5) và bản đồ cấu trúc (B3b); thiếu thì tự đo bổ sung. Mốc chính xác tới 0,1s; phần ước lượng ghi độ tin cậy ngay trong prompt.
3. **9 khối bắt buộc:** (1) thông số kỹ thuật: 9:16, độ phân giải, 60fps, thời lượng mẫu, LUFS, vùng an toàn; (2) tóm tắt nhịp: F1-F4 gần nhất, số shot, shot TB/trung vị, sự kiện thị giác/giây, đường cong năng lượng; (3) **bảng dòng thời gian**: `| # | Giây | Vai trò | Cảnh cần dùng (cỡ, góc, chuyển động máy) | Lời thoại (ô điền của Dũng) | Chữ (nội dung, font + độ đậm, cỡ %, vị trí, màu, vào/ra, số khung) | MG/E (mã) | Chuyển cảnh (TR, số khung, easing) | SFX (loại, mốc, lớp) | Nhạc (phách, lên/hạ, ducking) |`; (4) hệ chữ từ phiếu font (kèm thay thế OFL có tiếng Việt), ưu tiên mã E1-E9, không nền sau chữ; (5) chuyển cảnh & chuyển động với tham số làm lại được (không punch-in/rung footage); (6) âm thanh: đặc điểm nhạc + gợi ý tìm bài tương tự, mức nhạc/giọng, SFX theo mốc theo `textfx-kit`; (7) màu theo số đo `signalstats`, hướng xử lý D-Log; (8) ánh xạ nội dung của Dũng: từng đoạn mẫu ↔ take/cảnh của Dũng (hoặc danh sách cảnh cần quay trên DJI Pocket 4), hook/CTA lấy từ lời thoại thật, số liệu chưa xác minh để `[CẦN XÁC MINH]`; (9) ràng buộc: toàn bộ luật cứng của `dung-video` + tự kiểm mục 5.
4. **Theo công cụ đích:** code → thêm JSON/bảng mốc theo khung để `dung-video` dựng thẳng; CapCut → bước thao tác theo track, tên hiệu ứng CapCut gần nhất, chỗ CapCut không làm được và cách thay; AI tạo video → mỗi cảnh một prompt (chủ thể, bối cảnh, chuyển động máy, ánh sáng, thời lượng), cảnh có người dẫn dùng cảnh quay thật, chữ/MG/SFX ghép ở bước dựng.
5. **Tự kiểm trước khi gửi:** tổng thời lượng các dòng = thời lượng mẫu (±0,2s; có sửa điểm yếu thì ghi chênh lệch và lý do); mọi cú cắt, sự kiện thị giác, SFX đo được đều có dòng ("X/X sự kiện đã đưa vào prompt"); chữ có dấu đọc đủ, trong vùng an toàn; mọi mã tồn tại hoặc ghi "MỚI" kèm công thức; không còn nội dung, footage, nhạc, logo, template của mẫu.
6. **Gửi & lưu:** prompt trong một khối mã (dài thì kèm file `.md`) + 2-3 dòng: công cụ đích, phần còn ước lượng. Lưu `HDRE_Library/prompts/<ten-video-mau>_<công cụ>.md`. Cuối hỏi: "Anh muốn em dựng luôn từ prompt này không?" — Có thì chuyển `/dung-video`.

## Mẫu Thẻ phong cách (một nơi lưu chung: `asset/phong_cach/the/<ma>-<ten>.md`)
```
Mã / Tên:
Nhóm: talking head | motion graphics | animation | edit khác
Hợp nội dung: (kể chuyện, chia sẻ, Q&A, pháp lý, review nhà...)
Bằng chứng độ phổ biến: URL, nền tảng, ngày, chỉ số [XM] hoặc "chưa xác minh"
Cấu trúc theo giây: hook / thân / chốt
Nhịp cắt (cú/10s):  Chữ:  Chuyển cảnh:  MG:  B-roll:  SFX:  Nhạc:  Màu:   (dùng mã Từ điển / E / MG / TR)
Font (từ phiếu font):
Cách quay cần có (góc máy, ánh sáng, mic):
Rủi ro / không hợp khi:
Kế hoạch dựng lại bằng footage của Dũng:
Kết quả đo trên kênh Dũng:
Nhãn tin cậy: [XM] / [MT] / [ĐX]
```

## Sổ tay & tự huấn luyện
Thư mục `HDRE_Library/` trên máy Dũng (đường dẫn trong `assets_path.txt`; chưa có thì hỏi một lần):
- `recipes/<mã>_<tên>.md` công thức hiệu ứng (nguồn, tham số, cách làm, phiên bản, điểm Dũng chấm, số lần dùng) · `fonts.md` danh bạ font · `analysis_log.md` video đã phân tích + kết quả kiểm chứng · `structures/` bản đồ cấu trúc · `prompts/` prompt dựng lại · `mg_kit/` (3D clay, icon, `hieu_ung_chu/` E1-E9) · `training/` dùng chung với habit-memory (`rules.md` luật ghi `Phạm vi: style-scout`, `feedback_log.md`, `predictions.csv`, `reviews/`).
- Thẻ phong cách và Từ điển hiệu ứng ở `asset/phong_cach/` (chung với auto-style-learner, đọc bởi `/dung-video`).

Vòng huấn luyện (mỗi lần phân tích/tái tạo, tự chạy):
1. **Nạp:** `training/rules.md` (lọc `style-scout`), công thức liên quan, `fonts.md`, 5 dòng cuối `analysis_log.md`; dùng luật "dấu hiệu → kết luận" để rút ngắn đo.
2. **Quan sát:** chỉ ghi dữ kiện đo được.
3. **Giả thuyết & kiểm chứng:** ≥2 giả thuyết hoặc 2 cách làm; thử nhỏ, đo, so song song; loại cái không khớp.
4. **Dự đoán & kết luận** kèm độ tin cậy; tái tạo/prompt thì ghi điểm dự đoán vào `predictions.csv`.
5. **Đối chiếu** khi Dũng xác nhận/sửa (font thật, bài thật, cách làm đúng, điểm chấm).
6. **Chẩn đoán** nhận định sai (khung trích quá thưa, nhầm hai kiểu chuyển cảnh, chữ quá nhỏ…) → `feedback_log.md`.
7. **Cập nhật luật** theo điểm tin cậy của habit-memory (mục 3); cuối báo cáo 1-3 dòng `🧠 Đã học: …` nếu có điều mới. Công thức chấm ≥4 ở ≥2 video → "Chuẩn"; <3 điểm hai lần → "Bỏ".
Thước đo (mỗi 5 video hoặc "Báo cáo huấn luyện lab"): tỷ lệ nhận định hiệu ứng đúng, tỷ lệ tên font đúng (vị trí 1 và top 3), số lần thử đến khi Dũng hài lòng, điểm TB bản tái tạo, điểm giống của prompt → `training/reviews/`.
Chưa kết nối máy: cuối phản hồi khối `📌 BÀI HỌC CẦN LƯU` + gửi file sổ tay đã cập nhật.
