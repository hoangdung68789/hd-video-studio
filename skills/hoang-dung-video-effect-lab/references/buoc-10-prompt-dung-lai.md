# hoang-dung-video-effect-lab — Bước 10: prompt dựng lại video giống mẫu

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

### Bước 10: Viết prompt dựng lại video giống mẫu (khi Dũng chọn “Có” ở Bước 6, chọn ở Bước 0, hoặc nhắn trực tiếp)
Mục tiêu: một prompt **tự đứng được** (AI khác hoặc phiên mới đọc là dựng được, không cần xem video mẫu) mô tả lại **toàn bộ cấu trúc** video mẫu đến từng mốc thời gian, để dựng ra video có cùng nhịp, cùng bố cục, cùng kiểu chữ, chuyển cảnh, hiệu ứng, âm thanh và màu — với nội dung, cảnh quay, nhạc của Dũng.

#### 10.1 Hỏi trong một lần (chỉ hỏi phần chưa rõ)
1. **Mức giống:** `Giống 100% mẫu` (bản A) | `Giống mẫu + cải tiến điểm yếu` (bản B, sửa theo Bước 3b mục 3) — đã chọn ở Bước 6 thì không hỏi lại.
2. **Prompt dùng cho đâu:** `Claude dựng bằng code (Remotion/FFmpeg/HTML)` | `Dựng tay trên CapCut máy tính` (kịch bản dựng từng bước) | `AI tạo video (Higgsfield/Seedance/Kling…)` | `Đủ cả 3`. Mặc định: Claude dựng bằng code + CapCut.
3. **Nội dung đưa vào:** `Cảnh quay + lời thoại của anh` (đã có hoặc sẽ gửi) | `Thông số căn nhà, chưa có cảnh quay` (prompt kèm danh sách cảnh cần quay) | `Để trống ô nội dung` (prompt khung, điền sau).
Ngôn ngữ prompt: tiếng Việt; bản cho AI tạo video viết thêm tiếng Anh (các công cụ đó hiểu tiếng Anh tốt hơn), chữ trên hình giữ tiếng Việt có dấu.

#### 10.2 Điều kiện đầu vào (đủ mới viết)
- Có số đo **toàn bộ video** (Bước 2-5) và **bản đồ cấu trúc** (Bước 3b). Phạm vi phân tích trước đó hẹp hơn thì tự đo bổ sung phần thiếu và báo ngắn.
- Mốc thời gian chính xác tới 0,1 giây (cú cắt, sự kiện thị giác, chữ vào/ra, SFX, điểm nhạc lên/hạ). Phần chỉ ước lượng được thì ghi độ tin cậy ngay trong prompt.

#### 10.3 Cấu trúc prompt (bắt buộc đủ 9 khối)
1. **Thông số kỹ thuật:** tỷ lệ 9:16, độ phân giải, fps xuất theo quy tắc của skill master (nguồn dưới 60fps → 60fps), tổng thời lượng mẫu, LUFS mục tiêu, vùng an toàn TikTok/Reels (đỉnh, đáy, mép phải).
2. **Tóm tắt nhịp:** công thức F1-F4 gần nhất, số shot, độ dài shot trung bình/trung vị, sự kiện thị giác mỗi giây, đường cong năng lượng (hook → thân → cao trào → CTA).
3. **Bảng dòng thời gian (khối chính):** mỗi dòng một đoạn/sự kiện:
   `| # | Giây bắt đầu–kết thúc | Vai trò (Hook/vị trí/nhà/giá-pháp lý/bằng chứng/CTA) | Cảnh cần dùng (cỡ cảnh, góc, chuyển động máy) | Lời thoại / nội dung (ô điền của Dũng) | Chữ trên hình (nội dung, font + độ đậm, cỡ theo % chiều cao khung, vị trí, màu, kiểu vào/ra, số khung) | MG / BR / E (mã) | Chuyển cảnh vào cảnh này (TR, số khung, đường cong) | SFX (loại, mốc, lớp) | Nhạc (phách, lên/hạ, ducking) |`
