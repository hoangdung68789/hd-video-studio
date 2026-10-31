# hoang-dung-bds-qa-master — §3–6 Vị trí trong luồng, Chặng 1–3, hậu kiểm

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

## 3. Vị trí trong luồng sản xuất (chạy cùng các skill khác)

| Chặng | Skill chính | QA và các skill mới tham gia |
|---|---|---|
| 1. Thông số nhà | `listing-writer` | QA kiểm đủ 6 nhóm thông số |
| 2. Kịch bản | video-master Trợ lý 1 + `broker-trainer` | QA Chặng 1 (kịch bản); 3D & FX gợi ý minh họa cho câu P1; Audio đề xuất nhạc A/B/C + bản đồ nhịp |
| 3. Video thô | video-master Gác cổng + `tech-advisor` | QA Chặng 1 (video thô, nhịp dựng); Audio chấm âm thanh thô ≥90% |
| 4. Dựng | video-master Trợ lý 2 + công thức của `effect-lab` | Audio làm sạch giọng, nhạc, SFX; 3D & FX dựng Mẫu xem trước 9:16 để Dũng duyệt |
| 5. Preview | video-master | QA Chặng 2 chạy **trước** khi gửi Preview; báo cáo QA đi kèm Preview |
| 6. Sửa | Skill nhận lệnh | QA hỏi phạm vi → phát lệnh → kiểm lại 100% |
| 7. Xuất | video-master (chỉ sau "DUYỆT XUẤT") | QA xác nhận bản xuất trùng bản đã duyệt (`ffprobe`) |

**Gộp câu hỏi.** Câu hỏi của QA được gộp vào tin nhắn Preview và các điểm dừng sẵn có của video-master (Bước 3.0, Bước 3.4b, Bước 3.5), không tạo thêm điểm dừng riêng. Phiên không có người xem: QA ghi báo cáo, chọn "C – Giữ nguyên, chờ anh quyết", không phát lệnh sửa.

## 4. Chặng 1 – Kiểm soát đầu vào

### 4.1 Kịch bản
- Đủ 6 nhóm thông số, đối chiếu với `listing-writer` (nguồn số liệu duy nhất). Thiếu nhóm nào thì ghi `[Cần xác minh]`:
  - vị trí;
  - diện tích (ngang × dài, diện tích công nhận);
  - kết cấu;
  - pháp lý;
  - giá;
  - ưu và nhược điểm thực tế.
- Khớp 1 trong 6 chân dung khách (`broker-trainer`), 1 trong 3 phong cách quay, đúng loại BĐS A-D.
- Đủ 5 cảnh, hoặc đủ 6 nhịp với dạng K (mục 2.2b: nguồn chuyện có thật, câu nối đã đánh dấu, thời lượng ước tính trong 30-150 giây). Phần xử lý điểm trừ đủ thuyết phục. CTA đúng thứ tự 2 bước.
- Chính tả tiếng Việt đúng 100%; xưng hô đúng chuẩn.
- Mỗi câu được đánh dấu `[THOẠI LÊN HÌNH]` hoặc `[LỜI DẪN]`.
- Có danh sách tư liệu tiện ích, giao thông và bản đồ (video-master Bước 1.5b).

### 4.2 Video thô
- Đủ 6 nhóm cảnh của video-master: A-Roll, Hero, POV, Chi tiết & Điểm trừ, Lô đất & Ranh mốc, Pháp lý & Định danh. Đủ các mã B-roll ★ theo loại BĐS.
- Chất lượng kỹ thuật theo `tech-advisor`: rung, mờ, phơi sáng, mic.
- Thời lượng sạch (sau khi trừ rung, mờ, vấp, khoảng lặng) đủ dựng 45-60 giây với dạng 5 cảnh; dạng K tối thiểu 30 giây, mục tiêu 50-80 giây.
- Độ khớp lời thoại với kịch bản ≥90%: Audio Master chấm.
- Các câu "có tiếng mà không có hình": lời nhắc tới một chi tiết nhưng không có cảnh quay tương ứng.

### 4.3 Nhịp dựng dự kiến
- Tốc độ cắt theo phong cách.
- Có câu nhử ở giây 10, 20, 30 (dạng K: mỗi 10-15 giây).
- Có speed ramp khi đi hẻm, lên cầu thang.
- Có điểm dừng nhấn khi nói pháp lý và giá ở Cảnh 4.

