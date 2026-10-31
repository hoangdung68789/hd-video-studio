# hoang-dung-video-effect-lab — Bước 2–8: thu dữ liệu, phân tích, nhạc, font, báo cáo, tái tạo, tự huấn luyện

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

### Bước 2: Thu dữ liệu đo được
- `ffprobe`: độ phân giải, fps, thời lượng, tỷ lệ khung.
- Điểm cắt: `ffmpeg -i in.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null -` → mốc cắt, độ dài từng shot, nhịp trung bình.
- Khung hình: ảnh tổng hợp toàn video; quanh mỗi điểm cắt và mỗi lần chữ/đồ họa xuất hiện, trích dày (10-30 khung/giây trong ±0,5 giây) để thấy cách chuyển cảnh và cách chữ chuyển động.
- Màu: `signalstats` theo từng shot (độ sáng, bão hòa, ám màu).
- Âm thanh: độ lớn (`ebur128`), khoảng lặng, độ lớn nhạc so với giọng; nhịp/BPM ước lượng bằng thư viện phân tích âm thanh (ví dụ librosa, xin phép nếu cần cài; không cài được thì ước lượng bằng numpy).
- Lời thoại: ưu tiên **faster-whisper** trên máy Dũng (đã cài sẵn; cấu hình như Bước 2.0b của skill master: `language="vi"`, `word_timestamps=True`, `vad_filter=True`), sau đó mới tới Whisper/Whisper.cpp. Môi trường đám mây thường chặn tải mô hình (mạng chỉ cho vào một số trang; kho cài đặt trả lỗi 403). Thứ tự: (1) máy Dũng đã kết nối → chạy faster-whisper trên máy Dũng (thiếu thì xin phép cài); (2) nhờ Dũng gửi bản lời hoặc phụ đề `.srt`/`.txt` (ví dụ CapCut “Tự động tạo phụ đề” rồi xuất); (3) đọc phụ đề in trên khung hình (1 khung/giây) và ghi rõ đoạn nói không có phụ đề thì thiếu lời.
- Video mẫu dạng hậu trường (thành phẩm nằm giữa nền mờ, có timeline bên dưới): cắt riêng vùng thành phẩm trước khi đo cắt cảnh và sự kiện thị giác (với file 576×1024 của bộ ME4REAL: `crop=380:673:98:47`); phóng to timeline để đọc tên file nhạc/SFX làm bằng chứng (luật R-L008, R-L009).
- Ngoài cú cắt cứng, đếm cả **sự kiện thị giác** (chữ, đồ họa, chuyển cảnh) bằng ngưỡng thấp, ví dụ `select='gt(scene,0.06)'` trên vùng thành phẩm — nhịp của video BĐS thường đến từ đồ họa chứ không chỉ từ cú cắt.
- AI “xem” qua khung hình trích và “nghe” qua số đo, không xem liên tục như người — nói rõ điều này khi một kết luận phụ thuộc vào nó.

### Bước 3: Phân tích hiệu ứng & chuyển cảnh
Nhóm cần soi: chuyển cảnh (hard cut, whip, zoom, mask, match cut, glitch...); chuyển động khung (zoom/pan giả lập, rung nhịp, speed ramp, freeze); chữ (cách xuất hiện, nhấn từ khóa, phụ đề); motion graphic (thẻ, bản đồ, line, 3D, chữ bám vật thể); lớp phủ (ánh sáng, hạt, khung); đồng bộ nhạc (cắt theo beat, SFX).
Bảng: `| Mốc | Loại hiệu ứng | Mô tả | Bằng chứng (khung/số đo) | Độ tin cậy | Cách làm lại (FFmpeg / CapCut / DaVinci / Premiere) | Mã MG/BR/E tương ứng |`. Mã MG/BR lấy từ thư viện của skill master, mã E từ Bước 9.9; hiệu ứng chưa có mã thì ghi “MỚI”.

