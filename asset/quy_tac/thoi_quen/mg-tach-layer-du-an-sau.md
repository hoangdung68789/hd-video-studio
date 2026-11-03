---
name: mg-tach-layer-du-an-sau
description: "03/11/2026: từ dự án sau, MG nhiều phần (bản đồ, sơ đồ) phải tách thành từng layer riêng (nền, đường, icon/ghim, chữ); không áp cho DU-AN-MAU"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-03T10:24:24.089Z
---

Từ dự án sau, MG nhiều phần như bản đồ phải là từng layer riêng (ảnh nền, đường, icon/ghim, chữ) để Dũng tự chỉnh. Dự án DU-AN-MAU giữ nguyên, không tách.

**Why:** Dũng muốn chỉnh riêng icon, line, maps; đã nói rõ "việc tách layer là dùng cho dự án sau, không phải lần này".

**How to apply:** Khi dựng dự án mới, dựng sẵn MG theo từng layer, hoặc dùng thao tác `splitMgLayers` trong `Apps/hd-studio/lib/html.mjs` (nút "Xem thử tách thành từng layer" ở bảng thuộc tính). Không tự chạy lên dự án đang làm dở.
