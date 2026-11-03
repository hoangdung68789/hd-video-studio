---
name: music-level-climax
description: "Mức nhạc nền Dũng duyệt cho video BĐS tour: lời thoại ~−28 LUFS, đoạn chỉ cảnh/nhạc ~−11 LUFS cho đủ cao trào; SFX thấp hơn giọng 1–6 dB"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-01T16:25:00.313Z
---

Video BĐS có lời dẫn (DU-AN-MAU, ngày 25/10/2026):
- Lúc đầu Dũng muốn nhạc "nhỏ vừa đủ nghe, chỉ tăng khi vào cảnh quay". Bản −26/−15 LUFS bị chê "nhạc quá nhỏ, không đủ cao trào".
- Mức chốt: khi Dũng nói, nhạc khoảng **−28 LUFS** (giọng −14). Đoạn chỉ có cảnh và nhạc (teaser, cao trào, bản đồ), nhạc khoảng **−11 LUFS**. Nhạc lên lại trong khoảng 0,6s. Mức này thay cho ghi chú cũ "nhạc thấp hơn giọng ~3 dB" trong [[bds-video-edit-rules]].
- SFX: lấy theo bàn giao ngày 24/10 và `dung-text-fx` 08-sfx, tức là rõ nhưng thấp hơn giọng 1–6 dB. Luật R-L020 ghi "≥12 dB" là cũ hơn. Vẫn giữ SFX thưa: chỉ ở chuyển cảnh lớn và điểm nhấn giá, pháp lý.
- Video tour được phép dài khoảng 1:55 khi Dũng muốn mỗi không gian có 2 cảnh. Quy định 60–90s trong preferences của tài khoản <TAI_KHOAN> nhường cho yêu cầu cụ thể này.

- 27/10/2026 (DU-AN-MAU, mới nhất — thay mức −28 khi nói): Dũng "muốn nhạc lên cao trào khi chuyển cảnh quay không người dẫn, giảm nhỏ nhạc vừa phải khi có người dẫn để nghe rõ tiếng nói". Đang dùng: cú drop của bài canh đúng điểm chuyển sang cảnh không người dẫn, lặp đoạn dâng + cao trào theo ô nhịp; cảnh không người −11 LUFS, lúc nói −22 LUFS (giọng −14). Chờ Dũng nghe duyệt mức −22. SFX phải hợp nhạc nền + lời: giữ âm theo phân loại, dịch cao độ âm có tông về hợp âm chủ của bài (`dv_sfx_key.py`).

- 01/11/2026: mức nhạc không còn tính điểm trong `sfx_audit`, chỉ báo số đo; đo `ebur128` từng đoạn ở cổng G5.

**Why:** Dũng cảm nhận theo độ cuốn trên điện thoại. Nhạc nhỏ ở đoạn chỉ cảnh làm teaser và cao trào bị hụt.

**How to apply:** `mix.py <bgm> -28 -11`, làn âm lượng nhạc theo đoạn lời (plan.seg). Đo ebur128 từng đoạn trước khi render. Liên quan [[always-add-bgm]], [[<TAI_KHOAN>-account-data]].
