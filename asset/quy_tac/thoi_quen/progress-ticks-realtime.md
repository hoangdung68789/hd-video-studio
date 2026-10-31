---
name: progress-ticks-realtime
description: Tích tiến độ phải cập nhật ngay khi xong từng bước và báo 1 dòng; không dồn tích đến cuối lượt
metadata:
  node_type: memory
  type: feedback
  originSessionId: 18c63b28-1f3a-4f78-aa16-6ae8fc34c370
  modified: 2026-10-30T11:39:56.780Z
---

Xong bước nào phải tích bước đó ngay (update_plan advance đi cùng lệnh mở bước sau) và báo Dũng 1 dòng kết quả có số/file. Việc dài chia bước nhỏ theo từng video hoặc kết quả nhìn thấy được, không gom thành bước lớn. Cuối lượt luôn có câu báo xong.

**Why:** 30/10/2026 Dũng phản ánh tích quá chậm, đã xong mà không có phản hồi nên không theo dõi được. Nguyên nhân: Claude lập danh sách một lần rồi không tích giữa chừng, tất cả chỉ được tích ở cuối lượt.
**How to apply:** mọi việc có danh sách tiến độ, gồm cả lúc chờ tác vụ nền: tác vụ nền xong thì tích và báo ngay ở lượt đó.
