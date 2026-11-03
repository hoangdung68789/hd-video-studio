---
name: effects-as-timeline-clips
description: Từ 30/10/2026 mọi hiệu ứng AI áp vào video phải là clip riêng ở lớp Hiệu ứng của HD Studio để Dũng tự căn chỉnh
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-30T16:45:13.947Z
---

Mọi hiệu ứng AI áp vào video (zoom, rung, flash, chuyển cảnh phủ...) phải hiện thành clip riêng trên timeline HD Studio, kéo dời và rút ngắn được.

**Why:** Dũng yêu cầu 30/10/2026: "đối với hiệu ứng được áp dụng cũng sẽ được tạo dưới timeline để căn chỉnh theo ý người dùng", nối tiếp quy tắc tách âm thanh [[audio-mp3-on-timeline]].

**How to apply:** Cách viết (`class="clip fx"`, tween ghi `data: "<id clip hiệu ứng>"`) nằm ở mục "HD Studio" của skill dung-video; Studio đã đọc được dạng này từ 30/10/2026. Dự án cũ chỉ đổi khi Dũng yêu cầu. Liên quan [[hd-studio]].
