---
name: open-studio-timeline
description: "Chỉ khi Dũng yêu cầu dựng: mở Studio của dự án theo workflow/00 (HyperFrames hoặc Remotion), xem được tới khi render xong"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-31T15:48:44.647Z
---

> Cập nhật tối 02/11/2026 (Dũng chọn thay nguyên xi gói skill): mở Studio của dự án theo `workflow/00-khoi-dong-brief.md`: HyperFrames Studio cho dự án HyperFrames, Remotion Studio cho Remotion; xem được từ lúc dựng tới khi render xong. Luật số 0 (tạo khung và mở HD Studio trước tiên) không còn trong skill.

02/11/2026: CHỈ mở Studio khi Dũng yêu cầu dựng video (dựng mới/sửa dự án); học mẫu, hỏi đáp, sửa luật, tìm tài nguyên thì không mở.

Mỗi khi tiến hành dựng video, luôn mở dự án timeline trong Studio cho Dũng xem (không đợi Dũng hỏi).

31/10/2026 Dũng chốt thành luật số 0 của skill: tạo dự án + `hf/index.html` khung và mở Studio là VIỆC ĐẦU TIÊN, trước cả đo footage; không được bỏ qua (lần DU-AN-MAU làm muộn nên Dũng không tìm thấy dự án). Cổng có thể khác 4700: dùng cổng preview_start trả về.

**Why:** Dũng muốn theo dõi timeline trực tiếp trong lúc dựng (yêu cầu 25/10/2026, dự án DU-AN-MAU).

**How to apply:** Từ 30/10/2026 dùng HD Studio (`Apps\hd-studio`): có `hf/index.html` thì `preview_start {name:"hd-studio"}` rồi navigate `http://localhost:4700/?du-an=<tên>`. Dự án Remotion vẫn dùng Remotion Studio. Trước khi sửa tiếp hoặc xuất, đọc `studio_chinh_sua.jsonl` + `studio_ghi_chu.json` của dự án. Liên quan [[video-project-location]], [[render-output-path]].
