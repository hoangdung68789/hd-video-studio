---
name: download-to-learn-then-delete
description: "Dũng cho tải video mẫu về máy để học (Antigravity cần mp4), học xong phải xóa video, chỉ giữ dữ liệu đã học"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-27T17:58:41.838Z
---

Dũng cho phép (28/10/2026) tải video mẫu (TikTok/Reels/YouTube) về máy để học phong cách, ghi đè luật "không tải file về" của hoang-dung-auto-style-learner. Điều kiện: tải vào thư mục riêng trống, học xong XÓA file video (mp4 + info.json), chỉ giữ dữ liệu đã học (blueprint, số đo, ghi chú, link gốc).

**Why:** công cụ học video Antigravity (antigravity_learn_video, listen_video_sfx) chỉ đọc file mp4 trên máy; đo trên file chính xác hơn tua trình duyệt và đo được âm thanh.

**How to apply:** dùng yt-dlp trong HDRE AI\venv; không tải video cho mục đích khác ngoài học; không đưa video người khác vào sản phẩm dựng; báo Dũng đã xóa sau mỗi đợt. Liên quan [[token-saver-always]].

**Ngoại lệ từ 30/10/2026:** video đã thành template (TV-xx) không xóa mà giữ ở `~\Downloads\Template_Video\<thể loại>\TV-xx.mp4`, Dũng tải lên Google Drive làm dự phòng cho HD Studio ([[hd-studio]]). Video chỉ để học vẫn xóa.
