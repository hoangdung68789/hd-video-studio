---
name: hoang-dung-token-saver
description: "Lớp tiết kiệm token cho mọi việc của Dũng: phân hạng việc, nạp skill có chọn lọc, nén ở 50%, giới hạn output công cụ, thử rẻ trước render sau, tự quên dữ liệu thừa."
---

# Tiết kiệm token – Hoàng Dũng

Chạy CÙNG các skill khác. Mục tiêu: ít token và ít thời gian nhất mà chất lượng thương mại không giảm. Tiết kiệm không bao giờ đổi bằng việc bỏ kiểm tra lỗi.

## 0. Quyền và ranh giới
- Dũng chỉ duyệt BẢN CUỐI. Mọi sửa đổi trung gian (tạo/sửa file làm việc, sửa lỗi, cài gói cần cho việc, chọn hướng, dọn dữ liệu, cập nhật sổ tay) tự quyết, không hỏi.
- Bảo vệ không cần hỏi: làm trên bản sao, file gốc của Dũng giữ nguyên; xóa → chuyển `_to_delete` và báo ở báo cáo cuối; không đăng/gửi/xuất bản ra ngoài trước khi Dũng duyệt bản cuối; không đổi cài đặt bảo mật hay cấu hình ngoài thư mục làm việc.
- Luật cứng video: không tự thêm chữ; bắt lỗi chữ, cảnh thừa, lỗi hình; kiểm nhạc nền; chỉ xuất bản có nhạc. Chỉ trình MỘT bản cuối. Sửa giữa chừng: sửa ngay rồi làm tiếp từ chỗ dở.
- Lưu file: thư mục Dũng chỉ định, không có thì `~\Claude`; video cùng thư mục video gốc.

## 1. Phân hạng việc (1 dòng đầu tiên)
Tóm yêu cầu 3 dòng: Mục tiêu / Đầu vào / Thế nào là «xong».
| Hạng | Ví dụ | Cách làm | Ngưỡng cứng (dừng, báo Dũng) |
|---|---|---|---|
| S | clip ≤15s từ 1 ảnh, sửa nhỏ, hỏi đáp | 1 luồng, không agent con, tự kiểm bằng script | 6k token |
| M | video vài cảnh, nhiều file | ≤2 agent | 30k |
| L | video đầy đủ, dự án nhiều công đoạn | điều phối đủ, ≤3 agent song song | 100k |
Vượt 50% ngưỡng: báo 1 dòng. Ngưỡng là ước tính, tự hiệu chỉnh theo sổ huấn luyện.

## 2. Nạp skill có chọn lọc
- Skill lớn (>15KB) chỉ nạp khi loại việc thật sự cần; chỉ áp phần liên quan, không đọc lại trong cùng phiên.
- Việc video luôn có orchestrator + effect-lab (yêu cầu của Dũng) nhưng chỉ áp đúng mục: chữ/hiệu ứng → E1-E9 + luật R-L; font → phiếu font; prompt dựng lại → Bước 10; bỏ phân tích video mẫu khi không có mẫu.
- Tài liệu thư viện: đọc đúng 1 file đúng chủ đề. Kiểm tra công cụ có chạy được (cài đặt, mạng) TRƯỚC khi đọc tài liệu của nó.
- Sau khi nạp, ghi ≤10 dòng quyết định chính vào CONTEXT.md.

## 3. Kiểm soát output công cụ
- Lệnh im lặng: ffmpeg `-loglevel error -nostats`, npm/pip `--silent`; cắt `| tail -5` hoặc ghi log ra file rồi chỉ đọc dòng lỗi.
- Không in danh sách dài (`head`, `wc`, `grep -c`). Đọc file theo đoạn (offset/limit).
- Xem nhiều khung hình: ghép 1 ảnh contact sheet.

## 4. Thử rẻ trước, render đắt sau
1. Chụp 3-5 khung hoặc dựng bản nháp 2-3s độ phân giải thấp.
2. Gom TẤT CẢ lỗi thấy được, sửa 1 lượt.
3. Render đầy đủ 1 lần. Không render lại toàn bộ chỉ để sửa 1 thông số.

## 5. Lỗi hạ tầng: không lặp
Lỗi 403/điều khoản/chặn mạng/DNS: không thử lại; 1 lần chẩn đoán rồi chuyển phương án dự phòng có sẵn (FFmpeg/Playwright thay vì cài gói bị chặn), báo 1 dòng. Cùng lệnh lỗi tối đa 2 lần.

## 6. Kiểm 3 vòng, rẻ
Vòng 1 đúng yêu cầu (checklist) · vòng 2 lỗi kỹ thuật bằng SCRIPT (ffprobe, loudness, trích khung, đối chiếu bảng chữ) · vòng 3 xem bằng mắt trên khung thật. Sau khi sửa chỉ kiểm lại phần đã sửa + điểm liền kề. Hạng L: 4-5 vòng.

## 7. Nén hội thoại
`_token-saver/CONTEXT.md` ≤40 dòng (mục tiêu, điều đã chốt, việc dở, đường dẫn). Ở 50% cửa sổ ngữ cảnh: cập nhật CONTEXT.md rồi `/compact` giữ đúng nội dung đó (BẮT BUỘC). Dưới 50%: nén khi xong mốc hoặc đổi chủ đề.

## 8. Agent
Mỗi agent ĐÚNG 1 nhiệm vụ. Brief ≤10 dòng; kết quả ≤15 dòng + đường dẫn file. Tối đa 5 vòng sửa; sau 3-5 lần không đạt thì thay agent mới, truyền lại CONTEXT.md. Việc dưới ~3 lệnh: tự làm.

## 9. Tự quên & dọn dữ liệu
- Sau mỗi dự án: xóa file nháp/tạm/log do Claude tạo (chuyển `_to_delete`), giữ bản cuối + nguồn.
- Hàng tuần: file không sửa >30 ngày và không còn được tham chiếu → chuyển `_to_delete`; mục nằm trong `_to_delete` quá 14 ngày mà Dũng không lấy lại thì xóa hẳn. Báo 5 dòng.
- Không bao giờ chạm: video gốc, file nguồn của khách, thư mục dự án đang mở.
- Sổ huấn luyện: quên theo quy tắc của orchestrator (mục Tự huấn luyện).

## 10. Báo cáo
Tiếng Việt, ≤8 dòng: kết quả, file giao, điều thay đổi so với yêu cầu, điều chưa làm được. Không tường thuật từng bước, không lặp nội dung đã nói.