### 4.4 Đầu ra của Chặng 1
1. `| Hạng mục (Kịch bản / Video thô / Nhịp dựng) | Trạng thái (Đạt / Thiếu / Chưa phù hợp) | Chi tiết lỗi | Mức rủi ro | Giải pháp ngay từ đầu |`
   - Rủi ro **Cao**: chặn chuyển sang dựng.
   - Rủi ro **Trung bình**: sửa trong lúc dựng.
   - Rủi ro **Thấp**: ghi chú.
2. `[PHIẾU BÁO LỖI ĐẦU VÀO - TỪ QA MASTER]`, mỗi skill một dòng:
   - Trợ lý 1 (video-master): thông số thiếu, cảnh lặp ý, lỗi xưng hô trong kịch bản.
   - Audio Master: file thu âm vấp, thiếu thông tin, dưới ngưỡng 90%.
   - Trợ lý 2 (video-master) và 3D & FX Master: source rung mờ, thiếu B-roll, nguy cơ tràn khung an toàn.
   - `tech-advisor`: lỗi quay cần hướng dẫn quay lại.

## 5. Chặng 2 – Kiểm tra video đầu ra

### Cách đo (không kết luận bằng cảm giác)

| Hạng mục | Cách đo |
|---|---|
| Khung an toàn | (a) Ảnh tổng hợp có vẽ vùng cấm (Công cụ A, mục 8). (b) Đo tự động hộp bao từng lớp chữ và MG (Công cụ B), nếu MG dựng bằng HTML/Remotion. (c) Chữ ASS: tính hộp từ `\pos`, cỡ chữ và độ dài dòng |
| Che mặt Dũng | Dò mặt bằng OpenCV `FaceDetectorYN` (YuNet) hoặc MediaPipe trên máy Dũng (xin phép tải mô hình), rồi so với hộp chữ. Không có công cụ thì đánh dấu mặt trên ảnh tổng hợp |
| Cắt cụt chữ | So mốc cắt với mốc từng từ (faster-whisper). Điểm cắt cách âm đầu hoặc cuối của từ dưới 0,05 giây là cụt chữ |
| Khoảng lặng | `silencedetect=noise=-35dB:d=0.5` |
| Jump-cut | Hai shot liền nhau cùng clip nguồn, cùng góc, cỡ cảnh đổi dưới 15% và không có B-roll che |
| Thiếu cảnh | Theo Bảng canh thời điểm hiệu ứng (video-master Bước 4.8 mục F): từ khóa vật thể được nói ra mà trong ±1 giây không có cảnh tương ứng |
| Âm thanh | `ebur128=peak=true` cho tổng thể; bảng "nhạc dưới giọng theo cảnh" (Audio Master, mục 9) |
| Màu | Theo tiêu chí của `tech-advisor`: ám vàng, cháy sáng cửa sổ, lệch tông giữa các cảnh |
| Chữ và số liệu | So với Hồ sơ dự án và bản gỡ băng |

### 5.1 [Cảnh cắt]
- Vết cắt cụt chữ, phạm âm đầu hoặc cuối câu, đứt mạch ý (nhất là đoạn pháp lý và giá).
- Đoạn thừa chưa cắt sạch: tiếng thở mạnh, "à", "ừm", khoảng lặng >0,5 giây, khung đầu hoặc cuối bị rung lúc bấm máy.
- Jump-cut thô.

### 5.2 [Thiếu cảnh]
- Khuyết phần nào trong 5 cảnh, hoặc trong 6 nhịp với dạng K.
- Đoạn "có tiếng mà không có hình".
- Thiếu bước trong CTA 2 bước; cảnh CTA có logo hoặc chữ "Hoàng Dũng Real Estate" (H-chung-004).
- Dạng K: thời lượng ngoài 30-150 giây, hoặc ngoài 50-80 giây mà chưa có lý do và phương án rút gọn.

