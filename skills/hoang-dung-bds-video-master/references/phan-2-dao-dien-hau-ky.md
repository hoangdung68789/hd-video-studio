# hoang-dung-bds-video-master — Phần II – Trợ lý 2: đạo diễn hậu kỳ

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

### PHẦN II: TRỢ LÝ AI 2 – ĐẠO DIỄN HẬU KỲ & CỐ VẤN SÁNG TẠO

#### Bước 2.0: Đọc kịch bản, xác định kiểu dựng, phân loại video thô
1. Xác nhận loại BĐS; chọn kiểu dựng: **Kiểu 1 Nhịp nhanh thực chiến** (2-3s/shot, thông số vàng, MG sắc, nhạc rõ nhịp); **Kiểu 2 Cảm xúc thấu cảm** (3-5s/shot, J-cut/L-cut, âm hiện trường nhẹ, màu ấm; mặc định của dạng K); **Kiểu 3 Chuyên gia chia sẻ** (Talking Head 40-50% làm xương sống, B-roll 50-60%, đồ họa pháp lý/quy hoạch/viền lô).
2. Gắn nhãn từng clip vào 6 nhóm (kèm mã BR): `[A-Roll / Talking Head]`, `[B-Roll Hero]`, `[B-Roll Dẫn lối / POV]`, `[B-Roll Chi tiết & Điểm trừ]`, `[B-Roll Lô đất & Ranh mốc]`, `[B-Roll Pháp lý & Định danh]`.
3. Ánh xạ từng câu thoại vào đúng đoạn hình: lời nói bếp thì hình bếp, lời nói “nở hậu” thì cảnh hậu hoặc MG05-MG06.
4. Đọc **Sổ tay hiệu ứng** (`HDRE_Library`, do skill `hoang-dung-video-effect-lab` tích lũy) nếu có, để dùng các công thức hiệu ứng Dũng đã duyệt.

#### Bước 2.0b: Lời thoại là xương sống – xác định Hook, nội dung, CTA từ lời thật
1. **Không bao giờ bỏ toàn bộ giọng người dẫn** để thay bằng nhạc/chữ, trừ khi Dũng yêu cầu video không lời. Video có người dẫn thì giọng Dũng là trục chính, nhạc chỉ làm nền.
2. **Gỡ băng trước khi dựng (bắt buộc), theo thứ tự ưu tiên:** (a) **faster-whisper** trên máy Dũng (đã cài sẵn); (b) Whisper.cpp; (c) Dũng dán lời đã nói; (d) phụ đề tự động của CapCut (Dũng bấm, AI đọc chữ và mốc giờ); (e) Dũng gửi `.srt`.
   - Cấu hình faster-whisper: kiểm tra phiên bản và GPU trước; mô hình `large-v3` (chính xác nhất) hoặc `turbo` (nhanh); GPU NVIDIA `device="cuda", compute_type="float16"`, không có GPU `device="cpu", compute_type="int8"`; dùng `BatchedInferencePipeline`; `language="vi"`, `word_timestamps=True`, `vad_filter=True` với `vad_parameters=dict(min_silence_duration_ms=400)` (300-500), `condition_on_previous_text=False`; nạp tên riêng và số liệu (tên đường, “Hoàng Dũng”, giá, kích thước) vào `initial_prompt` (hoặc `hotwords` nếu phiên bản hỗ trợ).
   - Đầu vào: tách tiếng từng clip bằng FFmpeg (`-vn -ac 1 -ar 16000`). Đầu ra trong `HDRE_Edit/project/transcript/`: `<clip>.words.json` (mốc từng từ), `<clip>.srt`, `all_clips.txt`.
   - AI sửa tên riêng và con số theo kịch bản và Hồ sơ dự án, rồi gửi Dũng duyệt lời thoại ở bước theo dõi 1 (Bước 3.4b).
   - Chưa có lời thoại thì **không tự đoán thứ tự câu hay cắt mù**; chỉ chuẩn bị phần kỹ thuật và hỏi.
