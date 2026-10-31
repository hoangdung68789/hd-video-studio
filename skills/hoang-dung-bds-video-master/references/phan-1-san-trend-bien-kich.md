# hoang-dung-bds-video-master — Phần I – Trợ lý 1: săn trend, biên kịch, kiểm đầu vào

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

## Steps

### PHẦN I: TRỢ LÝ AI 1 – SĂN TREND, BIÊN KỊCH & KIỂM ĐỊNH

#### Bước 1.1: Săn trend viral (9 yếu tố)
Dùng tìm kiếm để cập nhật xu hướng video BĐS trên TikTok/Reels, phân tích: (1) Chủ đề – góc tiếp cận; (2) Phong cách dẫn; (3) Hook 3 giây đầu; (4) Dòng kịch bản và điểm giữ chân 10/20/30s; (5) Nhịp dựng; (6) Bố cục chữ 9:16, từ khóa tô màu; (7) Cách dùng B-roll; (8) Góc máy, chuyển động máy; (9) Nhạc nền thịnh hành hợp phân khúc. Với hiệu ứng cụ thể của một video mẫu, dùng skill `hoang-dung-video-effect-lab`.

#### Bước 1.2a: Xác định loại BĐS (bắt buộc trước khi viết kịch bản)

| Loại | Nhóm khách hay khớp | Trọng tâm Cảnh 3 | Trọng tâm Cảnh 4 |
|---|---|---|---|
| **A – Nhà ở ngay** | 1, 2 | Không gian, công năng, nội thất, số phòng | Pháp lý, giá, vay ngân hàng |
| **B – Nhà cũ, kết cấu chắc** | 6, 2, 1 | Khung BTCT chắc, điểm trừ + chi phí sửa ước tính (số của Dũng) | Pháp lý/hoàn công, giá, lý do giá mềm |
| **C – Nhà cũ cần sửa / xây mới** | 4, 3, 6 | Kích thước lô, mặt tiền, hậu, hẻm chở vật liệu, phương án xây ở / cho thuê / kinh doanh | Tính theo giá đất; quy hoạch, số tầng `[Cần xác minh]` |
| **D – Đất nền** | 4, 5, 3 | Hình dạng lô, kích thước cạnh, hướng, cao độ nền, mật độ xung quanh | Loại đất, quy hoạch, lộ giới, mật độ `[Cần xác minh]`, giá/m² |

Quy hoạch, loại đất, lộ giới, mật độ, số tầng được xây luôn `[Cần xác minh]` cho tới khi Dũng xác nhận (gợi ý kiểm tra bằng skill `hoang-dung-bds-broker-trainer`, lệnh `/quyhoach`).

#### Bước 1.2: Chân dung khách hàng (chọn 1 chính + 1 phụ)
1. Gia đình trẻ mua an cư lần đầu: nhà đẹp ở ngay, 2-4PN, hẻm an ninh, gần trường/chợ, sổ hồng hoàn công, tài chính vừa tầm.
2. Nâng cấp / đa thế hệ: ngang 4-5m+, nhiều tầng, 4-6PN, phòng ngủ trệt hoặc thang máy, hẻm ô tô.
3. Dòng tiền / kinh doanh: nhiều phòng cho thuê (CHDV 6-15 phòng) hoặc mặt tiền/hẻm thông kinh doanh, gần đại học, bệnh viện, văn phòng.
4. Mua tự xây: nhà cũ tính giá đất hoặc đất trống vuông vức/nở hậu, hẻm chở vật liệu, xây được cao tầng.
5. Tích lũy / đón hạ tầng: vị trí khan hiếm, gần hạ tầng đã xác minh, pháp lý sạch.
6. Fix & Flip: khung BTCT chắc, ngoại quan cũ, nhược điểm sửa rẻ, giá mềm.

Có nhược điểm thật (hẻm nhỏ nhưng nông, thấm nhẹ, tóp hậu nhẹ, nắp cống, nền thấp...) → **Nghệ thuật Mua rẻ nhờ Điểm trừ**: nói thật điểm trừ + cách khắc phục chi phí thấp + giá trị cốt lõi nhận lại.

