# hoang-dung-bds-video-master — Phần V–VI – Luồng theo phần mềm, kho huấn luyện

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

### PHẦN V: LUỒNG THEO PHẦN MỀM DỰNG

Kích hoạt theo câu trả lời ở Bước 3.0. Mọi luồng đều: kiểm định (Gác cổng) → lời thoại & kịch bản từ lời thật → Bảng ưu tiên hiệu ứng → dựng → **Preview bắt buộc do AI render từ cùng bản dựng** → Dũng duyệt → xuất H.265 đúng khung và fps gốc. Bàn dựng Remotion luôn mở để Dũng xem bản lắp ráp của AI, kể cả khi chỉnh tay ở phần mềm khác. Lần đầu dùng một luồng: nhờ Dũng thử nhập file và báo lỗi, ghi bài học vào Nhánh C.

**1. AI tự dựng trên bàn dựng Remotion (mặc định) hoặc FFmpeg:** Phần III đầy đủ.
**2. CapCut (máy tính):** CapCut hiện không nhập được timeline từ phần mềm khác, nên AI giao gói trong `HDRE_Edit/export/capcut_pack/`: MG tĩnh dạng PNG; MG chuyển động dạng video nền trong suốt (ProRes 4444 `.mov`), kèm bản nền xanh để dùng tính năng xóa nền màu nếu bản CapCut không nhận nền trong suốt; phụ đề `.srt`; bảng cắt có mốc thời gian theo thứ tự track; hướng dẫn từng bước (đặt clip track chính, B-roll track trên, MG track trên cùng, Tracking cho MG23, ducking Cảnh 4). Xuất trong CapCut: đúng khung gốc, fps theo nguồn, chọn mã hóa HEVC/H.265 nếu bản CapCut có. Hoặc Dũng chọn để AI xuất luôn bằng FFmpeg.
**3. DaVinci Resolve:** AI tạo timeline `.fcpxml` theo fps xuất trỏ tới file gốc (cắt theo cut_list), MG nền trong suốt trên các track video phía trên, `.srt`, nhạc + SFX trên track audio; ghi chú dùng LUT DJI trên clip D-Log; chữ 3D và bám vật thể làm trong Fusion (tính năng tracking có thể tùy phiên bản). Timeline thô giao ngay sau bước theo dõi 2 để Dũng tua xem. Dũng nhập qua chức năng nhập timeline của DaVinci rồi xuất H.265 theo Bước 3.6.
**4. Premiere Pro:** AI tạo timeline XML định dạng Final Cut Pro XML (Premiere nhập được), MG nền trong suốt, `.srt` cho captions, nhạc + SFX; chữ 3D bám vật thể dùng After Effects nếu Dũng có, không thì làm ở Cấp 1-2 bằng AI rồi nhập dạng video nền trong suốt. Timeline thô giao ngay sau bước theo dõi 2. Xuất H.265 (HEVC) theo Bước 3.6.
**5. Điều khiển trực tiếp ứng dụng (tùy chọn):** nếu có công cụ điều khiển máy tính và Dũng đồng ý, AI có thể thao tác trực tiếp trong phần mềm; chậm và dễ lệch hơn file dự án, nên chỉ dùng cho bước nhỏ (nhập file, bấm xuất).
Định dạng nền trong suốt: `-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le`. Ghi lựa chọn phần mềm lần này vào `assets_path.txt` để lần sau gợi ý.

### PHẦN VI: KHO HUẤN LUYỆN DÙNG CHUNG (với `hoang-dung-video-effect-lab`)
“Tự huấn luyện” là AI rèn luyện qua sổ tay và phản hồi của Dũng; mô hình AI không thay đổi, năng lực học được nằm trong kho này — giữ gìn và mang theo khi đổi máy hoặc đổi AI.
- **Thuộc lõi `hoang-dung-bds-habit-memory`:** cùng thư mục có `user_habits.md` (thói quen H-) và `expert_notes.md` (kiến thức K-). Mỗi lần làm chạy vòng 7 bước của lõi: nạp → nghiên cứu → áp dụng → tự phản biện → quan sát → rút kinh nghiệm → ghi. Video-master ghi mảng `kich_ban` (Trợ lý 1) và `dung` (Trợ lý 2); kiến thức lĩnh vực `video`, `nen_tang`, `marketing`.
- Nơi lưu `HDRE_Library/training/` trong thư mục tài nguyên (đường dẫn ở `assets_path.txt`): `rules.md` (luật “dấu hiệu → hành động”, mã R-M… cho skill này, R-L… cho Lab, phạm vi, điểm tin cậy, nguồn); `feedback_log.md` (mỗi lần Dũng sửa: ngày, video, chỗ sửa, nhóm nguyên nhân kỹ thuật / tư duy dựng / thông điệp / gu, luật tạo hoặc sửa); `predictions.csv` (dự đoán của AI: take được chọn, mức P, điểm Preview — và kết quả thật); `take_weights.csv` (trọng số chấm take hiện hành và lịch sử); `performance.csv` (số liệu sau đăng theo video, công thức F1-F4, kiểu dựng); `experiments.md`, `reviews/`.
- Điểm tin cậy luật: như skill effect-lab Bước 8.3 (AI rút ra 40; Dũng dạy “Dạy AI: …” 85; đúng +15; bị sửa −25; ≥70 áp dụng mặc định; dưới 30 hoặc bị bác 2 lần liên tiếp thì hết hiệu lực).
- Trọng số take: Dũng chọn khác AI 2 lần với cùng lý do → chuyển 5 điểm trọng số sang tiêu chí Dũng ưu tiên (tổng vẫn 100); ghi lịch sử thay đổi.
- Mỗi lần dựng: nạp luật và trọng số trước → áp dụng → cuối Preview thêm 1-3 dòng `🧠 Đã học: …` khi có điều mới.
- Sau mỗi 5 video hoặc khi Dũng nhắn “Báo cáo huấn luyện”: so 5 video gần nhất với 5 video trước (điểm Preview, số lần sửa đến khi duyệt, tỷ lệ take AI chọn trùng Dũng, số liệu sau đăng), luật mạnh nhất, luật bị loại, 1-3 việc tập trung tới; lưu `reviews/`.
- Chưa kết nối máy: cuối phản hồi thêm khối `📌 BÀI HỌC CẦN LƯU` để Dũng giữ và gửi lại lần sau.
- Luật học được không vượt Gotchas. Đề xuất đưa luật ổn định vào SKILL.md luôn chờ Dũng duyệt.

