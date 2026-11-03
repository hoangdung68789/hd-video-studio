# Giai đoạn 7 (Pha 2) — Kiểm tra Nhanh Tổng thể (`≥ 98/100`), Vá Cục bộ & Xuất Bản Cuối

Phụ trách: **Agent Tổng (`hoang-dung-agent-orchestrator`)** phối hợp cùng **Tổ QA Nhanh (`dung-qa`)** và **Tổ Render (`dung-render`)**.
Luật theo agent: `rules/luat-theo-agent.md` & `rules/dieu-phoi.md`.

## 1. Kiểm tra Nhanh Tổng thể bởi Agent Tổng (Quick Holistic Executive Audit — Bỏ rà 3 vòng nặng nề)
Nhờ các Sub-Agents đã **tự sửa ngay tại chỗ** và **kiểm tra chéo lỗi của nhau** trong suốt Pha 1, ở Pha 2 Agent Tổng chỉ thực hiện **1 lượt Kiểm tra Nhanh Tổng thể**:
1. **Kiểm nhanh bằng số đo thật & Contact Sheet tổng thể:**
   - Gộp các khung điểm cắt + các mốc chữ hook thành **1–2 tấm Contact Sheet tổng hợp** (thay vì mở lẻ tẻ hàng trăm ảnh hoặc rà đi rà lại 3 vòng).
   - Đối chiếu nhanh với bảng `chữ ↔ nguồn`, danh sách cắt, bảng vùng che địa chỉ và bảng số đo âm thanh (`ebur128`, `sfx_audit`).
   - Kiểm nhanh chế độ **có tiếng** và **tắt tiếng**: cốt truyện mạch lạc, phụ đề rõ, nhạc bắt tai không át lời.
2. **Chấm điểm Tổng thể Dự án (Thang 100 điểm — Ngưỡng bàn giao `≥ 98/100`):**
   - **Cắt dựng & Nhịp (25đ):** Nói hết câu mới cắt, không vấp/lặng thừa, B-roll khớp lời không lặp.
   - **Chữ, MG & Bản đồ (25đ):** 100% có nguồn, phụ đề/nhãn không SFX, chữ hook đủ 3 pha (`Entrance Ease-Out → Hold ≥1.5s → Exit Ease-In/Cut-out`), đúng tên hiệu ứng phổ biến, không che mặt, tương phản tốt.
   - **Âm thanh, Nhạc & SFX (25đ):** Giọng `≈ -14 LUFS`, BGM bắt tai `-18…-22 LUFS`, SFX chữ hook chạm đúng khung `±2f`, `true peak ≤ -1 dBTP`.
   - **Màu sắc, Bảo mật & Kỹ thuật xuất (25đ):** Màu đúng lựa chọn của Dũng, **0 khung lộ địa chỉ**, đúng 1 file 9:16 H.265 60fps không watermark lạ.

**Thứ tự cố định:** kiểm nhanh trên timeline đã ghép (G7) → đạt thì render 1 lần → `ffprobe` file thật (G6) → bàn giao. Phần "Kỹ thuật xuất" chấm dự kiến ở G7, xác nhận ở G6; G6 sai thì xuất lại, không chấm lại phần khác.

## 2. Quyết định Bàn giao (`≥ 98/100`) hoặc Vá Lỗi Cục Bộ Tức Thì (`< 98/100`)
- **Trường hợp ĐẠT (`Tổng điểm ≥ 98/100` và 0 lỗi cấm):**
  - **Render rồi bàn giao ngay bản cuối cho Dũng** mà không bắt làm lại vì 1–2 điểm sai số vi mô.
  - **Nói rõ chi tiết cho Dũng:** Trình bày rõ tổng điểm (`98/100`, `99/100` hoặc `100/100`), chi tiết điểm từng phần, nói rõ chi tiết nào đạt xuất sắc và chi tiết nhỏ nào bị trừ 1–2 điểm (nếu có).
- **Trường hợp CẦN VÁ LỖI (`< 98/100` hoặc có đoạn bị lỗi):**
  - **Chỉ sửa ngay đúng đoạn có lỗi (Surgical Segment Patch):** Khoanh vùng chính xác `timecode / segment_id` hoặc lớp bị lỗi, giao đúng Sub-Agent phụ trách sửa ngay đoạn đó rồi ghép khớp vào toàn bộ video.
  - **CẤM làm lại từ đầu những đoạn đã chuẩn**, tránh tốn thời gian. Vá trên timeline trước khi xuất, nên chưa phải nối file.

## 3. Render Bản Cuối Duy Nhất
- Render **1 lần** ra bản cuối chất lượng thương mại dùng ngay: **9:16, H.265 (`libx265`), 60fps**, có nhạc nền đầy đủ.
- Lưu vào `<HD_VIDEO_HOME>\Videos`.
- Kiểm nhanh file xuất bằng `ffprobe` (đúng khung, fps, thời lượng, luồng âm thanh, phát hết).

## 4. Đánh giá Nhân sự Sub-Agents sau Dự án (`agent-roster.json`)
- Ngay sau khi xuất bản cuối, Agent Tổng đánh giá toàn bộ Sub-Agents đã tham gia dự án:
  - Hoàn thành tốt (`≤ 2 lần lỗi`) → **`GIỮ LẠI (RETAINED)`** cho dự án sau.
  - Làm hỏng việc **trên 2 lần (`> 2 lần lỗi`)** → **`LOẠI BỎ (TERMINATED)`**.

Cổng: G6, G7 (`rules/cong-chat-luong.md`).
