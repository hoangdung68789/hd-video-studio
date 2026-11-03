# Giao Bản Cuối (`≥ 98/100`), Đánh giá Sub-Agents, Tự học & Xử lý Lỗi

## 1. Bàn giao Bản Cuối cho Dũng (Khi đạt `≥ 98/100`)
Khi Agent Tổng kiểm tra nhanh tổng thể đạt **tối thiểu từ `98/100` trở lên (`≥ 98/100`)**, bàn giao ngay **MỘT bản cuối duy nhất dùng ngay** và nói rõ chi tiết cho Dũng theo cấu trúc gọn, rõ ràng:
1. `Thư mục chứa kết quả: <đường dẫn>` + Tên style + 1–2 link mẫu tham chiếu (nếu có).
2. **Điểm chất lượng tổng thể (`XX/100` — ngưỡng đạt `≥ 98/100`) & Chi tiết từng hạng mục:**
   - Nêu rõ số đo thật của từng phần: Cắt dựng (`../25`), Chữ/MG/Bản đồ (`../25`), Âm thanh/Nhạc/SFX (`../25` — kèm LUFS thật), Màu & Bảo mật địa chỉ (`../25`).
   - Nếu điểm là `98/100` hoặc `99/100`: giải trình rõ ràng 1–2 điểm trừ nhỏ nằm ở mốc giây nào và xác nhận đã khớp mượt toàn bộ video.
3. **Báo cáo Đánh giá Nhân sự Sub-Agents của dự án (`agent-roster.json`):**
   - Số lượng Sub-Agents đã tạo (vừa đủ theo dự án, `≤ 50`, không tạo dư).
   - Danh sách Sub-Agents hoàn thành tốt được **Giữ lại (`RETAINED`)** và Sub-Agents làm hỏng việc `> 2 lần` đã bị **Loại bỏ (`TERMINATED`)** (nếu có).
- Không đưa nhiều phương án video để chọn. Dũng chỉ nhận và duyệt đúng 1 bản cuối chất lượng cao.

## 2. Khi Dũng yêu cầu sửa thêm
- **Chỉ sửa ngay đúng đoạn/phần Dũng yêu cầu (Surgical Patch):** Khớp lại vào toàn bộ video và làm tiếp từ chỗ dở; **không làm lại từ đầu**, không tốn thời gian vào các đoạn đã đạt.
- Không ưng style → quay lại 1b.

## 3. Tự học sau dự án
- Dũng duyệt/sửa/chấm → chạy Vòng tự học của `hoang-dung-auto-style-learner`; Thẻ phong cách ghi "đã dùng trên kênh Dũng". Vòng tự học chỉ ghi vào thư viện học (`HDRE_Library/training`), không tự sửa `SKILL.md` khi Dũng chưa yêu cầu.

## 4. Xử lý lỗi & Kỷ luật Sub-Agents (`> 2 lần hỏng việc = Loại bỏ`)
- **Kiểm chéo & Sửa ngay:** Sub-Agent phát hiện lỗi của Sub-Agent trước thì yêu cầu sửa ngay trước khi nhận việc.
- **Loại bỏ Sub-Agent yếu kém:** Bất kỳ Sub-Agent nào **làm hỏng việc trên 2 lần (`> 2 lần lỗi`)** hoặc tự bịa/tự đoán trái quy tắc → Agent Tổng **loại bỏ ngay lập tức (`TERMINATED`)**, tạo Sub-Agent mới kế thừa thông tin và làm tiếp từ đúng chỗ dở.
- **Thiếu nguồn/hạ tầng:** Nguồn trong `references/routing.md` hoặc `textfx-kit/` thiếu trên máy → ghi `missing`, dùng dự phòng, không đoán. Lỗi mạng/403 không thử lại quá 2 lần; chuyển dự phòng và báo 1 dòng.
