# Cổng Chất lượng Tức thời & Kiểm tra Chéo (Cập nhật 03/11/2026)

## 1. Nguyên tắc Vận hành Cổng (Không chờ cuối mới rà soát)
- **Kiểm tại chỗ & Kiểm chéo ngang hàng (In-line & Peer Cross-Check):**
  - Mỗi Sub-Agent khi hoàn thành một phân đoạn/mốc phải **tự kiểm và sửa ngay lập tức** tại mốc đó.
  - Sub-Agent nhận đầu vào từ cổng trước có quyền **kiểm tra chéo ngay đầu vào** và **yêu cầu Sub-Agent đứng trước sửa ngay đoạn lỗi** trước khi mình bắt đầu công việc.
- **Vá lỗi cục bộ (Surgical Patch):** Đoạn/mốc nào lỗi thì **chỉ sửa và kiểm lại đúng đoạn/mốc đó + điểm nối liền kề**, tuyệt đối không chạy lại toàn bộ dự án.
- **Kỷ luật Sub-Agent (`> 2 lần hỏng việc = Loại bỏ`):** Mỗi Sub-Agent chỉ được phép sửa lỗi tối đa **2 lần**. Làm hỏng việc **trên 2 lần (`> 2 lần lỗi`)** → Agent Tổng **loại bỏ ngay lập tức (`TERMINATED`)**, khởi tạo Sub-Agent mới kế thừa trạng thái làm tiếp từ chỗ dở.

## 2. Bảng Cổng Chất lượng Chạy Đồng thời (G0 – G7)
| Cổng | Phụ trách & Kiểm chéo | Điều kiện Qua Cổng (Đo ngay trong lúc dựng) |
|---|---|---|
| **G0 Brief & Style** | Agent Tổng | Đủ `master-timeline` (Timecode + Transcript), đã hỏi template và có câu trả lời của Dũng (hoặc `tpl:`/`mau:`; không người trả lời → không dùng template), có tên style + nguồn + 1–2 link mẫu đã kiểm, đã gộp câu hỏi Màu/LUT (nếu cần), cấp phát vừa đủ Sub-Agents (`≤ 50`, không dư) |
| **G1 Lời & Timecode** | Tổ Chép lời ↔ Tổ Cắt & Đồ họa kiểm chéo | Đủ 100% lời, đúng dấu, có `word_id` + timecode từng từ; số/giá khớp thông tin Dũng; đánh dấu sạch chỗ vấp/lặng thừa |
| **G2 Cắt dựng phân đoạn** | Tổ Cắt dựng ↔ Tổ Đồ họa & Âm thanh kiểm chéo | Đủ lý do cắt, người dẫn nói hết câu mới chuyển cảnh (`≥0.1s`), không mất chữ, không trùng cảnh, khóa từng phân đoạn (`segment_lock: true`) để đẩy luồng song song |
| **G3 Màu** | Tổ Màu ↔ Tổ Render kiểm chéo | Đúng lựa chọn của Dũng (1 trong 3 lựa chọn); đồng nhất giữa các cảnh, da tự nhiên, nhà đúng thực tế. Clip đã chỉnh màu: `color_engine.py audit` đạt `≥ 90/100`, clipping `< 0.3%`, có ảnh Before/After đã xem bằng mắt |
| **G4 Chữ, MG & Bản đồ** | Tổ Đồ họa ↔ Tổ Âm thanh kiểm chéo | Đủ bảng `chữ ↔ nguồn` (không chữ tự bịa); phụ đề (T0) & nhãn (T1) không hiệu ứng/không SFX; mọi chữ hook (T2–T3) đủ 3 pha (`Entrance Ease-Out` → `Hold ≥1.5s` → `Exit Ease-In/Cut-out`), đúng tên hiệu ứng phổ biến, qua cổng font tiếng Việt, tương phản đo thật; bản đồ đúng OSM; không camera giả trái phép |
| **G4b Bảo mật Địa chỉ** | Tổ Bảo mật ↔ Agent Tổng/QA kiểm chéo | **0 khung lộ** số nhà, tên hẻm, giấy tờ (`boxblur` bám chuyển động suốt cảnh) |
| **G5 Âm thanh & SFX** | Tổ Âm thanh ↔ Tổ Đồ họa kiểm chéo | Giọng `≈ -14 LUFS`, nhạc dưới giọng `-18…-22 LUFS`, `true peak ≤ -1 dBTP` (đo `ebur128` thật); nhạc bắt tai từ giây đầu, không át giọng; mọi chữ hook có SFX khớp đỉnh `±2 khung`; `sfx_audit` đạt `≥ 98/100` |
| **G7 Kiểm nhanh Tổng thể** (chạy trước G6) | **Agent Tổng (Executive Audit)** | Kiểm tra nhanh tổng thể toàn video trên timeline đã ghép (số đo + contact sheet nhanh): **Tổng điểm đạt tối thiểu từ `98/100` trở lên (`≥ 98/100`)** và 0 lỗi cấm → **cho xuất bản cuối (G6)**. Nếu `< 98/100` → chỉ sửa cục bộ đúng đoạn lỗi trên timeline, chưa xuất |
| **G6 Render H.265** (chạy sau G7) | Tổ Render ↔ Agent Tổng kiểm chéo | Đúng 1 file 9:16 H.265 60fps, đúng thời lượng, có nhạc nền, phát mượt từ đầu đến cuối, không watermark nền tảng khác. Đo bằng `ffprobe` trên file thật, đạt → **Bàn giao ngay cho Dũng + Giải trình chi tiết** |

## 3. Đánh giá Nhân sự Sub-Agents sau mỗi Dự án
Ngay khi qua G6, Agent Tổng cập nhật `agent-roster.json`:
- **Giữ lại (`RETAINED`):** Sub-Agent hoàn thành tốt nhiệm vụ (`≤ 2 lần lỗi`, đạt chuẩn ngay tại chỗ).
- **Loại bỏ (`TERMINATED`):** Sub-Agent làm hỏng việc **trên 2 lần (`> 2 lần lỗi`)** hoặc tự bịa/tự đoán trái quy tắc.
