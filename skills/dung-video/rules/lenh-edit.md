# 4 lệnh edit nhanh
Làm trên dự án có sẵn trong `HDRE AI\Videos`, mức M của `rules/dieu-phoi.md`. Không chạy lại cả quy trình /video, không hỏi template, không đụng màu.

## Luồng chung của /dung-mg, /dung-motion, /dung-animation
1. Xác định dự án và thời điểm. Thiếu hoặc không chắc → đọc `Videos/`, `work/`, transcript để xác minh; vẫn không chắc thì hỏi 1 câu có lựa chọn. Chỉ làm đúng thứ được yêu cầu.
2. HD Studio đang tắt, không mở. Đọc `studio_chinh_sua.jsonl` và `studio_ghi_chu.json` nếu có. Sửa thẳng `hf/index.html`, không chạy `build.py`. Cần xem thì dùng HyperFrames Studio.
3. Dựng theo `references/motion.md` và luật 9, 16, 17, 18 ở `rules/luat-cung.md`: hiện đúng câu thoại nói tới nó, không che mặt, không rung, tween trên timeline GSAP có giây cụ thể, mỗi khối là một clip riêng trên timeline (mẫu ở `templates/khoi-timeline.html`).
4. Kiểm: `hyperframes check` hoặc tua HyperFrames Studio tới mốc, chụp đầu/giữa/cuối khối, mở ảnh xem bằng mắt, kiểm clip có trên lớp timeline.
5. Báo tối đa 5 dòng: đã thêm gì, ở giây nào, id clip, ảnh đã kiểm. Không xuất video trừ khi Dũng yêu cầu; khi xuất làm theo `workflow/07-qa-render.md`.

## Khác nhau giữa 3 lệnh
| Lệnh | Dùng khi | Công cụ chính | SFX |
|---|---|---|---|
| `/dung-mg` | Đồ họa truyền thông tin: thẻ giá, số chạy, biểu đồ, bản đồ, tiêu đề động, nhãn | `motion-graphics`; bản đồ theo `references/ban-do.md` | Chữ hook và số chạy (T2–T3) có SFX theo luật 7 |
| `/dung-motion` | Sửa cách chuyển động: chuyển cảnh, easing, nhịp, thứ tự vào ra của khối đã có. Zoom, Ken Burns là camera giả: mặc định tắt, phải hỏi Dũng trước; không lắc khung (luật 9) | `motion-design`, `hyperframes-keyframes` | Không thêm, trừ khi Dũng yêu cầu |
| `/dung-animation` | Hình minh họa chuyển động theo lời: mặt bằng, thước đo, icon, vẽ nét SVG, dotLottie có tệp nguồn | `hyperframes-animation`, `gsap-core`, `gsap-timeline` | Không có, trừ khi Dũng yêu cầu |

Không dùng công cụ tốn credit (Higgsfield) trừ khi Dũng yêu cầu rõ.

## /dung-studio [tên dự án]
0. HD Studio đang tắt từ 03/11/2026. Dũng gõ lệnh này là yêu cầu bật lại: làm theo `Apps\hd-studio\.du-lieu\tat-studio-03-11\BAT_LAI.md` trước. Lệnh khác không được tự bật.
1. `http://localhost:4700/` đang trả lời → dùng luôn Studio đó, không mở server thứ hai. Không trả lời → `preview_start {name: "hd-studio"}` từ `<HD_VIDEO_HOME>`, lấy cổng nó trả về.
2. Có tên → `navigate` tới `http://localhost:<cổng>/?du-an=<tên>`. Tên không khớp thư mục nào trong `Videos` → hỏi kèm các tên gần nhất. Không có tên → mở trang chính của Studio.
3. Thư mục có nhưng thiếu `hf/index.html` → báo 1 dòng, không tự tạo khung.
4. Nối phiên bằng skill `ket-noi-studio` nếu chưa nối. Đọc lại trang để xác nhận đúng dự án, báo 1 dòng. Không sửa gì khác.