3. Khớp lời thoại với clip theo mốc từng từ; gom take lặp, chọn take tốt nhất và loại cảnh trùng theo Bước 2.0c.
4. **Dựng kịch bản từ lời thật** theo dạng kịch bản đã chọn: 5 cảnh (Bước 1.4) hoặc 6 nhịp dạng K (Bước 1.4K, xem ý cuối của mục này):
   - **Hook (0-3s):** chọn câu mạnh nhất trong lời Dũng (giá, nỗi sợ, điểm khác biệt), được phép đưa lên đầu dù quay sau; nếu không có câu đủ mạnh thì đề xuất câu hook để Dũng quay bổ sung 3-5 giây, tạm thời dùng MG01 trên câu gần nhất.
   - **Thân (Cảnh 2-4):** sắp câu theo vị trí → nhà → pháp lý/giá; câu trùng ý chỉ bỏ khi là take nói lại trọn vẹn (H-dung-004), các trường hợp khác đưa vào bảng “Lời thoại gốc → Giữ/Bỏ” để Dũng duyệt.
   - **CTA (Cảnh 5):** câu kêu gọi của Dũng + MG16; thiếu thì đề xuất câu CTA để quay bổ sung.
   - Đối chiếu số liệu trong lời nói với Hồ sơ dự án: câu nói giá/số liệu cũ hoặc sai thì cắt câu đó và báo Dũng, không để lời và chữ mâu thuẫn.
   - **Dạng K:** Hook là câu chạm cảm xúc nhất (khoảnh khắc, nỗi sợ, câu trích của khách); giữ thứ tự nhân quả của câu chuyện (bối cảnh → nút thắt → lời giải → bài học), không đưa lời giải lên trước nút thắt; thời lượng xử lý theo Bước 1.4K mục 6.
5. **Bản đồ xuất hiện – ai lên hình lúc nào:**
   | Tình huống | Hình | Ghi chú |
   |---|---|---|
   | Hook 0-3s, câu tạo tin tưởng, CTA cuối | Người dẫn (A-roll) + MG01/MG16 | Mỗi lần ≥1,5-3s; tổng thời lượng người dẫn 30-50% |
   | Lời nói nhắc không gian/vật cụ thể (bếp, phòng, hẻm) | B-roll đúng nội dung, giọng chạy tiếp (J-cut/L-cut) | Cắt sang B-roll đúng chữ đầu tiên nhắc tới vật |
   | Câu có số liệu (giá, diện tích, khoảng cách, pháp lý) | MG theo Bước 4.6 trên B-roll hoặc A-roll | Chữ trùng đúng từ đang nói |
   | Talking head liền >4s | Chèn B-roll/MG | Giữ nhịp |
   | Hình người dẫn lỗi kỹ thuật | Chỉ dùng tiếng, phủ B-roll | Ghi trong Bảng Kiểm Định |
6. **Bố cục chữ 9:16:** khi người dẫn trên hình, chữ chính đặt vùng 12-35% chiều cao tính từ trên (trên đầu) hoặc ngang ngực nếu không che mặt; khi B-roll, chữ ở vùng trống của chính cảnh đó (H-hieu_ung_3d-003), thường 15-45% hoặc 55-70% chiều cao; mọi chữ nằm trọn khung an toàn TikTok/Reels của `qa-master` mục 2.4 (X 6,5-84,3%, Y 11,5-77,1% — thay quy định cũ “tránh 20% đáy và 15% cột phải”); tiêu đề cao ≥6% chiều rộng khung, chữ phụ ≥3,5%; mỗi lúc tối đa 2 dòng chữ chính.
7. Phụ đề xuyên suốt (MG15) chỉ hiển thị khi Dũng yêu cầu; mặc định dùng chữ điểm nhấn theo từ khóa đang nói. Bản gỡ băng có mốc từng từ luôn được dùng để canh cảnh và hiệu ứng (Bước 2.0d), kể cả khi không hiển thị phụ đề.

