# Quy trình Làm Chữ Hiệu ứng Đồng thời & Sửa Ngay Tại Chỗ (Giai đoạn 4 → 5 → 7)

## Bước 0 — Kiểm tra Chéo Đầu Vào Trước Khi Lên Chữ (Upstream Peer Cross-Check)
- Đầu vào: `words.json` (transcript từng từ có `word_id` + timecode) và danh sách cắt từ Tổ Chép lời & Tổ Cắt dựng + thông tin Dũng cung cấp.
- **Kiểm tra chéo bắt buộc:** Trước khi lập bảng mốc chữ, kiểm tra ngay `words.json` và các điểm cắt. Nếu phát hiện từ khóa bị nghe sai, câu nói bị cắt cụt âm cuối, hoặc số liệu/giá lệch thông tin Dũng → **yêu cầu Tổ Chép lời / Tổ Cắt dựng sửa ngay lập tức đoạn đó** trước khi làm Bước 1.

## Bước 1 — Lập Bảng Mốc Chữ Hook Neo Theo `word_id` (Giai đoạn 4 — Chạy Đồng thời)
Chỉ lập bảng cho chữ hook (T2–T3). Phụ đề (T0) và nhãn (T1) không hiệu ứng, không SFX, không đưa vào `moments.json`.
Với mỗi mốc ghi một dòng:
`word_id | thời điểm | từ khóa trong lời | nội dung chữ (nguồn) | loại L1–L10 | bậc T0–T3 | Tên hiệu ứng phổ biến quốc tế (Tên tiếng Việt)`
- Dòng nào "nội dung chữ" không có nguồn (lời thoại hoặc thông tin Dũng) → **xóa ngay lập tức**.
- Kiểm hạn mức mật độ ở `03-thoi-diem-su-dung.md` mục 3 ngay khi lập bảng. Quá mức → hạ bậc hoặc bỏ bớt mốc yếu nhất ngay tại chỗ.
- Xuất ngay `moments.json` gửi sang Tổ Âm thanh để làm SFX song song.

## Bước 2 — Chọn Hiệu ứng Chuẩn 3 Pha Editor Pro (Đầu giai đoạn 5)
1. Chọn **tối đa 2 họ hiệu ứng** cho cả video (xem `05`), ghi vào `edit-state.json → stages.4`.
2. Với mỗi mốc, chọn hiệu ứng theo loại L và bậc T, gọi đúng **Tên phổ biến quốc tế (Tên tiếng Việt)**. Không dùng cùng hiệu ứng cho hai mốc liền kề.
3. Nếu Dũng đưa video mẫu: `hoang-dung-viral-style-scout` (Chế độ B) phân tích hiệu ứng/font/màu/nhịp của mẫu trước, rồi map sang hiệu ứng ở `05`.
4. Ghi rõ 3 pha cho từng mốc: `Entrance (0.18–0.45s Ease-Out + Stagger) | Hold (≥1.5s) | Exit (0.15–0.30s Ease-In / Cut-out) | SFX Pre-roll & Peak`.

## Bước 3 — Dựng Đồng thời & Tự Kiểm / Sửa Ngay Từng Mốc (In-line Fix — Giai đoạn 5)
Công cụ theo engine (xem `05` mục 3):
- HyperFrames: `motion-graphics`, `hyperframes-animation`, `hyperframes-keyframes`, `embedded-captions`.
- Remotion: `remotion-best-practices` → `remotion-markup` (+ `@remotion/transitions`, `@remotion/effects`).

**Quy tắc dựng & sửa ngay tại chỗ (CẤM đợi dựng xong cả video mới kiểm):**
- Mỗi mốc là một lớp riêng, có `id` rõ (`txt-hook`, `txt-price`…), neo theo `word_id` / timecode ở Bước 1.
- Ngay khi dựng xong **từng mốc chữ T2–T3**, trích ngay 3 khung (`đang vào`, `đỉnh`, `nghỉ`) của chính mốc đó và kiểm tra tức thì:
  - [ ] Nội dung chữ khớp 100% lời/thông tin Dũng; không lặp chữ; không 2 điểm nhấn cùng khung.
  - [ ] Nằm trong vùng an toàn; **không che mặt người dẫn** (`face_zones.py`) hoặc chi tiết chính của nhà.
  - [ ] Dấu tiếng Việt đủ ở trạng thái nghỉ (`padding-top >= 0.34em` cho `background-clip:text`).
  - [ ] Đủ 3 pha (`Entrance Ease-Out` → `Hold ≥ 1.5s` → `Exit Ease-In/Cut-out`); chữ chạm đúng từ nói (`±2 khung`); SFX đỉnh trùng khít.
  - [ ] Tương phản đo trên khung thật đạt chuẩn (`≥ 4.5:1` chữ thường, `≥ 3:1` chữ lớn); không hộp nền tối.
- **Phát hiện bất kỳ ô nào chưa đạt ở mốc vừa dựng → sửa ngay lập tức mốc đó trước khi chuyển sang mốc tiếp theo!**

## Bước 4 — Kiểm tra Nhanh Tổng thể bởi Agent Tổng (Giai đoạn 7 — Ngưỡng `≥ 98/100`)
- Agent Tổng kiểm tra nhanh tổng thể toàn video (kết hợp số đo + contact sheet tổng hợp).
- Nếu tổng điểm video đạt **`≥ 98/100`** (và 0 lỗi cấm) → bàn giao ngay bản cuối cho Dũng kèm giải trình chi tiết.
- Nếu có mốc lỗi làm điểm `< 98/100` → **chỉ sửa cục bộ ngay đúng mốc chữ đó (Surgical Patch)**, không dựng lại toàn bộ.

## Bước 5 — Kỷ luật Sub-Agent & Tự học
- Sub-Agent làm hỏng việc **trên 2 lần (`> 2 lần lỗi`)** → bị Agent Tổng **loại bỏ ngay (`TERMINATED`)** và thay bằng Sub-Agent mới kế thừa công việc tại chỗ dở.
- Sau khi Dũng duyệt: ghi vào vòng tự học của `hoang-dung-auto-style-learner` và cập nhật đánh giá nhân sự trong `agent-roster.json`.
