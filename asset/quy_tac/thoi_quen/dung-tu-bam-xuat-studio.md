---
name: dung-tu-bam-xuat-studio
description: "03/11/2026: Dũng tự xuất video thủ công trên Studio; AI không tự chạy render, chỉ hỗ trợ phần còn lại sau khi Dũng xác nhận và bấm nút render"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-03T09:00:48.802Z
---

Dũng tự xuất video bằng tay ngay trên Studio. Sau khi Dũng xác nhận và bấm nút render thì AI mới hỗ trợ phần còn lại.

**Why:** Dũng ghi rõ trong yêu cầu 03/11/2026, và đã từ chối khi AI định chạy hàng loạt render thử. Máy từng bị quá tải CPU/GPU.

**How to apply:** Không tự chạy render, kể cả render thử, nếu Dũng không yêu cầu. Sửa lỗi render thì kiểm bằng test đơn vị hoặc đồ thị bộ lọc ngắn, rồi để Dũng bấm xuất. Liên quan [[hd-studio-dang-tat]], [[no-preview-qa-then-final]].