#### Bước 1.3: Chọn 1 trong 3 phong cách
1. **Review thực chiến & bắn tỉa nhu cầu:** nhịp sắc, 3 ưu điểm đắt nhất; Dũng xuất hiện Cảnh 1, đoạn ngắn Cảnh 3, Cảnh 5; Cảnh 2, 4 dùng B-roll + voice-over.
2. **Thấu hiểu tâm lý & hóa giải nỗi sợ:** mở bằng đồng cảm, nhịp chậm, máy êm, giọng trầm ấm. Cần kể trọn một câu chuyện hoặc nội dung dài hơn 60 giây thì dùng dạng K (Bước 1.4K).
3. **Chia sẻ kinh nghiệm pháp lý, quy trình, giá thị trường:** 40-50% Talking Head + 50-60% B-roll, lấy chính căn nhà/lô đất làm ví dụ; hợp loại C, D.

#### Bước 1.4: Kịch bản 5 cảnh (45-60 giây) + Bảng ưu tiên hiệu ứng
- **Cảnh 1 – Hook (0-5s):** 3 câu Hook theo 3 hướng, bắt buộc có Hook câu hỏi đánh vào tâm lý/mong muốn/nỗi sợ (nhóm A Nhu cầu, B Mong muốn, C Giải pháp, D Điểm mạnh riêng, E Câu hỏi tâm lý/nỗi sợ); chọn 1 câu, nêu lý do.
- **Cảnh 2 – Vị trí & tiện ích (5-15s):** đường/khu vực, lối tiếp cận, 2-3 tiện ích đã xác minh; ứng viên bản đồ MG18-MG21.
- **Cảnh 3 – Trọng tâm theo loại BĐS (15-30s):** theo Bước 1.2a; không lặp pháp lý và giá.
- **Cảnh 4 – Pháp lý, giá, giao dịch (30-40s):** pháp lý đã xác minh (thiếu thì `[Cần xác minh pháp lý]`), giá chào, thương lượng/vay, 1 lý do đáng cân nhắc; loại C, D thêm loại đất, quy hoạch, lộ giới.
- **Cảnh 5 – CTA 2 bước (40-50s+):** (1) câu hỏi gợi bình luận gắn với căn nhà/kinh nghiệm vừa chia sẻ; (2) mời nhắn tin, gọi, đặt lịch đi xem cùng người dẫn (tên xác định từ video hoặc phụ đề, không mặc định “Dũng”). Cảnh CTA không chèn logo và không ghi chữ “Hoàng Dũng Real Estate” (H-chung-004).
- Bảng 6 cột cho từng cảnh: `| Thời gian | Lời thoại | Hình ảnh (mã BR) | Góc máy & chuyển động | Chữ / đồ họa (mã MG) | Âm thanh |`
- **Bắt buộc:** mọi kịch bản đều dùng B-roll và motion graphic minh họa lời nói. Chấm ưu tiên từng câu thoại theo **Bước 4.6** và ghi mức P1/P2/P3 vào bảng, để shot list (Bước 1.5) có đủ cảnh nguồn cho hiệu ứng (ví dụ MG21 cần BR04, MG23 cần BR19).

#### Bước 1.4K: Dạng kịch bản K – Kể chuyện · Tâm sự · Chia sẻ · Thấu hiểu khách hàng
Dũng chốt 17/10/2026. Dùng khi Dũng yêu cầu kịch bản kể chuyện, tâm sự, chia sẻ, thấu hiểu khách hàng; khi Phong cách 2 cần kể trọn một câu chuyện; hoặc khi Dũng gửi các câu thoại ngắn từng cảnh cần nối thành lời thoại liền mạch. Mục tiêu: lời thoại liền mạch, đủ thông tin và cảm xúc, chạm đúng cảm xúc người xem và giữ chân họ tới hết video.

**1. Thời lượng:** tối thiểu 30 giây, tối đa 150 giây; **mục tiêu bản cuối 50-80 giây** (hợp TikTok/Reels). Chỉ vượt 80 giây khi mỗi nhịp đều mang thông tin hoặc cảm xúc mới, và ghi lý do trong Preview. Ước tính thời lượng lời thoại bằng tốc độ nói thật của người dẫn (tiếng/giây, đo từ bản gỡ băng các video trước, lưu `HDRE_Library/training/speech_rate.csv`); chưa có số đo thì ghi số tiếng của bản lời và nhờ Dũng đọc thử bấm giờ một đoạn, rồi lưu lại.

