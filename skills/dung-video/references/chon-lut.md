# Hướng Dẫn Chọn, Đo Lường & Áp Dụng LUT Chuyên Nghiệp

Dành cho **Tổ Màu (`dung-mau`)** trong quy trình dựng video FFmpeg / Python.  
Quy chuẩn kỹ thuật nền tảng: xem chi tiết tại `references/color-pipeline.md`.  
Công cụ thực thi: `textfx-kit/scripts/color_engine.py`.

---

## 1. Đo Tín Hiệu Bằng Công Cụ (Thay thế lệnh ffprobe/signalstats thủ công)

Thay vì gõ chuỗi lệnh FFmpeg dài dòng dễ nhầm lẫn, dùng trực tiếp:
```bash
python textfx-kit/scripts/color_engine.py probe <clip> --ss <giây>
```
Lệnh tự động trích xuất các chỉ số và quy đổi về thang 8-bit / 10-bit chuẩn Rec.709:
* `YMIN, YAVG, YMAX`: Độ sáng tối thiểu, trung bình và cực đại.
* `SATAVG, SATMAX`: Độ bão hòa trung bình và cực đại.
* `UAVG, VAVG`: Cân bằng màu (tâm trung tính lý tưởng là `128.0`).

---

## 2. Tiêu Chí Lọc Cảnh Nghi Lỗi

| Dấu hiệu | Ngưỡng lọc tự động | Phân tích chuyên môn | Hành động đề xuất |
|---|---|---|---|
| **Quá tối** | `YAVG < 50` hoặc `YMIN < 8` | Mất chi tiết khối nhà, bóng râm bị bết đen. | Nâng nhẹ Gamma `1.04 – 1.08` hoặc Lift `+0.02`. |
| **Quá sáng / Cháy** | `YAVG > 195` hoặc `YMAX > 245` | Bầu trời hoặc mặt tiền bị trắng khét. | Hạ nhẹ Gain `0.92 – 0.96` bằng `colorlevels`. |
| **Ám màu (Lệch WB)** | `\|UAVG - 128\| ≥ 8` hoặc `\|VAVG - 128\| ≥ 8` | U > 136: Ám xanh lạnh; U < 120: Ám vàng cam.<br>V > 136: Ám hồng tím; V < 120: Ám xanh lá cây. | Cân bằng lại qua `wb_temp` / `wb_tint` Pre-LUT. |
| **Phẳng (D-Log/Flat)** | `SATAVG < 4` và dải Luma hẹp | Footage quay chế độ phẳng, chưa bung màu. | Đủ điều kiện để áp LUT chuyển đổi hoặc Creative LUT. |

*Lưu ý:* Luôn xuất ảnh xác nhận bằng mắt bằng lệnh `preview`. Cảnh quay ban đêm, phòng ngủ đèn vàng hoặc sân vườn có thể vượt ngưỡng nhưng vẫn đúng bối cảnh thực tế.

---

## 3. Quy Tắc Áp Dụng 3D LUT (.cube)

1. **Tuyệt đối không áp LUT "trần" lên footage chưa cân chỉnh:**
   * Luôn phải có tầng **Pre-LUT** để cân bằng sáng tối (Exposure) và cân bằng trắng (White Balance). Nếu clip gốc đang bị thừa sáng mà đưa thẳng vào LUT, LUT sẽ cắt cụt (hard-clip) dữ liệu vùng Highlight thành mảng bệt trắng.
2. **Luôn kích hoạt nội suy Tứ diện (`interp=tetrahedral`):**
   * Ngăn chặn hiện tượng vỡ dải màu (banding/posterization) trên nền trời và làn da người.
3. **Pha trộn cường độ (LUT Opacity / Mix Slider):**
   * Creative LUT luôn có màu rất gắt. Mặc định luôn pha trộn ở mức **$40\% - 65\%$** (chuẩn: **$55\%$**) với clip gốc để giữ màu sắc trong trẻo tự nhiên của ngôi nhà và làn da:
     ```bash
     python textfx-kit/scripts/color_engine.py build-filter --lut "<duong_dan_lut.cube>" --lut-mix 0.55
     ```
4. **Bảo vệ màu da người (Skin Tone Rule):**
   * Màu da người (mọi chủng tộc) luôn phải bám sát trục *Skin Tone Line* trên Vectorscope. Nếu LUT làm da bị biến thành màu đỏ gạch, vàng nghệ hoặc bệch phấn, phải hạ `lut_mix` hoặc từ chối LUT đó (`audit --reference` báo độ lệch, xem ảnh để chốt).

---

## 4. Quét và Đề Xuất LUT từ Kho Tài Nguyên

Khi áp dụng Lựa chọn 3 (Dùng LUT có sẵn):
1. Quét kho LUT tại `~\Downloads\freshluts-LUT-phan-loai_DAY-DU.zip` (hoặc thư mục giải nén).
2. Lọc bỏ các LUT tạo độ tương phản quá gắt, làm đen đặc vùng tối (`YMIN < 5`) hoặc làm cháy sáng (`YMAX > 248`).
3. Chọn ra **tối đa 3 LUT đẹp nhất** (giữ màu da tự nhiên, nhà trông sạch sáng đúng thực tế).
4. Render 3 ảnh so sánh Before vs After bằng `color_engine.py preview` gửi kèm câu hỏi cho Dũng duyệt trước khi dựng.
