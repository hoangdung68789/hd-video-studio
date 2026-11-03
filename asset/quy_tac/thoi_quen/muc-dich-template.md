---
name: muc-dich-template
description: "Lý do duy nhất template tồn tại — dùng ngay, giống tuyệt đối hiệu ứng + mẫu chữ gốc (sai là loại), áp ngay cho footage của Dũng"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-02T17:13:13.170Z
---

Template (TV-xx) chỉ có giá trị khi:
1. Dùng được ngay: giống TOÀN BỘ hiệu ứng và mẫu chữ của video gốc (kể cả SFX đi kèm). Sai/lệch là loại bỏ, không giữ dạng "Thử nghiệm".
2. Áp ngay lên footage của Dũng: thay footage + lời là ra video, mọi hiệu ứng là recipe dùng lại được.
3. Tuân thủ TOÀN BỘ quy tắc Dũng đã đặt trong skill `hoang-dung-auto-style-learner` (luật cứng, đo đủ lớp, tên có nguồn, vì sao, SFX, chấm 3 vòng, lưu trữ, xóa video học…).

Không được bỏ qua màu sắc hiển thị của video mẫu (Dũng 02/11): màu chữ/chuyển màu đo từng khung, và tông màu hình (bộ màu "theo video mẫu", .cube) lưu trong template — khi dựng vẫn hỏi 3 lựa chọn màu, đây là lựa chọn (2).

Luật Dũng chốt 03/11/2026:
- Template phải khớp TOÀN BỘ video mẫu; sai thì không còn là template và không được dùng.
- AI không tự làm khác mẫu khi chưa có lệnh của Dũng.
- Template phải đủ 8 thành phần: (1) Text, (2) SFX, (3) VFX, (4) Motion Graphics, (5) Effect, (6) BGM, (7) A-roll và B-roll, (8) bố trí, cấu trúc và cách dùng bố cục.
- Antigravity sẽ hỗ trợ Claude thêm dữ liệu để tạo template (Dũng tự cấu hình).
- Mỗi template luôn riêng biệt, Dũng tự chọn. Việc của Claude: (1) gửi liên kết thư mục chứa template liên quan, (2) gợi ý template.
- Mẫu khác luật dựng chung: trong template giữ đúng mẫu, lúc dựng hỏi Dũng từng trường hợp. VFX = tác động lên hình; Effect = hiệu ứng dựng (Dũng duyệt 03/11).

**Why:** 02/11/2026 Dũng: "tôi không muốn nó đã là templates mà vẫn không thể sử dụng lại các hiệu ứng mà tôi muốn"; "sfx đi kèm là không thể bỏ qua". Liên quan [[diem-thap-khong-pass]].

**How to apply:** [[hoang-dung-auto-style-learner]]: mỗi hiệu ứng trong mẫu phải có tên (có nguồn), recipe HyperFrames + SFX, chấm giống tuyệt đối; template phải là bộ dựng nhận footage/lời của Dũng. Chưa đạt 100 → không được dùng, không gọi là template đạt.