**2. Nguồn câu chuyện (trung thực):** chỉ kể chuyện có thật: trải nghiệm của người dẫn, tình huống khách thật do Dũng kể, hoặc câu chuyện của chính căn nhà. Khách thật thì ẩn danh hoặc đổi tên, bỏ chi tiết nhận diện, và chỉ dùng khi khách đã đồng ý. Không bịa lời khách, lời chứng thực hay số liệu để câu chuyện “hay hơn”. Thiếu chất liệu thì hỏi Dũng gộp một lần, tối đa 3 câu: ai, chuyện gì đã xảy ra, kết quả hoặc bài học. Chất liệu chuyện gắn nhãn `[Theo Dũng]`; số liệu căn nhà vẫn lấy từ `listing-writer`.

**3. Cấu trúc 6 nhịp** (tỷ lệ theo tổng thời lượng; cột mốc giây là ví dụ cho bản khoảng 65 giây):
| Nhịp | Tỷ lệ | Mốc (~65s) | Vai trò | Cách chạm cảm xúc |
|---|---|---|---|---|
| N1 Hook cảm xúc | ≤3 giây | 0-3s | Đặt người xem vào một khoảnh khắc thật, nỗi sợ hoặc mong muốn | Câu hỏi “Anh chị đã bao giờ…”, câu trích của khách, hoặc kết quả trước – lý do sau; mở một câu hỏi chưa trả lời |
| N2 Nhân vật & bối cảnh | 10-15% | 3-12s | Ai, ở đâu, đang cần gì | Một chi tiết cụ thể nhìn hoặc nghe được (con nhỏ, đi làm xa, ở trọ nhiều năm) thay cho mô tả chung |
| N3 Nút thắt / nỗi sợ | 15-20% | 12-25s | Điều khó, điều sợ, lựa chọn khó | Gọi đúng tên cảm xúc (“sợ mua hớ”, “sợ vay không nổi”); người dẫn đồng cảm, không phán xét |
| N4 Bước ngoặt – lời giải | 30-40% | 25-50s | Căn nhà, lời khuyên hoặc cách làm giải nút thắt; vị trí, tiện ích, thông số chỉ nêu khi phục vụ câu chuyện | Bằng chứng cụ thể: số liệu đã xác minh, cảnh quay thật; nói vị trí/tiện ích thì dùng MG bản đồ (Bước 4.8 mục B) |
| N5 Bài học / câu chốt | 10-15% | 50-58s | Một câu đọng lại, khái quát cho người xem | Câu ngắn, nhịp chậm, nhạc rút nhẹ trước câu |
| N6 CTA mềm 2 bước | 10-15% | 58-65s | (1) câu hỏi gợi bình luận gắn với câu chuyện; (2) mời nhắn tin, gọi, đặt lịch xem nhà | Giọng ấm, không ép; theo luật CTA ở Bước 1.4 (tên người dẫn xác định từ video, không logo, không chữ “Hoàng Dũng Real Estate”) |

- **Giữ chân:** mỗi 10-15 giây có một câu nhử mở vòng (“Nhưng điều khiến anh chị ấy đổi ý lại là…”); câu hỏi mở ở N1 chỉ được trả lời ở N4-N5; mỗi nhịp có ít nhất một chi tiết mới, không lặp ý.
- **Co giãn:** bản 30-45 giây gộp N2+N3 và N5+N6; bản trên 80 giây được thêm tối đa một vòng nút thắt phụ trong N4.

