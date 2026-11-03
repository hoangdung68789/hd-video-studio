---
name: ai-auto-genre-or-template
description: "/dung-video có 2 chế độ (29/10/2026): AI tự phân loại thể loại + chọn công cụ, hoặc áp template auto-style-learner Dũng chọn; 3D và LUT DJI không còn bắt buộc"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-29T14:31:55.729Z
---

29/10/2026 Dũng chốt: /dung-video không còn bắt buộc mọi video theo template. Chế độ A (mặc định khi không có `tpl:`): AI tự phân loại thể loại video rồi chọn công cụ/engine/hiệu ứng phù hợp. Chế độ T: Dũng chọn mã template TV-xx từ `asset/phong_cach/template/INDEX.md` thì áp nguyên khối template đó. Hiệu ứng 3D không còn là lớp bắt buộc (AI tự quyết theo nội dung hoặc Dũng chỉ định). LUT DJI không mặc định.

**Why:** Dũng muốn AI tự quyết theo từng thể loại thay vì quy trình cố định.

**How to apply:** Ghi `mode` + `genre` + lý do vào edit-state ở giai đoạn 1. Không hỏi Dũng chọn template. Liên quan: [[dji-dlog-official-lut]], [[template-only-on-request]], [[video-dispatcher-no-style-question]]
