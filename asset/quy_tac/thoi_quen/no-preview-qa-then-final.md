---
name: no-preview-qa-then-final
description: "Không gửi preview nữa — chỉ QA toàn bộ video, đạt thì render và gửi thẳng bản cuối"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-28T16:54:42.406Z
---

Dũng (28/10/2026): bỏ quy tắc preview, áp dụng cho mọi lần sau. Chỉ giữ bước QA kiểm toàn bộ video; QA đạt thì render bản cuối và gửi luôn, không hỏi duyệt preview.

**Why:** Dũng không muốn duyệt bản nháp, mất thời gian; muốn nhận một bản cuối đã qua QA.
**How to apply:** Ở /video bỏ giai đoạn 7 "trình preview"; vẫn chạy QA độc lập (khung hình mỗi 1–2s, mọi điểm cắt, mọi chữ). Đạt → render H.264 60fps ([[final-render-h264]]) và trả `Thư mục chứa kết quả:` ([[render-output-path]]). Thay cho [[delete-preview-after-final]] phần preview.
