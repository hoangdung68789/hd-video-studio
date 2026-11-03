# Cổng Âm thanh Đồng thời & Kiểm tra Chéo — BẮT BUỘC

Cập nhật ngày **03/11/2026**: Chạy đồng thời, kiểm tra chéo đầu vào từ Tổ Đồ họa/Cắt dựng, sửa lỗi ngay tại từng mốc âm thanh, tích hợp vào điểm tổng thể của Agent Tổng (`≥ 98/100`).

## 0. Kiểm tra Chéo Đầu Vào Trước Khi Xử Lý (Upstream Peer Cross-Check)
- Trước khi chạy `sfx_plan.py` và trộn âm, Tổ Âm thanh kiểm tra ngay `words.json` (từ Tổ Chép lời/Cắt dựng) và `moments.json` (từ Tổ Đồ họa):
  - Nếu `moments.json` chứa nhầm phụ đề (T0) hoặc nhãn (T1), hoặc thiếu chữ hook (T2–T3), hoặc có 2 mốc đặt trùng gây vi phạm khoảng thở → **yêu cầu Tổ Đồ họa sửa ngay lập tức `moments.json`** trước khi render SFX.
  - Nếu file giọng nói bị cắt cụt từ ở điểm nối cảnh → **yêu cầu Tổ Cắt dựng sửa ngay điểm cắt đó** trước khi mix.

## 1. Nhạc nền (BGM) — Chạy Đồng thời từ Pha 1
- Chia nhạc theo cảm xúc từng phần: `hook / thân / cao trào / CTA`.
- Đổi bài hoặc đổi cường độ tại điểm chuyển cảm xúc (khớp mốc ở giai đoạn 4).
- Ưu tiên nhạc bắt tai, gây cảm xúc từ giây đầu, dễ viral; Dũng chấp nhận rủi ro nền tảng tắt tiếng nhạc ngoài thư viện thương mại.
- **Chỉ xuất bản có nhạc. CẤM xuất bản không nhạc. CẤM tự tổng hợp nhạc bằng code.**
- Thứ tự tìm nhạc (dừng ở nguồn đầu tiên đạt):
  1. Thư viện nhạc cục bộ của Dũng
  2. `npx hyperframes media-use resolve --type bgm --intent "<cảm xúc + nhịp>" --project <dự án>` (nếu cần tài khoản trả phí → hỏi trước)
  3. Higgsfield `tiktok_music_trending` / `tiktok_music_tune`
  4. Higgsfield `generate_audio` — tốn credit, HỎI TRƯỚC

## 2. SFX Chữ Hook & Hệ Sinh Thái Sound Design (Chuẩn 3 Pha Editor Pro)
> **Tài liệu tham khảo chuyên sâu:** `references/sfx-sound-design-chuyen-sau.md` (hệ thống sound design đa tầng & tâm lý học âm thanh).
- **Chỉ chữ hook (T2–T3) có SFX.** Phụ đề (T0) và nhãn (T1) KHÔNG SFX; có SFX trên phụ đề hoặc nhãn = lỗi nghiêm trọng, phải xóa ngay tại chỗ.
- Mỗi chữ hook hero xuất hiện đều có SFX (chữ hook hiện ra im lặng = lỗi). `moments.json` chỉ gồm chữ hook mang tính nhận thức then chốt.
- **Quy tắc Khoảng thở Âm thanh (Audio Spacing):** Giữa 2 cú Accent Hits phải cách nhau tối thiểu `2.5s – 3.0s`. Tuyệt đối cấm spam SFX dồn dập.
- **Phối hợp 5 Nhóm Chức năng Sinh học:**
  - `Ambience` (`-24dB..-32dB`): Trải ngầm làm keo dán liền mạch các cú cắt cảnh.
  - `Foley` (`-18dB..-24dB`): Tạo xúc giác thực tế (giấy sổ hồng, phím cơ, bút ký, ly nước), khóa khớp `±1 frame`.
  - `Transitions`: Whoosh/Pass-by chỉ dùng cho chuyển cảnh lớn; có J-Cut Lead-in vào sớm `0.08–0.15s` (3–5 frames).
  - `Impacts`: Sub-Drop/Thud chỉ dồn vào 2–3 mốc số liệu then chốt của toàn video.
  - `Textures`: Drone trầm / Nhịp tim điều biến tâm lý hồi hộp.
