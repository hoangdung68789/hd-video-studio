# Giai đoạn 4, 5, 5b — Chữ Hook, Phụ đề, MG & Bản đồ (Chạy Đồng thời & Sửa Ngay Tại Chỗ)

Phụ trách: **Tổ Đồ họa (`dung-chu-mg` + Sub-Agents chia theo cụm Chữ Hook / Phụ đề / MG Bản đồ)** phối hợp kiểm chéo tức thì với **Tổ Chép lời/Cắt dựng** và **Tổ Âm thanh**.

## Đọc theo thứ tự (chỉ nạp đúng file cần)
1. `references/text-fx/01-quy-tac-thep.md` — quy tắc thép về chữ.
2. `references/text-fx/02-phan-loai-truong-hop.md` — gán bậc T0–T3 và loại L1–L10.
3. `references/text-fx/03-thoi-diem-su-dung.md` — canh thời điểm, thời lượng, mật độ.
4. `references/text-fx/06-font-mau-hieu-ung.md` — font, màu, glow, chữ âm bản, SFX.
5. `references/text-fx/05-thu-vien-hieu-ung.md` — chọn hiệu ứng cụ thể + công cụ.
6. `references/text-fx/04-quy-trinh.md` — quy trình dựng đồng thời và kiểm ngay tại chỗ.

## Kiểm tra Chéo Đầu Vào Trước Khi Làm (Upstream Peer Cross-Check)
- Trước khi render chữ/MG cho phân đoạn nào, Tổ Đồ họa kiểm tra ngay `words.json` và điểm cắt của Tổ Chép lời/Cắt dựng:
  - Nếu thấy câu thoại bị cắt mất chữ, từ khóa bị lệch timecode, hoặc con số/giá không khớp thông tin Dũng → **yêu cầu Tổ Chép lời/Cắt dựng sửa ngay lập tức phân đoạn đó** trước khi đặt chữ. Tuyệt đối không đặt chữ trên nền timecode sai.

## Bốn Bước Thực Thi Đồng Thời (Có thể chia cho nhiều Sub-Agents làm cùng lúc)
- **Bước A — Bảng mốc chữ hook & Neo theo `word_id` (Giai đoạn 4):**
  - Chỉ gồm hook, giá, diện tích/kết cấu, điểm mạnh, pháp lý, CTA đúng lời (bậc T2–T3 mang tính nhận thức then chốt).
  - Mỗi dòng: `word_id / thời điểm → từ khóa trong lời → nội dung chữ (nguồn) → loại L → bậc T → Tên hiệu ứng phổ biến quốc tế (Tên tiếng Việt) → 3 pha (Entrance / Hold / Exit) → SFX đề xuất`.
  - **Quy tắc chặn Spam SFX từ nguồn (Tuân thủ `references/sfx-sound-design-chuyen-sau.md`):** TUYỆT ĐỐI KHÔNG xuất mốc SFX cho icon nhỏ, nhãn định vị T1, phụ đề T0 hay chuyển động vụn vặt. Chỉ đề xuất mốc cho Chữ Hook Hero mang tính bước ngoặt nhận thức (Cognitive Anchor); khoảng cách giữa 2 mốc phải đảm bảo `≥ 2.5s` (Quy tắc khoảng thở âm thanh).
  - Dòng không có nguồn trong lời thoại/thông tin Dũng → **xóa ngay tại chỗ**.
  - Xuất ngay `moments.json` gửi sang Tổ Âm thanh để Tổ Âm thanh phối hợp sound design **đồng thời**.
- **Bước B — Phụ đề (T0) và Nhãn (T1) (Giai đoạn 5 — Sub-Agent riêng):**
  - Font `Be Vietnam Pro`: trắng + viền đen 3–4px, bóng mềm (`filter: drop-shadow(0 2px 4px rgba(0,0,0,0.85))`).
  - **Lựa chọn 2 Chế độ Phụ đề theo yêu cầu Dũng (`R-L039`):**
    1. *Chế độ Phụ đề Tối giản:* Hiện thẳng hoặc fade ≤0.15s, không hiệu ứng, không SFX.
    2. *Chế độ Phụ đề Động Nổi Bật (`CAP-01..CAP-06`):* Áp dụng đầy đủ 3 pha chuẩn:
       - **Pha 1 (Entrance 0.08–0.12s):** `Fade Up` (`y: +8px -> 0px`) hoặc `Pop-in Elastic` nhẹ (`back.out(1.4)`).
       - **Pha 2 (Hold & Active Highlight):** Từ đang nói đổi sang **Vàng Gold `#FFD700`** theo nhịp giọng nói; tự động bắt 4 nhóm từ khóa đắt giá (giá, sổ, diện tích, vị trí) để bật **Vàng Gold + Soft Glow 10px**; tự động hạ mờ `opacity: 0.25` hoặc ẩn khi Chữ Hook Hero (`T3`) xuất hiện ở giữa màn hình (`Collision Avoidance`).
       - **Pha 3 (Exit 0.05–0.08s):** `Snap Cut` hoặc `Quick Dissolve 0.06s`.
  - Kiểm dấu tiếng Việt (`vn_font_gate.py`) và vùng an toàn (`bottom: 490–520px`) ngay khi tạo từng câu.
- **Bước C — Chữ Hook (T2–T3) chuẩn 3 Pha Editor Chuyên nghiệp (Giai đoạn 5 — Sub-Agent riêng):**
  - Tối đa 2 họ hiệu ứng, 2 font. Màu nhấn vàng gold thương hiệu.
  - **Bắt buộc đủ 3 pha chuẩn Editor Pro:**
    1. **Mở đầu (`Entrance` 0.18–0.45s):** `Ease-Out` giảm tốc (`power3.out` / `back.out(1.4)`), kết hợp ≥2 thuộc tính + `Stagger 40–70ms`.
    2. **Duy trì (`Hold` ≥ 1.5s):** Đứng yên đủ đọc (`≥ 1.5s` hoặc `số_ký_tự/12s`).
    3. **Kết thúc (`Exit` 0.15–0.30s):** Nhanh gọn bằng `60–70%` pha vào (`Ease-In`), hoặc ngắt khít trước vết cắt `1–2 frames`, hoặc cuốn theo chuyển cảnh.
  - **Sửa ngay tại chỗ (In-line Fix):** Dựng xong mốc chữ nào → trích ngay 3 khung (`đang vào`, `đỉnh`, `nghỉ`) của mốc đó, đo tương phản trên khung thật (`≥ 4.5:1` chữ thường, `≥ 3:1` chữ lớn) và kiểm vùng mặt (`face_zones`). Nếu bị cắt dấu, che mặt hoặc kém tương phản → **sửa ngay mốc đó tức khắc**, không đợi làm xong cả video mới kiểm!
- **Bước D — Bản đồ MG (5b — Sub-Agent riêng chạy song song):**
  - Khi lời nói về vị trí/tiện ích (`references/ban-do.md`): tải dữ liệu OSM thật, pin lệch 80–150m, ghi `© OpenStreetMap`. SFX gắn vào chuyển động đồ họa bản đồ (zoom, pin, sonar), không gắn vào nhãn chữ.

## Camera giả
Mặc định tắt zoom/punch-in/Ken Burns/rung trừ khi Dũng đã đồng ý đúng trường hợp đó (`rules/luat-cung.md` mục 9).

Nộp: Bảng `chữ ↔ nguồn` + ảnh kiểm 3 khung từng mốc hook + điểm `measure.py`/`score.py` (khi có mẫu).
Cổng: G4 (`rules/cong-chat-luong.md`).
