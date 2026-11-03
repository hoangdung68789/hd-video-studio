---
name: "dung-video"
description: "Lệnh /video dựng video hoàn chỉnh theo chuẩn Công ty Sản xuất Nội dung MXH Chuyên nghiệp: Agent Tổng điều phối tối đa 50 Sub-Agents chạy ĐỒNG THỜI (không tạo dư), Sub-Agents kiểm tra chéo & sửa lỗi NGAY TẠI CHỖ trước khi nhận việc, Agent Tổng kiểm nhanh tổng thể đạt ≥98/100 là bàn giao ngay MỘT bản cuối H.265 chất lượng cao kèm báo cáo chi tiết, đánh giá giữ lại Sub-Agents tốt và loại bỏ Sub-Agents hỏng việc >2 lần."
---

# dung-video — /video (Chuẩn Công ty Sản xuất Nội dung MXH Chuyên nghiệp)

Lệnh:
- `/video <footage> [bds|promo|talking|explainer|music] [tpl:<mã TV-xx>] [style:<tên>] [mau:<video mẫu>] [ghi chú]` — chạy quy trình đồng thời tốc độ cao (Pha 0 → Pha 1 Đồng thời → Pha 2 Kiểm nhanh ≥98/100 & Xuất bản cuối).
- `/video text-fx <dự án>` — chỉ chữ hiệu ứng + SFX. `/video sfx <moments.json>` — chỉ SFX.
- `/video hoc <mẫu>` — học hiệu ứng/bộ chữ từ mẫu → `hoang-dung-auto-style-learner`.

Đây là **bộ định tuyến trung tâm của Studio**, vận hành theo mô hình **Công ty Sản xuất Nội dung Chuyên nghiệp trên nền tảng Mạng xã hội**:
1. Đọc `rules/luat-cung.md` (một lần đầu phiên) và `edit-state.json` / `agent-roster.json` nếu đã có.
2. Ở mỗi công đoạn, mỗi Sub-Agent chỉ nạp đúng file chuyên môn ghi trong bảng bên dưới.
3. Luôn đi cùng `hoang-dung-agent-orchestrator` (Agent Tổng — Giám đốc Sản xuất). Trả lời Dũng bằng tiếng Việt; brief gửi Sub-Agent bằng tiếng Anh (`resources/brief-agent-en.md`).

## Năm Quyết định Cốt lõi về Quy trình & Nhân sự Agents (Chốt 03/11/2026 — Thắng mọi quy tắc cũ)
1. **Chạy ĐỒNG THỜI 100% & Sửa lỗi NGAY TẠI CHỖ (In-line Real-time Fix):**
   - CẤM làm xong cả video mới rà soát lỗi rồi quay lại sửa.
   - Sau khi chốt khung xương Timecode/Transcript (`master-timeline` ở Pha 0), tất cả các tác vụ (Cắt dựng phân đoạn, Đo/Chỉnh màu, Che địa chỉ, Chữ Hook/Phụ đề/MG/Bản đồ, Giọng/Nhạc/SFX) phải chạy **đồng thời** theo từng phân đoạn (`segment_id` / `word_id`).
   - Phát hiện lỗi ở mốc nào → **sửa ngay tức khắc tại mốc đó** trong lúc đang dựng; AI không tự bịa, không đoán mà làm đúng chuẩn quy trình Editor chuyên nghiệp.
2. **Kiểm tra chéo Ngang hàng giữa các Sub-Agents (Peer Cross-Check & Upstream Gate):**
   - Mỗi Sub-Agent được giao nhiệm vụ riêng biệt nhưng **có quyền và nghĩa vụ kiểm tra lỗi đầu ra của Sub-Agent liên đới/đứng trước** và **yêu cầu sửa ngay trước khi đảm nhiệm công việc của chính mình**. Không nhận bàn giao dữ liệu lỗi để tránh sai dây chuyền.