- **Dải tần bảo mật Giọng nói (Mid-Range Cleansing):** Bắt buộc EQ Cut dải `800Hz – 3.5kHz` trên track SFX khi có lời thoại người dẫn.
- **Khoảng lặng đắt giá (Negative Space):** Tại mốc cao trào (Climax / Twist 45–55s), bắt buộc cắt sạch âm thanh (Dead Silence `0.3s–0.6s`) trước khi bung cú Sub-Drop giải tỏa.
- **Thanh trừng SFX Blacklist:** Tuyệt đối cấm tiếng hoạt hình/meme rẻ tiền (Laser, Boing, Pop bong bóng thô, Chuông keng keng nhà máy, còi xe giật mình, kính vỡ).
- **Chuẩn 3 pha âm thanh đi kèm hiệu ứng:**
  - **Mở đầu (`Pre-roll`):** Tiếng `Riser` hoặc phần đầu `Whoosh` vào sớm hơn hình `0.08–0.20s`.
  - **Đỉnh chạm (`Peak Sync`):** Đỉnh biên độ của `Impact / Pop / Whoosh` đập trùng khít khung chữ mở hoàn tất (`±2 khung`).
  - **Kết thúc (`Audio Tail / Decay`):** Đuôi âm ngân tự nhiên (`0.15–0.35s`) hoặc `fade-out` mượt, cấm cắt cụt gây tiếng bụp.
- Cảnh quan trọng và chuyển động đồ họa bản đồ (zoom, pin, sonar): chọn theo `textfx-kit/references/08-sfx.md` từ kho 863 file (`~\Downloads\SOUNDEFFECT TAKING HEARD`, nhãn `textfx-kit/library/sfx-tags.json`).
- Đa dạng, không lặp một file liên tục, không phủ kín cả video.

## 3. Mix (`hyperframes-audio` / `sfx_mix.py`) & Sửa Ngay Tại Chỗ
| Thông số | Mục tiêu chuẩn |
|---|---|
| Giọng nói | `≈ −14 LUFS` integrated |
| Nhạc dưới giọng nói | `−18 đến −22 LUFS` (ducking mượt) |
| SFX chữ hook | Thấp hơn giọng `1–6 dB`, nổi `≥ 4.5 dB` trên nhạc |
| True peak | `≤ −1 dBTP` |
| Nhạc đầu/cuối & điểm cắt | Fade in/out mượt, không cắt cụt, không bụp, không hụt âm |

## 4. Đo Tức Thì & Vá Lỗi Cục Bộ Trước Khi Render
```bash
ffmpeg -i mix.wav -af ebur128=peak=true -f null -
ffmpeg -i voice.wav -af ebur128 -f null -
ffmpeg -i bgm_ducked.wav -af ebur128 -f null -
```
Ghi số đo thật (`I, LRA, True peak`) vào `edit-state.json → lufs`.
- Nếu bất kỳ mốc SFX nào lệch khung hoặc sai độ to trong `sfx_audit.py`: **chỉ sửa ngay đúng mốc đó trong `sfx_plan.json` và trộn lại tức thì**, không làm lại từ đầu.

## 5. Checklist Cổng G5 (Kiểm ngay trước khi ghép Render)
- [ ] Có BGM bắt tai trên toàn bộ thời lượng (không tổng hợp bằng code)
- [ ] Giọng `−14 ±1 LUFS`; nhạc dưới giọng trong `−18…−22 LUFS`
- [ ] True peak `≤ −1 dBTP`
- [ ] Mọi chữ hook (T2–T3) đều có SFX đúng đỉnh `±2 khung`; phụ đề (T0) và nhãn (T1) 0 SFX
- [ ] Tuân thủ khoảng thở âm thanh: khoảng cách giữa các cú accent hits `≥ 2.5s` (0 spam dồn dập)
- [ ] Dải tần giọng nói `800Hz – 3.5kHz` sạch sẽ, không bị SFX đè nát (đã EQ Cut trên SFX)
- [ ] Có khoảng lặng Negative Space `0.3s – 0.6s` trước cao trào / plot twist
- [ ] 0 SFX rác trong Blacklist (không laser, boing, pop thô, chuông nhà máy, còi xe giật mình, kính vỡ)
- [ ] Điểm `sfx_audit.py` và âm thanh tổng thể đạt chuẩn bàn giao (`≥ 98/100`–`100/100`)