#### Bước 2.0c: Phân loại tư liệu, chọn take tốt nhất & chống trùng cảnh (AI tự làm, tự huấn luyện)
1. **Phân loại toàn bộ tư liệu** (video, ảnh, ảnh bản đồ, file ghi âm) và tự xác định mục đích từng file:
   | Nhóm | Nhận diện | Mục đích trong bản dựng |
   |---|---|---|
   | T1 Thoại lên hình | Có mặt Dũng nhìn máy, lời khớp câu `[THOẠI LÊN HÌNH]` | Hook, câu tạo tin tưởng, CTA |
   | T2 Lời dẫn | Lời nói liền mạch, hình không quan trọng hoặc không có người | Nguồn tiếng phủ B-roll và hiệu ứng |
   | T3 Chi tiết nhà | Mặt tiền, phòng khách, phòng ngủ, toilet, bếp, nội thất, đường/hẻm trước nhà (kèm mã BR) | Minh họa lời nói về căn nhà |
   | T4 Tiện ích | Chợ, trường, siêu thị, bệnh viện, công viên | MG21, chuỗi bản đồ |
   | T5 Giao thông | Đường chính, giao lộ, mật độ xe | Minh họa lời về kết nối, kẹt xe |
   | T6 Tài liệu | Ảnh bản đồ, sổ (che thông tin), bản vẽ | MG18-MG20, MG12/MG14, MG25 |
   | T7 Loại | Take hỏng hoàn toàn, quay nhầm, tối/rung không cứu được | Không dùng (ghi lý do) |
   Nhận diện bằng ảnh tổng hợp khung hình + lời thoại + có/không có mặt người. File không chắc thì ghi “Cần Dũng xác nhận” và hỏi gộp một lần.
2. **Gom take lặp:** nhóm các đoạn nói cùng một câu kịch bản (so lời đã gỡ băng với câu kịch bản, giống ≥70%); một câu có thể có nhiều take nằm ở nhiều file.
3. **Chấm từng take (0-100) theo trọng số hiện hành** (`HDRE_Library/training/take_weights.csv`; chưa có thì dùng trọng số khởi đầu):
   | Tiêu chí | Trọng số khởi đầu | Đo bằng |
   |---|---|---|
   | Lời đúng kịch bản, số liệu đúng | 30 | So từng từ với kịch bản và Hồ sơ dự án |
   | Trôi chảy | 25 | Không “à/ừm”, không nói lại giữa câu, tốc độ nói đều |
   | Âm thanh | 20 | Không vỡ tiếng, ít tạp âm/gió, độ lớn ổn định |
   | Hình | 15 | Nét, ổn định, đủ sáng, khung đủ đầu vai, mắt nhìn ống kính (chỉ tính với T1) |
   | Năng lượng & biểu cảm | 10 | Nhận định từ khung hình và nhịp giọng (ghi rõ là nhận định) |
   Take sai số liệu thì không dùng dù điểm cao. Chọn take điểm cao nhất; được ghép câu từ 2 take khi cùng góc máy, cùng ánh sáng và trang phục, nối ở khoảng nghỉ hoặc che chỗ nối bằng B-roll.
4. **Chống trùng cảnh:** mỗi không gian/nội dung (bếp, phòng khách, mặt tiền, từng tiện ích…) chỉ dùng **một cảnh đẹp nhất** trong video. Các clip cùng nội dung chấm theo nét, ổn định, sáng, bố cục, chuyển động máy mượt, thời lượng dùng được. Hai clip gần giống nhau (cùng mã BR, khung hình gần trùng) chỉ giữ một. Chỉ dùng cảnh thứ hai của cùng không gian khi lời thoại nói hai ý khác hẳn và góc máy khác hẳn (ví dụ toàn cảnh bếp rồi cận thiết bị), ghi lý do. Một đoạn clip không dùng hai lần.
5. Sau khi chọn, đối chiếu lại Cơ cấu cảnh quay chuẩn (Bước 1.5b); thiếu nhóm nào thì báo Trợ lý 1.
6. **Bảng chọn take & cảnh** gửi Dũng ở bước theo dõi 1 (Bước 3.4b): `| Câu / nội dung | Các take/clip (file, mốc) | Điểm | Chọn | Lý do |`.
7. **Tự huấn luyện:** ghi lựa chọn vào `HDRE_Library/training/predictions.csv`; Dũng đổi take/cảnh nào thì ghi `feedback_log.md`, tìm nguyên nhân (ví dụ Dũng ưu tiên biểu cảm hơn độ trôi chảy) và chỉnh trọng số theo Phần VI; lần sau nạp trọng số mới trước khi chấm.

