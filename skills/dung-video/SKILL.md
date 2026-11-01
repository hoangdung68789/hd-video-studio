---
name: "dung-video"
description: "Lệnh /video dựng video hoàn chỉnh cho Dũng: AI tự phân loại thể loại video và chọn công cụ phù hợp, hoặc áp nguyên khối Template video trọn bộ Dũng chọn (cảnh, chuyển cảnh, hiệu ứng, MG, chữ+SFX, nhịp dựng, nhịp nhạc, giữ chân); chọn phong cách (tên có nguồn + link mẫu đã kiểm), cắt dựng, che địa chỉ, màu theo footage (không mặc định LUT), phụ đề, chữ hiệu ứng + SFX theo nghĩa lời, bản đồ MG, b-roll/animation minh họa lời, không che mặt người dẫn, nói hết câu mới chuyển cảnh, nhạc nền bắt buộc, QA độc lập, giao MỘT bản cuối H.264 60fps."
---

# dung-video — /video

Lệnh:
- `/video <footage> [bds|promo|talking|explainer|music] [tpl:<mã TV-xx>] [style:<tên>] [mau:<video mẫu>] [ghi chú]`: chạy đủ giai đoạn 0–7. Có `tpl:` là áp template đó; không có thì AI tự phân loại và chọn công cụ.
- `/video text-fx <dự án>`: chỉ giai đoạn 4–6 (chữ + SFX). `/video sfx <moments.json>`: chỉ SFX.
- `/video hoc <mẫu>`: học từ mẫu bằng `hoang-dung-auto-style-learner`.

`smart-dispatcher-portable` và `hoang-dung-agent-orchestrator` là luật cứng, luôn nạp cùng skill này. Không đoán: có kế hoạch, sửa xong phải đo lại trên bản xuất rồi mới báo. Trả lời tiếng Việt. Bắt đầu dựng thì đọc `rules/luat-cung.md` trước, các file khác đọc khi tới bước cần.

## Quy trình cốt lõi
| Bước | Việc | Đọc khi tới bước |
|---|---|---|
| 0 | **Việc đầu tiên, không được bỏ qua: tạo dự án + `hf/index.html` khung và tự mở HD Studio đúng dự án** (luật số 0 ở `rules/luat-cung.md`); sau đó đọc sổ tự học, phân công | `rules/studio-timeline.md` |
| 1 | Đo footage, phân loại thể loại, chọn Chế độ A hoặc T, chọn style | `templates/che-do-va-template.md`, `references/presets.md`, `references/chon-phong-cach.md` |
| 2 | Chép lời, cắt dựng, che địa chỉ | `references/giai-doan.md`, `references/che-dia-chi.md` |
| 3 | Màu theo từng clip, không mặc định LUT | `references/chon-lut.md` |
| 4–5 | Bảng mốc, chữ, MG, b-roll, bản đồ, chuyển cảnh | `references/motion.md`, `references/text-fx/`, `references/ban-do.md`, `assets/textfx-kit/` |
| 6 | Nhạc, lời thoại và SFX thành .mp3 riêng trên timeline | `references/audio-gate.md`, `references/nghe-am-thanh.md`, `templates/khoi-timeline.html` |
| 7 | QA độc lập, render H.264 60fps, giao một bản cuối | `rules/cong-kiem-tra.md`, `rules/giao-va-xu-ly-loi.md` |

Giai đoạn 2–6 chạy song song sau khi xong bước 1. Bảng đầy đủ: `references/giai-doan.md`.

## Điều không được quên
- Mọi hiệu ứng và khối edit (chữ, video, ảnh, MG, chuyển cảnh, màu, thoại, SFX, nhạc) phải xuất hiện trên timeline Studio để chỉnh được. Không che mặt người dẫn.
- Thứ tự ưu tiên hiệu ứng: MG/motion design minh họa mượt → chữ đa dạng (màu, font, hiệu ứng, SFX; chưa có mẫu thì xin Dũng hoặc học từ video mẫu) → animation đi kèm; có bảng `thời điểm | loại | mục đích` trước khi dựng.
- Ngoài luật ở `rules/luat-cung.md`, AI được tự do chọn cách làm; Dũng sẽ yêu cầu sửa khi cần.
- Chưa qua cổng thì không sang bước sau; chưa 100/100 có dẫn chứng thì không gửi Dũng.
- Mỗi dự án ghi trạng thái vào `edit-state.json` theo `templates/edit-state.json`.

## Bốn thư mục
- `rules/`: luật bắt buộc. `references/`: kiến thức tra cứu. `templates/`: khuôn dự án và khối timeline. `assets/`: script, font, công thức.
