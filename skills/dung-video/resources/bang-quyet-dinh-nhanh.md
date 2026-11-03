# Bảng Quyết định Nhanh (Cập nhật 03/11/2026)

Khi gặp tình huống này thì xử lý ngay lập tức theo đúng bảng dưới đây. Chi tiết ở file được trỏ tới.

## Tình huống → Hành động Tức thời
| Tình huống | Làm ngay (Chuẩn Studio Chuyên nghiệp) |
|---|---|
| **Sub-Agent phát hiện lỗi ở đầu ra của Sub-Agent đứng trước** | **Chặn ngay & Yêu cầu Sub-Agent đứng trước sửa lập tức đoạn lỗi đó** trước khi mình bắt đầu làm việc (Peer Cross-Check & Upstream Gate) |
| **Phát hiện lỗi ở1 mốc chữ / 1 đoạn cắt / 1 mốc SFX** | **Sửa cục bộ ngay tại chỗ (In-line / Surgical Patch)** đúng mốc/đoạn đó để khớp toàn bộ video; cấm để dồn tới cuối video hoặc làm lại cả dự án |
| **Agent Tổng kiểm nhanh tổng thể đạt `≥ 98/100` (0 lỗi cấm)** | **Bàn giao ngay bản cuối duy nhất cho Dũng**, báo rõ điểm số từng hạng mục và giải trình chi tiết rõ ràng (`workflow/07-qa-render.md`) |
| **Sub-Agent làm hỏng việc trên 2 lần (`> 2 lần lỗi`)** | **Agent Tổng loại bỏ ngay lập tức (`TERMINATED`)**, tạo Sub-Agent mới kế thừa trạng thái làm tiếp từ chỗ dở; ghi vào `agent-roster.json` |
| **Kết thúc mỗi dự án** | **Agent Tổng đánh giá toàn bộ Sub-Agents:** làm tốt (`≤ 2 lần lỗi`) → **Giữ lại (`RETAINED`)**; hỏng việc `> 2 lần` → **Loại bỏ (`TERMINATED`)** |
| **Khởi tạo số lượng Sub-Agents cho dự án** | Tính toán theo quy mô thực tế dự án (tối đa **50 Sub-Agents**), tạo **đúng và đủ số lượng cần thiết, tuyệt đối không tạo dư** |
| Mẫu có zoom/punch-in/rung | Học đủ cấu trúc, ghi "cần hỏi Dũng", nhấn bằng chữ động; hỏi Dũng 1 câu nếu thật sự cần (`rules/luat-cung.md` mục 9) |
| Phiên không có người trả lời | Không áp dụng camera giả (ghi "đã bỏ"); màu giữ nguyên gốc (ghi "chưa hỏi được, giữ gốc") |
| Muốn thêm SFX cho phụ đề/nhãn | Không. Nâng thành chữ hook (T2) và được Dũng đồng ý mới có SFX |
| Lời có CTA | Làm chữ đúng câu đó. Không có trong lời thì không có chữ CTA |
| Font lỗi dấu tiếng Việt | Chạy `vn_font_gate.py` ngay khi chọn font, báo đúng mẫu cảnh báo, dùng font thay thế |
| Chữ khó đọc trên nền | Sửa ngay tại mốc đó: tăng viền/bóng hoặc làm tối nhẹ cục bộ bằng gradient mỏng; không dùng hộp nền, không tăng glow |
| Chữ âm bản trên nền xám trung bình | Không dùng (chữ biến mất [Tính]); đổi ngay sang trắng + viền |
| Style chưa có link mẫu đã kiểm | Không đưa vào gợi ý |
| Thiếu file/skill/nguồn | Ghi `missing` / `skipped_refs`, dùng dự phòng, tuyệt đối không tự đoán |
| Nhạc át giọng | Hạ nhạc quanh giọng (`≤ 6 dB`), đo lại `ebur128` ngay tại chỗ |

## Điểm mấu chốt về Chữ Hook & Hiệu ứng Chuẩn Editor Pro (dùng khi thiếu `references/text-fx/06`)
- **Phụ đề (T0) & Nhãn (T1):** `Be Vietnam Pro`, trắng + viền đen 3–4px, bóng mềm; không hiệu ứng, không SFX [N7].
- **Font chữ hook (T2–T3):** `Anton`, `SVN-Bebas Neue`, `Montserrat Black`; `Playfair Display Italic` cho chữ tâm sự; tối đa 2 font/video [N9].
- **Chuẩn 3 pha hiệu ứng (`R-L034`):** Mở đầu (`Entrance Ease-Out 0.18–0.45s` + đa thuộc tính + `Stagger 40–70ms` + `Pre-roll SFX`) → Duy trì (`Hold ≥ 1.5s`) → Kết thúc (`Exit Ease-In 0.15–0.30s` hoặc ngắt khít vết cắt `1–2 frames` + đuôi âm `Reverb/Fade-out`).
- **Đặt tên hiệu ứng (`R-L036`):** Luôn gọi đúng `Tên phổ biến quốc tế (Tên thông dụng tiếng Việt)` theo `tu_dien_hieu_ung.md`.
- **Glow / Âm bản / Chữ sau người:** Glow đơn sắc mềm chỉ ở chữ hook, giữ viền [N8][N10]. Âm bản và chữ-sau-người mỗi loại tối đa 1 lần/video [N11].
- **Đo tương phản ngay trên khung thật:** Tham chiếu `4.5:1` chữ thường, `3:1` chữ lớn [N8].
