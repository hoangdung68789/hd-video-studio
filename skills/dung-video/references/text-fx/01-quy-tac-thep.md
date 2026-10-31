# Quy tắc thép — chữ hiệu ứng

Vi phạm 1 điều = chữ đó bị xóa/làm lại. Orchestrator có quyền phủ quyết ở cổng G4.

## A. Nội dung chữ
1. Chữ trên màn hình CHỈ gồm: (a) lời thoại thật của người dẫn, (b) thông tin Dũng cung cấp (giá, địa chỉ, diện tích, kết cấu, hotline). Ngoại lệ duy nhất: nhãn trên bản đồ vệ tinh vị trí.
2. KHÔNG tự thêm slogan, tiêu đề, CTA, con số, mỹ từ ("100%", "2 WC", "7M" nếu không có trong lời/thông tin).
3. CTA cuối video chỉ lặp đúng câu người dẫn nói. Không chèn card giá/số điện thoại/slogan mà người dẫn chưa nói.
4. Mỗi mẩu thông tin hiện chữ **tối đa 1 lần** trong cả video. Không lặp chữ giữa các MG. Phụ đề và chữ hiệu ứng không được hiện cùng một câu cùng lúc.

## B. Hình thức
5. KHÔNG khung/hộp/nền tối phía sau chữ. Tách chữ khỏi nền bằng bóng mềm, viền mảnh, màu tương phản, hoặc làm tối nhẹ vùng nền cục bộ bằng gradient rất mỏng (không thành khung).
6. Font tiếng Việt: Be Vietnam Pro nhúng bằng `@font-face`. Tiêu đề màu vàng `background-clip:text` PHẢI có padding trên ≈ 0.34em, nếu không dấu chồng bị cắt (MỖI → MÔI).
7. Cỡ chữ "vừa đủ đọc", không khổng lồ. Một khung hình chỉ có **một** điểm nhấn chữ chính.
8. Mọi chữ nằm trong vùng an toàn TikTok/Reels: tránh ~230px trên cùng, ~480px dưới cùng, ~160px cột nút bên phải. Không che mặt người nói, không che chi tiết chính của nhà.
9. Giữ nguyên bảng màu thương hiệu (xanh + vàng gold với FISA/HDRE, vàng gold với Hoàng Dũng). Không dùng neon/RGB nhiều màu tùy tiện.

## C. Chuyển động
10. Zoom, Ken Burns, punch-in, rung footage: AI tự quyết theo nội dung (Dũng bỏ luật cấm 31/10/2026).
11. Mọi chữ xuất hiện đều có SFX (chữ hiện im lặng = lỗi). Chữ hero: SFX có đỉnh nằm đúng khung hình chữ "chạm" từ được nói.
12. Chữ phải **đọc xong được**: thời gian giữ ≥ thời gian đọc (xem `03`). Hiệu ứng không được làm chữ khó đọc ở trạng thái cuối.
13. Không dùng cùng một hiệu ứng cho hai mốc liền kề. Cả video dùng tối đa 2 "họ" hiệu ứng để giữ thống nhất.
14. Hiệu ứng nặng (glitch, 3D, particle, shimmer) chỉ cho T3, không dùng lên số liệu cần đọc chính xác lúc đang chạy (giá, diện tích).

## D. Kỹ thuật
15. Mọi chuyển động định thời (frame-exact, seekable) để preview và render ra giống nhau. Không dùng đồng hồ thời gian thực. Không dùng random không có seed.
16. Chữ tách từng ký tự/từ phải kiểm dấu tiếng Việt ở trạng thái nghỉ (descender, dấu mũ, dấu hỏi không bị cắt bởi mask/overflow).
17. Sau khi dựng: trích khung ở mốc vào, đỉnh, và nghỉ của MỌI chữ T2–T3 và xem bằng mắt.

## E. Cấm chung
- Chữ "nhàm chán": tiêu đề phẳng, hiện cái rụp, không nhịp, không SFX.
- Chữ nhiều hiệu ứng cùng lúc (blur + glitch + xoay + nảy) trên một dòng.
- Hiệu ứng dài làm trễ lời nói: chữ phải đến cùng hoặc trước từ nói tối đa vài khung, không đến sau.
