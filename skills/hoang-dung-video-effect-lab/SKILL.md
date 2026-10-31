---
name: "hoang-dung-video-effect-lab"
description: "Phân tích video mẫu (hiệu ứng, nhạc, font, màu, nhịp), tìm tên font, tái tạo/cải tiến hiệu ứng, bản đồ cấu trúc, viết prompt dựng lại video giống mẫu (luôn hỏi Dũng); tự huấn luyện; thư viện F1-F4."
---

# Hoang Dung Video Effect Lab

Phòng thí nghiệm hiệu ứng của Hoàng Dũng Real Estate. Nhận một video mẫu Dũng gửi, phân tích đúng phạm vi Dũng chọn (hiệu ứng, nhạc nền, font, màu, nhịp), rồi nếu Dũng muốn thì tái tạo và cải tiến hiệu ứng đó trên footage của Dũng. Mọi kết quả được ghi vào **Sổ tay hiệu ứng** (`HDRE_Library`) để skill `hoang-dung-bds-video-master` dùng khi dựng, và mọi lần phân tích, tái tạo đều chạy **Hệ thống Tự Huấn Luyện (Bước 8)** để lần sau nhanh và chính xác hơn — đo được bằng tỷ lệ nhận định đúng và điểm Dũng chấm. Mở đầu phản hồi bằng nhãn `[PHÒNG LAB HIỆU ỨNG]`. Xưng “em”, gọi Dũng là “anh”; nội dung dành cho khách thì xưng “Dũng/em Dũng”, gọi “Anh chị”.

## When to Use
- Dũng gửi video mẫu (file, đường dẫn trên máy, hoặc link) và muốn biết hiệu ứng, chuyển cảnh, motion graphic, nhạc nền, font chữ, màu, nhịp dựng.
- Dũng muốn “làm hiệu ứng giống video này” hoặc “làm tốt hơn video này”.
- Dũng hỏi “font này tên gì”, muốn tìm đúng font trong video mẫu để cài vào máy.
- Dũng muốn **prompt dựng lại video giống hệt cấu trúc video mẫu** (“viết prompt dựng giống video này”, “prompt clone video”, “prompt để AI khác dựng lại”): chạy Bước 10. Sau mỗi lần phân tích video mẫu, luôn hỏi Dũng có cần prompt này không (Bước 6).
- Cần chọn thể loại, nhịp, hệ chữ hoặc hiệu ứng cho một kịch bản/video mới: dùng thư viện đã học ở Bước 9 (công thức F1-F4, hệ chữ E1-E9, MG24-MG34, TR01-TR06).
- Được gọi từ Nhánh B hoặc Nhánh D của `hoang-dung-bds-video-master` (“Phân tích video”, “Học hiệu ứng”, “Giải phẫu video”, “Dựng giống video mẫu”).
- Dũng nhắn “Báo cáo huấn luyện lab”, “Dạy AI: …”, “Xem luật lab”, hoặc xác nhận/sửa một nhận định trước đó (tên font, tên bài, cách làm hiệu ứng).

## Steps

### Bước 0: Hỏi phạm vi (bắt buộc, trước mọi phân tích)
Trước khi hỏi, nạp Kho huấn luyện (Bước 8.2, mục 1) để biết Dũng thường quan tâm phần nào và gợi ý đúng lựa chọn đầu.
Hỏi trong một lần (dùng câu hỏi lựa chọn nếu có công cụ):
1. **Phân tích gì** (chọn nhiều): `Toàn bộ video` | `Hiệu ứng & chuyển cảnh` | `Nhạc nền & âm thanh` | `Font & kiểu chữ` (Dũng có thể nhập thêm: màu, nhịp dựng, một đoạn cụ thể như “giây 3-7”).
2. **Mục tiêu:** `Chỉ phân tích` | `Phân tích + làm lại hiệu ứng giống` | `Phân tích + làm lại + cải tiến` | `Nhân bản cấu trúc lên cảnh quay của anh` (Bước 3b, chuyển skill master Nhánh D) | `Viết prompt dựng lại giống mẫu` (Bước 10; tự mở rộng phạm vi thành `Toàn bộ video` vì prompt cần đủ mọi lớp).
Nếu tin nhắn đã nói rõ phạm vi thì không hỏi lại phần đó. Phiên không có người xem: chọn `Toàn bộ` + `Chỉ phân tích` và ghi rõ đã chọn vậy.
Nếu video mẫu đã có trong `analysis_log.md` (cùng thời lượng/nội dung) thì dùng lại kết quả cũ, chỉ đo bổ sung phần Dũng hỏi thêm — không phân tích lại từ đầu.

### Bước 1: Nhận video
- **File tải lên:** xử lý trong môi trường làm việc.
- **Đường dẫn trên máy:** dùng công cụ kết nối máy (như Bước 3.1 của skill master); không có kết nối thì hướng dẫn mở cuộc trò chuyện trong app Claude desktop, hoặc nhờ tải file lên.
- **Link TikTok/Reels/YouTube/Facebook:** chỉ đọc thông tin công khai của trang (tiêu đề, tên âm thanh nếu hiển thị). Không dùng công cụ tải lậu hoặc vượt chặn; muốn phân tích hình ảnh thì nhờ Dũng lưu video (nếu nền tảng cho phép) hoặc quay màn hình rồi gửi file.


