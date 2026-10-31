---
name: final-render-h264
description: Bản cuối video xuất H.264 (không còn H.265) từ 2026-10-23; vẫn giữ 60fps và quy tắc xóa preview/draft/master
metadata:
  node_type: memory
  type: feedback
  originSessionId: 43fd2eed-0651-4bfa-878d-b2e0f06cd240
  modified: 2026-10-23T15:50:43.975Z
---

Từ 2026-10-23 Dũng muốn render video hoàn chỉnh ở **H.264** (thay cho H.265 mà skill dung-video / bds-video-master ghi). Giữ nguyên các quy tắc khác: 60fps, độ phân giải gốc, bitrate cao phù hợp, sau khi bản cuối kiểm OK thì xóa preview/draft/master trung gian.

**Why:** Dũng chọn (có thể vì tương thích phát/đăng tốt hơn).
**How to apply:** HyperFrames: `render --quality delivery --fps 60` ra thẳng MP4 H.264 làm bản cuối; không nén lại sang HEVC. Related: [[delete-preview-after-final]], [[render-output-path]]