### Bước 3b: Bản đồ cấu trúc video mẫu (khi Dũng chọn “Nhân bản cấu trúc”)
1. Từ số đo Bước 2-3, chia video mẫu thành các đoạn theo vai trò (Hook, vị trí, nhà, giá/pháp lý, bằng chứng, CTA).
2. Ghi `HDRE_Library/structures/<ten-video-mau>.md`: `| Đoạn | Giây | Vai trò | Thời lượng shot TB | Sự kiện thị giác/giây | Chữ/MG (mã) | Chuyển cảnh (TR) | SFX | Nhạc (phách, cao trào) | Host trên hình |`, kèm tổng: thời lượng, nhịp trung bình, LUFS, công thức F1-F4 gần nhất.
3. Ghi điểm yếu của mẫu (chữ quá nhanh, che chủ thể, rối, dấu bị cắt, thiếu câu nhử…) để bản B “vượt mẫu” sửa.
4. Chuyển bản đồ cho skill master Nhánh D để ghép take và cảnh của Dũng; chỉ học cấu trúc và kỹ thuật, không dùng footage, nhạc, logo, template của mẫu.

### Bước 4: Nhạc nền & âm thanh
1. **Tên bài:** AI không nhận dạng bài hát bằng cách nghe. Nguồn xác nhận hợp lệ: tên âm thanh hiển thị trên trang video, Dũng xem tên âm thanh trong app, hoặc Dũng dùng Shazam / tính năng tìm bài hát khi phát video. Chưa có nguồn thì ghi `[Chưa xác minh tên bài]`, không đoán.
2. **Đặc điểm đo được:** BPM ước lượng, điểm cao trào/drop, có lời hay không lời, thể loại và cảm xúc (nêu là nhận định), mức nhạc so với giọng, chỗ hạ nhạc, tỷ lệ cú cắt trùng nhịp, SFX và vị trí.
3. **Gợi ý dùng:** từ khóa tìm bài tương tự trong thư viện nhạc CapCut/TikTok; lưu ý bản quyền khác nhau giữa TikTok, Facebook, YouTube.
4. Không chép lời bài hát vào báo cáo; không tách hay tải nhạc từ video người khác để dùng lại. Nhạc cho video của Dũng do skill master tìm theo Bước 2.4b (nhịp theo kiểu dựng, giấy phép rõ, không lặp bài 5 video gần nhất).

