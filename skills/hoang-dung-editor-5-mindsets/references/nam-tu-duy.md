# hoang-dung-editor-5-mindsets — §2 Năm tư duy: nguyên lý, chuẩn đo, lỗi hay gặp

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

## 2. Năm tư duy: nguyên lý, chuẩn đo, lỗi hay gặp
Số đo dưới đây là **kinh nghiệm nghề** dùng làm mặc định; thói quen Dũng đã chốt (H-…) luôn thắng.

### 2.1 Tư duy kể chuyện (xương sống)
**Nguyên lý**
- Một video = **một thông điệp chính + một cảm xúc chính**; cảnh nào không phục vụ thì rút gọn (nhưng không bỏ lời mang ý, H-dung-004).
- **Hook 0-3 giây:** câu thoại thật mạnh nhất (con số, nỗi sợ, câu hỏi) ghép hình mạnh nhất; mở vòng tò mò và trả lời muộn.
- **Cung truyện BĐS** gắn 5 cảnh: vấn đề của người mua → căn nhà là lời giải → bằng chứng (thông số, pháp lý) → điểm trừ và cách hóa giải (Đòn bẩy Bù trừ) → CTA 2 bước.
- **Lộ trình không gian thật:** hẻm/đường → mặt tiền → vào nhà → các tầng → sân thượng; người xem có cảm giác đang "đi xem nhà".
- **Nói đến đâu, thấy đến đó:** lời nói về bếp thì hình bếp xuất hiện trong ≤0,3 giây.
- **Nhịp giữ chân:** có thay đổi thị giác hoặc âm thanh mỗi 2-4 giây (cut, chữ, B-roll, SFX); mốc giữ chân 10/20/30 giây có điểm nhấn.
- Chỉ kể bằng **lời thật** của người dẫn (H-dung-001); editor kể chuyện bằng thứ tự, nhịp, hình và âm, không thêm lời.

**Chuẩn đo:** hook ≤3 giây nêu lợi ích hoặc nỗi sợ; 100% câu P1 có hình minh họa; không đoạn nào >4 giây không có thay đổi; CTA một hành động rõ.

**Lỗi hay gặp:** mở bằng lời chào dài; liệt kê thông số khô; B-roll không khớp lời; trả lời hook quá sớm; kết thúc lửng; cảm xúc nhạc ngược nội dung.

### 2.2 Tư duy bố cục
**Nguyên lý**
- Mỗi khung có **một điểm nhìn chính**; mắt đi theo thứ tự: vùng sáng nhất → tương phản cao nhất → mặt người → chữ.
- Khung dọc 9:16: ưu tiên **chiều sâu và đường dẫn dọc** (hẻm, cầu thang, hành lang, ô cửa) hơn bề ngang.
- **1/3 và đối xứng:** mặt tiền, hành lang dùng đối xứng; người dẫn trên đường 1/3, mắt quanh Y ≈ 600-750 px (khung 1080×1920), chừa khoảng nhìn về phía người dẫn hướng tới.
- **3 lớp chiều sâu:** tiền cảnh (khung cửa, lan can, cây) – trung cảnh – hậu cảnh để nhà có khối.
- **Kiến trúc:** đường dọc thẳng đứng (lệch ≤1°), đường ngang thẳng; sửa nghiêng/méo trước khi đặt chữ.
- **Vùng chữ thiết kế từ khung hình:** đặt vào vùng trống của chính cảnh (H-hieu_ung_3d-003), trong khung an toàn X 70-910, Y 220-1480; không đè chi tiết đắt giá hay mặt người dẫn.
- **Hướng mắt liên tục qua cut:** điểm nhìn cảnh sau nằm gần điểm nhìn cảnh trước, trừ cú cắt có chủ đích gây giật.

**Lỗi hay gặp:** chữ đè bếp, cửa sổ, cầu thang; cắt cằm hoặc đỉnh đầu không chủ đích; đường dọc nghiêng; khung rối nhiều điểm nhìn; điểm nhìn nhảy trái–phải liên tục qua các cut.

