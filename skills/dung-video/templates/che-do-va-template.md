# Hai chế độ dựng và template trọn bộ

## Hai chế độ dựng (Dũng chốt 29/10/2026, thay luật "mọi video theo template")
- **Chế độ T — Dũng chọn template** (`tpl:<mã>` hoặc nói tên template): áp đúng template đó từ `asset/phong_cach/template/INDEX.md` (do `hoang-dung-auto-style-learner` học), theo các ý dưới.
- **Chế độ A — AI tự quyết** (không có `tpl:`): AI tự phân loại thể loại (bds/promo/talking/explainer/music hoặc thể loại khác đo được từ footage + lời) rồi tự chọn công cụ, engine, hiệu ứng, màu theo `references/presets.md` + `routing.md`. Template trong INDEX chỉ là tham khảo, không bắt buộc. Không hỏi Dũng chọn template.
- Không mặc định LUT DJI, không mặc định 3D: màu và 3D do AI quyết theo footage + nội dung (xem giai đoạn 3 và presets).
- **Review BĐS (người dẫn + tour)**: dựng bằng bộ script `<HD_VIDEO_HOME>\Videos\_TEMPLATE_BDS_Review_2phut` (`new_project.ps1 -Name …`, chỉ sửa `project.py`; README + LOI_CAN_TRANH ngắn). Đây là bộ công cụ, không phải template phong cách: bố cục vẫn tự lập theo lời + nhịp nhạc.

## Template video trọn bộ (chỉ áp khi chế độ T hoặc có video mẫu)
- Template lấy từ `asset/phong_cach/template/INDEX.md` (trạng thái Dùng được/Chuẩn), do `hoang-dung-auto-style-learner` tự học và tự cập nhật — template mới có trong INDEX là dùng được ngay.
- Áp NGUYÊN KHỐI: bố cục cảnh, chuyển cảnh, hiệu ứng, MG/animation, chữ + SFX, nhịp dựng, nhịp nhạc, cơ chế giữ chân đi cùng nhau trên một dòng thời gian. Không lấy lẻ từng phần từ nhiều template.
- Mọi agent (Dựng, Đồ họa, Âm thanh, QA) đọc cùng `template.json`; `template.map` ghi đoạn template ↔ take của Dũng. Thời lượng khác mẫu → co/giãn theo đoạn, giữ mật độ sự kiện/giây và vị trí trên phách nhạc. Chi tiết: `hoang-dung-auto-style-learner/references/template-video.md` mục 4.
- Có video mẫu Dũng gửi → lập template của mẫu trước (learner) rồi dựng theo nó. Mã template Dũng chọn không có trong INDEX → hỏi Dũng 1 câu kèm 2–3 mã gần nhất, không tự thay.
- Luật cứng /video thắng template (chữ chỉ từ lời + thông tin Dũng, không nền hộp, kêu gọi theo dõi chỉ khi Dũng nói).
