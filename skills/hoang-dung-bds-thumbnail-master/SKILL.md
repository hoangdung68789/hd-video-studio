---
name: "hoang-dung-bds-thumbnail-master"
description: "Thumbnail/ảnh bìa video BĐS Hoàng Dũng: câu hỏi chỉ khi có người, khuôn mặt tiền F1-F3 tự phân tích ảnh, chữ tự cân đối và đảm bảo tương phản, ≥3 mẫu 9:16 có ô lưới 3:4, chèn vào video sau khi Dũng chọn."
---

# Hoang Dung BDS Thumbnail Master (Chuyên gia ảnh bìa video)

Tạo ảnh bìa (thumbnail) cho video bán nhà của Hoàng Dũng Real Estate: một cái nhìn là người xem hiểu căn nhà (ảnh đẹp nhất, giá, thông số, điểm nhấn) và tò mò bấm vào xem.

## Vai chuyên gia & liên kết
- **Vai chính:** art director ảnh bìa ở chuẩn hàng đầu thế giới, vận hành theo Phần 0 của `hoang-dung-bds-habit-memory`. Lĩnh vực hỗ trợ: tâm lý thị giác, tỷ lệ bấm xem (CTR), typography, nhiếp ảnh chân dung và kiến trúc. Hành vi nền tảng (cách cắt ô lưới, vùng che giao diện) có thể đổi: chưa chắc thì tra cứu và ghi sổ tay chuyên gia (lĩnh vực `nen_tang`).
- **Nhận từ** (qua Hồ sơ dự án, giao thức video-master mục 2.1): `listing-writer` thông số; video-master lời thoại đã gỡ băng và cảnh đã kiểm định; `color-master` công thức màu đã duyệt; `broker-trainer` nỗi sợ/mong muốn của nhóm khách để viết câu hỏi.
- **Giao cho:** video-master khung ảnh bìa chèn đầu video; `qa-master` kiểm chữ, tương phản và khung an toàn trước Preview.
- **Tự huấn luyện:** vòng 7 bước của lõi; ghi mẫu được chọn, mẫu bị bác và lý do vào mảng `hieu_ung_3d`; kiến thức về CTR và nền tảng vào sổ tay chuyên gia.

## When to Use
- Mọi video BĐS dựng bằng `hoang-dung-bds-video-master`: chạy sau khi có thông tin nhà và cảnh quay đã kiểm định, trước bước Preview.
- Dũng nhắn "thumbnail", "ảnh bìa", "cover", "ảnh đại diện video", hoặc gửi ảnh mặt tiền.
- Luôn nạp `hoang-dung-bds-habit-memory` (mảng `chung`, `hieu_ung_3d`, `kich_ban`, `mau_sac`; sổ tay lĩnh vực `nen_tang`, `marketing`) trước khi làm.

## Gu đã chốt của Dũng (16/10/2026)
1. **Dạng câu hỏi chỉ dùng khi có người:** chủ thể (người dẫn) kết hợp không gian đẹp của nhà. Không có người thì dùng **dạng khẳng định** (vd "NHÀ MỚI VÀO Ở NGAY").
2. **Hình nền ưu tiên:** chủ thể ở khung đẹp, biểu cảm tự nhiên; **mặt tiền trước nhà**; nội thất, thiết kế đẹp nhất.
3. **Không dùng khung mặt xấu:** méo miệng, hé răng khi đang nói, nhắm/lờ đờ mắt, chớp mắt, quay ngang, nhòe.
4. **Chữ luôn đọc rõ trên mọi nền** (trần trắng, tường trắng, trời sáng).
5. **Bố cục chữ đẹp, tự cân đối, khớp nội dung video và môi trường cảnh quay.**
6. **Luôn có mẫu mặt tiền** khi có ảnh hoặc cảnh quay mặt tiền (khuôn F1-F3, Bước 3b).

## Đầu vào (lấy từ Hồ sơ dự án chung)
1. Thông số đã chuẩn hóa từ `hoang-dung-bds-listing-writer`: khu vực, giá, kích thước, diện tích, kết cấu (đầy đủ và rút gọn), PN/WC, pháp lý.
2. Lời thoại đã gỡ băng: câu hook mạnh nhất, điểm nhấn người dẫn nói.
3. Cảnh quay đã kiểm định, ảnh mặt tiền Dũng gửi, kết quả màu của `hoang-dung-bds-color-master`.
4. **Đối chiếu ảnh với thông tin:** số tầng nhìn thấy, kiểu cửa, mặt tiền phải khớp tin đăng và cảnh quay; lệch thì hỏi Dũng trước khi ghép số liệu.
Thiếu số liệu thì không bịa: bỏ mục đó và ghi `[Cần xác minh]`. Ảnh làm mẫu trước khi có thông tin thật phải gắn nhãn đỏ **"SỐ LIỆU MẪU – thay bằng thông tin thật"**.

