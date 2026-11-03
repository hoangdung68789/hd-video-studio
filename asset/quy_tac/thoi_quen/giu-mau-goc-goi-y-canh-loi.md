---
name: giu-mau-goc-goi-y-canh-loi
description: "01/11: footage đã có màu thì không chỉnh; AI chỉ gợi ý cảnh ám màu/quá tối/quá sáng có dẫn chứng; chỉ footage phẳng mới chọn LUT"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-01T15:55:42.702Z
---

Dũng chốt 01/11/2026: nếu video gốc đã có màu thì không chỉnh sửa. AI chỉ gợi ý những cảnh bị ám màu quá mạnh, quá tối hoặc quá sáng, có dẫn chứng; Dũng đồng ý mới sửa.

**Why:** Các lớp chỉnh màu tự động trước đây làm hỏng da và mất nhiều vòng sửa.

**How to apply:** Theo `dung-video/references/chon-lut.md`. Nhãn `bt709` không phân biệt được D-Log, phải đo SATAVG + xem khung. Footage phẳng mới dùng [[lut-tu-kho-nguyen-ban]]. Thay [[dji-dlog-official-lut]] và công thức ở [[freshluts-lut-library]].
