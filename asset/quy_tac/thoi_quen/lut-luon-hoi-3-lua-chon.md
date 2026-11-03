---
name: lut-luon-hoi-3-lua-chon
description: "02/11: màu/LUT luôn hỏi Dũng 3 lựa chọn — giữ màu gốc / tạo theo video mẫu / dùng tài nguyên có sẵn và gợi ý; không tự chọn LUT"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-02T14:23:02.021Z
---

Dũng chốt 02/11/2026: LUT màu luôn hỏi Dũng, 3 lựa chọn: (1) giữ màu gốc, (2) tạo theo video mẫu, (3) sử dụng tài nguyên có sẵn và gợi ý cho Dũng.

**Why:** Các lần AI tự chọn/tự chỉnh màu làm hỏng da và tốn vòng sửa ([[lut-tu-kho-nguyen-ban]], [[giu-mau-goc-goi-y-canh-loi]]).

**How to apply:** Hỏi ở giai đoạn 0, gộp câu hỏi chung, kèm số đo footage (phẳng hay đã có màu). Lựa chọn 1 dùng cách lọc cảnh lỗi ở `dung-video/references/chon-lut.md`; 2 đo signalstats mẫu; 3 gửi ảnh so tối đa 3 LUT gốc đẹp nhất từ kho ([[freshluts-lut-library]]) để Dũng chọn — ưu tiên trắng sáng tự nhiên, không quá tối, không loang/ám màu nặng (Dũng giảm từ ~6 xuống 3, 02/11). Không ai trả lời → giữ gốc. Đã ghi vào `dung-video/workflow/03-mau.md`, SKILL.md, rules/00-quyet-dinh và `~/.claude/CLAUDE.md`. Thay [[giu-mau-goc-goi-y-canh-loi]] ở chỗ "đã có màu thì tự giữ".