## Bước 1: Chọn và làm sạch khung ảnh
### 1a. Khung nhà (nội thất)
- Trích 6-10 khung ứng viên từ nguồn độ phân giải cao nhất (ưu tiên B-roll 10-bit), đúng màu đã chỉnh.
- Chấm: nét, đủ sáng, thẳng đứng; có chi tiết đắt giá; có vùng trống cho chữ; không có người lạ, biển số, giấy tờ.
### 1b. Khung chủ thể
- Quét dày clip người dẫn (10-25 khung/giây), cắt cận mặt, lập bảng ảnh mặt có mốc thời gian; chỉ giữ khung mắt mở rõ, miệng khép hoặc cười mỉm tự nhiên, mặt hướng ống kính, nét.
- Mặt đẹp + nền đẹp → tràn khung; mặt đẹp nhưng nền kém → nền là không gian đẹp nhất + **thẻ chân dung** (nửa người, bo góc, viền trắng mảnh, bóng mềm, nhãn tên); không có khung đạt → bỏ dạng câu hỏi và gợi ý lần sau quay 2-3 giây đứng cười nhìn máy trong không gian đẹp nhất.
### 1c. Ảnh mặt tiền
- **Phân tích tự động:** tìm vùng trời (xanh/sáng, ít chi tiết), khối nhà chính (dải cột liên tục che trời gần giữa ảnh), cửa chính, ban công, cây và nhà bên cạnh. Khối nhà và cửa chính là vùng cần giữ; trời, cây, nhà bên cạnh, vỉa hè là vùng được đặt chữ.
- **Làm sạch:** phát hiện sticker, chữ dán, logo app, watermark (màu rực bất thường, viền trắng); xóa bằng sao chép theo phương đứng (cột, cổng, tường liên tục) hoặc tô lấp (inpaint); kiểm tra bằng ảnh cận. Xóa không sạch thì cắt khung tránh, dùng thẻ chữ che đúng chỗ, hoặc xin Dũng ảnh gốc không sticker. Không xóa chi tiết thật của nhà (biển số nhà thì làm mờ nếu cần giấu địa chỉ).
- Chỉnh nhẹ: tương phản, độ bão hòa; giữ đúng màu thật của nhà; mặt tiền thẳng đứng (chỉnh nghiêng phối cảnh nếu lệch nhiều).

## Bước 2: Ý chính trên ảnh (tối đa 4 lớp thông tin)
1. Tiêu đề:
   - **Có người → câu hỏi:** dòng ngữ cảnh ≤ 7 từ + câu hỏi ≤ 6 từ, chỉ tô vàng từ khóa (vd "TÀI CHÍNH TẦM **4 TỶ** / có nhà mới Bình Tân?", "BẾP ĐẸP THẾ NÀY / nhà giá **bao nhiêu?**").
   - **Không người → khẳng định:** dòng khu vực nhỏ + tiêu đề ≤ 6 từ, tô vàng từ khóa (vd "NHÀ MỚI **VÀO Ở NGAY**", "MẶT TIỀN **5 TẦNG** HIỆN ĐẠI" khi số tầng đã xác minh).
2. Giá (màu vàng).
3. 2-3 thông số: kích thước/diện tích, kết cấu, PN/WC.
4. 1 điểm nhấn: pháp lý, hẻm, vị trí hoặc tiện ích đã xác minh.
Tiêu đề khớp nội dung video và không gian làm nền. Không hứa hẹn sai, không "rẻ nhất"; xưng hô theo `H-chung-003`; chính tả chuẩn.

## Bước 3: Dàn chữ tự cân đối theo môi trường cảnh quay
1. **Bản đồ vùng:** vùng trống (trần, sàn, tường trơn, bầu trời) và vùng cần giữ (mặt người, bếp, cửa sổ, cầu thang, đèn trần, khối nhà, cửa chính).
2. **Chọn chỗ đặt chữ:** chấm từng vị trí ứng viên trong dải an toàn bằng mật độ chi tiết + phạt nặng nếu đè vùng cần giữ; chọn điểm thấp nhất.
3. **Cân đối:** tiêu đề ở một đầu, thông tin giá + thông số ở đầu kia; cùng lề 60 px, khoảng cách đều.
4. **Thứ bậc chữ:** dòng ngữ cảnh (~3-5% chiều rộng) → tiêu đề (Black ~6-8%) → giá (Black ≤ ~9%) → thông số (3-4%). Mỗi dòng chỉ một từ khóa vàng.
5. **Tương phản tự động (bắt buộc):** đo độ sáng nền sau từng khối chữ (bách phân vị 90); dưới 4,5:1 (WCAG) thì tự thêm nền mờ tối mềm mép hoặc tăng độ đậm thẻ kính đến khi đạt, cho cả chữ trắng và chữ vàng.
6. **Dải an toàn:** 1080x1920; chữ quan trọng trong y 250-1680 (ô lưới trang cá nhân cắt giữa 3:4); tránh 20% đáy và cột phải 15% cho chữ quan trọng.
7. **Phong cách:** chữ trắng bóng mềm, từ khóa vàng, thẻ kính mờ viền mảnh, viền vàng mảnh cho thẻ giá; không khối đen đặc lớn đè ảnh, không viền chữ dày; font hỗ trợ tiếng Việt (Inter Display hoặc font trong `brand.txt`).

