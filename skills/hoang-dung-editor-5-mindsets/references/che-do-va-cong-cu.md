# hoang-dung-editor-5-mindsets — §4–6 Bốn chế độ A–D, cách AI nhìn/nghe để chấm, tự huấn luyện

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

## 4. Bốn chế độ làm việc

### Chế độ A – Bản thiết kế 5 tư duy (trước dựng)
**Đầu vào:** lời thoại có mốc (video-master 2.0b), phân tích cảnh (H-dung-003), màu đã duyệt hoặc ENV, nhạc và bản đồ nhịp.

**Đầu ra:** một bảng theo từng cảnh, ghi vào Hồ sơ dự án:

`| Cảnh / mốc | Mục đích kể chuyện & cảm xúc | Điểm nhìn & vùng chữ (X/Y px) | Màu (look, điểm nhấn) | Motion (kiểu, hướng, ease, thời lượng) | Âm (nhạc, SFX, khoảng lặng, J/L-cut) | Skill thực thi |`

Kèm 1 dòng **Thông điệp + cảm xúc chính** của video và 1 dòng **Điểm vượt chuẩn**. Gửi trong Duyệt gộp, không dừng riêng.

### Chế độ B – Chấm & phản biện (trước Preview và sau mỗi lần sửa)
**Thang 100 điểm = 5 tư duy × 20 điểm; mỗi tư duy 4 tiêu chí × 5 điểm:**
| Tư duy | 4 tiêu chí |
|---|---|
| Kể chuyện | Hook ≤3 giây · Một thông điệp rõ · Nói đến đâu thấy đến đó · Nhịp giữ chân và CTA |
| Bố cục | Một điểm nhìn mỗi khung · Đường dọc/ngang thẳng · Chữ đúng vùng trống, trong khung an toàn · Hướng mắt liên tục qua cut |
| Màu sắc | Đúng sự thật căn nhà · Tông da và tường trắng chuẩn · Khớp màu giữa clip · Dẫn mắt bằng sáng/bão hòa |
| Motion | Có lý do và đúng hướng · Ease không tuyến tính · Thời lượng đủ đọc · Khớp phách/từ khóa |
| Sound design | Giọng rõ, đúng mức · Nhạc theo cảm xúc và nhịp · SFX đủ, đa dạng, khớp khung · Không hụt âm, có khoảng lặng chủ ý |

**Cổng chất lượng:** tổng **≥90** và không tư duy nào **<17** mới gửi Preview.
- Trước Preview đầu tiên: AI tự sửa trong phạm vi kế hoạch đã duyệt rồi chấm lại.
- Sau khi Dũng đã xem Preview: mọi sửa đi theo `qa-master` (báo trước, Dũng chọn phạm vi).

**Mẫu báo cáo (nén):**
1. Bảng điểm 5 tư duy (điểm, 1 dòng nhận xét mỗi tư duy).
2. Tối đa 3 điểm cần nâng: `| Mốc | Tư duy | Vấn đề | Phương án chính | Skill thực thi |`.
3. 1 điểm vượt chuẩn đã làm hoặc đề xuất.

**Trung thực:** điểm là **đánh giá chuyên môn** dựa trên khung hình trích xuất và số đo (mục 5), không phải dữ liệu người xem. Sau khi đăng, đối chiếu với tỷ lệ giữ chân thật để hiệu chỉnh cách chấm.

### Chế độ C – Chẩn đoán video kém hiệu quả
1. Dũng gửi số liệu nền tảng (biểu đồ giữ chân, mốc rơi, thời gian xem trung bình) và video.
2. Ghép mỗi mốc rơi với khung hình, lời thoại, âm thanh tại mốc đó; xác định tư duy gây rơi.
3. Đưa giả thuyết chính + 1 thử nghiệm cho video kế tiếp (thay đổi đúng 1 yếu tố để đo được).
4. Ghi kết luận vào sổ tay chuyên gia (K-bien_tap), loại "kinh nghiệm", đến khi lặp lại đủ để thành luật.

### Chế độ D – Đào tạo Dũng
- **5 học phần × 3 cấp:** Nền tảng → Chuyên nghiệp → Bậc thầy.
- **Thứ tự gợi ý** (theo tác động lên giữ chân): Kể chuyện → Bố cục → Sound design → Màu sắc → Motion.
- **Mỗi bài:** 1 nguyên lý; 1 ví dụ Trước/Sau lấy từ chính video của Dũng; 1 bài tập ≤15 phút trên CapCut máy tính; tiêu chí đạt đo được.
- **Ví dụ bài tập:**
  - Kể chuyện: viết lại thứ tự 5 cảnh của một video cũ chỉ bằng lời thoại có sẵn, đưa câu mạnh nhất lên 3 giây đầu.
  - Bố cục: chụp 5 khung từ video, vẽ điểm nhìn và đường 1/3, sửa 2 khung bị nghiêng.
  - Sound design: làm lại 10 giây có J-cut, room tone và một khoảng lặng chủ ý; đo -14 LUFS.
  - Màu sắc: khớp màu 3 clip cùng phòng sao cho tường trắng trung tính.
  - Motion: làm một chữ nhấn với ease-out + nảy 8%, so với bản tuyến tính.
- Tiến độ học ghi ở mảng `bien_tap` của habit-memory.

## 5. Cách AI "nhìn" và "nghe" để chấm (đã chạy thử 17/10/2026)
```bash
# Trích khung mỗi 0,5 giây để xem bố cục, màu, chữ
mkdir -p frames && ffmpeg -i preview.mp4 -vf "fps=2,scale=540:-1" frames/f_%04d.png
# Độ ồn tổng (I, LUFS) và đỉnh (Peak) – dòng cuối của bản tóm tắt
ffmpeg -nostats -i preview.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12
# Độ sáng thấp/cao mỗi giây (thang 8-bit 0-255) để soát cháy sáng, bệt tối
ffmpeg -nostats -i preview.mp4 -vf "fps=1,signalstats,metadata=print" -f null - 2>&1 | grep -E "YLOW|YHIGH"
# Mốc cắt cảnh (soát nhịp 2-4 giây/lần thay đổi)
ffmpeg -nostats -i preview.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*"
```
- Motion: trích chuỗi khung liền nhau quanh mỗi chuyển động để soát ease, hướng và thời lượng giữ chữ.
- Khớp lời–hình–âm: so mốc chữ, SFX với mốc từng từ của bản gỡ băng.
- Điều AI không cảm được trực tiếp (cảm xúc nhạc, độ "đã" của SFX) thì nói rõ và nhờ Dũng nghe kiểm.

## 6. Tự huấn luyện (theo habit-memory)
- Mảng `bien_tap`: điểm 5 tư duy của mỗi video, lỗi tư duy hay lặp, gu kể chuyện Dũng chọn, tiến độ học 5 tư duy.
- Sổ tay `K-bien_tap`: nguyên lý (không hạn kiểm lại); xu hướng nhịp dựng, hook, trend nền tảng (kiểm lại 30 ngày, phải tra cứu nguồn trước khi khẳng định).
- Mỗi lần Dũng sửa sau Preview: ghi độ lệch theo tư duy (vd "giữ chữ lâu hơn 0,5 giây" → Motion) để hiệu chỉnh thang chấm.

