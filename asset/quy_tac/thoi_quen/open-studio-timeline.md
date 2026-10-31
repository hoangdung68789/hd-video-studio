---
name: open-studio-timeline
description: "Mỗi lần dựng video, luôn tự mở timeline dự án trong Studio (HyperFrames/Remotion) cho Dũng xem"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2d9cbbd0-2a3d-4ce5-815d-21068638c179
  modified: 2026-10-31T15:48:44.647Z
---

Mỗi khi tiến hành dựng video, luôn mở dự án timeline trong Studio cho Dũng xem (không đợi Dũng hỏi).

31/10/2026 Dũng chốt thành luật số 0 của skill: tạo dự án + `hf/index.html` khung và mở Studio là VIỆC ĐẦU TIÊN, trước cả đo footage; không được bỏ qua (lần 45.4 làm muộn nên Dũng không tìm thấy dự án). Cổng có thể khác 4700: dùng cổng preview_start trả về.

**Why:** Dũng muốn theo dõi timeline trực tiếp trong lúc dựng (yêu cầu 25/10/2026, dự án DU-AN-MAU).

**How to apply:** Từ 30/10/2026 dùng HD Studio (`Apps\hd-studio`): có `hf/index.html` thì `preview_start {name:"hd-studio"}` rồi navigate `http://localhost:4700/?du-an=<tên>`. Dự án Remotion vẫn dùng Remotion Studio. Trước khi sửa tiếp hoặc xuất, đọc `studio_chinh_sua.jsonl` + `studio_ghi_chu.json` của dự án. Liên quan [[video-project-location]], [[render-output-path]].