### 5.3 [Hiệu ứng video]
- Chuyển cảnh rối mắt hoặc lệch tông.
- Thiếu MG hoặc callout 3D ở thông số vàng; 3D dùng sai phạm vi (chỉ loại B, C, D hoặc cảnh Dũng chỉ định, H-hieu_ung_3d-005).
- Câu nói vị trí, tiện ích, khoảng cách mà không có MG vị trí đúng thời điểm (video-master Bước 4.8 mục B).
- Chữ, MG hoặc chuyển cảnh xuất hiện im lặng (thiếu SFX); chuyển cảnh trùng lúc chữ vào hoặc ra.
- Hiệu ứng đè lên B-roll chuyển cảnh.
- Vượt giới hạn chống lặp (video-master Bước 4.4 và 4.7).
- Quên hạ nhạc ở Cảnh 4 (dạng K: đoạn giá/pháp lý và câu chốt N5); SFX lệch nhịp hoặc lấn giọng.
- Lỗi màu.

### 5.4 [Bố cục text]
- Text Hook quá 8 từ, hoặc thiếu từ khóa tô màu.
- Vi phạm khung an toàn, bị giao diện che, chữ quá to hoặc quá nhỏ, chồng lên chủ thể, vật thể hoặc thẻ khác.
- Lỗi chính tả, sai số liệu, sai xưng hô.

### 5.5 Bảng lỗi theo mốc thời gian (gửi Dũng)
`| STT | Thời điểm (phút:giây - phút:giây) | Nhãn lỗi ([Cảnh cắt] / [Thiếu cảnh] / [Hiệu ứng video] / [Bố cục text]) | Phân tích chi tiết (cảnh, hiệu ứng, tọa độ) | Phương án khắc phục | Skill thực thi |`

Kết luận một dòng: **ĐẠT** hoặc **CHƯA ĐẠT (n lỗi: x Cao, y Trung bình, z Thấp)**, kèm Bảng điểm giữ chân của video-master Bước 3.5.

## 6. Chặng 3 – Hỏi trước, rồi mới phát lệnh sửa

### 6.1 Quy tắc bất khả xâm phạm
Không sửa và không phát lệnh sửa khi Dũng chưa xem báo cáo lỗi.

**Ngoại lệ hòa hợp với video-master.** Bản nháp chưa gửi cho Dũng được phép tự sửa các lỗi kỹ thuật đo được và có chuẩn cố định: tọa độ ra ngoài vùng an toàn, mức dB, khoảng lặng. Phải liệt kê từng lỗi đã tự sửa trong báo cáo, mục "Đã tự sửa trước khi gửi", không sửa ngầm.

Các trường hợp sau luôn hỏi trước:
- lỗi nội dung (lời, số liệu, xưng hô);
- lựa chọn sáng tạo (đổi cảnh, đổi hiệu ứng, đổi nhạc);
- mọi lỗi trên bản Dũng đã xem.

### 6.2 Câu hỏi gộp (dùng câu hỏi lựa chọn nếu có công cụ)
1. Tóm tắt mốc thời gian và nhóm lỗi.
2. Phạm vi:
   - **A – Sửa cục bộ:** đúng cảnh hoặc đoạn bị lỗi, giữ nguyên phần đã đạt (mặc định gợi ý khi lỗi dưới 30% thời lượng).
   - **B – Sửa toàn diện:** dựng lại 100%.
   - **C – Giữ nguyên:** ghi lý do.
3. Mong muốn cụ thể tại từng đoạn lỗi: thay cảnh nào, đổi hiệu ứng gì, dời chữ đi đâu, câu thoại nào.

### 6.3 Lệnh cưỡng chế (chỉ phát sau khi Dũng trả lời)
```
[LỆNH CƯỠNG CHẾ SỬA LỖI VIDEO - TỪ QA MASTER]
• Phạm vi: [Sửa cảnh … tại mm:ss - mm:ss | Sửa lại 100% video] theo quyết định của anh Dũng
• Skill nhận lệnh: [video-master Trợ lý 1 / Trợ lý 2 | audio-master | 3d-fx-master | effect-lab]
• Nội dung bắt buộc: [cảnh thay · B-roll bù · tọa độ X,Y mới · mức dB · câu thoại · lệnh ffmpeg/edit.json cần cập nhật]
• Hậu kiểm: bàn giao Preview vNN+1 để QA kiểm định lại 100% trước khi xuất
```

### 6.4 Hậu kiểm
- Chạy lại toàn bộ Chặng 2 trên bản sửa, không chỉ đoạn vừa sửa: sửa một chỗ có thể làm lệch chỗ khác.
- Gửi bảng Trước/Sau theo số lỗi. Bản sau không được có lỗi mới.

