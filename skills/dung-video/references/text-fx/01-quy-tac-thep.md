# Quy tắc thép — chữ hiệu ứng

Vi phạm 1 điều = chữ đó bị xóa/làm lại. Orchestrator có quyền phủ quyết ở cổng G4.
Bản viết lại 02/11/2026 theo 3 quyết định của Dũng: (1) một video cho cả 3 nền tảng; (2) zoom/punch-in tùy trường hợp, phải hỏi Dũng; (3) phụ đề không SFX, chỉ chữ hook có hiệu ứng + SFX.

## A. Nội dung chữ
1. Chữ trên màn hình CHỈ gồm: (a) lời thoại thật của người dẫn, (b) thông tin Dũng cung cấp (giá, địa chỉ, diện tích, kết cấu, hotline). Ngoại lệ duy nhất: nhãn trên bản đồ vệ tinh vị trí.
2. KHÔNG tự thêm slogan, tiêu đề, con số, mỹ từ ("100%", "2 WC", "7M" nếu không có trong lời/thông tin).
3. CTA chỉ xuất hiện dưới dạng chữ khi chính người dẫn nói câu đó, và chỉ lặp đúng câu ấy. Không chèn card giá/số điện thoại/slogan mà người dẫn chưa nói.
4. Mỗi mẩu thông tin hiện chữ **tối đa 1 lần** trong cả video. Không lặp chữ giữa các MG. Phụ đề và chữ hook không hiện cùng một câu cùng lúc.

## B. Vai chữ, hình thức, màu
5. Ba vai chữ: **phụ đề (T0)** và **nhãn (T1)** không hiệu ứng, không SFX; **chữ hook (T2–T3)** có hiệu ứng + SFX. Chi tiết `02`.
6. KHÔNG khung/hộp/nền tối phía sau chữ. Tách chữ khỏi nền bằng viền, bóng mềm, màu tương phản, hoặc làm tối nhẹ vùng nền cục bộ bằng gradient rất mỏng (không thành khung).
7. Font: phụ đề và nhãn dùng Be Vietnam Pro (nhúng bằng `@font-face`). Chữ hook dùng font display theo `06`. Mọi font phải qua `vn_font_gate.py`. Tiêu đề màu vàng `background-clip:text` PHẢI có padding trên ≈ 0.34em, nếu không dấu chồng bị cắt (MỖI → MÔI).
8. Màu chữ: phụ đề trắng + viền đen 3–4px; nhấn bằng vàng gold thương hiệu; không đỏ/xanh lá/xanh dương làm màu chữ chính; đo tương phản trên khung thật. Chi tiết `06`.
9. Cỡ chữ "vừa đủ đọc", không khổng lồ. Một khung hình chỉ có **một** điểm nhấn chữ chính.
10. Vùng an toàn: chỉ có MỘT file cho TikTok, Shorts, Reels, nên dùng vùng của TikTok Dũng đã chốt làm chuẩn chung: tránh ~230px trên cùng, ~480px dưới cùng, ~160px cột nút bên phải. Vùng của Shorts và Reels chưa tra [Chưa xác minh]; nếu tra ra chặt hơn thì cập nhật số ở đây. Không che mặt người nói, không che chi tiết chính của nhà.
11. Giữ bảng màu thương hiệu (xanh + vàng gold với THUONG-HIEU-MAU/HDRE, vàng gold với Hoàng Dũng). Không neon/RGB nhiều màu. Glow đơn sắc nhẹ được phép, chỉ ở chữ hook (`06` mục 5).

## C. Chuyển động
12. Hiệu ứng ở **chữ**, không ở footage. Zoom giả, Ken Burns, punch-in, rung màn hình: **mặc định tắt**. Chỉ áp dụng khi Dũng đồng ý từng trường hợp. Cách hỏi: một câu, kèm mốc giây, lý do và mẫu nào có dùng. Không có người trả lời (phiên không người trực) thì không áp dụng và ghi "đã bỏ: ..." vào báo cáo. Muốn nhấn mà chưa được đồng ý thì làm chữ động.
13. Chữ hook luôn có SFX. Chữ hero: SFX có đỉnh nằm đúng khung hình chữ "chạm" từ được nói. Phụ đề và nhãn có SFX hoặc hiệu ứng = lỗi.
14. Chữ phải **đọc xong được**: thời gian giữ ≥ thời gian đọc (xem `03`). Hiệu ứng không được làm chữ khó đọc ở trạng thái cuối.
15. Không dùng cùng một hiệu ứng cho hai mốc liền kề. Cả video dùng tối đa 2 "họ" hiệu ứng.
16. Hiệu ứng nặng (glitch, 3D, particle, shimmer) chỉ cho T3, không dùng lên số liệu cần đọc chính xác lúc đang chạy (giá, diện tích). Chữ âm bản và chữ-sau-người: mỗi loại tối đa 1 lần/video.

## D. Kỹ thuật
17. Mọi chuyển động định thời (frame-exact, seekable) để preview và render giống nhau. Không dùng đồng hồ thời gian thực. Không dùng random không có seed.
18. Chữ tách từng ký tự/từ phải kiểm dấu tiếng Việt ở trạng thái nghỉ (descender, dấu mũ, dấu hỏi không bị cắt bởi mask/overflow).
19. Sau khi dựng: trích khung ở mốc vào, đỉnh, và nghỉ của MỌI chữ hook và xem bằng mắt.

## E. Cấm chung
- Chữ "nhàm chán" ở vai chữ hook: tiêu đề phẳng, hiện cái rụp, không nhịp, không SFX.
- Chữ nhiều hiệu ứng cùng lúc (blur + glitch + xoay + nảy) trên một dòng.
- Hiệu ứng, glow, đổi màu từng từ hoặc SFX trên phụ đề.
- Hiệu ứng dài làm trễ lời nói: chữ phải đến cùng hoặc trước từ nói tối đa vài khung, không đến sau.
