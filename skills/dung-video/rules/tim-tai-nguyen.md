# Tự tìm tài nguyên MG / motion design / animation (Dũng chốt 02/11/2026)

## Khi nào được tìm
- Cảnh cần MG, motion design hoặc animation mà kho tại máy chưa có tài nguyên phù hợp (`HDRE AI\asset`, thư viện MG của skill, `Fonts\capcut`, kho SFX, repo `hdre-ai-backup`). Tra kho trước, thiếu mới tìm trên mạng.
- Loại được tìm: icon, SVG, Lottie (.json/.lottie), ảnh, video nền/overlay (mp4/webm/mov), GIF, mô hình 3D (glb/gltf/fbx/blend), font, preset/mẫu chuyển động, đoạn mã GSAP/CSS mẫu.
- Được lấy cả tài nguyên có bản quyền: Dũng chấp nhận rủi ro. Ưu tiên miễn phí, không tiêu credit (luật free-only).

## Dũng phải được biết
Mỗi tài nguyên lấy về ghi một dòng vào `Videos\<dự án>\nguon_tai_nguyen.md`:
`tên file | dùng ở cảnh/giây | link gốc | tác giả | giấy phép (CC0 / CC-BY / miễn phí cá nhân / có bản quyền / không rõ) | kết quả kiểm an toàn`.
Báo cáo cuối có mục "Tài nguyên tự tìm": số lượng, cái nào có bản quyền hoặc giấy phép không rõ, cái nào cần ghi công (CC-BY).

## Kiểm an toàn trước khi tải và cài (bắt buộc)
1. **Nguồn:** chỉ lấy từ trang gốc của tác giả hoặc kho có tiếng (LottieFiles, IconScout, SVGRepo, Iconify, Pixabay, Pexels, Mixkit, Poly Haven, Sketchfab, Google Fonts, GitHub/npm có người dùng thật). Bỏ link rút gọn, trang tải đầy quảng cáo/nút "Download" giả, trang bắt tắt diệt virus hay cài "trình tải".
2. **Không tải hay chạy file thực thi lạ:** `.exe .msi .bat .cmd .ps1 .vbs .scr .jar .lnk .hta`, macro Office, "crack", "keygen", "patch", bản lậu phần mềm/plugin → không tải, cảnh báo Dũng.
3. **Thư mục cách ly:** mỗi lần tải vào một thư mục mới, trống (`HDRE AI\_cach_ly\<ngày>-<tên>\`), chưa chép vào dự án khi chưa kiểm xong.
4. **Kiểm file:** đuôi thật khớp nội dung (đọc byte đầu, bắt đuôi kép kiểu `anh.png.exe`); file nén thì xem danh sách bên trong trước khi giải nén, có file thực thi hoặc đường dẫn `..\` thì bỏ; Lottie/SVG/HTML mở bằng trình đọc văn bản, có `<script>`, `eval`, `expression` gọi mạng, link lạ thì bỏ hoặc gỡ phần đó.
5. **Quét virus bằng Windows Defender:** `"%ProgramFiles%\Windows Defender\MpCmdRun.exe" -Scan -ScanType 3 -File "<thư mục cách ly>" -DisableRemediation`. Ghi kết quả vào sổ nguồn.
6. **Gói mã (npm, pip, GitHub, plugin, skill):** kiểm tên đúng gói gốc (không phải tên na ná), số tải/sao, ngày cập nhật, người duy trì, đọc `package.json` (`preinstall`/`postinstall`) hoặc `setup.py` trước khi cài; cài npm với `--ignore-scripts` khi không cần script; không chạy lệnh dạng `curl ... | sh` / `iwr ... | iex` từ trang lạ.
7. **File đã xác định có mã độc** (Defender báo nhiễm, hoặc là file thực thi đội lốt media/đuôi giả, hoặc chứa script độc) → **xóa ngay** file đó cùng cả thư mục cách ly của lần tải (`Remove-Item -Recurse -Force`), không mở, không cài, không giữ lại để kiểm thêm; ghi vào sổ nguồn dòng `ĐÃ XÓA – mã độc` và thông báo Dũng ngay: `⚠ Đã xóa file mã độc: <tên file> | nguồn: <link> | lý do: <tên mối đe dọa Defender / dấu hiệu> | đã xóa lúc <giờ>`. Kiểm lại thư mục đã mất hẳn rồi mới báo. Không tải lại từ nguồn đó.
   **Mới chỉ nghi ngờ** (trang yêu cầu tắt bảo vệ, chữ ký số lỗi, script lạ chưa rõ tác dụng) → dừng, không cài, xóa thư mục cách ly, cảnh báo Dũng một dòng kèm tên file, nguồn và lý do.
8. Kiểm xong sạch mới chép vào `Videos\<dự án>\hf\assets\` (hoặc kho chung nếu dùng lại nhiều lần), rồi xóa thư mục cách ly.
