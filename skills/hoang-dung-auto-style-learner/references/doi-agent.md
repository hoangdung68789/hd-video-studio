# Đội agent học hằng ngày & chế độ học từ video mẫu (chi tiết)

## Đội agent (đặt tên và nhiệm vụ)
Tổng Quản là luồng chính: lập bảng phân công, giao việc, tổng hợp, báo Dũng. Mỗi agent ĐÚNG 1 nhiệm vụ, brief ≤10 dòng, kết quả ≤15 dòng kèm đường dẫn file. Agent không có công cụ trình duyệt thì Tổng Quản làm bước mở trang rồi giao dữ liệu cho agent. Không tuyên bố «đã gọi agent» nếu không thật sự gọi; nếu chỉ đóng vai thì nói rõ.

| Tên | Mục tiêu | Đầu vào → Đầu ra | Đạt khi |
|---|---|---|---|
| **Trinh Sát** | Tìm ứng viên mới theo thể loại | danh sách đã học + thể loại → ≥8 ứng viên/thể loại (URL, nền tảng) | không trùng video đã học; đủ thể loại |
| **Kiểm Chứng** | Xác minh độ phổ biến thật | URL → lượt thích/xem, thời lượng, tác giả, nhãn âm thanh trên trang video | chọn đúng 5+ video/thể loại; loại video không xác minh được |
| **Thợ Đo** | Đo cấu trúc và hiệu ứng (lệnh đo theo viral-style-scout B2) | video đã xác minh → số cú cắt/10 giây, mốc hook–thân–chốt, khung hình mỗi cú cắt và mỗi lần chữ xuất hiện, vị trí chữ, cách vào/ra của chữ, chuyển cảnh, B-roll, MG, mốc SFX và độ to, nhịp nhạc | mỗi trường có nhãn Đã đo/Ước đoán/Không đo được |
| **Định Danh** | Tìm tên gọi đúng và phân loại hiệu ứng | mô tả hành vi từ Thợ Đo + chú thích/hashtag/bình luận của video + tài liệu phần mềm + video hướng dẫn → dòng Từ điển hiệu ứng (mã, tên chuẩn, tên gọi khác, nhóm, nhãn tên, nguồn URL) | mỗi hiệu ứng có nhóm + nhãn tên; không tự bịa tên; danh sách [Chưa rõ tên] đầy đủ |
| **Soát Sót** | Chống bỏ sót (độc lập với Thợ Đo và Định Danh) | Thẻ + Từ điển + video gốc → danh sách mục thiếu/lệch, % phủ | phủ 100% cú cắt và lần chữ xuất hiện; mọi hiệu ứng có dòng trong Từ điển; mục thiếu quay lại agent liên quan; tối đa 3 vòng |
| **Biên Tập Trưởng** | Gộp thành phong cách dùng được | các Thẻ đã qua Soát Sót → Thẻ phong cách (mẫu của viral-style-scout, lưu `asset/phong_cach/the/`), bảng «thể loại → phong cách, nhịp, chữ, chuyển cảnh, SFX vai trò, nhạc» dùng mã trong Từ điển | mỗi thể loại có ≥1 phong cách, gắn nhãn [XM]/[MT]/[ĐX]; chỉ dùng hiệu ứng có tên có nguồn |
| **Thư Ký** | Ghi nhớ và đồng bộ | Thẻ + Từ điển + danh sách video → cập nhật `/topics/video-da-hoc.md`, bảng Notion «Video đã học» và «Từ điển hiệu ứng», `asset/phong_cach/` | video và hiệu ứng mới nằm trong cả 3 nơi; không trùng dòng |
| **Thủ Kho** | Sao lưu hằng ngày | `asset/` → chạy `tools/audit_and_scaffold.py` (làm mới INDEX/manifest, quét khóa bí mật), đẩy file mới/đổi lên GitHub riêng tư hdre-ai-backup (khi Dũng đã cho phép) | đối chiếu số file với manifest; báo file không đẩy được; không đẩy khóa/mật khẩu/.env/lịch sử chat |
| **Kiểm Định** | QA cuối (agent chưa làm công đoạn nào) | toàn bộ kết quả → kết luận Đạt/Không đạt theo 6 tiêu chí: đủ hạn mức, không trùng, số liệu khớp trang gốc, không bỏ sót, mọi hiệu ứng có nhóm + nhãn tên không bịa, không vi phạm luật cứng | 0 lỗi; còn lỗi thì trả đúng agent sửa |

Trình tự (học hằng ngày): Trinh Sát → Kiểm Chứng → Thợ Đo → Định Danh → Soát Sót → Biên Tập Trưởng → Thư Ký → Thủ Kho → Kiểm Định. Thợ Đo và Định Danh có thể chạy song song theo thể loại (tối đa 3 agent cùng lúc). Hạng việc theo orchestrator: học 1 thể loại = M; học đủ ngày = L.