### Bước 5: Tìm đúng tên font & phiếu thông tin font
Nhiệm vụ: tìm **đúng tên font** (họ font + độ đậm) của từng kiểu chữ trong video mẫu và đưa Dũng đủ thông tin để tự cài nếu máy chưa có. Không chỉ gợi ý font na ná; khi chưa đủ bằng chứng thì nói rõ đang ở mức tin cậy nào và vẫn đưa font thay thế hợp lệ.
1. **Lấy mẫu chữ:** mỗi kiểu chữ một mẫu, lấy khung chữ đã đứng yên (không nhòe chuyển động); cắt sát và phóng to 3-4 lần (`crop=…,scale=iw*4:-1:flags=lanczos`). Chữ 3D nghiêng thì xoay/nắn thẳng trước khi so. Ưu tiên mẫu có chữ đặc trưng: a, g, t, y, R, G, Q, số 1/3/4/7, và chữ có dấu chồng (ầ ố ệ ự ỷ).
2. **Mô tả nét:** có chân/không chân, hình học hay mềm, độ đậm, độ rộng, viền, đổ bóng, màu, cách tô từ khóa, vị trí và cỡ chữ. Dấu hiệu phân biệt nhanh: `a` một tầng hay hai tầng; đầu `t` cắt xiên hay bằng; `G` có cựa không; đuôi `y`, `g`; số `1` có cờ không; chữ `O` tròn hình học hay ô van; khoảng cách chữ.
3. **Phép thử dấu tiếng Việt:** font không có dấu tiếng Việt thì phần mềm thay chữ có dấu bằng font khác, nên chữ có dấu trông lệch nét. Chữ có dấu chồng khớp hoàn toàn → font đang dùng có hỗ trợ tiếng Việt. Tra bộ ký tự (subset) của ứng viên (Google Fonts, ví dụ qua `gwfh.mranftl.com/api/fonts/<tên>`); ứng viên gốc không có `vietnamese` mà video vẫn hiện đúng dấu → kết luận “bản Việt hóa hoặc font tích hợp trong phần mềm”, không kết luận là bản gốc.
4. **Lập danh sách ứng viên (3-6 font):** (a) font tích hợp trong phần mềm người dựng hay dùng (CapCut, DaVinci…); (b) Google Fonts có subset `vietnamese`; (c) font Việt hóa phổ biến (tiền tố SVN-, UTM-, iCiel…) — chỉ ghi tên, kèm cảnh báo giấy phép; (d) kết quả công cụ nhận dạng ở mục 6.
5. **So dựng chữ song song (bước quyết định):** gõ đúng câu trong video bằng từng ứng viên, cùng cỡ, đặt cạnh mẫu cắt (`hstack`/`vstack`), so từng dấu hiệu ở mục 2, loại ứng viên lệch. Nơi dựng: font có sẵn trong môi trường làm việc; máy Dũng qua kết nối máy (chỉ đọc thư mục font: Windows `C:\Windows\Fonts`, `%LOCALAPPDATA%\Microsoft\Windows\Fonts`; Mac `~/Library/Fonts`, `/Library/Fonts`); hoặc file font Dũng tải lên. Môi trường đám mây thường bị chặn tải font từ internet (npm/Google Fonts đều bị chặn) — khi đó nói rõ và dùng font có sẵn: Inter/Inter Display (có tiếng Việt, đủ Black), TeX Gyre Chorus (chữ viết tay có dấu), Lora; Poppins có sẵn nhưng KHÔNG có dấu tiếng Việt.
6. **Công cụ nhận dạng (Dũng tự chạy, AI chuẩn bị ảnh):** WhatTheFont (myfonts.com), Font Squirrel Matcherator, WhatFontIs. Ảnh gửi công cụ: 1 dòng chữ, nền tương phản, chữ đã nắn thẳng, ưu tiên đoạn ít dấu. Kết quả từ công cụ vẫn phải qua mục 5.
7. **Độ tin cậy:** **Cao** = khớp ≥5 dấu hiệu ở mục 5 và qua phép thử dấu, hoặc có nguồn xác nhận (tên font trong project, người dựng nói, Dũng xác nhận). **Trung bình** = cùng dáng chung, khớp 2-4 dấu hiệu, chưa so được hết. **Thấp** = chỉ cùng nhóm (ví dụ “script nối nét, tương phản cao”). Mức Trung bình và Thấp không được trình bày như tên chính xác.
8. **Phiếu thông tin font** (mỗi kiểu chữ một dòng):
   `| Vai trò trong video | Tên font + độ đậm | Độ tin cậy | Tiếng Việt | Giấy phép | Nguồn tải chính thức | Thay thế hợp lệ có tiếng Việt |`
   Kèm cách cài (chỉ đưa link nguồn chính thức, không gửi file font):
   - Windows: tải từ nguồn chính thức → giải nén → chuột phải file `.ttf`/`.otf` → “Install for all users” → mở lại phần mềm dựng.
   - Mac: nhấp đúp file font → “Install Font” (Font Book) → mở lại phần mềm dựng.
   - CapCut máy tính, DaVinci, Premiere: dùng font hệ thống sau khi mở lại phần mềm; Premiere còn dùng được Adobe Fonts đã kích hoạt.
   - CapCut điện thoại: dùng font có sẵn trong app, hoặc mục nhập font nếu bản app có; không có thì dùng font thay thế có sẵn.
   - Kiểm tra sau cài: gõ câu thử “ẤN TƯỢNG · đầu tư · Quận Tân Phú · 1,3 TỶ · nhà hẻm xe hơi” và xem dấu có đủ, có bị cắt không.
