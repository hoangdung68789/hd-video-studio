# Cấu Trúc & Quy Chuẩn Chỉnh Màu Video Chuyên Nghiệp (Color Pipeline)
Tài liệu quy chuẩn kỹ thuật dành riêng cho Hệ thống Dựng Video FFmpeg / Python (`dung-video`).

---

## I. NGUYÊN TẮC CỐT LÕI: THỨ TỰ BẤT BIẾN 6 TẦNG (THE 6-STAGE PIPELINE)

Trong xử lý video chuyên nghiệp, mọi phép toán màu sắc phải tuân theo thứ tự phân lớp nghiêm ngặt. Nếu đảo ngược thứ tự (ví dụ: áp LUT trước rồi mới cân chỉnh sáng tối), tín hiệu sẽ bị cắt cụt (hard-clipping) và phá hủy vĩnh viễn dải tương phản.

```
[Video Gốc]
    │
    ▼ (1. PRE-LUT: Chuẩn hóa kỹ thuật & Định hình dải sáng)
[Tầng 1: Input Normalization] ──► [Tầng 2: Exposure & S-Curve] ──► [Tầng 3: White Balance & Sat]
    │
    ▼ (2. AT-LUT: Ánh xạ màu nghệ thuật có kiểm soát)
[Tầng 4: 3D LUT (.cube) với Tetrahedral Interpolation + Blend/Mix 40% - 65%]
    │
    ▼ (3. POST-LUT: Bảo vệ màu da & Làm sạch tín hiệu)
[Tầng 5: Skin Gate & Lum vs Sat Roll-off] ──► [Tầng 6: Broadcast Limiter (16-235)]
    │
    ▼
[Video Xuất Chuẩn H.265 / Rec.709]
```

---

## II. CHI TIẾT TỪNG THÀNH PHẦN MÀU SẮC (PRE-LUT vs AT-LUT vs POST-LUT)

### 1. CÁC THÀNH PHẦN TRƯỚC LUT (PRE-LUT CONDITIONING)
> **Mục tiêu:** Đưa hình ảnh về trạng thái trung tính hoàn hảo và "lái" tín hiệu vào đúng vùng dung sai hoạt động (Sweet Spot) của bảng LUT.

| Thành phần | Ý nghĩa kỹ thuật | Cách điều chỉnh an toàn (FFmpeg / Python) | Lỗi cấm của Claude |
|---|---|---|---|
| **Input Normalization** | Khai báo đúng hệ số không gian màu Rec.709 và dải màu của clip (lấy từ `color_range` của `probe`), rồi xử lý trong RGB 16-bit để chống gãy màu (banding). | `setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709,scale=flags=accurate_rnd+full_chroma_int,format=gbrp16le` | CẤM để FFmpeg tự đoán format dẫn đến lệch BT.601 làm bợt màu đỏ và xỉn da. |
| **Black Point (Lift)** | Neo vùng tối nhất (Shadows) ở mức `3% – 5% IRE` (Luma 16–22). Giữ chi tiết khối nhà, tóc, vải tối màu. | `--lift` dương nâng điểm đen (`colorlevels` đầu ra `romin`), âm hạ điểm đen (đầu vào `rimin`), biên độ `±0.06`. | CẤM dùng `eq=brightness` dạng cộng làm biến màu đen thành xám mốc. |
| **White Point (Gain)** | Giữ vùng sáng nhất (Highlights) ở mức `90% – 95% IRE` (Luma 220–235), không chạm trần 255 trước khi vào LUT. | `--gain` dưới 1 hạ điểm trắng (`colorlevels` đầu ra `romax`), trên 1 nâng điểm trắng (đầu vào `rimax`), biên độ `0.92 – 1.08`. | CẤM đẩy Gain vượt 100 IRE gây cháy khét trời và bóng đèn. |
| **Midtone Exposure (Gamma / Pivot)** | Điều chỉnh độ sáng tổng thể của bức hình và khuôn mặt nhân vật mà không làm lệch điểm đen và điểm trắng. | `--gamma` trên 1 sáng lên, dưới 1 tối đi (`curves` 16-bit), biên độ `0.88 – 1.12`. Không dùng `eq` vì filter này ép về 8-bit. | CẤM dùng phép nhân tuyến tính làm trôi điểm neo đen. |
| **Pre-Contrast S-Curve** | Nén nhẹ vùng tối và giãn nhẹ vùng sáng theo đường cong Spline mềm quanh tâm xoay Pivot (~0.435). | Dùng `curves=m='0/0 0.25/0.22 0.5/0.5 0.75/0.78 1/1'`. | CẤM dùng `eq=contrast` tuyến tính làm gãy gập hai đầu dải sáng. |
| **White Balance (Temp / Tint)** | Khử hiện tượng ám vàng (Warm), ám xanh (Cool), ám lá (Green), ám tím (Magenta). Đưa vùng xám về $R \approx G \approx B$. | Dùng `colorbalance=rm=...:gm=...:bm=...` tác động đồng bộ Shadows, Midtones, Highlights. | CẤM nâng Saturation khi chưa cân bằng trắng. |

