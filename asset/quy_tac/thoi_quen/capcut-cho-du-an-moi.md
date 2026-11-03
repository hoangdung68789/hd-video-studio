---
name: capcut-cho-du-an-moi
description: "Tối 02/11/2026: skill mới không nhắc CapCut; cách dựng draft CapCut giữ để tham khảo, chỉ dùng khi Dũng yêu cầu"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-01T18:41:02.816Z
---

> Cập nhật tối 02/11/2026 (Dũng chọn thay nguyên xi gói skill): `dung-video` mới không nhắc CapCut; dự án mới dựng theo `workflow/00-khoi-dong-brief.md`. Cách dựng CapCut bên dưới giữ để tham khảo, chỉ dùng khi Dũng yêu cầu.

Từ 02/11/2026 Dũng chốt: AI tạo dự án video mới bằng CapCut. Dự án đầu tiên theo luật này: "DU-AN-MAU".

**Why:** Dũng muốn mở, chỉnh và xuất trên CapCut thay vì HD Studio.

**How to apply:** Draft CapCut desktop nằm ở `%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft\<tên>\`, `draft_content.json` là JSON thường (chưa mã hóa, CapCut 9.7). Luật số 0 và luật xuất GPU trong HD Studio của dung-video ([[xuat-trong-hd-studio-gpu]], [[open-studio-timeline]]) xung đột với luật này → luật này thắng cho dự án mới; skill dung-video chưa được sửa (cần hỏi Dũng trước khi sửa skill). Các luật edit khác (chữ, SFX, nhạc nền, không che mặt, an toàn TikTok) vẫn giữ.

Cách dựng đã chạy được (02/11): `pip install pycapcut` → script mẫu `Videos\DU-AN-MAU\scripts\build_capcut.py` (track Video/MG/Chữ/Nhạc/SFX, chia track tự động khi khối trùng giờ, âm lượng theo LUFS đo được). MG xuất ProRes 4444 nền trong suốt bằng `mg_render.py`. CapCut đang chạy tự nhận draft mới. ffmpeg trên máy này crash khi `-filter_complex_script` nằm ở đường dẫn có dấu tiếng Việt → truyền bộ lọc trực tiếp.
