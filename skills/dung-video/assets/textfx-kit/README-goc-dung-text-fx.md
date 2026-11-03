# textfx-kit — ghi chú (thay bản README gốc của dung-text-fx)

dung-text-fx đã gộp vào `dung-video` ngày 27/10/2026. File này thay README gốc (02/11/2026) vì README gốc chứa luật đã bị thay thế: "mọi chữ có SFX", cấm zoom tuyệt đối, "DỪNG hỏi trước khi render bản cuối", các mục "[chưa có]".

**Luật hiện hành nằm ở:** `dung-video/SKILL.md` và `dung-video/references/text-fx/01`–`06`. Gặp luật khác ở đây hay ở file cũ thì làm theo hai nơi đó.

## Lệnh (qua /video)
- `/video text-fx <dự án>` — bảng mốc chữ hook → SFX theo nghĩa → chấm → báo cáo (giai đoạn 4–6).
- `/video sfx <moments.json>` — chỉ SFX (`references/08-sfx.md`). `moments.json` chỉ chứa chữ hook.
- `/video hoc <mẫu>` — học hiệu ứng/chữ từ mẫu → `hoang-dung-auto-style-learner`.

## Định tuyến
| Việc | File | Script |
|---|---|---|
| SFX theo ý nghĩa lời: phân loại 3 trục, chọn, canh, trộn, chấm 100 | `references/08-sfx.md` | `sfx_tag.py`, `sfx_plan.py`, `sfx_render.py`, `sfx_mix.py`, `sfx_audit.py` |
| Cổng tiếng Việt cho font | `references/text-fx/06-font-mau-hieu-ung.md` | `vn_font_gate.py` |
| Đo + chấm chữ hiệu ứng so với mẫu | — | `measure.py`, `score.py`, `colorlab.py` |
| Dựng recipe chữ (HyperFrames) | `recipes/*.html` | `build_recipe.py` |

## Đường dẫn thật
- Thư viện SFX: `~\Downloads\SOUNDEFFECT TAKING HEARD` (863 file).
- Danh mục gốc: `<HD_VIDEO_HOME>\sfx-catalog\` (catalog.json đo thô — dùng `library/sfx-tags.json` đã đo lại).
- Font đã qua cổng: `fonts/files/`, ảnh bằng chứng `fonts/proof/`.
- GSAP cục bộ: `vendor/gsap.min.js` (3.14.2).