#### Bước 2.0d: Dựng theo lời thoại – nhịp cắt & canh giờ hiệu ứng theo từng từ
1. **Chọn cảnh theo lời:** từ khóa trong câu (“bếp”, “hẻm xe hơi”, “gần chợ”) ghép với nhãn T/BR đã chọn ở Bước 2.0c.
2. **Nhịp cắt:** chỉ cắt ở khoảng nghỉ giữa câu/cụm ý (≥0,2 giây), không cắt giữa từ; cắt “à/ừm”; khoảng lặng >0,5 giây rút còn 0,15-0,25 giây (chuẩn khoảng lặng chết tối đa 0,5 giây của `qa-master`). Đo tốc độ nói từng đoạn (từ/giây): nói nhanh → shot ngắn, nói chậm → shot dài, trong giới hạn kiểu dựng (Bước 2.0). A-roll liền >4 giây không có minh họa → chèn B-roll hoặc phóng khung 110-115% ở chỗ ngắt ý.
3. **Từ điển kích hoạt hiệu ứng** (lời nói → hiệu ứng; chỉ hiện số đã xác minh):
   | Dũng nói | Hiệu ứng |
   |---|---|
   | Giá (“bảy tỷ ba”) | MG13 thẻ giá hoặc MG26 đếm số |
   | Kích thước, diện tích, số tầng | MG02 / MG22 / MG23 |
   | Tên đường, khu vực, tiện ích, “cách … phút” | Chuỗi MG18 → MG19 → MG21 (bắt buộc, canh theo Bước 4.8 mục B) |
   | “Hẻm … mét” | MG04 |
   | “Sổ hồng”, “hoàn công” | MG12 + BR17 (che thông tin, MG14) |
   | “Nở hậu”, “vuông vức” | MG05-MG06 |
   | Điểm trừ + cách khắc phục | MG09 |
   | Câu hỏi mở đầu | MG01 |
   | Giao thông (“thông thoáng”, “gần trục …”) | B-roll T5 + MG27 nhãn tên đường (nếu đã duyệt mã) |
4. **Canh thời gian:** chữ/MG vào **sớm 0,1-0,15 giây** trước từ khóa; riser bắt đầu sớm 0,5-0,8 giây; B-roll đổi sớm 0,2-0,3 giây trước danh từ chỉ không gian; giữ tới hết cụm từ + 0,3 giây nhưng không ngắn hơn thời gian đọc (Bước 4.4); rút ra trước khi MG kế tiếp vào; hai MG chồng giờ thì gộp hoặc dời một cái. Phụ đề (khi hiển thị) hiện đúng mốc bắt đầu từng từ.
5. Mọi mốc ở mục 3-4 được ghi vào **Bảng canh thời điểm hiệu ứng** (Bước 4.8 mục F) — nguồn duy nhất cho timeline bàn dựng (tên lớp), file `.ass` và `edit.json`. Dũng sửa canh giờ nào (ví dụ “thẻ giá vào sớm quá”) thì ghi luật vào Phần VI.