9. **Giấy phép:** Google Fonts (giấy phép OFL) dùng thương mại được. Font Việt hóa SVN-/UTM- là bản chỉnh sửa thêm dấu của font gốc (nhiều khi là font thương mại), giấy phép thường không rõ → không khuyên dùng cho video bán hàng khi chưa rõ quyền; luôn đưa kèm một font OFL thay thế.
10. **Ghi lại:** ghi kết quả vào `HDRE_Library/fonts.md` (vai trò, tên font, video nguồn, độ tin cậy, Dũng đã cài chưa, đúng/sai sau xác minh); khi Dũng nhắn “Font đúng là <tên>” thì chạy Bước 8 mục 5-7.

### Bước 6: Báo cáo (chỉ gồm phần Dũng đã chọn)
Thứ tự: Tóm tắt 3 dòng → Bảng hiệu ứng → Nhạc nền → Font (phiếu thông tin font) → Màu & nhịp → **Áp dụng cho video BĐS của Dũng** (nên học gì, bỏ gì, gắn với mã MG/BR/E và loại BĐS nào) → Điều chưa chắc chắn. Ngắn gọn, dễ đọc trên điện thoại. Báo cáo dài hoặc cần giữ lại thì đề nghị lưu thành tài liệu.

**Câu hỏi bắt buộc cuối báo cáo** (dùng câu hỏi lựa chọn nếu có công cụ; bỏ qua khi Dũng đã chọn `Viết prompt dựng lại giống mẫu` ở Bước 0, hoặc đã trả lời câu này cho cùng video mẫu):
> “Anh có cần em viết **prompt dựng lại video giống toàn bộ cấu trúc video mẫu** này không?”
> `Không cần` | `Có — prompt giống 100% mẫu` | `Có — giống mẫu + cải tiến điểm yếu` (bản B)
Dũng chọn “Có” thì chạy Bước 10. Phiên không có người xem: không tự viết prompt, ghi câu hỏi này ở cuối báo cáo để Dũng trả lời sau.

### Bước 7: Tái tạo & cải tiến (khi Dũng chọn)
1. Chọn 1-3 hiệu ứng đáng học nhất theo giá trị bán hàng và tính khả thi; nói lý do. Khi Dũng nói thích “hiệu ứng và bố cục chữ” của cả bộ video: dựng lại toàn bộ hệ chữ (như E1-E9 ở Bước 9.9).
2. Viết công thức: thời lượng, đường cong chuyển động, vị trí, cỡ chữ (% chiều cao khung), màu theo bộ nhận diện của Dũng.
3. Làm thử trên một đoạn footage của Dũng (hoặc khung mẫu / nền minh họa ghi rõ “nền minh họa”): clip thử ≤10 giây mỗi hiệu ứng, **≥720p, fps theo khung xuất** (60, hoặc 50 khi nguồn 50), **luôn kèm SFX** theo bảng SFX của hiệu ứng (luật R-L015) và chuẩn -16 LUFS. Cách dựng nhanh đã kiểm chứng: trang HTML có hàm `render(t)` + Playwright chụp từng khung 60fps → ffmpeg ghép; SFX tự tổng hợp bằng numpy (không vướng bản quyền) rồi ghép tiếng. Mẫu sẵn: `HDRE_Library/mg_kit/hieu_ung_chu/fx.html` và `sfx.py`.
4. So sánh song song bản gốc và bản làm lại tại cùng thời điểm (`hstack`/`vstack`), gửi ảnh so sánh (khung mẫu → 4 khung chuyển động của bản dựng lại + thông số bên dưới) + clip thử.
5. Trước khi gửi, ghi dự đoán (Bước 8.2, mục 4), rồi tự chấm 1-5 theo 5 tiêu chí: giống về thời gian/nhịp; giống về chuyển động; dễ đọc (dấu tiếng Việt không bị cắt, nằm trong vùng an toàn); hợp bộ nhận diện; phục vụ thông điệp bán hàng.
6. Khi Dũng chọn cải tiến: làm thêm bản B sửa điểm yếu của bản gốc (chữ đi quá nhanh, che chủ thể, quá rối, dấu bị cắt, sai vùng an toàn), giải thích vì sao tốt hơn; Dũng chọn A (giống) hay B (cải tiến).
7. Ghi vào Sổ tay (Bước 8). Hiệu ứng mới được Dũng duyệt thì đề xuất mã MG mới để bổ sung vào thư viện của skill master; việc cập nhật skill luôn chờ Dũng duyệt.
8. Chỉ học kỹ thuật và phong cách; không sao chép footage, logo, nhạc, template trả phí hay thiết kế nhận diện của người khác. Hiệu ứng làm lại vẫn tuân thủ quy tắc MG của skill master (mật độ, số liệu đã xác minh, vùng an toàn).

