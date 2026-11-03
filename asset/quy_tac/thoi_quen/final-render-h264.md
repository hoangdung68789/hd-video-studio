---
name: final-render-h264
description: "Bản cuối video xuất H.265 (02/11/2026 Dũng đổi lại, thay H.264 từ 23/10); một file 9:16 cho cả ba nền tảng; vẫn 60fps và xóa preview/draft/master"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-02T14:04:51.681Z
---

02/11/2026 Dũng chọn **H.265** khi cập nhật gói `dung-video-files-moi.zip`, thay H.264 chốt ngày 23/10. Tên file giữ nguyên để không gãy liên kết. Một file 9:16 duy nhất dùng chung cho TikTok, Shorts, Reels. Giữ các quy tắc khác: 60fps, độ phân giải gốc, bitrate cao phù hợp, bản cuối kiểm OK thì xóa preview/draft/master trung gian.

**Why:** Dũng trả lời trực tiếp câu hỏi chọn codec lúc cài gói 02/11.
**How to apply:** Bản cuối ra H.265 theo `workflow/07-qa-render.md` của dung-video. Related: [[delete-preview-after-final]], [[render-output-path]]
