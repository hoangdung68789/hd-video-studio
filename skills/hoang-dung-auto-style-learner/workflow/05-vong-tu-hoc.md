# Giai đoạn 5 — Vòng Tự học & Quản lý Sổ luật Huấn luyện (`rules.md`)

Vòng tự học dùng chung cho toàn bộ hệ thống (`/hoang-dung-auto-style-learner` và `/dung-video`).
Nơi lưu: `Documents/HoangDung_AI/HDRE_Library/training/rules.md`.

## 1. Cơ chế Tự học theo Phản hồi của Dũng
1. **Dũng duyệt video / duyệt template:**
   - Ghi cái đã dùng (template `TV-xx`, style, bộ chữ `TX-xx`, hiệu ứng, nhạc, nhịp) theo thể loại, cộng `+10 điểm` tin cậy.
   - Hiệu ứng trong bản duyệt cộng `+1` vào cột "Số lần dùng". Lần sau ưu tiên dùng lại trước.
2. **Dũng sửa hoặc chê:**
   - Chuyển lỗi thành luật kiểm tra tại cổng tương ứng với điểm khởi đầu `85 điểm`.
   - Hiệu ứng bị chê ghi nhận vào cột "Dũng chấm" để rà soát. Lần dựng sau bắt buộc phải qua luật này trước khi trình.
3. **Dũng chấm điểm 1–5 sao:**
   - Điểm `≥ 4 sao`: Cộng `+10 điểm`, đưa vào danh mục "Gu quen dùng của Dũng".
   - Điểm `< 3 sao` hai lần: Bỏ, giữ 1 dòng lý do trong hồ sơ.
4. **Lời Dũng nói trực tiếp ("từ giờ...", "Dạy AI: ..."):**
   - Tạo mã luật mới ngay lập tức với điểm khởi đầu `85 điểm` (hoặc `100 điểm` nếu là luật vận hành cốt lõi).
5. **Cơ chế Tự quên:**
   - Luật có điểm `< 40 điểm` hoặc sau 60 ngày không dùng: chuyển sang mục "Đã bỏ" (kèm 1 dòng lý do). Luật trùng lặp thì tự động gộp. Sổ luật duy trì `≤ 150 dòng`.

## 2. Báo cáo Cuối Phiên (Tối đa 8 dòng)
Sau mỗi lượt học hoặc vòng tự học, báo cáo gọn:
- Template mới (mã, thể loại, PASS/FAIL, điểm giống mẫu sau ≤3 vòng).
- Số phần tử BR/AN/MG mới + dòng Bảng kết hợp mới.
- Hiệu ứng mới đạt "Dùng được" + điểm giống.
- Dòng `🧠 Đã học: <tóm tắt 1 câu>` (không tuyên bố mô hình AI đã được huấn luyện lại).
