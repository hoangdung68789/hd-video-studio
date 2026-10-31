# Bộ quy tắc chữ hiệu ứng (text-fx)

Mục đích: chữ ở khoảnh khắc quan trọng phải **bắt mắt, có điểm nhấn, có kỷ luật** — không nhàm, không rối, không che nhà.
Áp dụng ở giai đoạn 4 (đánh dấu mốc) và giai đoạn 5 (chữ/MG) của `dung-video`.

## Thứ tự đọc (nạp dần, chỉ đọc file cần)
| File | Đọc khi |
|---|---|
| `01-quy-tac-thep.md` | LUÔN đọc đầu giai đoạn 4–5. Không được vi phạm. |
| `02-phan-loai-truong-hop.md` | Quyết định mốc này thuộc bậc chữ nào (T0–T3) và dùng nhóm hiệu ứng nào |
| `03-thoi-diem-su-dung.md` | Canh thời điểm, thời lượng, mật độ, đồng bộ lời + SFX |
| `04-quy-trinh.md` | Làm từng bước từ mốc → chữ → QA |
| `05-thu-vien-hieu-ung.md` | Chọn hiệu ứng cụ thể + công cụ thực thi + lỗi tiếng Việt |

## Nguồn của bộ quy tắc (nói thật về độ tin cậy)
- **Trang Envato "text presets – After Effects"** (đã đọc 2026-10-23): trang liệt kê ~46 gói preset chữ (nhiều gói 20–200 preset, có điều khiển chỉnh được). Trang chỉ cho **tên gói và nhãn**, không mô tả kỹ thuật từng preset. Chỉ rút ra được: các họ phổ biến là glitch, RGB split, offset, đường line, reveal mượt có blur, nhịp scale; công dụng là mạng xã hội, opener, promo, title. Các gói là template trả phí, **không chép nội dung**.
- Danh mục kỹ thuật chữ phổ biến (reveal blur/màu, chấm → chữ, viết tay bằng stroke, xoay 3D, extrude, reveal theo shape, chữ texture, rung, lỏng/sóng, đổ bóng) lấy từ bài kinetic typography công khai.
- Phần công thức chạy được lấy từ thư viện **đã cài trên máy Dũng**: `hyperframes-animation/rules/*`, `adapters/animate-text.md` (24 hiệu ứng có tên), `embedded-captions/CATALOG.md`, `motion-graphics`.
- Phần luật BĐS (vùng an toàn, không khung nền, Be Vietnam Pro, chữ chỉ từ lời thoại…) lấy từ memory của Dũng.
- Mức mật độ, thời lượng, tỷ lệ trong các file là **mặc định đề xuất**; Dũng chấm lại sau mỗi video rồi vòng tự học của `hoang-dung-auto-style-learner` ghi nhận.