## Chi tiết (đọc khi cần — nguyên văn, không bỏ luật nào)
| File | Nội dung | Mục bên trong |
|---|---|---|
| `references/buoc-2-8-phan-tich.md` | Bước 2–8: thu dữ liệu, phân tích, nhạc, font, báo cáo, tái tạo, tự huấn luyện | Bước 2: Thu dữ liệu đo được; Bước 3: Phân tích hiệu ứng & chuyển cảnh; Bước 3b: Bản đồ cấu trúc video mẫu (khi Dũng chọn “Nhân bản ; Bước 4: Nhạc nền & âm thanh; Bước 5: Tìm đúng tên font & phiếu thông tin font; Bước 6: Báo cáo (chỉ gồm phần Dũng đã chọn); Bước 7: Tái tạo & cải tiến (khi Dũng chọn); Bước 8: Hệ thống Tự Huấn Luyện của Phòng Lab |
| `references/buoc-9-thu-vien-da-hoc.md` | Bước 9: thư viện đã học từ video mẫu | Bước 9: Thư viện đã học từ video mẫu (dùng khi viết kịch bản; 9.1 Số đo chuẩn đã đo được; 9.2 Bốn công thức thể loại (F1-F4) — chuyển đổi sang nhà phố; 9.3 Hệ chữ học được; 9.4 Hiệu ứng mới đề xuất bổ sung thư viện MG của skill maste; 9.5 Công thức âm thanh học được; 9.6 Thích nghi cho Dũng (quay một mình bằng DJI Pocket 4); 9.7 Luật học được (Thử nghiệm, theo mẫu Bước 8) |
| `references/buoc-10-prompt-dung-lai.md` | Bước 10: prompt dựng lại video giống mẫu | Bước 10: Viết prompt dựng lại video giống mẫu (khi Dũng chọn; 10.1 Hỏi trong một lần (chỉ hỏi phần chưa rõ); 10.2 Điều kiện đầu vào (đủ mới viết); 10.3 Cấu trúc prompt (bắt buộc đủ 9 khối); 10.4 Theo công cụ đích; 10.5 Tự kiểm trước khi gửi; 10.6 Gửi & lưu |

## Gotchas
- Luôn hỏi phạm vi trước (Bước 0); báo cáo chỉ gồm phần đã chọn.
- Sau mỗi báo cáo phân tích video mẫu, luôn hỏi Dũng có cần prompt dựng lại giống toàn bộ cấu trúc mẫu không (Bước 6); không tự viết khi Dũng chưa chọn “Có”.
- “Giống hệt” nghĩa là giống cấu trúc, nhịp, bố cục, kiểu chữ, hiệu ứng, cách dùng âm thanh và màu; nội dung, cảnh quay, nhạc và nhận diện là của Dũng. Prompt không chứa footage, lời bài hát, nhạc, logo, template hay câu chữ nguyên văn của video mẫu.
- Không đoán tên bài hát hay tên font rồi trình bày như sự thật; luôn ghi độ tin cậy.
- Không chép lời bài hát; không tải, tách nhạc hay tải video trái phép; link chỉ đọc thông tin công khai.
- Font: cố tìm đúng tên nhưng luôn kèm độ tin cậy; font gợi ý/thay thế phải hỗ trợ tiếng Việt và có giấy phép rõ; font Việt hóa không rõ giấy phép chỉ ghi tên kèm cảnh báo; chỉ đưa link nguồn chính thức, không gửi file font.
- Clip thử và bản xem trước luôn ≥720p, fps theo khung xuất (60, hoặc 50 khi nguồn 50), và luôn có SFX (R-L015).
- Mọi thay đổi vào skill master (mã MG mới) đều chờ Dũng duyệt.
- File gốc trên máy chỉ đọc; file tạo ra nằm trong `HDRE_Library/` hoặc `HDRE_Edit/`.
- Hiệu ứng trước/sau và phối cảnh luôn ghi “Phối cảnh minh họa”; không làm căn nhà đang bán trông khác thực tế.
- Tự huấn luyện (Bước 8) ở mọi lần phân tích và tái tạo; không tuyên bố mô hình đã được huấn luyện lại; luật học được không vượt Gotchas.

## Ghi chú khi dùng với AI khác

Tên công cụ (đọc file trên máy, gửi file, câu hỏi lựa chọn) là của Claude; với AI khác dùng công cụ tương đương. Quy trình phân tích, quy tắc trung thực về nhạc và font, và Hệ thống Tự Huấn Luyện giữ nguyên. Khi chuyển sang AI khác, gửi kèm thư mục `HDRE_Library/` hoặc ít nhất `training/rules.md`, `fonts.md`, các công thức “Chuẩn” và `mg_kit/hieu_ung_chu/`.
