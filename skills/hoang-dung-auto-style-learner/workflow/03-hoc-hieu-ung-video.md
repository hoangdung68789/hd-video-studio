# Giai đoạn 3 — Học Hiệu ứng Video Riêng lẻ (Kho Recipe & Từ điển Hiệu ứng)

Mục tiêu: Xây dựng kho hiệu ứng đã dựng lại được thành recipe HyperFrames 3–5s, có tên có nguồn chuẩn Editor Pro, có SFX đi kèm, để `/dung-video` tra cứu và sử dụng ngay.

## 1. Bảy nhóm Hiệu ứng Video
- `CH` Chữ (vào/ra/nhấn số-giá/karaoke/phụ đề/tiêu đề)
- `CC` Chuyển cảnh (whip, match cut, mask, glitch, chớp, trượt)
- `CM` Chuyển động máy & thời gian (speed ramp, punch-in)
- `MG/AN` Đồ họa & Animation (thẻ thông tin, mũi tên, icon `IC-xx`, bản đồ, bộ đếm, lower-third)
- `VFX/LP` Kỹ xảo & Lớp phủ (`OV-xx`: light leak, hạt phim, ray sáng quét, tách nền)
- `MA` Màu sắc (LUT 3D, tone ấm/lạnh, tách trắng đen)
- `SF` Âm thanh (SFX vai trò, riser, impact, whoosh, ducking)

## 2. Quy trình Học từng Hiệu ứng (Tự động, không hỏi)
1. **Đo hành vi trên khung:** Hướng di chuyển, easing, số frame vào/ra, cỡ % khung, vị trí X/Y, màu hex, mốc SFX.
2. **Định danh chuẩn Editor Pro (`R-L036`):** Tìm tên trong nguồn chính thức (CapCut, Premiere, AE, DaVinci, GSAP). Ghi dòng Từ điển theo định dạng: `Tên phổ biến quốc tế (Tên thông dụng tiếng Việt)`.
3. **Dựng lại thành recipe:** HyperFrames 3–5s, 1080×1920, 60fps, chữ BĐS tiếng Việt có dấu, có SFX ngay từ bản đầu; font chạy qua `vn_font_gate.py`.
4. **Chấm giống mẫu:** Dùng `measure.py` + `score.py`. Điểm `≥ 80` → "Dùng được". Điểm `< 80` → sửa ≤3 lượt, không đạt thì để "Thử nghiệm".
5. **Kiểm luật cứng:** Không nền hộp sau chữ, nằm trong vùng an toàn TikTok, không che nội dung nhà.
6. **Lưu trữ & Cập nhật danh mục:**
   - Thư mục: `asset/phong_cach/hieu_ung/<mã>/` (`the.md`, `recipe.html`, `so-sanh.mp4`).
   - Danh mục: `asset/phong_cach/hieu_ung/INDEX.md` và `asset/phong_cach/tu_dien_hieu_ung.md`.