### 2.3 Tư duy màu sắc
**Nguyên lý**
- **Màu phục vụ cảm xúc và sự thật:** chỉnh cho đẹp nhưng giữ đúng bản chất căn nhà; không đổi màu tường, không dùng màu che vết nứt, thấm (tránh quảng cáo gây hiểu nhầm).
- **Thứ tự chuyên nghiệp:** chuyển D-Log → Rec.709 bằng LUT chính thức → cân trắng, phơi sáng → khớp màu giữa các clip → tạo look → kiểm trên điện thoại (sáng tối đa và 50%).
- **Kịch bản màu theo 5 cảnh:** hook sáng, tương phản rõ; thân ấm, sạch; điểm trừ trung tính, trung thực; CTA ấm, rõ.
- **Tông da** người dẫn nằm trên đường tông da của vectorscope, không bị ám theo tường hay đèn.
- **Dẫn mắt bằng độ sáng và độ bão hòa:** điểm nhìn chính sáng và bão hòa hơn xung quanh (vignette nhẹ, vùng chọn).
- **Nhất quán:** cùng một không gian thì cùng màu giữa các clip (đo ΔE bằng script của `color-master`).
- Màu chữ, MG: vàng kim thương hiệu làm màu nhấn; tương phản theo nền, không phông nền sau chữ (H-hieu_ung_3d-002).

**Chuẩn đo (tham khảo):** vùng sáng không cháy, giữ chi tiết cửa sổ khi có thể; vùng tối không bệt; mặt người dẫn khoảng 55-70 IRE; tường trắng trung tính (R ≈ G ≈ B).

**Lỗi hay gặp:** ám pha trộn đèn vàng và ánh sáng ngày; cửa sổ cháy trắng; bão hòa giả; mỗi clip một màu; LUT áp 100% làm bệt.

### 2.4 Tư duy motion
**Nguyên lý**
- **Chuyển động có lý do:** theo hướng lia máy, theo lời, theo phách nhạc.
- **Không tuyến tính:** vào dùng giảm tốc (ease-out), ra dùng tăng tốc (ease-in); chữ nhấn nảy nhẹ 5-10%; dùng chọn lọc các nguyên lý hoạt hình: chuẩn bị (anticipation), chồng lớp (overlap), đà theo sau (follow-through).
- **Một chuyển động chính tại một thời điểm;** chuyển động phụ nhỏ hơn và đến trễ 2-4 khung.
- **Liên tục hướng:** chuyển cảnh và nhãn phòng trượt cùng hướng lia (H-dung-002).
- **Thời lượng:** vào 0,2-0,4 giây; ra 0,15-0,3 giây; chuyển cảnh 0,2-0,5 giây; giữ chữ đủ đọc ≈ (số từ ÷ 3) + 0,5 giây, tối thiểu 1 giây.
- **Motion blur** cho chuyển động nhanh (tương đương màn trập 180°) để chữ không giật ở 60fps.
- **Khớp nhịp:** điểm dừng của chuyển động rơi đúng phách hoặc từ khóa.
- **Tiết chế:** chuyển động không tranh mắt với người dẫn khi đang nói ý quan trọng.

**Lỗi hay gặp:** mọi chữ cùng một kiểu bay vào; chuyển động tuyến tính "máy móc"; chuyển cảnh ngược hướng lia; nhiều MG cùng lúc; chữ biến mất trước khi đọc xong.

### 2.5 Tư duy sound design
**Nguyên lý**
- Âm thanh là **một nửa cảm xúc**. Thứ bậc: giọng > SFX chủ ý > nhạc > nền (tiếng phố, room tone).
- **4 lớp:** giọng sạch; nhạc theo nhịp; SFX cho chữ và chuyển cảnh (H-am_thanh-002, -003); âm nền thật (tiếng phố, chim, quạt) để người xem "đứng trong nhà".
- **Khoảng lặng là công cụ:** ngắt nhạc trước câu quan trọng (Cảnh 4 ngắt trống) để tạo nhấn.
- **J-cut / L-cut:** âm cảnh sau vào trước hình 4-12 khung để nối mượt; room tone lấp chỗ cắt để không hụt hơi.
- **Khoét tần số:** nhạc giảm nhẹ vùng 1-4 kHz hoặc ducking khi có giọng.
- **Chuẩn mix:** tổng khoảng -14 LUFS, đỉnh thật ≤ -1 dBTP; nhạc thấp hơn giọng 18-22 dB, Cảnh 4 thấp hơn 22-25 dB; SFX chữ phụ thấp hơn giọng 12-16 dB.
- **Khớp hình đến khung:** SFX chữ lệch ≤5 ms; SFX đúng chất liệu (cửa gỗ khác cửa kính, sàn gạch khác sàn gỗ).

**Lỗi hay gặp:** nhạc đè giọng; im bặt giữa các cut; lặp một loại SFX; nhạc không theo cảm xúc cảnh; tiếng gió, vang còn sót.

