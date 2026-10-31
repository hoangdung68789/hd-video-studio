---
name: dji-dlog-official-lut
description: "Không mặc định LUT DJI nữa (29/10/2026): AI đo footage rồi chọn cách chỉnh màu; chỉ khi footage là D-Log mới dùng LUT DJI chính thức V1.0"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 3dd155e1-96d3-4a6a-b577-4d340776d6c8
  modified: 2026-10-29T14:31:55.699Z
---

29/10/2026 Dũng bỏ luật "luôn áp LUT DJI Pocket 4 mặc định". AI đo footage (signalstats/ảnh khung) rồi tự chọn cách chỉnh màu theo thể loại video. Khi đo ra footage D-Log (phẳng, xám) thì vẫn dùng file chính thức `~\Documents\HoangDung_AI\HDRE_Library\luts\DJI OSMO Pocket 4 D-Log to Rec.709 V1.0.cube` làm nền, không thay bằng LUT đã sửa (luật 20/10/2026 vẫn giữ cho trường hợp này), rồi chỉnh WB/tone từng clip.

**Why:** Dũng muốn AI tự phân loại video và chọn công cụ, không áp một quy trình màu cố định cho mọi video.

**How to apply:** Giai đoạn 3 của /dung-video: đo trước rồi mới quyết, ghi lý do vào edit-state. Liên quan: [[bds-grade-pacing-feedback]], [[freshluts-lut-library]], [[ai-auto-genre-or-template]]
