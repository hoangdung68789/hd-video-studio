# Giai đoạn 1 — Tìm kiếm & Đo đạc Video (Web + Watch / Antigravity)

Quy tắc: Web (trình duyệt) để TÌM và HIỂU; `watch` / Antigravity để ĐO. Không đo nhịp/chữ/SFX bằng ảnh chụp web (sai số lớn).

## 1. Web — Tìm kiếm & Phân tích Chỉ số
1. **Đăng nhập TikTok:** Nhắc Dũng đăng nhập TikTok trong khung trình duyệt (nếu cần), chờ Dũng báo xong. Lướt Khám phá, hashtag BĐS, kênh trong hàng đợi; loại video không phải BĐS/không đúng thể loại cần học và video dài quá 2 phút.
2. **Chỉ số & Động lực giữ chân:** Trên trang video ghi nhận lượt xem, thích, bình luận, lưu, chia sẻ; đọc 5–10 bình luận nổi bật → dẫn chứng cho `ly_do`/giữ chân (gắn nhãn "Có bình luận" + trích ≤15 từ). Không bấm thích/theo dõi/bình luận.

## 2. Đo đạc Kỹ thuật bằng `watch` / Antigravity Bridge
1. **Lệnh tải & bóc khung:** `python ~/.claude/skills/watch/scripts/watch.py <link|file> --detail balanced --out-dir <thư mục tạm>`; cần nhiều khung để đo cú cắt/chữ → `--detail token-burner`; chỉ cần lời → `--detail transcript`.
2. **Đo cắt cảnh, BPM, độ to:** `python scripts/measure_video.py <video>` (cắt cảnh, BPM, LUFS).
3. **Đo lời thoại & SFX:** Antigravity `create_srt` (lời) + `listen_video_sfx` (SFX). Chữ không có phụ đề → chép lời bằng whisper sẵn có.
4. **Đo chữ & Màu chữ:**
   - Contact sheet: `python scripts/contact_sheet.py` (khung 1–4 fps có mốc giây).
   - Đo mốc hiện/tắt theo màu: `python scripts/text_onset_color.py <video> y0 y1 cyan|red ngưỡng` (10 fps).
   - Màu hex = trung vị pixel ở khung rõ nhất → lưu vào `asset/phong_cach/mau_chu/bang_mau.json`.
5. **SFX lẫn giọng:** Chỉ giữ SFX trùng sự kiện hình ±0.15s; còn lại ghi "Không đo được"; không thêm SFX ngoài mẫu vào template.
6. **Dọn dẹp:** Học xong xóa thư mục tạm (video + khung), chỉ giữ dữ liệu đo, template và số liệu.