4. **Hệ chữ:** font chính/phụ/viết tay/phụ đề lấy từ phiếu font Bước 5 (kèm font thay thế OFL có tiếng Việt), cỡ, màu từ khóa, quy tắc xuống dòng, không phông nền sau chữ, chữ không che chi tiết nhà và không trùng màu nền. Ưu tiên tham chiếu mã E1-E9 (Bước 9.9).
5. **Chuyển cảnh & chuyển động:** từng TR/MG với tham số làm lại được (thời lượng khung, đường cong easing, độ nhòe, độ zoom) — dùng đúng công thức đã ghi ở Bước 7/`recipes/`.
6. **Âm thanh:** đặc điểm nhạc (BPM, thể loại, có/không lời, điểm drop) và **gợi ý tìm bài tương tự có giấy phép** (không dùng lại bài của mẫu); mức nhạc so với giọng, ducking; danh sách SFX theo mốc, xoay vòng theo Bước 4.7 skill master.
7. **Màu:** độ sáng, độ bão hòa, ám màu theo từng đoạn (số đo `signalstats`), hướng xử lý D-Log → chuyển cho `hoang-dung-bds-color-master` nếu cần LUT.
8. **Ánh xạ nội dung của Dũng:** bảng nối từng đoạn mẫu với take/cảnh của Dũng (hoặc danh sách cảnh cần quay: cỡ cảnh, thời lượng tối thiểu, chuyển động máy trên DJI Pocket 4). Hook, nội dung, CTA lấy từ lời thoại thật của người dẫn; tên người dẫn xác định qua video/phụ đề. Số liệu nhà chỉ dùng số đã xác minh, chưa có thì để `[CẦN XÁC MINH]`.
9. **Ràng buộc & kiểm tra cuối:** áp toàn bộ quy tắc dựng đã duyệt của Dũng (giữ khung gốc, không cắt lời thoại mang ý, CTA không chèn logo/tên thương hiệu, logo chỉ khi Dũng yêu cầu, 3D chỉ cho nhà cũ/đất xây mới, Preview 720p 60fps trước khi render bản chính) + danh sách tự kiểm mục 10.5.

#### 10.4 Theo công cụ đích
- **Claude dựng bằng code:** thêm tham số máy đọc được (JSON/bảng mốc theo khung hình) để dựng thẳng trong Remotion/FFmpeg; chuyển cho `hoang-dung-bds-video-master` Nhánh D thực hiện.
- **CapCut máy tính:** viết thành các bước thao tác theo track (video chính, B-roll, chữ, MG, SFX, nhạc), tên hiệu ứng/chuyển cảnh CapCut gần nhất và thông số chỉnh tay; ghi rõ chỗ CapCut không làm được và cách thay.
- **AI tạo video:** mỗi cảnh một prompt riêng (chủ thể, bối cảnh, chuyển động máy, ánh sáng, thời lượng ≤ giới hạn công cụ), cảnh có người dẫn thật thì dùng cảnh quay thật; chữ, MG, SFX ghép ở bước dựng, không giao cho AI tạo video.

#### 10.5 Tự kiểm trước khi gửi
- Tổng thời lượng các dòng = thời lượng mẫu (±0,2 giây; bản B ghi rõ chênh lệch và lý do); không có khoảng trống hay chồng mốc.
- Mọi cú cắt, sự kiện thị giác và SFX đo được ở Bước 2-3 đều có dòng tương ứng (đếm và báo: “X/X sự kiện đã đưa vào prompt”).
- Mọi chữ có dấu tiếng Việt đọc đủ, nằm trong vùng an toàn; mọi mã MG/TR/E tồn tại trong thư viện hoặc ghi “MỚI” kèm công thức.
- Không còn nội dung, footage, nhạc, logo hay template của video mẫu trong prompt.

#### 10.6 Gửi & lưu
- Gửi prompt trong một khối mã để Dũng sao chép, kèm 2-3 dòng: mức giống, công cụ đích, phần còn ước lượng. Prompt dài thì gửi thêm file `.md`.
- Lưu vào `HDRE_Library/prompts/` (Bước 8.1). Ghi dự đoán điểm giống vào `predictions.csv`; khi Dũng dựng xong và nhắn “Chấm prompt: <1-5>” thì chạy Bước 8.2 mục 5-7 (ví dụ luật: đoạn nào hay lệch nhịp, khối nào AI khác hay hiểu sai).
- Cuối phản hồi hỏi: “Anh muốn em dựng luôn từ prompt này không?” — Có thì chuyển `hoang-dung-bds-video-master` Nhánh D.

