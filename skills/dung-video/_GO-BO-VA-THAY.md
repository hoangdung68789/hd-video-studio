# Danh sách file: thay, thêm, gỡ (02/11/2026)

Tất cả đường dẫn tương đối so với thư mục skill `dung-video\` (và `hoang-dung-agent-orchestrator\` cho mục 4).
Tôi không có quyền ghi vào máy anh nên chưa thay/xóa gì trên máy. Làm theo bảng dưới.

## 1. Thay (ghi đè bằng file trong gói này)
| File | Lý do |
|---|---|
| `SKILL.md` | Viết lại theo 3 quyết định; thêm khóa hình, vai chữ, khối brief tiếng Anh |
| `references/text-fx/00-README.md`, `01`, `02`, `03` | Phụ đề/nhãn không SFX; camera giả hỏi trước; một video cho 3 nền tảng |
| `references/text-fx/04-quy-trinh.md`, `05-thu-vien-hieu-ung.md` | Sửa dòng "SFX mọi chữ", "3–5 vòng", "không zoom tuyệt đối", họ hiệu ứng chỉ cho chữ hook |
| `references/audio-gate.md` | Bỏ "chữ nào cũng có SFX"; sửa đường dẫn sfx-catalog sai (`whisper-20250625` → `HDRE AI\sfx-catalog`) |
| `references/routing.md` | Bỏ "kiểm 3–5 vòng", "Preview 720p", "render sau khi Dũng duyệt" (mâu thuẫn quy trình nhanh 27/10); punch-in mặc định tắt; SFX chỉ chữ hook |
| `references/presets.md`, `chon-phong-cach.md`, `ban-do.md` | Font theo vai; style có punch-in → hỏi Dũng; nhãn bản đồ không SFX |
| `textfx-kit/references/08-sfx.md` | Thêm mục Phạm vi (`moments.json` chỉ chữ hook); bỏ bước "gửi preview chờ duyệt" |
| `textfx-kit/README-goc-dung-text-fx.md` | Thay bằng ghi chú ngắn, bỏ luật cũ |
| `orchestrator/SKILL.md` → `hoang-dung-agent-orchestrator\SKILL.md` | Sửa 3 luật mâu thuẫn (CTA, khoảng lặng) + thêm 3 luật mới |

## 2. Thêm mới (thư mục AI đọc theo giai đoạn)
- `INDEX.md` — bản đồ thư mục.
- `rules/` — `luat-cung.md`, `luat-theo-agent.md`, `cong-chat-luong.md`, `00-quyet-dinh-02-11-2026.md` (11 mâu thuẫn đã giải quyết).
- `workflow/` — `00-khoi-dong-brief.md`, `02-cat-dung-khoa-hinh.md`, `03-mau.md`, `04-chu-hook-sfx.md`, `06-am-thanh.md`, `07-qa-render.md`, `giao-va-hoc.md`.
- `resources/` — `brief-agent-en.md`, `duong-dan-may.md`, `nguon-dan-chung.md`, `bang-quyet-dinh-nhanh.md`.
- `references/text-fx/06-font-mau-hieu-ung.md` — font, màu chữ, glow, chữ âm bản, SFX cho chữ hook (26 nguồn).
- `SKILL.md` chỉ còn ~3.9KB (bản cũ ~7.9KB, bản viết lại đầu tiên ~17KB): điểm mấu chốt + bảng "giai đoạn → đọc file nào".

## 3. Gỡ (chuyển vào `_to_delete\`, không xóa hẳn)
| File | Lý do |
|---|---|
| `textfx-kit/library/PROMPT-GOP.md` | Prompt gộp ngày 23/10: chứa luật đã bị thay ("mọi chữ có SFX", "TikTok/Reels", gửi preview chờ duyệt rồi mới nối, "dừng hỏi trước khi render bản cuối"). Không còn tác dụng; để lại dễ khiến agent làm theo luật cũ |

## 4. Giữ nguyên (đã kiểm, không xung đột)
`scripts/*` (không cần sửa code vì `moments.json` chỉ chứa chữ hook), `fonts/`, `vendor/`, `recipes/`, `library/sfx-tags.json`, `library/verification-log.md` (lịch sử), `references/che-dia-chi.md`, `engines.md`, `repos.md` (không thấy từ khóa xung đột khi quét).

## 5. Chưa kiểm hết
Chưa đọc từng dòng: `recipes/r01-hook-kinetic-slam.html`, các script `.py`, `repos.md`, `engines.md`, `verification-log.md`. Quét từ khóa (zoom, punch, mọi chữ, CTA, nền tảng, preview) không thấy xung đột ở các file này.
