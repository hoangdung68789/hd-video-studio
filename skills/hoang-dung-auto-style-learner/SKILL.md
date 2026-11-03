---
name: "hoang-dung-auto-style-learner"
description: "Bộ học của AI cho Dũng: học TOÀN BỘ cấu trúc video viral thành Template video trọn bộ khớp toàn bộ video mẫu, đủ 8 thành phần kèm phân tích vì sao mẫu dùng, tự dựng template giống mẫu và chấm 3 vòng tới 100 điểm, Dũng tự chọn; tự học danh mục hiệu ứng video từ video viral/hướng dẫn thành recipe có SFX, quản Từ điển hiệu ứng, vòng tự học sau mỗi lần Dũng duyệt/chấm/sửa — áp vào /dung-video."
---

# Bộ học phong cách & Tự học — Hoàng Dũng

Lệnh & Kích hoạt:
- `/video hoc <mẫu>` hoặc `/hoc-mau <mẫu>` hoặc gửi link mẫu kèm "học mẫu này" → **Học từ video mẫu** (Lập Template `TV-xx` + bóc hiệu ứng `TX-xx`).
- "học phong cách", "học video mới", "học hôm nay", "huấn luyện AI" → **Học hằng ngày** (khám phá video viral BĐS).
- "học effect", "học hiệu ứng", "học chuyển cảnh/chữ động/MG" → **Học hiệu ứng video** (danh mục & recipe).
- "học b-roll", "học animation", "học cách minh họa lời" → **Học B-roll · Animation · MG** (phân tích vì sao + Bảng kết hợp).
- Sau mỗi sản phẩm Dũng duyệt, chấm điểm hoặc yêu cầu sửa → **Vòng tự học** (sổ luật `rules.md`).

Đây là **bộ định tuyến**, không phải sổ tay. Làm theo 3 bước, đừng mở cả thư mục một lúc:
1. Đọc `rules/luat-cung.md` (một lần) ở đầu phiên học.
2. Ở mỗi nhiệm vụ, chỉ đọc đúng file ghi trong bảng định tuyến bên dưới.
3. Luôn trả lời Dũng bằng tiếng Việt; báo cáo ngắn gọn ≤ 8 dòng.

## Năm quyết định của Dũng (03/11/2026) — thắng mọi file cũ
1. **Template khớp TOÀN BỘ video mẫu (đủ 8 thành phần):** Tự dựng lại bằng HyperFrames và chấm qua `template_similarity.py` (tối đa 3 vòng) đạt đủ 100/100 điểm (`R-L033`). Chưa đạt 100 thì ghi "Chưa đạt", cấm dùng, cấm gợi ý.
2. **Không bịa tên hiệu ứng:** Bắt buộc dùng đúng `Tên phổ biến quốc tế (Tên thông dụng tiếng Việt)` mà giới editor thường gọi (`R-L036`).
3. **Mọi hiệu ứng video đủ 3 pha chuẩn Editor Pro:** Mở đầu (Entrance giảm tốc + Stagger + SFX dẫn trước `-3f`) → Duy trì (Hold) → Kết thúc (Exit nhanh gọn 60% thời gian vào, Reverb Tail) (`R-L034`, `R-L035`).
4. **Hệ thống 2 dạng Template song song:** Dạng 1 (`TV-xx` — Giống hoàn toàn mẫu 100%) và Dạng 2 (`TX-01..TX-08` — Mẫu VFX/Effects Text + 24 Icon SVG `IC-xx` tùy chỉnh tự do 9 thông số) (`R-L037`).
5. **Hệ sinh thái Sound Design & Dẫn dắt SFX đa tầng:** Bóc tách SFX theo 5 nhóm chức năng sinh học và 4 tầng ý nghĩa tự sự (`references/sfx-sound-design-chuyen-sau.md`). Bắt buộc giải mã lý do "vì sao mẫu đặt SFX tại mốc đó", đo khoảng thở âm thanh (`≥2.5s`), và nhận diện kỹ thuật Negative Space (khoảng lặng trước cao trào). Tuyệt đối cấm bóc tách cơ học phẳng lì (`R-L040`).

## Điểm mấu chốt (nhớ mà không cần mở file)
- Chỉ ghi điều đã mở và đo được trên khung hình thật; không đoán mò BPM/SFX/tên bài.
- Web để TÌM và HIỂU; `watch` / Antigravity để ĐO. Video học xong xóa ngay, chỉ giữ template và dữ liệu đo.
- Mẫu thắng luật dựng chung. Mẫu có dùng hộp nền tối sau chữ thì vẫn đo trung thực vào `template.json`, lúc dựng hỏi Dũng từng trường hợp.
- Phụ đề động 3 pha (`CAP-01..CAP-06`): từ đang nói đổi vàng gold `#FFD700`, tự bắt từ khóa đắt giá, né Chữ Hook Hero (`R-L039`).
- Dũng tự chọn template; AI gửi liên kết thư mục và gợi ý, không tự áp.

## Nhiệm vụ → đọc gì
| Nhiệm vụ | Việc | Agent / Công cụ | Đọc khi tới bước này |
|---|---|---|---|
| **0. Tìm & Đo** | Tìm video web, bóc khung `watch`, đo cắt/BPM/chữ/SFX | Scout / `measure_video.py` | `workflow/01-tim-va-do-web-watch.md` |
| **1. Template trọn bộ** | Bóc 8 thành phần, lập `template.json`, tái tạo đạt 100/100 | Reconstructor / Bridge Tool | `workflow/02-template-video-tron-bo.md` (trỏ tiếp tới `references/template-video.md`) |
| **2. Hiệu ứng video** | Học hiệu ứng lẻ 7 nhóm, dựng recipe 3–5s, từ điển hiệu ứng | Effect Builder / `score.py` | `workflow/03-hoc-hieu-ung-video.md` |
| **3. B-roll / AN / MG** | Phân tích "vì sao", bóc combo Lời ↔ Hình, Bảng kết hợp | Motion Analyst | `workflow/04-hoc-broll-an-mg.md` (trỏ tiếp tới `asset/phong_cach/ket_hop/INDEX.md`) |
| **4. Sổ tay Editor Pro** | Quy trình 7 bước, 10 nhóm tài nguyên, Overlay & Khung, Phụ đề | Toàn bộ Agent | `references/editor-chuyen-nghiep-8-thanh-phan.md` |
| **5. Sound Design đa tầng** | Bóc tách 5 nhóm SFX, 4 tầng ý nghĩa, tâm lý học dẫn dắt & khoảng thở âm | Sound Analyst | `references/sfx-sound-design-chuyen-sau.md` |
| **6. Vòng tự học** | Ghi nhận Dũng duyệt (+10đ), sửa (85đ), lời dạy trực tiếp | Self-Learner | `workflow/05-vong-tu-hoc.md` (sổ `HDRE_Library/training/rules.md`) |
| **Luật cứng** | Luật kiểm tra, cấm đoán, ngưỡng an toàn | Mọi Agent / Cổng QA | `rules/luat-cung.md` |
| **Bản đồ thư mục** | Toàn bộ vị trí file của skill | Bất kỳ khi tra cứu | `INDEX.md` |
