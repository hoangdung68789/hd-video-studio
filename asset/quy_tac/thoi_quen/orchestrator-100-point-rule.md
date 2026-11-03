---
name: orchestrator-100-point-rule
description: "Cập nhật 03/11/2026: Mô hình Công ty Sản xuất Nội dung MXH — tối đa 50 Sub-Agents (vừa đủ theo dự án, không tạo dư), kiểm chéo & sửa ngay tại chỗ, Agent Tổng kiểm nhanh tổng thể đạt ≥98/100 là bàn giao ngay kèm chi tiết, loại bỏ Sub-Agent hỏng việc >2 lần"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-03T12:25:00.000Z
---

> **Cập nhật 03/11/2026 (Dũng chốt — thắng mọi quy tắc cũ):**
> 1. **Mô hình Công ty Sản xuất Nội dung Chuyên nghiệp trên MXH:** `dung-video` luôn đi cùng `hoang-dung-agent-orchestrator` (Agent Tổng — Giám đốc Sản xuất).
> 2. **Quy mô tối đa 50 Sub-Agents (Không tạo dư):** Agent Tổng có thể tạo ra **tối đa 50 nhân viên Sub-Agents** nếu cần thiết và chủ động phân chia nhiệm vụ riêng cho mỗi Sub-Agent. Dựa theo dự án, chỉ tạo **đủ số lượng Sub-Agents cần thiết (không tạo dư)**.
> 3. **Đồng thời 100%, Kiểm tra chéo & Sửa ngay tại chỗ:** Tất cả các tác vụ chạy đồng thời. Các Sub-Agents có quyền **kiểm tra lỗi của nhau và yêu cầu sửa ngay trước khi đảm nhiệm công việc của chính Sub-Agent đó**. Cấm đợi làm xong mới rà soát lỗi rồi mới sửa.
> 4. **Kiểm tra nhanh tổng thể `≥ 98/100` & Sửa cục bộ tức thì:** Agent Tổng kiểm tra nhanh tổng thể video và **bàn giao ngay bản cuối cho Dũng nếu điểm đạt tối thiểu từ `98/100` trở lên (`≥ 98/100`)**, đồng thời **nói rõ chi tiết cho Dũng**. Nếu có lỗi, **chỉ sửa ngay đúng đoạn có lỗi** để khớp toàn bộ video mà không tốn thời gian làm lại từ đầu (thay cho ngưỡng cứng 100/100 cũ).
> 5. **Đánh giá & Loại bỏ Sub-Agents (`> 2 lần lỗi`):** Sau mỗi dự án, Agent Tổng đánh giá giữ lại (`RETAINED` trong `agent-roster.json`) các Sub-Agents hoàn thành tốt nhiệm vụ; các Sub-Agents **làm hỏng việc trên 2 lần (`> 2 lần lỗi`)** thì bị Agent Tổng **loại bỏ ngay lập tức (`TERMINATED`)**.

**Why:** Khâu kiểm tra cũ (đợi làm xong mới rà 3 vòng, ép 100/100 cứng nhắc, cấm agent nhắc lỗi nhau) mất quá nhiều thời gian và để lỗi dây chuyền từ các sub-agents hỗ trợ.
**How to apply:** Áp dụng đồng bộ trong `dung-video/SKILL.md`, `dung-video/rules/luat-cung.md`, `dung-video/rules/dieu-phoi.md`, `hoang-dung-agent-orchestrator/SKILL.md` và toàn bộ `~/.claude/agents/dung-*.md`.
