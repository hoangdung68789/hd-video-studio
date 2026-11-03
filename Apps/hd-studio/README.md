# HD Studio

Trình dựng video tiếng Việt HD Studio cho các dự án trong `HDRE AI\Videos`. Máy xem trước và máy xuất dùng lõi mã nguồn HyperFrames `0.8.171`.

Tracking cần OpenCV trong `HDRE AI\venv`: `venv\Scripts\python -m pip install "opencv-python-headless<5"`.

- Mở: bấm đúp `Mo Studio.bat`, hoặc AI gọi `preview_start {name: "hd-studio"}`.
- Địa chỉ: `http://localhost:4700/?du-an=<tên thư mục dự án>`.
- Kiểm thử: `node --test test/html.test.mjs`.

| File | Vai trò |
|---|---|
| `lib/html.mjs` | Đọc và sửa `hf/index.html` |
| `server.mjs` | API, xem trước, xuất video, lịch sử hoàn tác |
| `public/` | Giao diện |
| `.du-lieu/` | Lịch sử hoàn tác và ảnh nhỏ, xóa được |

File Studio ghi trong mỗi dự án: `hf/index.html`, `studio_chinh_sua.jsonl`, `studio_ghi_chu.json`.
