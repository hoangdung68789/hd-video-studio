# Giai đoạn 6 — Âm thanh (Sound Design Đa Tầng, Chạy Đồng thời, Kiểm chéo & Sửa Ngay Tại Chỗ)

Phụ trách: **Tổ Âm thanh (`dung-am-thanh` + Sub-Agents Voice / BGM / Sound Designer)**. 
Tài liệu bắt buộc: `references/sfx-sound-design-chuyen-sau.md` (Cẩm nang Sound Design đa tầng & tâm lý học âm thanh), `references/audio-gate.md`, và `textfx-kit/references/08-sfx.md`.

## 1. Kiểm tra Chéo Đầu Vào & Lọc Rác SFX (Upstream Peer Cross-Check)
- Ngay khi nhận `words.json` từ Tổ Chép lời/Cắt dựng và `moments.json` từ Tổ Đồ họa, Tổ Âm thanh kiểm tra ngay:
  - Có mốc phụ đề (T0) hoặc nhãn (T1) nào bị đưa nhầm vào `moments.json` không?
  - Có mốc chữ hook (T2–T3) nào đặt sát nhau vi phạm khoảng thở âm thanh (`< 2.5s` giữa 2 mốc) không?
  - Có mốc gán SFX cho icon nhỏ hoặc chi tiết vụn vặt không?
  - Nếu phát hiện lỗi → **yêu cầu Tổ Đồ họa sửa ngay lập tức mốc đó hoặc Tổ Âm thanh chủ động lược bỏ mốc thừa** trước khi render & mix âm thanh.

## 2. Thực thi Đồng thời Hệ Sinh Thái Âm Thanh & Sửa Ngay Tại Chỗ
1. **Nhánh Giọng nói (Voice Clean — chạy ngay khi có phân đoạn cắt):**
   - Khử ồn, cân âm lượng đồng đều (`≈ -14 LUFS`), cắt sạch tiếng bụp/hít hơi ở điểm nối (`crossfade 22ms`), rõ lời [N1].
2. **Nhánh Nhạc nền (BGM — chạy song song ngay từ Pha 1):**
   - Chọn nhạc bắt tai từ giây đầu, chia theo cảm xúc `hook / thân / cao trào / CTA`.
   - Giữ nền đều, hạ nhẹ mượt mà ở đoạn thoại (`-18 đến -22 LUFS`) và điểm nhấn SFX (`sfx_mix --plan`), không át giọng [N14].
   - **Cấm tổng hợp nhạc bằng code. Cấm xuất bản không có nhạc.**
3. **Nhánh Sound Design & SFX Đa Tầng (Tuân thủ `references/sfx-sound-design-chuyen-sau.md`):**
   - **Phối hợp 5 Nhóm chức năng sinh học:**
     * `Ambience / Room Tone` (`-24dB..-32dB`): Làm keo dán (Audio Glue) liền mạch các cú cắt cảnh.
     * `Foley` (`-18dB..-24dB`): Tạo xúc giác thực tế (giấy sổ hồng, gõ phím cơ, bút ký, ly nước), khớp chuẩn `±1 frame`.
     * `Transitions`: Whoosh/Pass-by chỉ dùng cho chuyển cảnh lớn; có J-Cut Lead-in vào sớm `0.08–0.15s` (3–5 frames).
     * `Impacts`: Sub-Drop/Thud chỉ dồn vào 2–3 mốc số liệu then chốt của toàn video.
     * `Textures`: Drone trầm / Nhịp tim điều biến tâm lý hồi hộp.
   - **Dải tần bảo mật Giọng nói (Mid-Range Cleansing):** Bắt buộc EQ Cut dải `800Hz – 3.5kHz` trên mọi track SFX khi có lời thoại.
   - **Khoảng lặng đắt giá (Negative Space):** Tại mốc cao trào (Climax / Twist 45–55s), cắt sạch âm thanh (Dead Silence `0.3s–0.6s`) trước khi bung cú Sub-Drop giải tỏa.
   - **Thanh trừng SFX Blacklist:** Xóa bỏ hoàn toàn tiếng hoạt hình (Laser, Boing, Pop bong bóng thô, Chuông keng keng nhà máy, còi xe giật mình, kính vỡ).
   - **Mức âm chuẩn:** SFX thấp hơn giọng `1–6 dB`, nổi `≥ 4.5 dB` trên nhạc; `true peak ≤ -1 dBTP`.
   - **Sửa ngay tại chỗ (In-line Fix):** Chạy `sfx_audit` và `ffmpeg ebur128` ngay khi trộn. Nếu mốc nào lệch khung hoặc sai độ to → **sửa ngay đúng mốc đó trong `sfx_plan.json` và render lại tức thì** (đạt `≥ 98/100`–`100/100`).

Đường dẫn thư viện SFX, danh mục, font: `resources/duong-dan-may.md`.
Nộp: Scorecard `sfx_audit` + số đo `ebur128` thật (ghi vào `edit-state.json → lufs`).
Cổng: G5 (`rules/cong-chat-luong.md`).
