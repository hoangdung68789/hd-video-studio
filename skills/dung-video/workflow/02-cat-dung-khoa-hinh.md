# Giai đoạn 2, 2b, 2c — Chép lời, Cắt dựng Đồng thời, Che địa chỉ & Khóa Phân đoạn

Phụ trách: **Tổ Chép lời (`dung-chep-loi`)**, **Tổ Cắt dựng (`dung-cat-dung`)**, **Tổ Bảo mật (`dung-che-dia-chi`)** chạy **ĐỒNG THỜI** theo từng phân đoạn (`segment_id`). Công cụ: `video-use`, `talking-head-recut`, `antigravity-video-bridge`.

## 2. Chép lời + Cắt dựng Đồng thời & Sửa lỗi Ngay tại chỗ
1. **Chép lời chuẩn (`words.json`):** Có `word_id` và timecode từng từ. Lời nói là xương sống [N1]. Áp từ vựng BĐS của Dũng; chữ không rõ không tự đoán mà đưa vào câu hỏi.
2. **Kiểm tra chéo tức thì (Peer Cross-Check):**
   - Ngay khi Tổ Chép lời xuất từng phân đoạn, Tổ Cắt dựng và Tổ Đồ họa kiểm tra ngay: nếu có từ nghe nhầm, mốc lặng cắt phạm vào âm cuối của từ, hoặc số liệu/giá lệch thông tin Dũng → **yêu cầu Tổ Chép lời sửa ngay tại chỗ** trước khi ghép cảnh.
3. **Cắt lặng & Dựng tinh ngay trên từng phân đoạn (In-line Segment Editing):**
   - Bỏ khoảng lặng thừa, ậm ừ, vấp/lặp, tiếng ho, take hỏng, cảnh trùng; **giữ quãng ngừng có nghĩa hoặc nhấn ý** [N4].
   - Người dẫn phải **nói hết câu mới chuyển cảnh** (`≥ 0.1s` sau từ cuối).
   - BĐS: xếp cảnh theo lộ trình xem nhà hợp lý [N5], B-roll đủ thời lượng xem (`~4.5–5s`), không dùng lặp clip B-roll.
   - Sửa lỗi điểm cắt **ngay khi đang cắt từng phân đoạn**, không đợi ghép xong cả video mới rà lại.
4. **Nộp:** `words.json` + danh sách cắt (`timecode + lý do`) + bảng `câu nói ↔ cảnh`.

## 2b. Che địa chỉ Tự động (Chạy Đồng thời cùng lúc với Cắt dựng & Đồ họa)
Chi tiết: `references/che-dia-chi.md`.
- Tổ Bảo mật (`dung-che-dia-chi` hoặc các Sub-Agents chia theo nhóm clip) quét khung mỗi `0.5s` + mọi điểm cắt ngay trên các clip được chọn.
- Phát hiện số nhà, biển số nhà, bảng tên hẻm, giấy tờ → tạo vùng `boxblur` bám theo chuyển động (tracking, nới biên `15–20%`) **ngay lập tức**. Không chắc vẫn che.
- **Kiểm tra chéo:** Tổ Render/QA hoặc Tổ Đồ họa khi đặt chữ trên cảnh nếu thấy bất kỳ khung nào còn lộ số nhà đọc được → **yêu cầu Tổ Bảo mật vá ngay khung đó trước khi làm tiếp**.
- Nộp: Bảng vùng che + ảnh trước/sau (0 khung lộ).

## 2c. Khóa Phân đoạn Tức thời (`segment_lock: true`) để Đẩy Luồng Đồng thời
- Thay vì bắt các Tổ Đồ họa/Màu/Âm thanh ngồi chờ khóa hình toàn bộ video gây trễ tiến độ, ngay khi từng phân đoạn (`S1, S2...`) và `word_id` được chốt (`segment_lock: true`), các Tổ Đồ họa (Chữ/MG), Tổ Màu và Tổ Âm thanh (SFX/BGM) **chạy song song đồng thời ngay trên phân đoạn đó**.
- Nếu cần chỉnh sửa nhịp ở phân đoạn nào, chỉ mở khóa và **sửa cục bộ đúng phân đoạn đó**, tự động cập nhật timecode qua neo `word_id` mà không làm hỏng các phân đoạn khác.

Cổng: G1, G2, G4b (`rules/cong-chat-luong.md`).