---

### 2. CÁC THÀNH PHẦN TẠI BƯỚC ÁP DỤNG LUT (AT-LUT)
> **Mục tiêu:** Áp màu phong cách nghệ thuật (Cinematic / Film Look) mà không phá hủy chi tiết gốc.

* **Bản chất file LUT (`.cube`):** Là bảng ánh xạ 3D tĩnh gồm $33\times 33\times 33 = 35.937$ điểm nút màu. LUT không có trí tuệ nhân tạo, nó sẽ cắt thẳng tay mọi điểm ảnh vượt quá ngưỡng `[0.0, 1.0]`.
* **Nội suy Tứ diện (`interp=tetrahedral`):** Bắt buộc phải khai báo cờ này trong FFmpeg. Nội suy Nearest hoặc Trilinear thông thường sẽ tạo ra các vết răng cưa và sọc loang lổ trên da người và nền trời.
* **Kỹ thuật Hòa trộn Độ mờ (LUT Opacity / Mix Slider):**
  * Trong điện ảnh, Creative LUT **không bao giờ được dùng ở mức 100%**.
  * Luôn sử dụng tỷ lệ hòa trộn **$40\% - 65\%$** (mặc định chuẩn: **$55\%$**) thông qua cấu trúc filtergraph song song:
    ```bash
    [pre_lut]split=2[pre_base][pre_to_lut];
    [pre_to_lut]lut3d=file='cinematic.cube':interp=tetrahedral[lut_applied];
    [lut_applied][pre_base]blend=all_mode=normal:all_opacity=0.55[post_lut]
    ```

---

### 3. CÁC THÀNH PHẦN SAU LUT (POST-LUT RECOVERY & MASTERING)
> **Mục tiêu:** Khắc phục các khiếm khuyết của LUT, bảo vệ màu da người và đóng gói chuẩn phát sóng.

| Thành phần | Ý nghĩa kỹ thuật | Cách điều chỉnh chuẩn |
|---|---|---|
| **Skin Tone Protection (Bảo vệ màu da)** | Đối chiếu vùng da người trên Vectorscope: phải luôn nằm dọc theo đường **Skin Tone Line** (góc 10h30). Nếu LUT làm da bị đỏ gạch hoặc vàng nghệ thì hạ `lut_mix` hoặc từ chối LUT đó. | `audit --reference <clip_gốc>` báo độ lệch sắc da so với gốc. Engine chưa có chỉnh màu riêng vùng da; số đo lọc theo dải màu nên gỗ, tường ấm cũng lọt vào: **luôn xem ảnh Before/After bằng mắt**. |
| **Luma vs Saturation Roll-off** | **Làm sạch điểm đen và điểm trắng:** Vùng đen sâu ($<5\%$ IRE) và vùng chói ($>95\%$ IRE) tuyệt đối không được có sắc tố lạ của LUT nhuộm vào. | Engine ép Saturation tiến dần về 0 tại 2 đầu cực bằng LUT `library/color/rolloff_rec709_33.cube`, không đổi độ sáng. |
| **Broadcast Safe Limiter** | Cắt phẳng mọi gai tín hiệu do quá trình nội suy màu sinh ra vượt ra ngoài dải an toàn truyền hình/mạng xã hội. | `scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,limiter=min=16:max=235:planes=1,limiter=min=16:max=240:planes=6` (giá trị theo thang 8-bit vì đặt sau `format=yuv420p`). |

---

