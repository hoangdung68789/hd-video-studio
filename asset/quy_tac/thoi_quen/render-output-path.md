---
name: render-output-path
description: "After every render, give only the output folder path in the short \"Thư mục chứa kết quả:\" format — no file table or per-file details"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-19T13:47:45.609Z
---

After any render finishes, end with just the output folder path, in exactly this short form:

**Thư mục chứa kết quả:**
`~\Downloads\whisper-20250625\THUONG-HIEU-MAU\out\`

No table of files, no per-file full paths, no specs (duration/fps/size) unless asked.

**Why:** 2026-10-19, THUONG-HIEU-MAU promo — user first asked for the full folder address after every render, then said only that one-line folder format is wanted, not the detailed listing.

**How to apply:** Closing message of any render turn includes that bolded label + the absolute folder path in a code span. Related: [[always-add-bgm]], [[fisa-kafe-promo]]
