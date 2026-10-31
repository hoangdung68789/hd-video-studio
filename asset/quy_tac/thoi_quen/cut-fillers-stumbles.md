---
name: cut-fillers-stumbles
description: "Dũng chê cắt lặng/vấp/à ừm chưa sạch (dự án sổ hồng 2026-10-23) – phải dò âm đệm, vấp, lặp từ bằng năng lượng + chép lời có gợi ý âm đệm, không chỉ dựa whisper"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 43fd2eed-0651-4bfa-878d-b2e0f06cd240
  modified: 2026-10-23T16:01:38.316Z
---

Video "cách xem sổ hồng" được khen tuyệt nhưng điểm trừ lớn: còn khoảng lặng, chỗ nói vấp, âm đệm "à, ừm, ừ, ờ", lặp từ ("thì thì", "nó nó").

**Why:** whisper thường bỏ qua âm đệm và mốc từ bị trôi, nên cắt chỉ theo whisper + silencedetect −38dB/0.5s là chưa đủ.
**How to apply:** sau khi cắt sơ bộ, chép lời lại CHÍNH bản giọng đã nối (initial_prompt có "ừm, à, ờ, ừ" để whisper ghi cả âm đệm), dò: (1) đoạn có năng lượng mà không thuộc từ nào = âm đệm; (2) từ lặp liền nhau / câu nói lại = vấp, giữ lần nói sau; (3) lặng > 0.25s rút còn ~0.15–0.2s. Nghe lại từng điểm cắt (điểm cắt ở đáy năng lượng, fade 20–30ms). Liệt kê danh sách cắt có timecode cho Dũng.
Công cụ đã làm: `Videos/cach-xem-so-hong/scripts/transcribe_fill.py` (chép lời gợi ý âm đệm) + `clean_cuts.py` (dò lặng > 0.25s, âm đệm à/á/ừm/ờ, “thì” đầu câu sau chỗ nghỉ, lặp từ, tiếng ngoài lời > 0.22s → work/cut_report.md + seg_clean.json). Âm đệm hay gặp của Dũng: “á” cuối cụm (“điểm đầu tiên á”), “Thì” mở câu, kéo dài “là…”. Sửa SEG thì phải dời lại phụ đề/MG theo G().
Dự án sổ hồng giữ nguyên (Dũng không muốn áp lại) — quy tắc này áp từ video sau, ngay ở bước cắt dựng (GĐ2), trước khi gắn chữ/MG. Related: [[bds-grade-pacing-feedback]], [[talking-head-script-style]]
