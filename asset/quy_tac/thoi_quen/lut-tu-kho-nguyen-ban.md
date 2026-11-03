---
name: lut-tu-kho-nguyen-ban
description: "31/10: màu lấy từ kho LUT freshluts, thử LUT gốc không chỉnh thêm, không mặc định LUT DJI; Dũng chọn Cinematic [1571]; Interview + WB trung tính làm người dẫn trông như phim kinh dị"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-03T06:34:41.904Z
---

31/10/2026 (video DU-AN-MAU): Dũng chê mọi bản đã tinh chỉnh (DJI + Interview 75% + WB trung tính; rồi thêm chỉnh riêng vùng da): da trắng bệch, môi tím, "như phim kinh dị". Dũng yêu cầu không mặc định LUT DJI, dùng kho LUT của Dũng, thử LUT GỐC; ổn thì không chỉnh thêm. Dũng chọn **Cinematic [1571]** (`02_TAT CA THEO CAMERA/06_Canon C-Log2/4_Dien anh - Blockbuster`) áp thẳng lên footage Pocket 4 D-Log.

**Cập nhật 03/11/2026:** quy tắc màu 6 tầng thay phần "dùng nguyên bản": Creative LUT trộn mặc định 55% (khung 40–65%) qua `color_engine.py`, LUT kỹ thuật D-Log áp 100%. Lý do dưới đây vẫn giữ: không tự thêm chỉnh sáng/WB khi chưa có số đo cần; da người dẫn là thứ xem đầu tiên.

**Why:** Mỗi lớp chỉnh tự động của AI làm mất sắc da; Dũng đánh giá bằng mắt người dẫn trước tiên.

**How to apply:** Từ 01/11 chỉ áp dụng cho footage phẳng ([[giu-mau-goc-goi-y-canh-loi]]). Giai đoạn 3: quét kho (`Downloads\freshluts-LUT-phan-loai_DAY-DU.zip`, script mẫu chấm da + tường + phơi sáng), gửi ảnh so tối đa 3 LUT gốc trên cảnh người dẫn và cảnh nhà để Dũng chọn trước khi dựng; dùng nguyên bản, không tự thêm WB/gamma/chỉnh da. Thay cho công thức mặc định ở [[freshluts-lut-library]] và [[dji-dlog-official-lut]].