## III. BẢNG GIỚI HẠN CỨNG (HARD GUARDRAILS) CẤM CLAUDE VƯỢT NGƯỠNG

Mọi Sub-Agent và lệnh FFmpeg/Python do AI tạo ra phải nằm trong khung an toàn sau:

1. **Biên độ Lift / Black Point:** Không chỉnh quá `±0.06` trên thang chuẩn hóa.
2. **Biên độ Gamma / Midtones:** Không đặt ngoài khoảng `[0.88, 1.12]`.
3. **Biên độ Gain / White Point:** Không đặt ngoài khoảng `[0.92, 1.08]`.
4. **Biên độ S-Curve Contrast:** Không kéo giãn quá `1.12` lần tương phản gốc.
5. **Cân bằng Trắng (White Balance Shift):** Hệ số dịch chuyển kênh R/G/B không vượt quá `±0.06`.
6. **Cường độ Creative LUT (`lut_mix`):** Bắt buộc nằm trong dải **`0.40 – 0.65`** (mặc định `0.55`). CẤM để `1.0` trừ phi là Technical LUT chuyển đổi camera (D-Log to Rec.709), khai báo bằng `--technical-lut`.
7. **Tỷ lệ Clipping cho phép (Gate G3, đo trên khung xấu nhất trong 12 khung lấy mẫu đều cả clip):**
   * Pixel vùng đen sâu ($Y < 5$): Tỷ lệ phải $< 0.3\%$.
   * Pixel vùng cháy sáng ($Y > 248$): Tỷ lệ phải $< 0.3\%$.
   * Nếu vượt quá ngưỡng trên $\rightarrow$ **Cổng G3 ĐÁNH TRƯỢT NGAY LẬP TỨC**.

`build-filter` tự kẹp mọi tham số về khung trên và báo trong `guardrail_warnings`. Không truyền tham số nào thì không đổi màu.

---

## IV. QUY TRÌNH SỬ DỤNG BỘ CÔNG CỤ `color_engine.py`

Thay vì tự đoán hoặc tự viết chuỗi filter FFmpeg phức tạp dễ gãy cú pháp, Claude và Sub-Agent `dung-mau` **bắt buộc sử dụng công cụ chuẩn**:
`textfx-kit/scripts/color_engine.py`

### 1. Bước 1: Đo lường tín hiệu clip gốc
```bash
python textfx-kit/scripts/color_engine.py probe <duong_dan_clip> --ss 1.5 --json out_stats.json
```
*Kết quả:* Trả về JSON chứa `YMIN, YAVG, YMAX`, `SATAVG`, cảnh báo lệch cân bằng trắng và nhận diện xem clip là phẳng (D-Log) hay đã có màu.

### 2. Bước 2: Tự động tạo chuỗi Filtergraph 6 tầng an toàn
```bash
python textfx-kit/scripts/color_engine.py build-filter \
  --lut "~/Downloads/freshluts-LUT/sample.cube" \
  --lut-mix 0.50 \
  --lift 0.01 \
  --gamma 1.04 \
  --contrast 1.05 \
  --wb-temp 0.02 \
  --json filter_recipe.json
```
*Kết quả:* Tự động sinh chuỗi filtergraph FFmpeg hoàn chỉnh, đúng cú pháp escape Windows, xử lý RGB 16-bit, nội suy tetrahedral, hòa trộn, roll-off và limiter. Clip `color_range=pc` thì thêm `--input-range pc`. LUT D-Log chuyển đổi camera thì thêm `--technical-lut`.

### 3. Bước 3: Xuất ảnh Before vs After để kiểm tra bằng mắt
```bash
python textfx-kit/scripts/color_engine.py preview <clip> --ss 2.0 --recipe filter_recipe.json --out preview_compare.png
```

### 4. Bước 4: Kiểm định tự động Cổng G3 trước khi xuất bản
```bash
python textfx-kit/scripts/color_engine.py audit <clip_da_chinh_hoac_frame> --reference <clip_goc>
```
*Kết quả:* Đạt điểm $\ge 90/100$ và clipping $< 0.3\%$ thì qua Cổng G3; nếu trượt phải điều chỉnh lại thông số Pre-LUT ngay tại chỗ. Mục `can_xem_bang_mat` có nội dung thì mở ảnh xác nhận trước khi cho qua.
