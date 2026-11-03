---
name: xuat-trong-hd-studio-gpu
description: "Tối 02/11/2026 không còn bắt buộc; chỉ xuất trong HD Studio bằng GPU (POST /vn/render) khi Dũng yêu cầu"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-01T14:58:18.194Z
---

> Cập nhật tối 02/11/2026 (Dũng chọn thay nguyên xi gói skill): `dung-video` mới không còn bắt buộc xuất trong HD Studio bằng GPU và không còn cấm HyperFrames Studio; render 1 lần, H.265 theo `workflow/07-qa-render.md`. Luật bên dưới chỉ áp dụng khi Dũng yêu cầu xuất trong HD Studio.

31/10/2026 Dũng chốt: xuất trong HD Studio của Dũng, bằng GPU; bỏ Studio HyperFrames, không render ở đó. Đã ghi vào `rules/luat-cung.md`, `rules/studio-timeline.md`, `references/giai-doan.md`.

**Why:** Dũng muốn thấy và kiểm soát lần xuất ngay trong công cụ của mình; lần DU-AN-MAU AI chạy lệnh ngoài nên Studio không hiện tiến độ.

**How to apply:** `POST /vn/render?du-an=<tên>` với `{"fps":60,"gpu":true,"quality":"delivery"}`, dùng cổng preview_start trả về. Lõi render trong HD Studio vẫn là HyperFrames (`Apps\hd-studio\server.mjs`); nói đúng khi Dũng hỏi. 01/11/2026 Dũng đã hủy việc tách Studio khỏi HyperFrames vì tốn quá nhiều thời gian và cho hoàn tác toàn bộ bản thử; chỉ giữ quy tắc xuất bằng GPU, đừng tự đề xuất làm lại. Thay phần lệnh render trong [[final-render-h264]].