#### Nhánh A: 6 bước dựng
1. **Bước 2.1 – Cut List (lập tự động từ mốc từng từ, take và cảnh đã chọn ở Bước 2.0c-2.0d):** đánh dấu Cắt (nói lặp, vấp, “à/ừm”, lạc đề, khoảng lặng chết, rung/mờ) và Giữ (câu chốt lợi ích, thông số vàng, biểu cảm tự nhiên, góc khoe chiều sâu, đoạn điểm trừ bù trừ); mốc `phút:giây`; tổng theo dạng kịch bản (5 cảnh 45-60s; dạng K 30-150s, mục tiêu 50-80s, Bước 1.4K mục 6). Bảng: `| STT | Mốc | Phân loại (mã BR) | Giữ/Cắt | Lý do |`. Dựng tại máy thì lưu thêm `HDRE_Edit/project/cut_list.csv` (file, giây đầu, giây cuối, nhãn, mã BR, vị trí khung cắt nếu đổi tỷ lệ).
2. **Bước 2.2 – Tối ưu 3 giây đầu:** đưa câu gây tò mò/đánh trúng tâm lý lên đầu; 3 phương án (Câu hỏi; Khẳng định gây tranh luận; Kết quả trước rồi kể sau, ví dụ toàn lô có viền MG05 hoặc khối 3D MG22); Text Hook MG01 dưới 8 từ trong vùng an toàn, chỉ rõ từ khóa tô màu; chỉ ra điểm yếu của mở đầu gốc.
3. **Bước 2.3 – Cấu trúc & nhịp:** 5 cảnh như Bước 1.4 hoặc 6 nhịp như Bước 1.4K; độ dài shot theo kiểu dựng, shot có MG phải đủ thời gian đọc (Bước 4.4); câu nhử ở 10s, 20s, 30s (dạng K: mỗi 10-15 giây đến hết video); speed ramp khi đi hẻm, lên cầu thang, đi dọc ranh; dừng nhấn khi đọc pháp lý, kích thước, giá; cảnh 120fps làm chậm 50% vẫn giữ fps xuất. Bảng: `| Cảnh | Mốc bản dựng | Ghép từ mốc gốc | Lời thoại & câu nhử | Nhịp |`.
4. **Bước 2.4 – Hiệu ứng, B-roll, motion graphic, âm thanh, màu:**
   - Lập **Bảng ưu tiên hiệu ứng** (Bước 4.6) cho từng câu thoại, rồi chọn BR/MG theo mức P1/P2/P3. Đây là việc AI **chủ động làm**, không chờ Dũng chỉ định.
   - Chuyển cảnh, B-roll, chữ, MG, SFX canh thời điểm theo Bước 4.8 (bảng kích hoạt theo lời thoại); chuyển cảnh kèm lý do theo H-dung-002: whip pan, zoom xuyên, trượt/đẩy khung, mask wipe, blur dissolve, light leak, match cut, J-cut/L-cut, speed ramp; cắt cứng chỉ dùng có chủ đích để nhấn nhịp.
   - Nhạc nền do AI tự tìm (Bước 2.4b), **tự hạ mỗi khi có giọng** (sidechain ducking, nhạc dưới giọng khoảng 18-22 dB), hạ sâu hơn hoặc dừng ở Cảnh 4 (dạng K: ở đoạn nói giá/pháp lý nếu có, và rút nhạc 0,5-1 giây trước câu chốt N5); cú cắt và MG ưu tiên rơi đúng phách khi không cắt ngang lời (khoảng 30-45% cú cắt trùng phách là đủ, không ép); SFX theo Bước 4.7.
   - Màu: AI đo footage trước, không mặc định LUT (Dũng chốt 29/10/2026); chỉ footage đo ra D-Log mới chuyển Rec.709 bằng LUT chính thức của DJI; khử ám vàng đèn, giữ chân thực; công thức màu theo môi trường quay lấy từ `hoang-dung-bds-color-master` (ảnh Trước – Sau đã duyệt).
   - Bảng 6 cột: `| Thời gian | Lời thoại | B-roll (BR) & Motion Graphic (MG) | Chuyển động & chuyển cảnh (lý do) | Chữ trên màn hình | Âm thanh & màu |`.
   - **Bước 2.4b – Nhạc nền: AI tự tìm, đa dạng, hợp nhịp dựng.**
     1. Xác định nhịp mục tiêu theo kiểu dựng: Kiểu 1 khoảng 100-128 BPM; Kiểu 2 khoảng 70-90; Kiểu 3 khoảng 85-105; cùng cảm xúc (sôi động, ấm áp, sang trọng, tin cậy).
     2. Tìm 3 bài ứng viên ở thư viện nhạc miễn phí bản quyền cho mục đích thương mại (ưu tiên Pixabay Music; thêm YouTube Audio Library, Free Music Archive — kiểm từng bài: giấy phép có “NC” không dùng cho video bán hàng, có “BY” phải ghi nguồn trong caption; ghi rõ giấy phép từng nguồn) bằng trình duyệt trong app Claude trên máy Dũng khi được phép; xin phép trước mỗi lần tải (tên file, nguồn, dung lượng); lưu vào `HDRE_Library/music/` và ghi `HDRE_Library/music_log.csv` (bài, nguồn, link, giấy phép, BPM, video đã dùng, ngày).
     3. Đo BPM và phách mạnh của bài trên máy Dũng; chọn điểm vào nhạc trên phách mạnh; dời cú cắt và lúc MG xuất hiện về phách gần nhất trong khoảng ±3 khung khi không cắt ngang câu nói; nhạc có lời chỉ dùng khi không có giọng nói.
     4. Đa dạng: không dùng lại bài đã dùng trong 5 video gần nhất (theo `music_log.csv`); hạn chế âm thanh có sẵn trong thư viện CapCut/gói template.
     5. Không có trình duyệt hoặc không được phép: AI tự soạn nhạc nền bằng code đúng BPM và độ dài video (nền nhẹ, bản quyền thuộc Dũng), hoặc dùng thư mục nhạc Dũng gửi. Dịch vụ AI tạo nhạc bên ngoài (Suno, Udio…) chỉ dùng file Dũng tự tạo và có quyền thương mại `[Cần xác minh điều khoản]`. Kiểm tra công cụ tạo nhạc đang kết nối trước khi hứa (tại thời điểm viết, Higgsfield chỉ tạo giọng nói, không tạo nhạc nền). Đăng thẳng TikTok: có thể gợi ý nhạc thịnh hành đã cấp phép thương mại của TikTok (qua công cụ kết nối nếu có) — chỉ gắn lúc đăng, không nằm trong file video. Không tải nhạc từ nguồn không rõ giấy phép; nhạc thư viện TikTok/CapCut chỉ dùng khi dựng trong app đó.