### Bước 8: Hệ thống Tự Huấn Luyện của Phòng Lab
“Tự huấn luyện” là AI tự rèn luyện qua sổ tay và phản hồi của Dũng: mỗi nhận định được kiểm chứng đúng/sai, mỗi lần tái tạo được chấm điểm, rồi biến thành luật có điểm tin cậy và được nạp lại trước lần sau. Mô hình AI gốc không thay đổi; năng lực tăng thêm nằm trong sổ tay, nên phải giữ gìn và mang theo khi đổi máy hoặc đổi AI. Kho dùng chung với skill `hoang-dung-bds-video-master` (Phần VI của skill đó: cùng thư mục `HDRE_Library/training/`, cùng quy tắc điểm).

#### 8.1 Nơi lưu
Thư mục `HDRE_Library/` trong thư mục tài nguyên trên máy Dũng (đường dẫn trong `assets_path.txt`; chưa có thì hỏi một lần). Toàn bộ là file Markdown/CSV thường.
- `recipes/<mã>_<tên>.md`: công thức hiệu ứng — mô tả, nguồn học (video nào, ngày), tham số, cách làm cho FFmpeg / CapCut / DaVinci / Premiere, phiên bản, điểm Dũng chấm, số lần dùng.
- `fonts.md`: danh bạ font — vai trò, tên font, video nguồn, độ tin cậy, nguồn tải, giấy phép, Dũng đã cài chưa, kết quả xác minh.
- `analysis_log.md`: mỗi video đã phân tích — ngày, nguồn, phạm vi, kết luận chính kèm độ tin cậy, kết quả kiểm chứng sau này (đúng / sai / chưa rõ).
- `training/rules.md`: luật học được (chung với skill master; luật của Lab ghi `Phạm vi: effect-lab`). Thay cho `lessons.md` cũ; nếu còn `lessons.md` thì chuyển từng dòng sang mẫu luật mới, điểm khởi đầu 50.
- `training/feedback_log.md`, `training/predictions.csv`, `training/experiments.md`, `training/reviews/`, `training/take_weights.csv`, `training/performance.csv`: dùng chung, cùng định dạng với skill master.
- `structures/<ten>.md`: bản đồ cấu trúc video mẫu (Bước 3b).
- `prompts/<ten-video-mau>_<A|B>_<công cụ>.md`: prompt dựng lại video giống mẫu (Bước 10), kèm phiên bản, ngày, điểm Dũng chấm độ giống.
- `mg_kit/hieu_ung_chu/`: bộ hệ chữ E1-E9 (`fx.html`, `sfx.py`, `HDRE_Quy_trinh_hieu_ung_chu.md`, 9 bảng so sánh E1-E9, clip demo có SFX).
Chưa kết nối máy: cuối phản hồi thêm khối `📌 BÀI HỌC CẦN LƯU` và gửi file sổ tay đã cập nhật để Dũng giữ; lần sau nhờ Dũng gửi lại, hoặc khi máy kết nối thì chép vào `HDRE_Library/` (thư mục mặc định cho file Claude tạo: `~\Claude`).

