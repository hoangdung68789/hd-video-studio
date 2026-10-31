# Preset

Tự nhận preset ở giai đoạn 1 (chế độ A: AI tự phân loại, ghi lý do + bằng chứng; chế độ T: theo thể loại của template Dũng chọn). Chỉ hỏi Dũng 1 câu khi footage thuộc 2 thể loại ngang nhau và công cụ khác nhau. Giai đoạn 0, 6, 7 giống mọi preset (sổ tự học + orchestrator; audio-gate; QA/render).

| Giai đoạn | bds | promo | talking | explainer | music |
|---|---|---|---|---|---|
| Nhận diện | quay nhà, có người dẫn, có giá/diện tích | sản phẩm/dịch vụ, có URL hoặc brief | 1 người nói vào camera | không có footage người, chỉ nội dung | Dũng đưa bài nhạc làm trục |
| 1 Brief | ffprobe; hoang-dung-viral-style-scout nếu có mẫu | product-launch-video (brief) | ffprobe | faceless-explainer (brief) | music-to-video (beat) |
| 2 Cắt | video-use | video-use | talking-head-recut | — | video-use, cắt theo beat |
| 3 Màu | AI đo rồi chọn (LUT DJI V1.0 chỉ khi đo ra D-Log) + từng clip | video-use grade | AI đo rồi chọn (LUT DJI chỉ khi D-Log) | — | video-use grade |
| 4 Mốc | hook, giá, diện tích, kết cấu, vị trí, CTA lời thoại | hook, tính năng, CTA lời thoại | chuyển ý, số liệu | từng ý chính | điểm rơi nhạc |
| 5 Chữ/MG | embedded-captions + motion-graphics + hyperframes-keyframes + C | motion-graphics + hyperframes-registry | talking-head-recut overlay + embedded-captions | faceless-explainer + hyperframes-animation | music-to-video + motion-graphics |
| 3D | Không bắt buộc; AI tự quyết khi nội dung cần (mặt bằng, ranh đất, kết cấu) hoặc Dũng chỉ định | AI tự quyết | AI tự quyết | AI tự quyết | AI tự quyết |

Thể loại không khớp 5 cột trên → AI tự lập cột mới (nhận diện + công cụ từng giai đoạn) từ `routing.md`, ghi vào edit-state, không hỏi Dũng.

## bds — mặc định cho Dũng
- Khung giữ nguyên gốc (thường 9:16), vùng an toàn TikTok.
- Font Be Vietnam Pro, không khung/nền sau chữ, không lặp chữ, chữ không che chi tiết nhà, màu chữ tương phản với nền.
- Hook mạnh lấy từ lời thoại; cắt tiếng ho; shot dài; giọng không cắt vụn.
- MG chỉ minh họa thông tin Dũng cung cấp (giá, địa chỉ, diện tích, kết cấu, hotline).
- Tên người dẫn lấy từ video/phụ đề, không mặc định tên Dũng.
- Logo chỉ chèn khi Dũng yêu cầu (góc trên phải); cảnh CTA không chèn logo/tên thương hiệu.
- Chuyển cảnh + B-roll + MG + text effect + SFX bắt buộc, đa dạng loại.
