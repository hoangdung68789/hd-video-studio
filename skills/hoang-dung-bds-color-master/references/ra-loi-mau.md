# hoang-dung-bds-color-master — §4 Rà lỗi màu, 6 mã lỗi, biên bản, chỉ đạo liên skill

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

## 4. Chủ động rà lỗi màu & chỉ đạo liên skill

### 4.1 Sáu mã lỗi
Đo trên khung trích mỗi 0,5 giây: histogram, RGB parade, b* vùng trắng, Vectorscope.

| Mã | Lỗi | Dấu hiệu đo được | Cách sửa |
|---|---|---|---|
| COLOR-01 | Cháy sáng | Vùng >95% mức sáng mất chi tiết (trời, cửa sổ, đèn, trán) | Highlights −30 đến −50; hạ đỉnh curve về 0,92; mặt nạ vùng cửa sổ |
| COLOR-02 | Bệt tối | Vùng <5% mất chi tiết (gầm cầu thang, hẻm sâu); kéo sáng ra nhiễu màu | Khử nhiễu ~15% **trước**, rồi Shadows +35, Gamma 1,10 |
| COLOR-03 | Sai cân bằng trắng / ám màu | b* vùng trắng > +8 (vàng) hoặc < −8 (xanh); a* lệch > ±6 | `wb_patch.py` + giảm bão hòa kênh bị ám |
| COLOR-04 | Lệch tông da | Da tái, đỏ gắt, hoặc ám vàng như gỗ | HSL Cam: Hue ±5, Luminance +5 đến +10 |
| COLOR-05 | Nhảy màu giữa các cảnh | Chênh độ sáng trung bình >10% hoặc ΔE màu trung bình >6 giữa hai shot liền kề | Đồng bộ histogram và parade tại điểm cắt; chuyển màu mượt trong 0,5 giây |
| COLOR-06 | Nền xung đột với chữ | Vùng đặt chữ quá sáng hoặc trùng màu chữ | Gradient tối nhẹ ~15% ở vùng chữ, hoặc báo 3D & FX thêm viền / hộp nền mờ cho chữ |

Ngưỡng của COLOR-05 là ngưỡng khởi đầu do em đặt, sẽ chỉnh theo phản hồi của Dũng (mục 7).

### 4.2 Biên bản rà soát lỗi màu
```
🎨 BIÊN BẢN RÀ SOÁT LỖI MÀU (COLOR QA REPORT)
• Video: … · Thiết bị & hệ màu: … (đọc từ ffprobe: độ phân giải, fps, color_transfer)
• Đánh giá: Đạt / Cần sửa X điểm · Điểm màu: …/100
📍 Chi tiết theo mốc:
1. [mm:ss – mm:ss] | COLOR-0x | Vị trí trong khung: … | Mức độ: Cao/Trung bình/Thấp | Cách sửa: …
```
Điểm màu (thang 100): bắt đầu từ 100; mỗi lỗi Cao trừ 15, Trung bình trừ 8, Thấp trừ 3.

### 4.3 Chỉ đạo liên skill
Báo cáo và hỏi Dũng trước, theo quy tắc của QA Master mục 6. Sau khi Dũng đồng ý:
- **QA Master:** gửi điểm màu và các mốc lỗi để gộp vào biên bản nghiệm thu chung.
- **video-master Trợ lý 2:** chuỗi lệnh màu hoặc file `.cube` theo từng đoạn môi trường (mặt tiền → phòng khách → phòng ngủ → sân thượng), nhúng vào luồng render (FFmpeg / bàn dựng Remotion, sau bước LUT DJI).
- **3D & FX Master:** vùng nền quá sáng ở chỗ đặt chữ (COLOR-06) để chỉnh hộp nền hoặc viền chữ.
- **video-master Trợ lý 1 và tech-advisor:** ghi chú quay cho lần sau. Ví dụ: "Quay mặt tiền buổi trưa thì đứng chéo 45° so với hướng nắng; cân trắng thủ công trong nhà đèn vàng".
- **Audio Master:** khi tông màu chuyển từ rực rỡ ngoài trời sang ấm cúng trong phòng, báo để nhạc chuyển cảm xúc theo (đồng bộ nghe – nhìn).
- **Kho huấn luyện chung:** ca sửa màu thực tế (kèm ảnh Trước – Sau) lưu thành bài học trong `HDRE_Library/training/`. Không đưa vào broker-trainer, vì skill đó chuyên nghiệp vụ môi giới.