## Bước 3b: Khuôn mặt tiền (dùng cho mọi căn, dữ liệu lấy từ thông tin Dũng cung cấp)
| Khuôn | Bố cục | Hợp khi |
|---|---|---|
| F1 · Tràn khung, chữ trên vùng trời | Cắt 9:16 đẩy khối nhà lệch phải, chừa trời bên trái; tiêu đề ở vùng trời, thẻ giá + thông số đặt trên cây/cổng nhà bên, chừa trọn cửa chính | Ảnh có nhiều trời, nhà cao |
| F2 · Thẻ niêm yết | Ảnh mặt tiền phủ 2/3 trên, dải tối chuyển mềm xuống bảng thông tin 1/3 dưới (khu vực, tiêu đề, chip thông số, pháp lý, giá); không chữ nào đè mặt tiền | Mọi ảnh, an toàn nhất |
| F3 · Nền mờ + ảnh đóng khung | Nền là chính ảnh đó làm mờ tối; ảnh mặt tiền sắc nét trong khung 3:4 bo góc viền trắng giữa khung; tiêu đề trên, thẻ giá dưới | Ảnh ngang/lệch tỷ lệ, nhiều chi tiết xung quanh |
Mặt tiền không có người nên dùng dạng khẳng định. Nếu có khung người dẫn đứng trước nhà đạt chuẩn mặt (Bước 1b) thì thêm mẫu câu hỏi trên nền mặt tiền.

## Bước 4: Tối thiểu 3 mẫu
| Mẫu | Khi nào | Bố cục |
|---|---|---|
| Q-Tràn khung | Có khung người + nền đẹp | Câu hỏi vùng trống, thẻ thông tin vùng sàn |
| Q-Chân dung | Mặt đẹp nhưng nền kém | Nền không gian đẹp nhất + thẻ chân dung + thẻ thông tin cân hai bên |
| F1-F3 · Mặt tiền | Có ảnh/cảnh quay mặt tiền | Theo Bước 3b |
| S-Hero / S-Ghép 3 ảnh | Không người, nội thất đẹp | Tiêu đề khẳng định + dải thông tin ở vùng trống lớn nhất |
Bộ mẫu gửi Dũng nên có: ≥ 1 mẫu câu hỏi (nếu có người đạt chuẩn) + ≥ 1 mẫu mặt tiền (nếu có ảnh mặt tiền) + mẫu nội thất.

## Bước 5: Xem trước để Dũng chọn
- Gửi các file mẫu và một bảng so sánh, mỗi mẫu kèm ảnh mô phỏng ô lưới 3:4. Khi chạy trong luồng video-master, gửi trong tin nhắn **Duyệt gộp** cùng ảnh Trước – Sau màu và Mẫu xem trước 9:16 (video-master mục 2, bước 7).
- Ghi ngắn mỗi mẫu: tiêu đề, khung nguồn, sticker đã xóa (nếu có), tỷ lệ tương phản thấp nhất đã đạt.
- Dũng chọn hoặc góp ý → sửa → gửi lại; ghi mẫu được chọn và góp ý vào hồ sơ thói quen (mảng `hieu_ung_3d`).

## Bước 6: Đưa vào video (sau khi Dũng chọn)
1. Xuất ảnh bìa riêng `HDRE_<du-an>_thumb_<mau>.jpg` để tải lên làm ảnh bìa khi nền tảng cho phép.
2. Chèn ảnh bìa vào video: mặc định ở đầu video 0,3 giây rồi chuyển sang hook bằng chớp sáng hoặc zoom xuyên (kèm SFX camera shutter); hỏi Dũng lần đầu nếu muốn đặt ở cuối video.
3. Khung chèn đúng độ phân giải và fps của bản xuất (video-master Bước 3.3 và 3.6), có trong Preview trước khi xuất bản chính; `qa-master` kiểm lại ở Chặng 2.

## Gotchas
- Không dùng câu hỏi khi ảnh không có người; không dùng khung mặt xấu.
- Không để chữ nào dưới tương phản 4,5:1 so với nền phía sau.
- Không ghép số liệu của căn này vào ảnh căn khác; ảnh lệch thông tin (số tầng, kiểu cửa) thì hỏi trước. Mẫu dùng số giả định phải có nhãn "SỐ LIỆU MẪU".
- Xóa sticker/watermark trước khi dùng ảnh; không xóa chi tiết thật của nhà.
- Không bịa giá, diện tích, pháp lý, khoảng cách; số liệu chưa xác minh không lên ảnh.
- Che thông tin sổ, biển số xe, mặt người lạ. Logo chỉ khi Dũng yêu cầu (`H-chung-004`).
- Luôn ≥ 3 mẫu kèm mô phỏng ô lưới 3:4; không chèn vào video khi Dũng chưa chọn.
- Mọi thay đổi skill này theo `H-chung-001`.