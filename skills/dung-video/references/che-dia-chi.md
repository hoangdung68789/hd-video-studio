# Giai đoạn 2b — Che địa chỉ (chi tiết)

**2b. Che địa chỉ (tự động, mọi video, không cần Dũng nhắc)** (agent Dựng)
- Quét bản dựng sau giai đoạn 2: trích khung mỗi 0,5s + mọi điểm cắt, tìm số nhà, biển số nhà, bảng tên đường/hẻm, biển số xe, giấy tờ có địa chỉ.
- Mỗi vùng phát hiện: ghi `timecode bắt đầu–kết thúc + khung (x,y,w,h)`; cảnh có chuyển động → bám vùng theo từng khung (tracking), nới khung 15–20% để không lộ mép.
- Che bằng làm mờ: `crop` → `boxblur` (đủ mạnh để không đọc được) → `overlay` đúng chỗ. Không che mặt người dẫn, không che chi tiết đẹp của nhà ngoài vùng cần che.
- Không chắc một vùng có phải số nhà/địa chỉ → vẫn che, ghi vào báo cáo.
- Nộp: bảng `timecode → vùng → loại thông tin → cách che` + ảnh trước/sau 1 khung mỗi vùng; ghi `stages.2b` vào edit-state.

