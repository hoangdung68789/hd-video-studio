---
name: dung-text-fx
description: "Chữ hiệu ứng + SFX theo ý nghĩa lời thoại cho video BĐS của Dũng: chọn khoảnh khắc (hook, giá, diện tích, vị trí, điểm mạnh, tiện ích, pháp lý, CTA, tâm sự), dựng chữ động, chọn và canh SFX đúng nghĩa/cảm xúc người dẫn đang nói, chấm 100 điểm bằng máy. Gọi khi /video tới giai đoạn 4–6, khi cần SFX cho chữ/khoảnh khắc, và khi Dũng gửi mẫu chữ/SFX (video, ảnh, template, link, web, video hướng dẫn) cần dựng lại."
---

# dung-text-fx — /text-fx

Lệnh:
- `/text-fx <dự án>` — lập bảng mốc chữ → SFX theo ý nghĩa → chấm → báo cáo (dùng trong giai đoạn 4–6 của `/video`).
- `/text-fx sfx <moments.json>` — chỉ chạy quy trình SFX (`references/08-sfx.md`).
- `/text-fx hoc <mẫu>` — học hiệu ứng chữ + SFX từ mẫu của Dũng, tái hiện tới 100 điểm (`references/05-hoc-tu-mau.md` [chưa có — đang làm; tạm dùng `hoang-dung-video-effect-lab`]).
Luôn trả lời Dũng bằng tiếng Việt. Nạp dần: chỉ đọc file của bước đang làm.

## Luật cứng (không đổi)
1. Chữ chỉ gồm lời thoại thật + thông tin Dũng đưa (giá, địa chỉ, diện tích, kết cấu, hotline); nhãn bản đồ là ngoại lệ duy nhất. Không tự thêm slogan, CTA, con số.
2. Không khung/nền tối sau chữ. Không lặp chữ. Mọi chữ có SFX. Chữ hero chạm đúng từ nói ±2 khung. Vùng an toàn TikTok (~230px trên, ~480px dưới, ~160px phải).
3. Zoom, Ken Burns, punch-in, rung footage: AI tự quyết theo nội dung (Dũng bỏ luật cấm 31/10/2026).
4. Không tuyên bố "100 điểm" khi chưa có scorecard do script sinh. Không nới ngưỡng.
5. Font: dùng font giống mẫu nhất, không kiểm giấy phép; font lỗi tiếng Việt → báo Dũng đúng mẫu cảnh báo (in bởi `scripts/vn_font_gate.py`) và chờ.
6. DỪNG hỏi Dũng trước khi: cài package, tải file/font, xóa file, ghi đè skill khác, gọi API tốn credit, render bản cuối, gửi/đăng.
7. AI không nghe được âm thanh: mọi kết luận về SFX là số đo; Dũng nghe duyệt bằng tai nghe.

## Định tuyến
| Việc | File | Script | Trạng thái |
|---|---|---|---|
| SFX theo ý nghĩa lời: phân loại 3 trục, chọn, canh, trộn, chấm 100 | `references/08-sfx.md` | `sfx_tag.py`, `sfx_plan.py`, `sfx_render.py`, `sfx_mix.py`, `sfx_audit.py` | 2 dự án 100/100, 24/24 lỗi cố ý bị bắt (23/10); đã nối vào /video — xem `library/verification-log.md` |
| Cổng tiếng Việt cho font | `references/06-font-chu.md` [chưa có] | `vn_font_gate.py` | script chạy được; tài liệu đang viết |
| Đo + chấm chữ hiệu ứng so với mẫu | `references/07-kiem-chung.md` [chưa có] | `measure.py`, `score.py`, `colorlab.py` | script chạy được; đang kiểm chứng |
| Dựng recipe chữ (HyperFrames) | `recipes/*.html` | `build_recipe.py` | r01 render được; các recipe khác đang làm |
| Quy tắc thép, thời điểm, bố cục, thư viện, học mẫu | `references/01`–`05` | — | đang viết (tạm dùng `dung-video/references/text-fx/`) |

## Đường dẫn thật
- Thư viện SFX: `~\Downloads\SOUNDEFFECT TAKING HEARD` (863 file).
- Danh mục gốc: `<HD_VIDEO_HOME>\sfx-catalog\` (catalog.json đo thô — dùng `library/sfx-tags.json` đã đo lại).
- Font đã qua cổng: `fonts/files/`, ảnh bằng chứng `fonts/proof/`.
- GSAP cục bộ: `vendor/gsap.min.js` (3.14.2).
