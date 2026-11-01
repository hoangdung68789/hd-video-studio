---
name: zoom-muot-khong-rung
description: "31/10: không dùng rung; hiệu ứng tên Zoom in - Zoom out; mọi hiệu ứng phải mượt, không giật khung"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d3ed198d-a332-4a51-a945-b2b0698816b4
  modified: 2026-10-31T16:38:52.954Z
---

31/10/2026 Dũng yêu cầu xóa rung, không áp dụng cho lần sau; đổi tên "Đẩy cận chậm" thành "Zoom in - Zoom out"; mọi hiệu ứng phải mượt, tự nhiên, không giật khung hình.

**Why:** Dũng thấy giật khung ở video DU-AN-MAU (nguồn 50fps xuất 60fps, zoom tuyến tính rất chậm).

**How to apply:** Clip nguồn đổi về đúng fps xuất trước khi dựng (ffmpeg `framerate`), tween zoom dùng `sine.inOut` + `force3D`, xen kẽ vào/ra. Sau render đo số khung trùng ở cảnh đứng yên. Liên quan [[free-to-work]].
