---
name: khong-doan-do-lai-truoc-khi-bao
description: "01/11: /dung-video luôn chạy cùng smart-dispatcher-portable + hoang-dung-agent-orchestrator (luật cứng); quy trình không đoán: đo, kế hoạch, sửa, đo lại trên bản xuất; có danh sách công cụ"
metadata:
  node_type: memory
  type: feedback
  originSessionId: eaa2e849-ec6a-4ca5-ba70-f665d88d69cc
  modified: 2026-11-01T13:40:11.243Z
---

01/11/2026 Dũng chốt: `smart-dispatcher-portable` và `hoang-dung-agent-orchestrator` là luật cứng, luôn hoạt động cùng `/dung-video`. AI không đoán, chỉ làm theo quy tắc, có kế hoạch rõ ràng, có kiểm chứng. Lỗi ở video DU-AN-MAU: "người dùng đã yêu cầu sửa video 3 lần vẫn không sửa, chỉ đoán rồi không làm".

**Why:** AI đổi fps, đổi ease rồi báo xong mà chưa đo chuyển động trên bản xuất. Đo lại mới thấy footage rung sẵn, còn bộ đổi 50→60fps do AI thêm còn làm rung nặng hơn.

**How to apply — quy trình mỗi lần dựng hoặc sửa:**
1. Nạp 3 skill: `dung-video`, `smart-dispatcher-portable`, `hoang-dung-agent-orchestrator`; đọc `rules/luat-cung.md`. Tạo dự án và mở HD Studio trước tiên.
2. Tách đúng việc Dũng yêu cầu. Vừa/lớn: bảng tiểu tác vụ có tiêu chí đạt đo được.
3. Đo nguyên nhân trên file thật trước khi sửa, ghi số đo. Không chắc thì hỏi 1 lần, tối đa 3 câu, có lựa chọn.
4. Sửa đúng nguyên nhân, thử trên đoạn ngắn, đo lại rồi mới áp toàn bộ.
5. Xuất trong HD Studio bằng GPU (`POST /vn/render`), đo lại cùng cách trên bản xuất.
6. QA độc lập (vai `dung-qa`, chưa làm công đoạn nào) xem bằng mắt; bảng CP5 đủ dòng; không còn Chưa đạt mới trình 1 bản cuối.
7. Dũng nhắc lại một lỗi nghĩa là cách trước sai: bỏ cách đó, đo lại từ đầu, không báo "đã sửa" khi chưa có số đo.

**Công cụ đã kiểm chứng:**
- Rung/zoom: `ffmpeg` + phase correlation bằng numpy (so clip gốc, clip đã xử lý, bản xuất); `hyperframes snapshot --at` lấy PNG chưa nén để đo zoom. `ffmpeg` có `vidstabdetect`, `vidstabtransform`, `minterpolate`; `framerate` đổi 50→60 làm tăng rung, không dùng cho cảnh lia; `minterpolate` mci ở 1728×3072 chậm (~0,8 hình/giây).
- Lời: faster-whisper large-v3 trong `HDRE AI\venv`; không đưa từ vựng vào prompt ở clip không có lời vì gây ảo giác.
- Màu: quét kho `Downloads\freshluts-LUT-phan-loai_DAY-DU.zip`, gửi ảnh LUT gốc để Dũng chọn.
- Che địa chỉ: `boxblur` theo mốc tay; bản đồ: `fetch_map.py` (Esri + OSM), tiện ích tra Nominatim. SFX: `dung-text-fx/scripts/sfx_plan.py`, thư viện `Downloads\SOUNDEFFECT TAKING HEARD`, mỗi âm một `.mp3`.
- Âm lượng: bộ trộn render làm nhạc lớn tụt ~3 dB, trộn lại theo `data-volume` rồi ghép (`mux_audio.py` của dự án 45.4), đo `ebur128`.

Liên quan [[zoom-muot-khong-rung]], [[orchestrator-100-point-rule]], [[video-dispatcher-no-style-question]], [[xuat-trong-hd-studio-gpu]].
