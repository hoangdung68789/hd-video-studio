---
name: parallel-agents-3-round-scoring
description: "Cập nhật 03/11/2026: Sub-Agents chạy đồng thời 100%, kiểm tra chéo & sửa lỗi ngay tại chỗ; bỏ rà 3 vòng cuối, thay bằng Agent Tổng kiểm nhanh tổng thể đạt ≥98/100 là bàn giao ngay kèm giải trình chi tiết"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-03T12:25:00.000Z
---

> **Cập nhật 03/11/2026 (Dũng chốt — thắng luật rà 3 vòng cũ):**
> - **Tất cả tác vụ làm ĐỒNG THỜI & Sửa ngay tại chỗ (In-line Fix):** Cấm đợi làm xong mới rà soát lỗi video rồi mới sửa. Mỗi Sub-Agent tự kiểm và sửa ngay lúc làm theo chuẩn quy trình Editor chuyên nghiệp (không tự bịa, không đoán).
> - **Kiểm tra chéo giữa các Sub-Agents (Peer Cross-Check):** Các Sub-Agents có quyền kiểm tra lỗi của nhau và **yêu cầu sửa ngay trước khi đảm nhiệm công việc của chính Sub-Agent đó**.
> - **Bỏ rà 3 vòng nặng nề ở cuối → Thay bằng Kiểm tra nhanh tổng thể (`≥ 98/100`):** Agent Tổng kiểm tra nhanh tổng thể video (bằng số đo thật + contact sheet tổng hợp) và **bàn giao ngay cho Dũng nếu đạt tối thiểu từ `98/100` trở lên (`≥ 98/100`)**, nói rõ chi tiết cho Dũng; nếu có lỗi thì **chỉ sửa ngay đúng đoạn có lỗi** để khớp toàn bộ video.
> - **Màu/LUT:** Luôn hỏi Dũng 3 lựa chọn (giữ màu gốc / theo video mẫu / gợi ý ≤3 LUT kho) theo quyết định 02/11/2026.

**Why:** Dũng muốn quy trình theo chuẩn mô hình công ty chuyên sản xuất nội dung mạng xã hội chuyên nghiệp, tiết kiệm thời gian, tối ưu hiệu quả, giao đúng 1 bản cuối chất lượng cao dùng ngay.
