---
name: video-dispatcher-no-style-question
description: "/dung-video không nạp dispatcher, đi cùng orchestrator; không hỏi phong cách ở 1b; chỉ dùng template khi Dũng yêu cầu"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-27T14:25:02.462Z
---

> Cập nhật tối 02/11/2026 (Dũng chọn thay nguyên xi gói skill): `dung-video` đi cùng orchestrator, không nạp dispatcher. Font theo vai: phụ đề và nhãn Be Vietnam Pro, chữ hook font display. SFX chỉ cho chữ hook. Phần bên dưới trái các điểm này là luật cũ.

> Cập nhật 01/11/2026: smart-dispatcher-portable và hoang-dung-agent-orchestrator không còn tự nạp kèm dung-video; điều phối đã gộp vào dung-video/rules/dieu-phoi.md (3 vòng + 1 QA). Chỗ nào bên dưới nói "luôn nạp" là luật cũ.

Mỗi lần chạy `/video` / `dung-video`: nạp luôn skill `smart-dispatcher-portable` cùng lúc. Bỏ câu hỏi chọn phong cách (giai đoạn 1b): dựng thẳng theo sở thích của Dũng (quy tắc dựng trong memory), ghi `style.source = so_thich`. KHÔNG tự dùng template (vd `_TEMPLATE_BDS_Review_2phut`) — chỉ dựng theo template khi Dũng yêu cầu rõ.

Bỏ bước preview 720p: render thẳng bản cuối, nhưng BẮT BUỘC mở Studio (launch.json + preview_start) ngay khi có composition để Dũng theo dõi tiến trình dựng (Dũng nhắc 27/10/2026: "tôi nhớ đã yêu cầu bỏ qua phần preview 720p").

Không khóa font mặc định (chọn bộ phối mới từ `HDRE AI\Fonts\capcut` / FONTS.md cho mỗi video) và không khóa SFX: dùng SFX theo phân loại của `dung-text-fx` (`sfx_plan.py` chọn theo ý định lời), không ép một bộ swish cố định (Dũng 27/10/2026 — thay luật "chỉ swish mềm" của bản 818).

Mọi mẫu/template gửi Dũng (template video, mẫu MG/chữ hiệu ứng) LUÔN kèm link video thật đã học bằng `hoang-dung-auto-style-learner` (danh sách `asset/phong_cach/` hoặc Notion "Video đã học", có mốc thời gian).

**Why:** Dũng ra lệnh 27/10/2026 khi dựng DU-AN-MAU: "smart-dispatcher-portable luôn phải đi cùng /dung-video", "từ nay bỏ qua việc hỏi phong cách", "chỉ dựng theo template khi tôi yêu cầu".
**How to apply:** Câu hỏi khác vẫn hỏi khi thật sự thiếu (chữ nghe không chắc, link bản đồ), nhưng gom một lần. Liên quan [[orchestrator-100-point-rule]], [[bds-video-edit-rules]].