## Lịch hằng ngày (chỉ khi Dũng duyệt giờ chạy)
Mỗi ngày một lượt gồm 2 phần liền nhau:
1. **Học**: toàn bộ đội agent như trên (≤ 30 video, ≥5/thể loại).
2. **Cập nhật và sao lưu dữ liệu mới lên cloud**: Thư Ký ghi bộ nhớ + Notion + `asset/`; Thủ Kho chạy script kiểm tra, đẩy file văn bản mới lên GitHub; zip đầy đủ tạo lại mỗi tuần hoặc khi Dũng yêu cầu (zip lớn, GitHub qua trình duyệt giới hạn kích thước file).
Tạo việc định kỳ bằng công cụ lịch của hệ thống, gọi là «tác vụ định kỳ»; hỏi Dũng giờ chạy (mặc định 8h sáng) trước khi tạo. Tác vụ dùng trình duyệt đã đăng nhập nên máy Dũng phải bật và ứng dụng Claude mở; hôm nào không chạy thì không bù quá 30 video/ngày. Tác vụ chỉ học và ghi chép, không tự sửa skill. Nếu GitHub bị chặn hoặc cần quyền mới thì báo Dũng, không tìm cách vòng qua.

## Chế độ học effect từ video mẫu (Dũng duyệt 28/10/2026)
Mục tiêu: học đúng hiệu ứng trong 1 video Dũng đưa (font + hiệu ứng chữ + bố cục + màu + SFX) và dựng lại được ngay khi dựng video BĐS. Dùng lại bước đo B2–B5 của `hoang-dung-viral-style-scout` (không viết trùng); skill này bổ sung bước dựng lại, chấm điểm và lưu Thẻ Bộ chữ.

| Bước | Agent | Việc | Đầu ra |
|---|---|---|---|
| 1 | Kiểm Chứng | Ghi nguồn. Link: URL, ngày xem, lượt xem/thích trên trang. File: tên, thời lượng, độ phân giải, fps | Phiếu nguồn |
| 2 | Thợ Đo | Trích khung ở mọi cú cắt và mọi lần chữ xuất hiện (±0,1s). Đo vị trí chữ (% khung), cỡ (% cao), màu (hex lấy mẫu), số khung vào/ra, hướng, độ mờ, chuyển cảnh, MG, animation, b-roll, mốc SFX + độ to so với nhạc, nhịp nhạc | Bảng đo; mỗi trường nhãn Đã đo / Ước đoán / Không đo được |
| 3 | Định Danh | Phiếu font theo B5 (so dựng song song, kiểm dấu tiếng Việt, font Việt hóa thay thế trên máy Dũng: chỉ đọc `C:\Windows\Fonts`, `%LOCALAPPDATA%\Microsoft\Windows\Fonts`). Dòng Từ điển hiệu ứng (mã, nhóm, nhãn tên, nguồn) | Phiếu font + dòng Từ điển |
| 4 | **Thợ Dựng Lại** | Dựng lại từng hiệu ứng thành recipe HyperFrames 3–5s **có SFX ngay bản đầu** (R-L015), dùng chữ BĐS mẫu. Ghép mẫu ↔ bản dựng cạnh nhau, chấm bằng `dung-video/assets/textfx-kit/scripts/measure.py` + `score.py` | `recipes/<mã>.html` + clip so sánh + điểm giống |
| 5 | Soát Sót | Phủ 100% lần chữ xuất hiện và hiệu ứng; mục thiếu trả về đúng agent (tối đa 3 vòng) | % phủ |
| 6 | Thư Ký | Lưu **Thẻ Bộ chữ** `asset/phong_cach/bo_chu/<mã>.md` + recipe; cập nhật Từ điển hiệu ứng và danh sách video đã học | File thư viện |
| 7 | Kiểm Định | QA độc lập: số đo khớp mẫu, không bịa tên, có SFX, điểm giống đúng | Đạt / Không đạt |

**Mẫu Thẻ Bộ chữ:** `| Mã | Vai trò dùng | Font + độ đậm (độ tin cậy) | Font thay thế Việt hóa trên máy | Cỡ (% cao) | Vị trí (% khung) | Màu (hex) | Vào (kiểu, số khung, easing) | Ra | Nhấn | SFX (vai trò, mốc so với chữ, dB so với nhạc) | Video gốc + giây | Recipe | Điểm giống | Dũng chấm 1–5 |`

**Quyết định của Dũng (28/10/2026):**
- Hiệu ứng [Chưa rõ tên] được dùng khi dựng **bằng mã thẻ** nếu bản dựng lại đạt **điểm giống ≥80/100**; tên vẫn để [Chưa rõ tên] cho tới khi có nguồn.
- Dưới 80/100: chưa dùng; sửa tối đa 3 lượt, vẫn dưới ngưỡng thì báo Dũng kèm clip so sánh.
- Bộ chữ Dũng chấm ≥4 → thêm vào «gu quen dùng» (habit-memory A3); chấm <3 hai lần → bỏ, giữ 1 dòng lý do.

**Giới hạn (giữ luật cứng):** link mạng xã hội không tải video về, chỉ đo trên khung trình duyệt (thiếu thì ghi «Không đo được»; muốn chính xác thì Dũng gửi file gốc). Không đoán tên bài nhạc/SFX: chỉ ghi vai trò, mốc, độ to; chọn âm thay thế có giấy phép từ kho của Dũng. Chỉ học kỹ thuật, không chép chữ, hình, nhạc của người khác.

**Báo cáo (≤8 dòng):** nguồn; số lần chữ/hiệu ứng đã đo, % phủ; phiếu font (font gốc ↔ font thay thế, độ tin cậy); danh sách Thẻ Bộ chữ mới + điểm giống; mục [Chưa rõ tên]; mục «Không đo được»; clip so sánh để Dũng chấm 1–5; nơi đã lưu.
