# Phân loại trường hợp dùng chữ hiệu ứng

Mỗi mốc ở giai đoạn 4 phải gán **một bậc** (T0–T3) và **một loại** (L1–L10) trước khi chọn hiệu ứng.
Bậc càng cao → hiệu ứng càng mạnh, SFX càng rõ, và càng hiếm.

## 1. Bốn bậc chữ
| Bậc | Vai trò | Hiệu ứng | SFX | Hạn mức mặc định (video 50–80s) |
|---|---|---|---|---|
| **T0** Nền | phụ đề/chữ thông tin phụ | rất nhẹ: fade, rise ngắn | click/tick rất nhỏ hoặc nằm dưới nhạc | không giới hạn nhưng chỉ khi Dũng yêu cầu phụ đề |
| **T1** Nhãn | tên người dẫn, địa chỉ, tên tiện ích, nhãn bản đồ | gọn: slide ngắn, mask-reveal, line draw | whoosh nhẹ / tick | 4–8 |
| **T2** Nhấn | từ khóa trong lời thoại (điểm mạnh, tiện ích, pháp lý) | vừa: sáng + scale nhẹ đúng từ nói, spring pop, đổi màu | pop/hit nhỏ | 3–6 |
| **T3** Hero | hook đầu, giá, diện tích/kết cấu chính, CTA | mạnh: kinetic build, slam theo nhịp, gradient sweep, count-up, depth text | hit/riser rõ, đỉnh trúng từ | **tối đa 3–4**, cách nhau ≥ 8s |

Không nâng bậc tùy hứng: nếu cả video đều là T3 thì không còn điểm nhấn.

## 2. Mười loại trường hợp (L1–L10)
| # | Trường hợp | Bậc | Nhóm hiệu ứng nên dùng (xem `05`) | Lưu ý riêng |
|---|---|---|---|---|
| L1 | **Hook 3–5 giây đầu** (câu gây tò mò lấy từ lời thoại) | T3 | kinetic build / slam theo nhịp / blur-resolve | Chữ hạ đúng từ khóa nói đầu tiên; không dùng tiêu đề phẳng kiểu "Nhà ở khu X" |
| L2 | **Giá** | T3 | count-up số + gradient sweep, hoặc spring-scale | Số phải đọc rõ ở trạng thái nghỉ; đơn vị (tỷ/triệu) theo đúng thông tin Dũng |
| L3 | **Diện tích / kết cấu / số phòng** | T2–T3 | stat reveal, ticker dọc, line draw dưới số | Gom 1 lần, không lặp lại ở cảnh khác |
| L4 | **Vị trí / địa chỉ / thời gian di chuyển** | T1 | mask-reveal, pin + line draw trên bản đồ | Nhãn bản đồ là ngoại lệ "chữ ngoài lời nói" |
| L5 | **Điểm mạnh nhà** (chủ tặng nội thất, mặt tiền, hẻm xe hơi…) | T2 | glow + scale đúng từ nói, đổi màu vàng, spring pop | Nhấn đúng cụm 1–3 từ, không nhấn cả câu |
| L6 | **Tiện ích xung quanh** (chợ, trường, bệnh viện) | T1–T2 | waterfall entry (từng dòng nối nhau), icon SVG vẽ nét | Mỗi tiện ích một lần; khoảng cách lấy từ thông tin Dũng |
| L7 | **Pháp lý** (sổ hồng riêng, hoàn công) | T2 | stamp/press-release, viền mảnh vàng, đứng yên rõ | Đặt gần cuối; hiệu ứng chắc, không nhí nhảnh |
| L8 | **Chuyển ý / đổi chủ đề** (trong nhà → quanh nhà → pháp lý) | T1 | fade-through, shared-axis, scale-swap | Nhẹ, đừng cạnh tranh hook/giá |
| L9 | **CTA cuối** | T3 | build gọn rồi giữ yên | Chỉ chữ người dẫn nói; không logo/slogan thêm |
| L10 | **Tâm sự / thấu hiểu khách** (video kể chuyện) | T2 | blur-resolve, discrete text sequence, serif/italic nhẹ | Chữ chậm, ít, để lời nói dẫn dắt cảm xúc |

## 3. Chọn nhanh theo cảm xúc của mốc
| Cảm xúc/mục tiêu | Chọn |
|---|---|
| Gây sốc, giữ người xem ở 3 giây đầu | L1 + slam / kinetic build, SFX hit mạnh |
| Tạo niềm tin, chắc chắn | L7, L3: stamp, line draw, màu vàng ổn định |
| Tạo khao khát | L2, L5: gradient sweep, glow, count-up |
| Dẫn đường, dễ hình dung | L4, L6: bản đồ, line draw, ticker |
| Ấm áp, thân tình | L10: blur-resolve, fade-through, không glitch |

## 4. Không dùng chữ hiệu ứng khi
- Người dẫn đang nói điều không có từ khóa nào đáng nhấn → để im, đừng nhồi.
- Cảnh mặt người nói cận hoặc chi tiết nhà đẹp chiếm hết khung → dùng T0/T1 đặt lệch vùng an toàn, hoặc bỏ.
- Mốc liền ngay sau một T3 (< 8s) → hạ xuống T1 hoặc bỏ.
