---
name: orchestrator-100-point-rule
description: "Dự án mới = 3 skill phối hợp (token-saver + smart-dispatcher + orchestrator); tối đa 10 vai agent; chỉ trình 1 bản cuối đạt 100/100, 0 lỗi"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b25c4e92-4071-4e98-8b90-3597b223e625
  modified: 2026-10-26T13:04:59.890Z
---

Dũng giao 26/10/2026: khi xây dựng MỌI dự án mới, 3 skill chạy phối hợp cùng lúc:
- hoang-dung-token-saver (phân hạng S/M/L, gọn token),
- smart-dispatcher-portable (kiểm chứng, có nguồn, bảng CP5),
- hoang-dung-agent-orchestrator = quản lý tổng các agent.

Luật bắt buộc:
- Tối đa 10 vai agent (đội hiện có 9 file trong ~/.claude/agents: dung-soat-yeu-cau, dung-chep-loi, dung-cat-dung, dung-mau, dung-che-dia-chi, dung-am-thanh, dung-chu-mg, dung-render, dung-qa).
- Chỉ gửi Dũng MỘT bản cuối dùng được ngay, sau khi qua mọi cổng và đạt 100/100 điểm, 0 lỗi. Dưới 100 → trả đúng công đoạn sửa, không trình.
- Vận hành theo quy tắc trợ lý (CLAUDE.md global + luật an toàn: không tự xóa/ghi đè/đăng/gửi khi chưa duyệt).

**Why:** Dũng không muốn nhận bản nháp hay bản còn lỗi; từng chấm cách dựng cũ 2/10.
**How to apply:** Mở đầu dự án mới nạp cả 3 skill, gửi sơ đồ phân công (≤10 vai), QA chấm điểm có bằng chứng, chỉ trình khi 100/100. Liên quan [[video-quality-feedback]], [[token-saver-always]].