#### 8.2 Vòng huấn luyện 7 bước (mỗi lần phân tích và tái tạo)
1. **Nạp:** đọc `training/rules.md` (lọc `effect-lab`), các công thức liên quan, `fonts.md` và 5 dòng gần nhất của `analysis_log.md`. Dùng luật dạng “dấu hiệu → kết luận” để rút ngắn bước 2-3 (ví dụ: chuyển cảnh có vệt mờ ngang 3-4 khung → whip pan giả lập).
2. **Quan sát:** chỉ ghi dữ kiện đo được (mốc thời gian, số khung, màu, BPM, hình dạng nét chữ).
3. **Giả thuyết & kiểm chứng:** ít nhất 2 giả thuyết hoặc 2 cách làm; thử nhỏ, đo, so sánh song song; loại giả thuyết không khớp.
4. **Dự đoán & kết luận:** ghi kết luận kèm độ tin cậy (Cao / Trung bình / Thấp) và bằng chứng. Với tái tạo, ghi vào `predictions.csv` điểm Dũng sẽ chấm và bản A hay B sẽ được chọn.
5. **Đối chiếu:** khi Dũng xác nhận hoặc sửa (tên font thật, tên bài thật qua Shazam, cách làm đúng, điểm chấm, bản được chọn), ghi đúng/sai vào `analysis_log.md` và `predictions.csv`.
6. **Chẩn đoán:** nhận định sai thì tìm vì sao (khung trích quá thưa, nhầm hai kiểu chuyển cảnh giống nhau, chữ quá nhỏ để nhận dạng font, thiếu số đo âm thanh...) và ghi `feedback_log.md`.
7. **Cập nhật luật & báo ngắn:** tạo hoặc sửa luật theo quy tắc điểm ở 8.3; cuối báo cáo thêm 1-3 dòng `🧠 Đã học: …`. Không có gì mới thì không thêm.

#### 8.3 Quy tắc điểm tin cậy
- Luật AI rút ra từ một quan sát: 40 (Thử nghiệm). Luật Dũng nói thẳng (“Dạy AI: …”): 85 (Đã duyệt).
- Nhận định áp dụng luật được Dũng xác nhận đúng, hoặc bản tái tạo theo luật được chấm từ 4 trở lên (hoặc ≥80%): +15. Bị Dũng sửa ngược lại: −25.
- ≥70 = Đã duyệt (áp dụng mặc định); 40-69 = Thử nghiệm (ghi rõ khi dùng); dưới 30 hoặc bị bác 2 lần liên tiếp = Hết hiệu lực (giữ để không học lại sai).
- Công thức hiệu ứng được chấm từ 4 trở lên ở ít nhất 2 video thì đánh dấu “Chuẩn” và ưu tiên dùng; công thức dưới 3 điểm hai lần thì đánh “Bỏ”.
- Luật học được không bao giờ vượt các Gotchas (độ tin cậy, bản quyền, giấy phép font, ≥720p và fps theo khung xuất, file gốc chỉ đọc).

#### 8.4 Thước đo tiến bộ & ôn tập
- Theo dõi: tỷ lệ nhận định hiệu ứng đúng, tỷ lệ tên font đúng (đúng ở vị trí 1 và trong top 3), số lần thử đến khi Dũng hài lòng, điểm trung bình bản tái tạo, tỷ lệ Dũng chọn bản cải tiến B.
- Sau mỗi 5 video phân tích, hoặc khi Dũng nhắn “Báo cáo huấn luyện lab”: tóm tắt các thước đo trên (so 5 lần gần nhất với 5 lần trước), luật mạnh nhất, luật bị loại, công thức “Chuẩn” mới, 1-3 việc tập trung tới. Lưu vào `training/reviews/`.
- Công thức “Chuẩn” đủ quan trọng thì đề xuất mã MG mới cho skill master; luật ổn định thì đề xuất đưa vào SKILL.md. Mọi thay đổi skill chỉ là đề xuất chờ Dũng duyệt.

#### 8.5 Lệnh
“Báo cáo huấn luyện lab” · “Dạy AI: <luật>” · “Xem luật lab” · “Quên luật R-xx” · “Font đúng là <tên>” / “Bài đúng là <tên>” (ghi kết quả kiểm chứng) · “Chấm bản tái tạo: <1-5>” · “Viết prompt dựng lại” (Bước 10, cho video mẫu gần nhất) · “Chấm prompt: <1-5>” (độ giống của video dựng từ prompt so với mẫu) · “Dùng hệ chữ E1-E9” (áp Bước 9.9 cho video đang dựng).

