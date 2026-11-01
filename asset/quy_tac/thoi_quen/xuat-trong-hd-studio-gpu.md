---
name: xuat-trong-hd-studio-gpu
description: "31/10: bắt buộc xuất video trong HD Studio bằng GPU (POST /vn/render); không chạy hyperframes render trực tiếp, không dùng Studio HyperFrames"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d3ed198d-a332-4a51-a945-b2b0698816b4
  modified: 2026-11-01T14:58:18.194Z
---

31/10/2026 Dũng chốt: xuất trong HD Studio của Dũng, bằng GPU; bỏ Studio HyperFrames, không render ở đó. Đã ghi vào `rules/luat-cung.md`, `rules/studio-timeline.md`, `references/giai-doan.md`.

**Why:** Dũng muốn thấy và kiểm soát lần xuất ngay trong công cụ của mình; lần DU-AN-MAU AI chạy lệnh ngoài nên Studio không hiện tiến độ.

**How to apply:** `POST /vn/render?du-an=<tên>` với `{"fps":60,"gpu":true,"quality":"delivery"}`, dùng cổng preview_start trả về. Lõi render trong HD Studio vẫn là HyperFrames (`Apps\hd-studio\server.mjs`); nói đúng khi Dũng hỏi. 01/11/2026 Dũng đã hủy việc tách Studio khỏi HyperFrames vì tốn quá nhiều thời gian và cho hoàn tác toàn bộ bản thử; chỉ giữ quy tắc xuất bằng GPU, đừng tự đề xuất làm lại. Thay phần lệnh render trong [[final-render-h264]].
