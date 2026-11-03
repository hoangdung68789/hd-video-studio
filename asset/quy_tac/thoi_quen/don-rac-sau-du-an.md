---
name: don-rac-sau-du-an
description: "Xong mỗi dự án → liệt kê file rác (temp render, cache, profile Chrome, preview/draft) kèm dung lượng, chờ Dũng duyệt rồi mới dọn"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-02T14:29:56.605Z
---

Sau khi xong mỗi dự án, dọn sạch file rác không còn dùng, nhưng **phải đưa danh sách cho Dũng trước khi xóa** (đường dẫn + dung lượng + là gì), xóa sau khi Dũng đồng ý. Thay phần "tự xóa" trong [[delete-preview-after-final]].

Chỗ rác hay phình (đo 02/11/2026): `%LOCALAPPDATA%\Temp\hf-render-*` (khung hình thô HyperFrames, 1 lượt dừng giữa chừng để lại 176 GB), `Temp\puppeteer_dev_chrome_profile-*` (~47 thư mục), `Temp\hyperframes-extract-cache-u`, `Temp\claude\<dự án>` (scratchpad), preview/draft/master trong `HDRE AI\Videos\<dự án>`.

**Why:** 02/11/2026 ổ C còn 45 GB vì rác render; Dũng lỡ xóa nhầm cả thư mục dự án DU-AN-MAU khi tự dọn, mất phần làm sau 2h sáng.
**How to apply:** cuối dự án lập bảng rác → hỏi 1 câu → xóa → đo lại ổ C. Trước khi xóa kiểm tra không có tiến trình render nào đang dùng; không bao giờ đụng file nguồn, edl, edit-state, bản cuối.