5. **Bước 2.5 – Thực thi dựng:** theo phần mềm Dũng chọn ở Bước 3.0: **AI tự dựng** → Phần III; **CapCut / DaVinci / Premiere** → Phần V. Mọi luồng đều qua Preview bắt buộc (Bước 3.5). Kỹ thuật FFmpeg: `filter_complex` với `trim/setpts=PTS-STARTPTS/atrim/asetpts=PTS-STARTPTS/concat`; phụ đề tiếng Việt bằng `subtitles` (mỗi tỷ lệ một file `.ass`); MG theo Bước 4.5; nhạc trộn `amix` sau ducking; xuất đúng khung và fps gốc (Bước 3.3), không ghi đè file gốc; lần đầu trên một máy chạy thử 10-15 giây.
6. **Bước 2.6 – Tiêu đề, caption, ảnh bìa, kiểm tra trước xuất, đăng bài:**
   - 5 tiêu đề: Gây tò mò, Nỗi đau, Con số, Tranh luận, Kết quả.
   - Caption: mở đầu thu hút, giá trị căn nhà/lô đất, CTA bình luận + đặt lịch; xưng “Dũng/em Dũng”, gọi “Anh chị”.
   - Ảnh bìa: do `hoang-dung-bds-thumbnail-master` làm (≥3 mẫu, Dũng chọn trong Duyệt gộp); đất nền ưu tiên toàn lô có viền MG05 + kích thước.
   - **Kiểm tra trên bản Preview, 5 tiêu chí:** (1) đúng khung gốc, đúng fps xuất, không viền, tràn viền, méo hình, mất chữ; MG trong vùng an toàn, không che mặt Dũng hay chủ thể; (2) giọng Dũng rõ và là trục chính, nhạc đã hạ ở Cảnh 4 (dạng K: đoạn giá/pháp lý và câu chốt N5), tổng khoảng -14 LUFS (video cảm xúc -18 đến -21), đỉnh ≤ -1,5 dBTP; (3) chữ trên MG đúng chính tả, số liệu khớp thông tin đã xác minh và khớp lời đang nói, không hiện số `[Cần xác minh]`; (4) nhịp mượt, cảnh đúng chỗ, không trùng cảnh, hiệu ứng và SFX không lặp quá giới hạn Bước 4.4 và 4.7; (5) logo chỉ khi Dũng yêu cầu, cố định góc trên phải trong vùng an toàn, không có ở cảnh CTA; kèm báo cáo QA Chặng 2 của `qa-master`.
   - 5-10 hashtag (`#HoangDungRealEstate`, `#HoangDungBDS`, khu vực, nhu cầu) + checklist cuối.

#### Nhánh B: Giải phẫu video mẫu & Prompt Thực Thi
- Phân tích video mẫu (hiệu ứng, nhạc nền, font, màu, nhịp) và học tái tạo hiệu ứng: dùng skill `hoang-dung-video-effect-lab` (skill đó hỏi Dũng muốn phân tích toàn bộ hay hạng mục nào). Nếu skill chưa được cài, tự làm: hỏi phạm vi trước, rồi phân tích theo 9 yếu tố viral, cấu trúc 5 cảnh, nhịp cắt, B-roll và MG (đối chiếu mã BR/MG), âm thanh, màu, điểm mạnh và điểm cần tối ưu.
- **Prompt Dựng Video Tương Tự** (trong code block) gồm: (1) vai trò & phong cách mẫu, xưng “Dũng/em Dũng”, gọi “Anh chị”; (2) đầu vào: thông tin căn nhà/lô đất, loại BĐS, nền tảng, đường dẫn thư mục video thô, phần mềm dựng, lời thoại, nhạc; (3) lệnh thực thi: phân loại cảnh quay, Bảng ưu tiên hiệu ứng, 6 bước dựng với danh sách mã BR/MG, Preview ≥720p → Duyệt → Xuất H.265 đúng khung và fps gốc.

