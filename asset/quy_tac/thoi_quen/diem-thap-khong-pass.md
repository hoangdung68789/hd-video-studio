---
name: diem-thap-khong-pass
description: "Cập nhật 03/11/2026: Bản dựng video đạt từ ≥98/100 trở lên (0 lỗi cấm) là ĐẠT (PASS) và bàn giao ngay kèm giải trình chi tiết; dưới 98/100 là Chưa đạt và chỉ sửa cục bộ ngay đoạn lỗi (riêng học Template TV-xx vẫn yêu cầu khớp mẫu)"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-03T06:03:50.055Z
---

> **Cập nhật 03/11/2026 (Dũng chốt cho `/dung-video`):**
> - **Với dựng dự án video (`/dung-video`):** Agent Tổng kiểm tra nhanh tổng thể video; nếu điểm đạt **tối thiểu từ `98/100` trở lên (`≥ 98/100`)** (và 0 lỗi cấm: không lộ địa chỉ, không chữ tự bịa, có nhạc nền) thì được công nhận **ĐẠT (`PASS`)**, bàn giao ngay bản cuối cho Dũng và nói rõ chi tiết từng hạng mục. Nếu `< 98/100` → ghi "Chưa đạt — <điểm>/100" và **chỉ sửa ngay đúng đoạn có lỗi** để khớp toàn bộ video.
> - **Với trích xuất/tạo Template gốc (`TV-xx` trong `hoang-dung-auto-style-learner`):** Dũng nhắc lại 03/11/2026: template vẫn phải đạt đúng `100/100` (`R-L033`), khớp toàn bộ 8 thành phần của video mẫu; không áp ngưỡng 98 cho template. `template_check` PASS chỉ là cổng phủ dữ liệu, không phải điểm chất lượng cuối.