3. **Agent Tổng kiểm tra nhanh tổng thể — Đạt `≥ 98/100` bàn giao ngay kèm chi tiết:**
   - Agent Tổng kiểm tra nhanh tổng thể video (Quick Holistic Audit bằng số đo thật + contact sheet nhanh, bỏ việc rà 3 vòng lặp lại tốn thời gian).
   - Nếu điểm tổng thể đạt **tối thiểu từ `98/100` trở lên (`≥ 98/100`)** (và 0 lỗi cấm: không lộ địa chỉ, không chữ tự bịa, có nhạc nền): **bàn giao ngay bản cuối duy nhất cho Dũng** và **nói rõ chi tiết** (điểm từng hạng mục, giải trình rõ từng chi tiết đạt/trừ điểm, đường dẫn file).
   - Nếu có đoạn lỗi hoặc `< 98/100`: **chỉ khoanh vùng sửa ngay đúng đoạn/khung có lỗi** để khớp vào toàn bộ video (Surgical Patch), không làm lại toàn bộ dự án.
4. **Quy mô tối đa 50 Sub-Agents (Không tạo dư) & Đánh giá/Loại bỏ nhân sự (`> 2 lần lỗi`):**
   - Agent Tổng có thể tạo ra **tối đa 50 nhân viên Sub-Agents** nếu dự án lớn cần thiết và chủ động phân chia nhiệm vụ riêng cho mỗi Sub-Agent.
   - Dựa theo quy mô từng dự án, Agent Tổng chỉ tạo **đủ số lượng Sub-Agents cần thiết** cho dự án đó (**tuyệt đối không tạo dư số lượng**).
   - **Đánh giá & Sàng lọc sau mỗi dự án:** Sub-Agent nào hoàn thành tốt nhiệm vụ sẽ được đánh giá đạt và **giữ lại** trong đội ngũ (`agent-roster.json`); Sub-Agent nào **làm hỏng việc trên 2 lần (`> 2 lần lỗi`)** thì bị Agent Tổng **loại bỏ ngay lập tức** và thay thế.
5. **Bốn quyết định kỹ thuật (02/11/2026) vẫn giữ nguyên hiệu lực:**
   - **MỘT video** 9:16 H.265 60fps dùng chung cho TikTok, Shorts, Reels (giao đúng 1 bản cuối dùng ngay).
   - **Camera giả** (zoom, punch-in, Ken Burns, rung): mặc định tắt; muốn dùng phải hỏi Dũng.
   - **Phụ đề (T0) và nhãn (T1) không SFX, không hiệu ứng.** Chỉ chữ hook (T2–T3) có hiệu ứng + SFX (chuẩn 3 pha Mở đầu `Ease-Out` + `Pre-roll SFX` → Giữ `≥1.5s` → Kết thúc `Ease-In/Cut-out`).
   - **Màu/LUT luôn hỏi Dũng** 3 lựa chọn: giữ màu gốc / tạo theo video mẫu / dùng tài nguyên có sẵn và gợi ý (`workflow/03-mau.md`).

## Điểm mấu chốt (nhớ ngay, không cần mở nhiều file)
- Chữ chỉ từ lời nói và thông tin Dũng cung cấp. CTA thành chữ chỉ khi người dẫn nói. Địa chỉ chỉ mức khu vực.
- Không khung nền tối sau chữ. Phụ đề trắng + viền đen 3–4px. Nhấn bằng vàng gold. Đo tương phản trên khung thật.
- Mọi hiệu ứng gọi đúng **Tên phổ biến quốc tế (Tên thông dụng tiếng Việt)** theo chuẩn giới Editor chuyên nghiệp.
- Giữ quãng ngừng có nghĩa; chỉ bỏ lặng thừa, vấp, ậm ừ. Người dẫn nói hết câu mới chuyển cảnh.
- Nhạc bắt buộc, bắt tai từ giây đầu, không át giọng, không tổng hợp bằng code.
- **SFX có ý nghĩa & không dùng bừa (`sfx-sound-design-chuyen-sau.md`):** Phối hợp 5 nhóm (Ambience làm keo dán, Foley xúc giác, Transitions J-Cut `-3f`, Impacts 2–3 mốc lớn, Textures). Khoảng thở giữa 2 cú hit `≥ 2.5s`. Bắt buộc EQ Cut `800Hz–3.5kHz` trên SFX để bảo vệ giọng nói. Dùng Negative Space (khoảng lặng) trước cao trào. CẤM SFX hoạt hình/meme rẻ tiền.
- Số đo thật, không tự bịa điểm/tên style/link. Đạt `≥ 98/100` là bàn giao ngay bản cuối + giải trình chi tiết.

