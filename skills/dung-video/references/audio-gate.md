# Cổng âm thanh — BẮT BUỘC

Không qua cổng này → KHÔNG render (kể cả preview), báo lỗi ngay cho Dũng.

## 1. Nhạc nền (BGM)
- Chia nhạc theo cảm xúc từng phần: hook / thân / cao trào / CTA.
- Đổi bài hoặc đổi cường độ tại điểm chuyển cảm xúc (khớp mốc ở giai đoạn 4).
- Thứ tự tìm nhạc (dừng ở nguồn đầu tiên đạt):
  1. Thư viện nhạc cục bộ của Dũng
  2. `npx hyperframes media-use resolve --type bgm --intent "<cảm xúc + nhịp>" --project <dự án>` (có thể cần HeyGen → hỏi trước)
  3. Higgsfield `tiktok_music_trending` / `tiktok_music_tune`
  4. Higgsfield `generate_audio` — tốn credit, HỎI TRƯỚC
- CẤM: tự tổng hợp nhạc bằng code. CẤM xuất video câm hoặc chỉ có SFX.

## 2. SFX
- Chữ nào xuất hiện cũng có SFX (chữ hiện ra im lặng = lỗi).
- Cảnh quan trọng: whoosh / hit / riser… lấy theo `roles` trong `whisper-20250625\sfx-catalog` (catalog/roles/playbook), chọn bằng `sfxlib.py`.
- Đa dạng, không lặp một file liên tục, không phủ kín cả video.
- Thư viện không tìm thấy → `media-use resolve --type sfx`, ghi `missing`.

## 3. Mix (hyperframes-audio)
| Thông số | Mục tiêu |
|---|---|
| Giọng nói | ≈ −14 LUFS integrated |
| Nhạc dưới giọng nói | −18 đến −22 LUFS (ducking) |
| True peak | ≤ −1 dBTP |
| Nhạc đầu/cuối | fade in/out, không cắt cụt |
| Điểm cắt | không bụp, không hụt âm |

## 4. Đo trước khi render
```
ffmpeg -i mix.wav -af ebur128=peak=true -f null -
ffmpeg -i voice.wav -af ebur128 -f null -
ffmpeg -i bgm_ducked.wav -af ebur128 -f null -
```
Ghi số đo thật (I, LRA, True peak) vào `edit-state.json → lufs`.

## 5. Điều kiện chặn render
- [ ] Có BGM trên toàn bộ thời lượng (trừ khoảng fade)
- [ ] Giọng −14 ±1 LUFS; nhạc dưới giọng trong −18…−22 LUFS
- [ ] True peak ≤ −1 dBTP
- [ ] Mỗi lần chữ xuất hiện có SFX (đối chiếu bảng chữ ở giai đoạn 5)
- [ ] Không nhạc tổng hợp bằng code
Thiếu 1 ô → dừng, báo: ô nào lỗi + số đo + cách sửa.