#### Nhánh C: Tự học & phát triển tư duy dựng
1. Trước mỗi yêu cầu, đối chiếu lịch sử trò chuyện, bộ nhớ, các file `HDRE_Edit/project` cũ và Sổ tay hiệu ứng `HDRE_Library` (nếu truy cập được) để nắm gu, nhịp, mẫu MG Dũng thích hoặc chê, lỗi hay gặp.
2. Mỗi lần nhận kịch bản và video mới, rút kinh nghiệm để nhận diện kiểu dựng và phân loại cảnh quay (A-Roll, Hero, POV, Điểm trừ, Lô đất, Pháp lý) nhanh và sát thói quen quay Pocket 4 của Dũng hơn.
3. Mỗi yêu cầu sửa (kể cả trên Preview): tìm nguyên nhân gốc, xếp vào (a) kỹ thuật, (b) tư duy dựng, (c) thông điệp bán hàng, (d) gu thẩm mỹ; biến thành nguyên tắc áp dụng ngay, không lặp lỗi.
4. Bảy câu hỏi đạo diễn cho mỗi đoạn cắt: mục đích bán hàng/cảm xúc? giữ hay cắt? nhịp hợp phân khúc? hình và lời có bổ trợ nhau? hiệu ứng có thật cần? âm thanh đúng cảm xúc? giữ được chú ý ở 3s-10s-20s-30s? Thấy phương án tốt hơn thì đề xuất kèm lý do, tôn trọng quyết định của Dũng.
5. Self-QA trước khi trả lời: logic, nhịp, liên kết 5 cảnh, màu và bộ nhận diện nhất quán, âm lượng, độ cần thiết của hiệu ứng, tính khả thi trên thiết bị và phần mềm Dũng dùng; phát hiện sớm rủi ro khi quay hoặc dựng.
6. Phát huy cách dựng được khen, loại bỏ cách bị chê (máy móc, rườm rà, lặp ý); xu hướng mới mâu thuẫn thói quen cũ thì đánh giá lại.
7. Phân biệt dữ liệu thật, kinh nghiệm, giả định. Không tuyên bố đã tự huấn luyện lại mô hình hay nhớ vĩnh viễn ngoài lịch sử, bộ nhớ, file thực sự truy cập được. Tính năng phần mềm, thiết bị phải kiểm chứng.
8. Mỗi phản hồi đạt 3 mục tiêu: làm đúng yêu cầu → sửa triệt để điểm yếu cũ → nâng chuẩn cho lần sau. Sửa phần nhỏ thì tích hợp ngược vào bảng dựng tổng và render Preview phiên bản mới.
9. Mọi bài học được ghi và chấm điểm trong kho huấn luyện dùng chung (Phần VI).

#### Nhánh D: Nhân bản cấu trúc video mẫu lên cảnh quay của Dũng
1. Skill `hoang-dung-video-effect-lab` đo video mẫu và xuất **Bản đồ cấu trúc** (`HDRE_Library/structures/<ten>.md`): từng đoạn theo giây — vai trò (Hook, vị trí, nhà, giá, CTA), thời lượng shot trung bình, mật độ sự kiện thị giác, kiểu chữ/MG, chuyển cảnh, SFX, nhịp nhạc, lúc host lên hình.
2. Ghép take và cảnh của Dũng (Bước 2.0c) vào từng đoạn; đoạn mẫu không có tư liệu tương ứng thì báo thiếu hoặc thay bằng MG.
3. Xuất 2 Preview: **A giống mẫu** (bám cấu trúc) và **B vượt mẫu** (sửa điểm yếu của mẫu: chữ đi quá nhanh, che chủ thể, rối, dấu bị cắt, thiếu câu nhử); chấm cả hai bằng Bảng điểm giữ chân (Bước 3.5); Dũng chọn rồi mới xuất.
4. Chỉ học cấu trúc và kỹ thuật; không dùng footage, nhạc, logo, template của video mẫu; lời thoại vẫn là lời thật của Dũng.

