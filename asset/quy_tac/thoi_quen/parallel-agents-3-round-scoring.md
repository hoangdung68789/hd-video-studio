---
name: parallel-agents-3-round-scoring
description: "29/10/2026: agent dựng video chạy song song cùng lúc; quản lý tổng tự rà 3 vòng, tự chấm có dẫn chứng thật, chỉ gửi Dũng khi 100/100; LUT tự phân loại theo môi trường"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8873daa7-426f-4da9-b980-b4726bba8515
  modified: 2026-10-29T14:44:45.501Z
---

Dũng chốt 29/10/2026:
- Các agent `dung-*` làm **cùng lúc**, mỗi agent một nhiệm vụ, dùng bản nháp trong edit-state rồi cập nhật; không làm xong phần này mới tới phần kia.
- Quản lý tổng (trợ lý cấp cao) liên tục rà lỗi + chấm điểm; trước khi chấm đạt phải tự rà **đủ 3 vòng**, không giao skill khác chấm thay; mỗi điểm có dẫn chứng thật (số đo, ảnh khung, timecode, log). Chỉ gửi Dũng khi 100/100.
- Màu: AI tự phân loại môi trường từng clip (bảng ENV color-master + nhóm freshluts) và chọn LUT theo môi trường + camera.
- AI không nghe được âm thanh → dùng MCP `antigravity-video-bridge` (đã thử 29/10 chạy được; file phải có luồng tiếng).

**Why:** Dũng muốn nhanh (song song) nhưng không đổi lấy chất lượng; ghét kết luận suông.

**How to apply:** Luật nằm trong `dung-video` (Chạy song song, Chọn LUT tự động, Nghe âm thanh) và orchestrator. Liên quan: [[orchestrator-100-point-rule]], [[ai-auto-genre-or-template]], [[dji-dlog-official-lut]]
