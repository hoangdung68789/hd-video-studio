---
name: token-saver-always
description: Dũng yêu cầu (2026-10-23) luôn áp quy tắc skill hoang-dung-token-saver ở mọi phiên sau để tiết kiệm token
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-22T19:26:28.795Z
---

Luôn áp `hoang-dung-token-saver` cùng mọi việc: dòng đầu phân hạng S/M/L + tóm 3 dòng (Mục tiêu/Đầu vào/Xong); nạp skill chọn lọc; lệnh im lặng (`-loglevel error -nostats`, `| tail`); thử rẻ trước render đắt; lỗi hạ tầng không lặp; kiểm 3 vòng (L: 4–5); giữ `_token-saver/CONTEXT.md` ≤40 dòng, nén khi tới 50% ngữ cảnh; agent 1 nhiệm vụ, brief ≤10 dòng; báo cáo ≤8 dòng.

**Why:** Dũng thấy phiên dài tốn token (phiên dung-text-fx 2026-10-23 rất dài, tường thuật nhiều).

**How to apply:** Khi luật của token-saver ("tự quyết cài gói", "chỉ duyệt bản cuối") xung đột với luật cứng Dũng ghi trong yêu cầu cụ thể (vd dung-video/dung-text-fx: dừng hỏi trước khi cài package, tải file, render bản cuối) thì luật cứng của yêu cầu thắng. Liên quan: [[reply-in-vietnamese]], [[render-output-path]].