## Luồng Sản xuất Đồng thời → Đọc gì
| Pha | Phòng ban / Sub-Agent | Công việc (Chạy đồng thời & Kiểm chéo tức thì) | Đọc khi tới bước này |
|---|---|---|---|
| **Pha 0** | **Agent Tổng (Director)** | Khởi động, phân tích khối lượng, cấp phát vừa đủ Sub-Agents (≤50), chốt `master-timeline` & hỏi Dũng 1 lần (Template/Style/LUT) | `workflow/00-khoi-dong-brief.md`, `templates/che-do-va-template.md`, `rules/dieu-phoi.md` |
| **Pha 1 (Song song)** | **Tổ Chép lời & Dựng** | Chép lời timecode từng từ, cắt lặng/vấp, ghép cảnh theo phân đoạn (`segment_id`) | `workflow/02-cat-dung-khoa-hinh.md` |
| **Pha 1 (Song song)** | **Tổ Bảo mật (Blur)** | Quét khung 0.5s, tracking & làm mờ địa chỉ/số nhà ngay trên từng clip | `references/che-dia-chi.md` |
| **Pha 1 (Song song)** | **Tổ Màu (Colorist)** | Đo bằng `color_engine.py`, lọc cảnh lỗi, áp chuẩn 6 tầng (Pre/At/Post-LUT) theo lựa chọn Dũng duyệt | `workflow/03-mau.md`, `references/color-pipeline.md` |
| **Pha 1 (Song song)** | **Tổ Đồ họa (Text/MG/Map)** | Kiểm chéo timecode lời → dựng Phụ đề, Chữ Hook (3 pha), MG, Bản đồ OSM neo theo `word_id` | `workflow/04-chu-hook-sfx.md` (`references/text-fx/`) |
| **Pha 1 (Song song)** | **Tổ Âm thanh (Sound)** | Kiểm chéo mốc chữ, lọc rác SFX, thiết kế sound design 5 nhóm & khoảng thở âm, xử lý giọng/BGM/SFX, đo `ebur128` & `sfx_audit` | `workflow/06-am-thanh.md`, `references/sfx-sound-design-chuyen-sau.md`, `references/audio-gate.md` |
| **Pha 2** | **Agent Tổng + Tổ Render** | Kiểm nhanh tổng thể (`≥ 98/100`), vá cục bộ đoạn lỗi (nếu có), xuất 1 bản cuối H.265, đánh giá giữ/loại Sub-Agents & bàn giao | `workflow/07-qa-render.md`, `workflow/giao-va-hoc.md` |
| **Luật & Cổng** | **Mọi Agents** | Luật cứng, cổng kiểm chéo G0–G7, brief tiếng Anh, bảng quyết định nhanh | `rules/cong-chat-luong.md`, `rules/luat-theo-agent.md`, `resources/brief-agent-en.md`, `resources/bang-quyet-dinh-nhanh.md` |

Bản đồ thư mục: `INDEX.md`. Toàn bộ mâu thuẫn đã giải quyết (cập nhật 03/11/2026): `rules/00-quyet-dinh-02-11-2026.md`.

## Khi thiếu file hoặc nguồn
Ghi `missing` hoặc `skipped_refs` vào `edit-state.json`, làm theo "Điểm mấu chốt" ở trên và `resources/bang-quyet-dinh-nhanh.md`, tuyệt đối không tự đoán nội dung.
