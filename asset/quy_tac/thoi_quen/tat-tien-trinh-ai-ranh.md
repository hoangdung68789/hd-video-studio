---
name: tat-tien-trinh-ai-ranh
description: "03/11 Dũng yêu cầu chủ động tắt tiến trình AI không dùng, chỉ mở khi cần; MCP rea và blender tắt mặc định, bật bằng mcp_bat_tat.cjs"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-03T06:41:51.738Z
---

Chủ động tắt tiến trình AI không dùng, chỉ mở khi cần (Dũng chốt 03/11/2026).

**Why:** Dũng thấy CPU/GPU quá tải; mỗi phiên Claude tự mở một bộ MCP riêng và các preview/ffmpeg để lại vẫn chiếm RAM.

**How to apply:**
- Xong việc, tự tắt preview, Chrome headless, ffmpeg, server do chính phiên mở; không cần hỏi.
- Trước khi tắt phiên khác: kiểm tra cây tiến trình con và thời gian hoạt động. Có ffmpeg/render/lệnh đang chạy, phiên vừa hoạt động, hoặc Remote Control đang bật thì giữ nguyên. Không chắc thì hỏi.
- App có cửa sổ Dũng tự mở (Antigravity...) thì hỏi trước khi đóng.
- MCP `rea`, `blender` tắt mặc định cho dự án HDRE AI. Cần thì `node "<HD_VIDEO_HOME>\mcp_bat_tat.cjs" bat blender`, có hiệu lực từ phiên mới; dùng xong tắt lại. Giữ `antigravity-video-bridge` vì dung-video cần cho chép lời và nghe SFX.
