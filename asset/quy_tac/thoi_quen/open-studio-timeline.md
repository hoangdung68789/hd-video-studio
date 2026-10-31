---
name: open-studio-timeline
description: "Mỗi lần dựng video, luôn tự mở timeline dự án trong Studio (HyperFrames/Remotion) cho Dũng xem"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2d9cbbd0-2a3d-4ce5-815d-21068638c179
  modified: 2026-10-30T12:17:50.516Z
---

Mỗi khi tiến hành dựng video, luôn mở dự án timeline trong Studio cho Dũng xem (không đợi Dũng hỏi).

**Why:** Dũng muốn theo dõi timeline trực tiếp trong lúc dựng (yêu cầu 25/10/2026, dự án DU-AN-MAU).

**How to apply:** Từ 30/10/2026 dùng HD Studio (`Apps\hd-studio`): có `hf/index.html` thì `preview_start {name:"hd-studio"}` rồi navigate `http://localhost:4700/?du-an=<tên>`. Dự án Remotion vẫn dùng Remotion Studio. Trước khi sửa tiếp hoặc xuất, đọc `studio_chinh_sua.jsonl` + `studio_ghi_chu.json` của dự án. Liên quan [[video-project-location]], [[render-output-path]].
