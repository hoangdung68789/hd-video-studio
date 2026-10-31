---
name: delete-preview-after-final
description: "Sau khi render xong bản cuối, tự xóa bản preview/draft của dự án đó (Dũng cho phép lâu dài, 2026-10-23)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 43fd2eed-0651-4bfa-878d-b2e0f06cd240
  modified: 2026-10-23T15:28:37.282Z
---

Khi đã render xong video hoàn chỉnh (bản cuối) và kiểm file OK → tự động xóa các bản preview/draft của chính dự án đó (vd `preview/*_preview_720p60.mp4`, `hf/renders/draft*.mp4`), không cần hỏi lại.

**Why:** tránh trùng lặp video và đầy bộ nhớ máy Dũng.
**How to apply:** chỉ xóa file preview/draft render trong thư mục dự án sau khi bản cuối đã kiểm (ffprobe + phát hết). Không xóa footage gốc, bản cuối, file nguồn dựng. Bản master trung gian trùng nội dung bản cuối (vd `hf/renders/master.mp4`) cũng xóa luôn sau khi kiểm bản cuối đọc được (Dũng đồng ý 2026-10-23). Related: [[render-output-path]]
