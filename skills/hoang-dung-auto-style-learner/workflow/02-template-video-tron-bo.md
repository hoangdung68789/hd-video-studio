# Giai đoạn 2 — Bóc tách & Tái tạo Template Video Trọn Bộ (`TV-xx`)

Ưu tiên số 1 của learner. Học cả video thành MỘT khối trên cùng dòng thời gian. KHÔNG tách lẻ.
Đủ 8 thành phần: (1) Text · (2) SFX Đa tầng (5 nhóm chức năng sinh học, 4 tầng ý nghĩa tự sự, khoảng thở âm thanh & negative space theo `references/sfx-sound-design-chuyen-sau.md`) · (3) VFX & Overlays (`OV-xx`) · (4) Motion Graphics & Icons (`IC-xx`) · (5) Effect (vào/ra, chuyển cảnh) · (6) BGM · (7) A-roll và B-roll · (8) Bố trí, cấu trúc và Khung Background (`BG-xx`).

## 1. Bóc tách & Lập Hồ sơ Template (`template.json`)
1. Đo đạc theo `references/template-video.md` mục 1 & mục 2.
2. Ghi thư mục: `asset/phong_cach/template/<TV-xx>-<ten>/`:
   - `template.json`: Dữ liệu đo đạc chi tiết toàn bộ timeline.
   - `the.md`: Thẻ tóm tắt 1 trang đọc nhanh (công thức giữ chân, bảng hiệu ứng kèm Mở đầu/Kết thúc).
   - `contact.jpg`: Contact sheet mọi cú cắt và mọi lần chữ.
   - `sample_look.cube`: Bảng màu 3D LUT trích xuất từ mẫu (cho lựa chọn màu 1).
   - `text_vfx_presets`: Trích xuất các mẫu chữ `TX-<TV>-xx` cài sẵn.
3. **Cổng kiểm tra không bỏ sót:** Chạy `python scripts/template_check.py template.json` phải **PASS** (phủ 100% thời lượng, số đo 8 thành phần khớp, có hook, open loops, mốc CTA). FAIL → đo lại đúng lớp thiếu, tối đa 3 lượt.

## 2. Tự Dựng Bản Tái Tạo & Chấm Điểm 100/100 (`R-L033`)
1. Dựng bản tái tạo bằng HyperFrames (`hf/index.html`) theo đúng `template.json`.
2. Render nháp 720p → đo lại bản tái tạo bằng CÙNG bộ đo → `ban_dung.json`.
3. Chấm điểm giống mẫu: `python scripts/template_similarity.py template.json ban_dung.json --out diem.json` (thang điểm 100 qua 8 thành phần).
4. **Vòng 1–3 sửa bản dựng:** Sửa bản dựng ở thành phần điểm thấp nhất.
   - **Đạt 100/100:** Chuyển trạng thái sang **"Dùng được"**.
   - **Chưa đạt 100 sau 3 vòng:** Ghi rõ **"Chưa đạt — <điểm>/100"**, báo Dũng bảng lệch, **CẤM đưa vào sử dụng và CẤM gợi ý cho `/dung-video`**.
5. Cập nhật `asset/phong_cach/template/INDEX.md`.