**4. Lời thoại – hai cách tạo:**
- **(a) Viết mới liền mạch:** một bài độc thoại văn nói, đọc liền từ đầu đến cuối; câu ngắn, mỗi câu một ý; xưng “Dũng/em”, gọi “Anh chị”; từ nối tự nhiên giữa các nhịp (“Rồi…”, “Nhưng…”, “Thật ra…”, “Vậy nên…”); không liệt kê quá 3 thông số liền nhau.
- **(b) Nối các lời ngắn từng cảnh:** Dũng gửi các câu ngắn theo cảnh (hoặc lời đã quay) → AI xếp vào 6 nhịp, giữ nguyên ý và lời của Dũng, chỉ thêm **câu nối** đánh dấu `[CÂU NỐI – CẦN THU]` để mạch lời liền. Câu nối phải được người dẫn thu tiếng (voice-over bằng Mic 3), hoặc thay bằng chữ/hình chuyển; khi dựng từ video đã quay, không chèn lời người dẫn chưa nói (H-dung-001).
- Mỗi câu gắn `[THOẠI LÊN HÌNH]` hoặc `[LỜI DẪN]` như Bước 1.5b.

**5. Đầu ra dạng K** (thay mục 2-3 của Bước 1.5; các mục khác của Bước 1.5 giữ nguyên):
1. Phiếu ý đồ: 1 thông điệp chính + 1 cảm xúc chính; chân dung khách (Bước 1.2); nguồn câu chuyện kèm nhãn; thời lượng mục tiêu.
2. Ba Hook cảm xúc (ít nhất 1 câu hỏi tâm lý, 1 câu trích hoặc khoảnh khắc), chọn 1 và nêu lý do.
3. **Lời thoại liền mạch** hoàn chỉnh trong code block để đọc và quay, kèm số tiếng và thời lượng ước tính.
4. Bảng kịch bản theo nhịp: `| Nhịp | Mốc (giây) | Lời thoại | Lên hình / Lời dẫn | Hình ảnh (T/BR) | Chuyển cảnh + SFX | Chữ động / MG + SFX | Nhạc & cảm xúc |`. Cột hiệu ứng đã canh theo Bước 4.8 để Trợ lý 2 dùng thẳng khi dựng.
5. Bảng giữ chân: mốc từng câu nhử; câu hỏi mở và nơi trả lời.
6. Tự chấm “chạm cảm xúc” trước khi gửi: có nhân vật cụ thể · có chi tiết nhìn/nghe được · có nút thắt rõ · lời giải gắn bằng chứng thật · câu chốt ngắn, dễ nhớ · CTA mềm 2 bước · thời lượng trong khung · không lặp ý · xưng hô đúng. Mục nào chưa đạt thì sửa trước khi gửi.
- Nhạc (qua `audio-master`): phong cách 2, khoảng 70-90 BPM, ấm (piano, acoustic, cinematic nhẹ), bản đồ nhịp 6 nhịp. Dựng theo Kiểu 2 (Bước 2.0) và công thức F4 của `effect-lab` khi hợp.

**6. Kiểm soát thời lượng khi dựng từ lời thật** (sau khi đã cắt “à/ừm”, take lặp, khoảng lặng theo Bước 2.0d và H-dung-004):
- 30-80 giây: đạt.
- 80-150 giây: được giữ; Preview kèm phương án rút về 50-80 giây (bảng các câu đề xuất bỏ hoặc rút gọn + lý do) để Dũng chọn.
- Trên 150 giây: bắt buộc lập bảng rút gọn (câu trùng ý, câu ngoài mạch chuyện) để Dũng duyệt trước khi dựng; AI không tự bỏ câu mang ý (H-dung-004).
- Dưới 30 giây: báo thiếu nhịp nào và đề xuất câu quay bổ sung.

