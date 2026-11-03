# Giai đoạn 3 — Màu Sắc Chuyên Nghiệp (Chạy Đồng thời — Đo từ Pha 0, Áp chuẩn Pipeline 6 Tầng)

Phụ trách: **Tổ Màu (`dung-mau` + Sub-Agents đo màu)**.  
Chạy **đồng thời** ngay từ Pha 0 trên các clip được chọn.  
Công cụ bắt buộc: `textfx-kit/scripts/color_engine.py` (Tuân thủ `references/color-pipeline.md`).

---

## 1. Đo Đồng thời ở Pha 0 & Tham vấn Lựa chọn (Chốt 02–03/11/2026)
- Ngay khi nhận footage ở Pha 0, Tổ Màu chạy song song lệnh đo bằng công cụ:
  ```bash
  python textfx-kit/scripts/color_engine.py probe <clip> --json stats_<clip>.json
  ```
  Xác định chính xác clip phẳng (D-Log, SATAVG < 4) hay đã có màu, và phát hiện ngay cảnh nghi lỗi (quá tối `YAVG < 50`, quá sáng `YAVG > 195`, ám màu `|U/V - 128| ≥ 8`, nguy cơ bệt/cháy).
- **Không tự ý đổi màu toàn cục khi chưa hỏi.** Gộp vào câu hỏi chung ở Pha 0 MỘT câu kèm số đo footage với **3 lựa chọn**:
  1. **Giữ màu gốc:** Không áp LUT. Chỉ gợi ý cảnh ám màu/quá tối/quá sáng kèm số đo và ảnh Before/After; Dũng duyệt cảnh nào mới sửa cảnh đó bằng chuỗi Pre-LUT an toàn.
  2. **Tạo theo video mẫu:** Đo `signalstats` của video mẫu Dũng gửi; dùng `color_engine.py build-filter` khớp dải sáng và độ bão hòa theo mẫu; nộp ảnh so sánh Before/After.
  3. **Dùng tài nguyên có sẵn (LUT) và gợi ý:** Quét kho LUT, chọn tối đa 3 LUT gốc phù hợp nhất, áp dụng với Pre-LUT conditioning + tỷ lệ hòa trộn mặc định 55%, trong khung 40–65% (interp tetrahedral); gửi ảnh so sánh Before/After cho Dũng chọn.
- Phiên không có người trả lời → **giữ màu gốc (lựa chọn 1)**, ghi "chưa hỏi được, giữ gốc" vào báo cáo.

---

## 2. Quy trình Thực thi Chuỗi 6 Tầng (Khi Áp LUT hoặc Sửa Cảnh Lỗi)
Khi Dũng duyệt sửa hoặc áp LUT, Tổ Màu **bắt buộc chạy qua `color_engine.py`** để sinh filtergraph an toàn:

1. **Khởi tạo thông số (Tuân thủ Hard Guardrails trong `color-pipeline.md`):**
   * *Pre-LUT:* Cân bằng điểm đen Lift, điểm trắng Gain, Gamma trung gian, và cân bằng trắng (Temp/Tint) để đưa tín hiệu vào vùng Sweet Spot của LUT.
   * *At-LUT:* File `.cube` nội suy `tetrahedral`, hòa trộn `lut_mix` từ `0.40` đến `0.65` (mặc định `0.55`). LUT D-Log chuyển đổi camera dùng `--technical-lut` (100%).
   * *Post-LUT:* Khử bẩn đen/trắng (Roll-off) và limiter 16–235, engine tự thêm.
2. **Sinh lệnh & Tạo ảnh duyệt:**
   ```bash
   python textfx-kit/scripts/color_engine.py build-filter --lut "<path.cube>" --lut-mix 0.55 --gamma 1.03 --json filter.json
   python textfx-kit/scripts/color_engine.py preview <clip> --ss 2.0 --recipe filter.json --out preview.png
   ```

---

## 3. Kiểm tra Chéo & Nghiệm thu Cổng G3 (Peer Cross-Check & In-line Fix)
- **Tự kiểm Cổng G3:** Chạy audit trước khi bàn giao clip:
  ```bash
  python textfx-kit/scripts/color_engine.py audit <clip_da_chinh_hoac_frame> --reference <clip_goc>
  ```
  Bắt buộc đạt điểm `≥ 90/100`, tỷ lệ clipping $< 0.3\%$ trên khung xấu nhất. Mục `can_xem_bang_mat` có nội dung thì mở ảnh xác nhận.
- **Kiểm tra chéo (Peer Cross-Check):**
  * *Tổ Cắt dựng ↔ Tổ Màu:* Kiểm tra độ đồng nhất sáng/màu giữa các cảnh cắt liền kề; không để cảnh trước quá tối mà cảnh sau lại quá chói.
  * *Tổ Đồ họa / Render ↔ Tổ Màu:* Kiểm tra da nhân vật trên khung thật. Nếu phát hiện bệch da, da ám cà rốt hoặc mất tương phản chữ $\rightarrow$ **yêu cầu Tổ Màu vá ngay đúng clip đó tại chỗ**.
- **Mục tiêu chuẩn Editor Pro:** Đồng nhất giữa các cảnh, da tự nhiên, **nhà trông đúng thực tế**, không biến căn nhà thành căn khác [N5].
- **Nộp:** Bảng số đo `signalstats` từng clip + ảnh đối chiếu Before/After + file công thức `filter.json`.

Cổng: G3 (`rules/cong-chat-luong.md`).
