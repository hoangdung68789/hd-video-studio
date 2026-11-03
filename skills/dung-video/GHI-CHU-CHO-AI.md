# Ghi chú cho AI của tài khoản mới
Dũng yêu cầu ngày 01/11/2026. Bản skill này đã gộp `hoang-dung-agent-orchestrator` và `smart-dispatcher-portable` vào `rules/dieu-phoi.md`. Làm các việc dưới đây một lần, khi Dũng đồng ý chạy. Sao lưu trước khi sửa, chuyển vào thư mục sao lưu thay vì xóa hẳn. Báo Dũng bảng `việc | kết quả | dẫn chứng`.

## 1. Cài
- Chép `commands/*.md` vào `~/.claude/commands/`, `agents/*.md` vào `~/.claude/agents/`.
- Đường dẫn trong skill viết theo máy `<HD_VIDEO_HOME>`. Máy khác thì báo Dũng đường dẫn nào không tồn tại, không đoán.

## 2. Xóa luật xung đột và điểm nghẽn
Skill này thắng khi có xung đột. Tìm trong `CLAUDE.md`, bộ nhớ, skill khác của tài khoản; chỉ gỡ đúng phần sau:
| Gỡ | Thay bằng |
|---|---|
| Luật toàn cục luôn áp `smart-dispatcher-portable` và `hoang-dung-agent-orchestrator` trong `CLAUDE.md` | `rules/dieu-phoi.md`. Giữ `hoang-dung-token-saver` và mục "Chống đoán" |
| Dispatcher tự bật với lệnh dựng video | Thêm vào mô tả dispatcher: không bật với `/dung-video`, `/video`, `/dung-mg`, `/dung-motion`, `/dung-animation`, `/dung-studio` |
| Tự áp template, tự chọn template, hoặc "không hỏi template" | Luôn hỏi (`templates/che-do-va-template.md`) |
| Tự chọn LUT, LUT DJI mặc định, công thức màu cố định, `MASTER_LUT` mặc định có giá trị trong bộ dựng BĐS | Giữ màu gốc, chỉ gợi ý cảnh lỗi (`references/chon-lut.md`); `MASTER_LUT = None` |
| Câu hỏi chọn phong cách | Dựng theo sở thích đã lưu (`references/chon-phong-cach.md`) |
| Mức nhạc −19 LUFS làm điều kiện 100/100 | Chỉ báo số; G5 đo `ebur128` từng đoạn. `sfx_audit.py` trong skill đã sửa |
| "Gửi mẫu MG trước" cho mọi MG | Luật 17 ở `rules/luat-cung.md` |
| Câu nhử tự thêm | Chỉ khi nằm trong lời thoại hoặc Dũng đưa |
| Bản đồng bộ cũ `anthropic-skills:dung-video` | Báo Dũng gỡ hoặc thay trên claude.ai; AI không tự xóa được phía tài khoản |

Giữ `hoang-dung-agent-orchestrator` và `smart-dispatcher-portable` cho việc không phải video. Luật không chắc có xung đột hay không thì gom hỏi Dũng một lần, không tự gỡ.

## 3. Kiểm thử (tài khoản đầu chưa làm do hết token)
1. `/dung-studio <dự án>`: Studio có sẵn thì dùng lại, không mở server thứ hai; đúng dự án. Tài khoản đầu đã thử mở đúng dự án; phần nối phiên cần thử lại.
2. `/dung-mg`, `/dung-motion`, `/dung-animation`: chưa từng chạy. Thử trên một **bản sao** dự án, mỗi lệnh một khối; kiểm clip hiện trên timeline, ảnh đầu/giữa/cuối khối, không che mặt.
3. `/dung-video`: phải hỏi template khi lệnh không có `tpl:`/`mau:`; footage đã có màu không bị đổi.
4. Ngưỡng màu ở `references/chon-lut.md`: ngưỡng ám màu đang quá nhạy, gắn cờ 13/40 clip thật (U lệch tới −25, V tới +20), nhiều clip đã nằm trong dự án cũ; chưa ai mở ảnh xác nhận. Mở ảnh các clip bị gắn cờ, đề xuất ngưỡng mới có số đo, Dũng duyệt rồi mới sửa. Ngưỡng tối, sáng chưa có mẫu lỗi thật.
5. `sfx_audit.py`: đã thử trên dự án DU-AN-MAU, chạy được, mức nhạc chỉ báo số. Lần thử dùng nhạc chưa né nên điểm SFX so với nhạc chưa chính xác.

## 4. Dũng cần chốt
Mức nhạc lúc nói: skill ghi −28 LUFS; ghi chú 27/10 ghi −22 LUFS "chờ Dũng nghe duyệt". Hỏi Dũng một lần rồi ghi lại.
