---
name: mg-broll-classified-sfx
description: "Dũng 29/10/2026 — MG/b-roll minh họa lời; SFX phân loại, không cấm âm; chữ + số chạy có SFX, hình minh họa không; nói hết câu mới cắt; chữ cao vừa, không che mặt"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 19491696-bb77-4744-b33b-6799fbcc6881
  modified: 2026-10-29T17:03:34.667Z
---

Từ 29/10/2026, mọi lần dựng:
- Minh họa lời nói bằng motion graphics + b-roll kèm animation (vd. mặt bằng vẽ nét khi nói diện tích, thước quét mặt đường khi nói "đường 7m", bản đồ khi nói vị trí, giá số chạy lên).
- SFX: đánh giá điểm quan trọng của từng câu (ý định L1–L12, bậc T1–T3 theo dung-text-fx 08-sfx.md), dùng SFX đã phân loại đúng mục tiêu từng trường hợp (sfx_plan.py), không spam 1 khuôn. KHÔNG còn luật cấm âm nào (Dũng 29/10 gỡ toàn bộ, kể cả cấm nghĩa đen 26/10).
- KHÔNG dùng họ SFX `Sine/` (SINE RISE/FALL…) ở mọi video về sau, trừ khi Dũng yêu cầu (Dũng 29/10: không hợp phong cách) — thay bằng âm cùng vai, vd swish mềm `Swipe & Swish/`. Cơ chế: `SFX_EXCLUDE = ["Sine/"]` trong project.py.
- Gắn SFX theo loại animation: chữ hiệu ứng (kể cả nhãn phòng) + số chạy (giá) CÓ SFX; animation hình minh họa (MG mặt bằng, thước, bản đồ) KHÔNG SFX trừ khi Dũng yêu cầu.
- Nhịp cắt: người dẫn nói HẾT câu rồi mới chuyển cảnh (mờ chuyển bắt đầu sau từ cuối ≥0,1s; build.py có cổng kiểm). Chữ theo lời đặt cao vừa phải (phụ đề đáy 600/1920, chữ nhấn ~540), trong vùng an toàn, không che mặt.
- Chữ: không đơn giản; dùng mẫu viral có nguồn trong asset/phong_cach (xếp tầng trái, slam phóng to–nhòe, đánh máy, giá số chạy) + câu hỏi nhử giữa khung làm điểm giữ chân; chữ vẫn chỉ lấy từ lời.
- Bố cục BĐS: sau mỗi cảnh thoại là 3 cảnh nhà ~4,7–5s rồi mới tới thoại kế tiếp.

**Why:** DU-AN-MAU Bình Thành v1 bị chê: SFX spam một vòng swish, chữ quá đơn giản, thiếu giữ chân, cảnh nhà quá ít giữa các đoạn thoại.
**How to apply:** Bản script đầy đủ (né mặt face_zones.py, SFX_INTENT, MG, kiểu chữ s/m/g/p/q + màu biến CSS, nhãn phòng, cổng nhịp cắt) đã chép vào template `_TEMPLATE_BDS_Review_2phut` (Dũng duyệt 30/10; bản cũ sao lưu `Videos\_backup\TEMPLATE_BDS_20261030`). README/LOI_CAN_TRANH template đã rút gọn. Bộ màu: `asset/phong_cach/mau_chu/bang_mau.json`. Liên quan [[bds-video-edit-rules]], [[mg-sample-before-build]], [[finish-fast-lean-docs]].
