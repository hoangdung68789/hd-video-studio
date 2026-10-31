---
name: whisper-mishears-dung
description: "whisper (large-v3) luôn nghe sai câu chữ của Dũng — điểm trừ lớn; chữ lên hình phải được đối chiếu/xác nhận, không tin whisper"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 79db6271-a8f2-477a-a30d-bac9ac760881
  modified: 2026-10-27T14:53:15.582Z
---

Whisper nghe sai lời Dũng rất thường xuyên (DU-AN-MAU, 27/10/2026: "đầy đủ nội thất" → "nơi hất", "phòng ngủ trệt" → "chạch", "hàng xóm" → "hàng sớm", "thiện chí" → "hiển trí", "Kênh Tham Lương" → "kênh thăm lương", "hơn 5 tỷ" → "5 đồng"; đoạn b-roll im lặng thì bịa "đăng ký kênh"). Dũng: "whisper luôn nghe sai câu từ của tôi, đây là 1 điểm trừ lớn".

**Why:** Chữ sai trên màn hình làm mất uy tín video; Dũng phải tự soát lại.
**How to apply:** Chép lời có `initial_prompt` gồm từ vựng BĐS + địa danh của dự án (tên đường, phường, Aeon…), `vad_filter=True`, `condition_on_previous_text=False`; chép lại riêng từng đoạn có tiếng. Mọi chữ nghe không chắc (từ lạ, sai ngữ cảnh, con số) → lập bảng "whisper nghe → sửa thành" và hỏi Dũng MỘT lần trước khi lên chữ; không đưa chữ chưa xác nhận lên hình. Liên quan [[cut-fillers-stumbles]], [[bds-video-edit-rules]].