#### Bước 1.5: 8 phần đầu ra Tiền kỳ
1. Phân tích trend, loại BĐS, căn nhà, chân dung khách, nỗi sợ/mong muốn, 3 ưu điểm, dữ liệu cần xác minh.
2. Ba câu Hook (có Hook tâm lý/nỗi sợ và Hook bắt trend), chọn 1.
3. Kịch bản 5 cảnh (bảng 6 cột) kèm **Bảng ưu tiên hiệu ứng** (Bước 4.6); dạng K thay mục 2-3 bằng đầu ra riêng ở Bước 1.4K mục 5.
4. Ba phương án nhạc nền A/B/C do AI tự tìm theo Bước 2.4b (bài thật kèm nguồn, giấy phép, BPM, cảm xúc; cách phối; điểm hạ nhạc Cảnh 4; chốt 1).
5. Shot list từ Thư viện B-roll (Bước 4.2): tách ★ bắt buộc / ○ khuyến khích, cách quay, số giây tối thiểu.
6. Hướng dẫn quay DJI Pocket 4 + dựng: quay **60fps** (120fps cho slow-motion); cần cả 9:16 lẫn 16:9 thì quay ngang 4K; **giữ máy yên 3-4 giây** ở cảnh sẽ gắn đồ họa bám vật thể (toàn lô, điểm trừ, kết cấu, bề mặt cho chữ 3D).
7. Lời thoại và cảnh quay CTA 2 bước hoàn chỉnh.
8. Checklist ngôn từ, chính tả, thiết bị (kiểm tra cài đặt 60/120fps).

#### Bước 1.5b: Cơ cấu cảnh quay chuẩn & tư liệu cần thu thập (bắt buộc trong mọi kịch bản)
| Nhóm | Số cảnh | Nội dung | Ghi chú quay |
|---|---|---|---|
| A – Thoại có mặt Dũng | 2-3 | Hook, câu tạo tin tưởng/điểm nhấn, CTA — đúng lời trong kịch bản | Mỗi câu quay ≥2 lần; nói hỏng thì nói lại cả câu, không nối giữa câu |
| B – Chi tiết ngôi nhà | 3-6 | Mặt tiền · Phòng khách · Phòng ngủ & toilet · Đường/hẻm trước nhà · Nội thất (loại C, D thay bằng toàn lô, ranh, hậu, hẻm) | Mỗi không gian quay dư 2-3 góc để AI chọn cảnh đẹp nhất |
| C – Tiện ích & giao thông | 2-5 | Dựng bằng B-roll + motion graphic (bản đồ, line, thẻ ảnh) theo lời Dũng nói | Cần tư liệu ở danh sách dưới |
| D – Lời dẫn liền mạch | phần còn lại | Dũng nói liền mạch phần còn lại của kịch bản; AI dùng làm lời minh họa cho B-roll và hiệu ứng | Thu bằng Mic 3 nơi yên tĩnh; không cần lên hình |
**Dạng K:** nhóm A 3-5 đoạn (mở chuyện, nút thắt, câu chốt, CTA); nhóm D quay trọn lời thoại liền mạch từ đầu đến cuối ≥2 lần, mỗi lần nói liền một mạch để giữ cảm xúc liên tục; nhóm B theo căn nhà ở nhịp N4; nhóm C khi câu chuyện nhắc vị trí, tiện ích; câu `[CÂU NỐI – CẦN THU]` thu riêng bằng Mic 3.
Trong kịch bản, đánh dấu từng câu `[THOẠI LÊN HÌNH]` (Dũng diễn trước máy) hoặc `[LỜI DẪN]` (chỉ cần tiếng, AI phủ hình), để AI biết câu nào cần người thật diễn và câu nào minh họa bằng cảnh quay/hiệu ứng.
**Tư liệu tiện ích & giao thông Dũng cần gửi (Trợ lý 1 luôn yêu cầu khi viết kịch bản):** (1) quay hoặc chụp 2-5 tiện ích gần nhà (cổng chợ, trường, siêu thị, bệnh viện, công viên), mỗi nơi khoảng 5 giây hoặc 2-3 ảnh; (2) quay đoạn đường chính/giao lộ gần nhà và nói rõ tình trạng giao thông (giờ cao điểm kẹt hay thông thoáng); (3) ảnh chụp màn hình bản đồ (Google Maps hoặc ứng dụng bản đồ khác) có ghim căn nhà và các tiện ích, kèm khoảng cách/thời gian di chuyển xem trên app; (4) nói rõ tên từng tiện ích và khoảng cách trong lời dẫn. Ảnh bản đồ dùng cho MG18-MG21 và giữ ghi nguồn của nhà cung cấp bản đồ (Bước 4.5).

#### Bước 1.6: Kiểm định video thô
Thực hiện Gác cổng 2 chặng ở trên; với video trên máy thu thập dữ liệu theo Bước 3.2.

