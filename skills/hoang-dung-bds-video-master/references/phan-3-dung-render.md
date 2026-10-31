# hoang-dung-bds-video-master — Phần III – Dựng & render tại máy, Preview

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

### PHẦN III: DỰNG & RENDER TẠI MÁY CỦA DŨNG – PREVIEW BẮT BUỘC

Nhãn: `[TRỢ LÝ AI 2 - DỰNG & RENDER TẠI MÁY]`. Dũng chỉ làm 3 việc: gửi đường dẫn thư mục, chọn phần mềm và nhịp theo dõi, duyệt Preview. **Bản chính chỉ render trên máy Dũng, không render trên đám mây.** AI tự làm mọi bước kỹ thuật còn lại, chỉ hỏi khi cần quyết định thật.

#### Bước 3.0: Hỏi trước mỗi lần chỉnh sửa video (gộp trong một tin nhắn)
1. **Đường dẫn thư mục video thô trên máy** (luôn hỏi nếu tin nhắn chưa có; không tự dùng thư mục cũ, chỉ gợi ý để Dũng xác nhận). Mẫu: `📂 Anh gửi đường dẫn thư mục chứa video thô cần dựng trên máy giúp em (ví dụ D:\Video\2026-10-20_tan-ky-tan-quy).` Mẹo: Windows chuột phải thư mục → “Copy as path” (Windows 10 giữ Shift); macOS chuột phải + giữ Option → “Copy … as Pathname”. Link web (Drive, Zalo) không dùng được, xin lại đường dẫn trên máy.
2. **Khung hình và fps xuất: AI tự nhận từ video gốc, không hỏi.** Đọc `width/height` + `rotation` của clip chính (người dẫn) theo Bước 3.3 và giữ nguyên: nguồn dọc → 9:16 1080x1920 tràn khung; nguồn ngang → 16:9 1920x1080 tràn khung. Chỉ hỏi khi các clip lẫn dọc và ngang, hoặc Dũng muốn thêm bản tỷ lệ khác.
3. **Phần mềm dựng:** `AI tự dựng trên bàn dựng Remotion (mặc định)` | `CapCut` | `DaVinci Resolve` | `Premiere Pro` (Dũng có thể nhập phần mềm khác). Gợi ý lựa chọn lần trước làm phương án đầu nhưng vẫn hỏi lại. Với mọi lựa chọn, bàn dựng vẫn được mở để Dũng xem bản lắp ráp của AI.
4. **Nhịp theo dõi:** `Xem liên tục` (mặc định: gửi kết quả từng bước rồi chạy tiếp) | `Duyệt từng bước` (dừng sau mỗi bước, Dũng nhắn “OK” mới làm tiếp) — Bước 3.4b.
5. Loại BĐS nếu chưa rõ.
Dùng câu hỏi lựa chọn nếu có công cụ. Có đủ câu trả lời thì tự chạy 3.1 → 3.5. Phiên không có người xem mà thiếu đường dẫn: dừng, để lại câu hỏi.

#### Bước 3.1: Tự kiểm tra kết nối & môi trường
1. Tìm công cụ `mcp__remote-devices__` (ToolSearch). Không có → hướng dẫn mở chính cuộc trò chuyện này trong app Claude desktop trên máy có video rồi nhắn lại. Thư mục ngoài vùng đã cấp quyền → nhờ Dũng cấp quyền thư mục đó trong app. Không gọi tới máy → máy ngủ/tắt/mất mạng hoặc app đóng.
2. **Trường hợp 1 – có shell trên máy** (`device_bash`): AI tự chạy mọi bước, nhận phần cứng, hiện tiến trình. **Trường hợp 2 – chỉ có công cụ chép file:** AI ghi script 1-click vào `HDRE_Edit/project/` (Windows: `bat-dau-dung.ps1` và `render.ps1` — dùng PowerShell thay `.bat` vì đường dẫn có dấu tiếng Việt; macOS: `.sh`), Dũng nhấp đúp để chạy; script ghi log, kết quả từng bước (`HDRE_Edit/steps/`) và file trạng thái để AI đọc lại qua kết nối máy. Không render bản chính trên đám mây; đám mây chỉ dùng cho việc nhẹ (xem ảnh tổng hợp, soạn file).
3. Xác định Windows hay macOS.
4. FFmpeg (`ffmpeg -version`, cần có `libass`): thiếu thì xin phép một câu, được đồng ý thì AI tự cài (`winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements` hoặc `brew install ffmpeg`); thất bại mới hướng dẫn cài tay; không tải bộ cài vào thư mục của Dũng. Ghi nhận encoder phần cứng H.265 (`hevc_nvenc/hevc_qsv/hevc_amf/hevc_videotoolbox`). Kiểm tra thêm faster-whisper (`python -c "import faster_whisper"`), GPU (`nvidia-smi`), Node.js (cho bàn dựng); thiếu thì xin phép cài như FFmpeg.
5. Tạo `HDRE_Edit/` trong thư mục video thô: `project/` (cut_list, `.ass`, script render, log, bản sao LUT/logo, `mg/` cho icon và ảnh, `transcript/`), `studio/` (dự án bàn dựng Remotion), `steps/` (kết quả từng bước theo dõi), `preview/`, `export/`, `_tmp/`. File gốc chỉ đọc. `HDRE_Edit` đã tồn tại thì nối tiếp phiên bản.
6. Tài nguyên (AI tự tìm trước): LUT `.cube`, logo PNG, `brand.txt`, nhạc, SFX, ảnh/icon tiện ích — trong thư mục video, thư mục cha, đường dẫn ở `assets_path.txt` của dự án trước. Không thấy thì hỏi **một lần** rồi ghi `HDRE_Edit/project/assets_path.txt`. D-Log mà thiếu LUT: hỏi, không tự chế màu. Font: theo `brand.txt`, không có thì font hệ thống hỗ trợ tiếng Việt. Nhạc nền: AI tự tìm theo Bước 2.4b; SFX ưu tiên thư viện miễn phí bản quyền đã lưu trong `HDRE_Library/sfx/`.

#### Bước 3.2: Quét & kiểm định source tại máy
1. Liệt kê video (bỏ qua `HDRE_Edit`).
2. `ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,color_transfer:stream_side_data=rotation -of json` → độ phân giải, **rotation**, fps, thời lượng, 10-bit, Log, âm thanh.
3. “Xem”: ảnh tổng hợp mỗi clip (`fps=1/2,scale=320:-2,tile=4x3`), chép về để đánh giá bố cục, rung, phơi sáng, nội dung, gán nhóm T1-T7 và mã BR, phát hiện clip trùng (Bước 2.0c).
4. “Nghe”: `volumedetect`, `silencedetect=noise=-35dB:d=0.5`, vỡ tiếng; gỡ băng lời thoại theo Bước 2.0b (faster-whisper → Whisper.cpp → Dũng dán lời → phụ đề tự động CapCut → `.srt`). Chưa có lời thoại thì dừng ở kiểm định, không dựng theo đoán.
5. Điền Bảng Kiểm Định, áp Quy tắc fps, chạy Gác cổng.

#### Bước 3.3: Quy tắc fps & tỷ lệ khung
| Fps nguồn | Xử lý khi xuất |
|---|---|
| 60 / 59.94 | Xuất 60, `fps=60` |
| 50 | **Giữ 50** (không đổi sang 60 để tránh giật) |
| ≥100 / 120 | Slow-motion `setpts=2.0*PTS` rồi về fps xuất, hoặc tốc độ thường |
| 24 / 25 / 30 | **Báo trước**: fps xuất cao hơn nguồn chỉ là lặp khung. Hỏi chọn: (a) lặp khung lên 60 (nguồn 25 thì lên 50) — mặc định khi vắng mặt; (b) nội suy `minterpolate=fps=60:mi_mode=mci` (mượt hơn, có thể méo, rất chậm); (c) quay lại ở 60fps |

Không bao giờ nói “mượt 60fps” khi nguồn 30fps.
Trộn nhiều fps: lấy fps của cảnh thoại (A-roll) làm fps xuất, các clip khác quy về fps đó và báo trước; không bao giờ tự hạ xuống 30fps.
**Nhận diện khung gốc (bắt buộc trước khi dựng):** tính tỷ lệ hiển thị từ `width/height`, xoay theo `rotation` (90/270 thì đổi chiều) và `sample_aspect_ratio`; ghi “Khung gốc: dọc 9:16 / ngang 16:9 / khác” vào Bảng Kiểm Định. Mặc định xuất **đúng khung gốc, tràn khung, không viền**; tuyệt đối không đặt video dọc vào giữa khung 16:9 (hay ngược lại) trừ khi Dũng yêu cầu bản tỷ lệ khác. Sau khi xuất, kiểm `ffprobe` (`width`, `height`, `sample_aspect_ratio=1:1`, không còn `rotation`) và ghi kết quả vào báo cáo Preview; dùng `setsar=1`.
Tỷ lệ khác khung gốc (chỉ khi Dũng yêu cầu): 9:16 – nguồn dọc `scale=1080:1920`, nguồn ngang `crop=ih*9/16:ih:X:0,scale=1080:1920` với X ghi theo từng shot trong cut_list; 16:9 – nguồn ngang `scale=1920:1080`, nguồn dọc nền mờ hai bên (`split` → `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=20:2` làm nền, `scale=-2:1080` đặt giữa bằng `overlay=(W-w)/2:0`). Chữ, phụ đề, MG, logo theo vùng an toàn từng tỷ lệ (9:16 tránh mép dưới và cột nút bên phải); mỗi tỷ lệ một bộ `.ass`.

#### Bước 3.4: Dựng tại máy – Bàn dựng Remotion Studio (mặc định) và FFmpeg
**A. Bàn dựng luôn bật ở đầu mỗi lần dựng** (AI tự chạy, hoặc giao script `bat-dau-dung.ps1`/`.sh`):
1. Kiểm tra/cài (xin phép lần đầu) Node.js LTS, FFmpeg, faster-whisper; tạo dự án Remotion trong `HDRE_Edit/studio/` (lần sau dùng lại khung dự án).
2. Tiền xử lý bằng FFmpeg: nếu footage đo ra D-Log → Rec.709 bằng LUT DJI (Remotion không đọc LUT `.cube`); footage thường bỏ bước LUT; bản nhẹ 1080p (fps theo khung xuất) cho bàn dựng ở `studio/public/proxy/`; bản trung gian chất lượng cao cho bản chính; tách tiếng 16kHz để gỡ băng.
3. Gỡ băng (Bước 2.0b) → chọn take & cảnh (2.0c) → Bảng canh thời điểm hiệu ứng (2.0d, 4.8) → ghi `studio/src/edit.json` (cảnh, take, mốc, MG, SFX, nhạc).
4. Mở bàn dựng: `npx remotion studio` → trình duyệt mở timeline. Mỗi cảnh là một Sequence đặt tên như `C1 Hook – T1 take3`, `C3 Bếp – BR05`; mỗi lớp MG mang mã MG; rãnh Giọng / Nhạc / SFX riêng. Prop `kythuat` bật **Chế độ kỹ thuật**: phủ tên cảnh, mã T/BR/MG, sóng âm giọng và nhạc, đường ducking.
5. AI sửa `edit.json` và các thành phần MG ngay trong thư mục của Dũng (qua shell, hoặc ghi file qua kết nối máy) → bàn dựng làm mới, Dũng thấy thay đổi khi AI đang dựng. Lần cài đầu: chạy thử để xác nhận bàn dựng tự làm mới và timeline có hiển thị sóng âm; nếu không thì sóng âm chỉ xem qua Chế độ kỹ thuật.
6. Giấy phép Remotion: miễn phí cho cá nhân và công ty tối đa 3 nhân sự; dựng cho công ty lớn hơn thì cần giấy phép công ty.
7. Máy không chạy được Remotion (cấu hình yếu, không cài được Node.js): dùng **Kdenlive** (mã nguồn mở, timeline có sóng âm; Dũng mở lại dự án để thấy thay đổi) hoặc dựng thẳng bằng FFmpeg (mục B), vẫn theo dõi qua chat.
**B. Kỹ thuật FFmpeg (tiền xử lý, dự phòng, xuất):**
1. Ghi vào `HDRE_Edit/project`: cut_list.csv, `.ass` chữ và MG theo khung, icon/ảnh trong `mg/`, script `render.ps1`/`render.sh` có chế độ `preview` và `final`.
2. Chạy FFmpeg với thư mục làm việc `project`, mọi tài nguyên dùng **đường dẫn tương đối** (tránh lỗi `C:` và `\` trong filter `lut3d/subtitles/ass`).
3. Hình: `trim` → `lut3d` → chỉnh màu → khung gốc → fps xuất → che sổ (MG14) → MG (`ass` + `overlay`, Bước 4.5) → chữ → logo (chỉ khi Dũng yêu cầu, góc trên phải, không ở cảnh CTA) → `format=yuv420p`.
4. Tiếng: `atrim` → `concat` → chuẩn hóa giọng → ducking liên tục `[giong]asplit[g1][g2];[nhac][g2]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[nhacduck]` (Cảnh 4 thêm `volume` hạ sâu) → SFX `adelay` theo Bước 4.7 → `amix` → `loudnorm=I=-14:TP=-1.5:LRA=11` (đỉnh ≤ -1,5 dBTP theo `audio-master`).
5. Lần đầu trên máy: thử 10-15 giây. Render dài: log `-progress` vào `project/render_log.txt`.

#### Bước 3.4b: Theo dõi quá trình dựng
Sau mỗi bước, AI xuất một kết quả nhìn được, lưu `HDRE_Edit/steps/NN_<ten>.*` và gửi vào cuộc trò chuyện (1-3 dòng mô tả + file). AI không phát hình trực tiếp liên tục; Dũng xem bản dựng thay đổi qua từng bước và trên bàn dựng.
| Bước | Dũng thấy | Dạng |
|---|---|---|
| 1. Kiểm định & phân loại | Ảnh tổng hợp từng clip có nhãn T1-T7/BR và Đạt/Thiếu; Bảng chọn take & cảnh; lời thoại đã gỡ băng để duyệt | Ảnh + bảng |
| 2. Dựng thô v0 | Chỉ cắt ghép theo lời, đúng thứ tự; góc khung in tên cảnh và mốc giây | Clip ≥720p, chưa màu/chữ |
| 3. Màu (`color-master`) | Từng cảnh chính trước/sau LUT đặt cạnh nhau | Ảnh so sánh |
| 4. Chữ & motion graphic (`3d-fx-master`) | Mẫu xem trước 9:16 + Bảng canh thời điểm hiệu ứng (Bước 4.8 mục F) | Ảnh + bảng |
| 5. Âm thanh (`audio-master`) | Biểu đồ giọng/nhạc/SFX theo thời gian, chỗ ducking, LUFS, bảng đếm SFX | Ảnh |
| 6. Preview v01 | Bản hoàn chỉnh + Bảng điểm giữ chân + báo cáo `qa-master` Chặng 2 + bảng điểm 5 tư duy (`editor-5-mindsets`) → dừng chờ “DUYỆT XUẤT” | Clip |
| 7. Xuất H.265 | Tiến trình %, thông số `ffprobe` | Tin nhắn |
- Nhịp: `Xem liên tục` (mặc định) hoặc `Duyệt từng bước` (Bước 3.0). Tin nhắn Dũng gửi khi AI đang chạy có thể chỉ được đọc sau khi xong bước đó; góp ý áp dụng ở bước kế tiếp.
- Nơi xem: (1) cuộc trò chuyện (cả trên điện thoại); (2) bàn dựng Remotion trên máy tính; (3) timeline trong DaVinci/Premiere — AI giao file timeline thô ngay sau bước 2 và bản mới sau mỗi lần sửa (CapCut không nhập timeline, xem theo cách 1-2); tùy chọn AI thao tác trực tiếp trên màn hình phần mềm khi Dũng đồng ý (chậm, chỉ cho bước nhỏ).
- Clip trung gian luôn ≥720p, fps bằng fps xuất.

#### Bước 3.5: PREVIEW BẮT BUỘC (áp dụng cho mọi phần mềm dựng)
1. Preview hoàn chỉnh (đủ cắt dựng, giọng người dẫn, màu, chữ, nhạc, SFX, MG, ảnh bìa đã chọn, logo khi Dũng yêu cầu), đúng khung gốc, **≥720p, fps bằng bản chính** (60, hoặc 50 khi nguồn 50) — mặc định `720x1280` / `1280x720`; Dũng muốn thì 1080p. Không bao giờ dưới 720p hoặc thấp hơn fps bản chính. Preview dùng H.264 để xem được trên mọi điện thoại: `-c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -r <fps xuất> -c:a aac -b:a 160k`; có thể thêm chữ nhỏ “PREVIEW vNN”.
2. Lưu `HDRE_Edit/preview/HDRE_<ten-du-an>_<9x16|16x9>_PREVIEW_v01.mp4`, tăng số phiên bản mỗi lần sửa.
3. Chép về và gửi file vào cuộc trò chuyện để Dũng xem cả trên điện thoại; báo vị trí trên máy. Trình phát trong khung chat có thể hiện viền đen hai bên video dọc; ghi rõ kết quả `ffprobe` và nhờ Dũng kiểm trên điện thoại hoặc mở file trực tiếp.
4. Kèm bảng 5 tiêu chí (Bước 2.6) với số đo thật (thời lượng, độ phân giải, fps, LUFS, dBTP), **Bảng ưu tiên hiệu ứng đã áp dụng** (câu thoại → mức P → BR/MG → nội dung chữ/số), bảng đếm số lần dùng mỗi mẫu hiệu ứng và SFX, **Bảng điểm giữ chân** (dưới đây), **bảng điểm 5 tư duy** của `editor-5-mindsets` (đạt cổng ≥90, không tư duy nào <17/20; kèm tối đa 3 điểm cần nâng và 1 điểm vượt chuẩn), và ghi chú (nguồn 30fps đã lặp khung, nguồn nhạc và giấy phép, MG bị bỏ do số liệu chưa xác minh, chữ 3D đang ở cấp nào).
   **Bảng điểm giữ chân** (mỗi Preview, so với bản trước): sự kiện thị giác mỗi 0,8-1,2 giây (video thuyết phục; dạng K mỗi 1,5-2,5 giây, câu nhử mỗi 10-15 giây, thời lượng trong 50-80 giây hoặc có lý do); ≥2 đồ họa trong 5 giây đầu; không khoảng lặng chết >0,5 giây; câu nhử ở 10/20/30 giây; tỷ lệ câu thoại có B-roll/MG minh họa; độ lớn -14 LUFS (video cảm xúc -18 đến -21); số cảnh trùng = 0; đa dạng SFX (Bước 4.7). Bản sau phải đạt điểm ≥ bản trước, kèm bảng so sánh; chỉ số chưa đạt thì AI tự sửa trước khi gửi hoặc ghi rõ lý do giữ. Sau khi đăng, Dũng gửi số liệu (tỷ lệ xem qua 3 giây, thời gian xem trung bình, tỷ lệ xem hết) → ghi `HDRE_Library/training/performance.csv` để chỉnh ngưỡng chấm (Phần VI).
5. **Dừng và hỏi:** `🎬 Preview v01 (720p @ <fps>) đã sẵn sàng. Bản chính thức sẽ xuất: <khung gốc> – <độ phân giải> @ <fps>, H.265, qua <phần mềm>. Anh nhắn “DUYỆT XUẤT” để xuất, hoặc ghi chỗ cần sửa.` Góp ý → sửa (Nhánh C) → Preview v02. Chỉ khi Dũng duyệt rõ **đúng bản Preview mới nhất** mới sang 3.6; lời khen chung chung chưa phải lệnh duyệt. Phiên không có người xem: dừng ở Preview.

#### Bước 3.6: Xuất bản chính thức H.265 (chỉ trên máy Dũng)
- Khung & độ phân giải: đúng khung gốc; mặc định 1080x1920 (dọc) hoặc 1920x1080 (ngang); 2160x3840 / 3840x2160 khi Dũng cần (YouTube). Fps theo Bước 3.3.
- Bộ mã hóa H.265 (AI tự nhận phần cứng):
  | Phần cứng | Lệnh |
  |---|---|
  | NVIDIA | `-c:v hevc_nvenc -preset p7 -tune hq -rc vbr -cq 19 -b:v 0` |
  | Mac Apple Silicon | `-c:v hevc_videotoolbox -q:v 65` (không dùng CRF) |
  | Intel | `-c:v hevc_qsv -global_quality 20` |
  | AMD | `-c:v hevc_amf -quality quality -rc cqp -qp_i 20 -qp_p 22` |
  | Không có GPU | `-c:v libx265 -preset slow -crf 19` |
- Chung cho mọi bộ mã hóa: `-tag:v hvc1 -pix_fmt yuv420p -g <2×fps> -c:a aac -b:a 320k -ar 48000 -movflags +faststart`, `setsar=1`, âm thanh đã `loudnorm` -14 LUFS. Khi dùng bitrate thay chất lượng cố định: 1080p 15-25M, 4K 35-50M.
- Bàn dựng Remotion: `npx remotion render … --codec=h265` (dùng CRF hoặc tăng tốc phần cứng, Remotion không cho dùng cùng lúc) → remux FFmpeg `-c copy -tag:v hvc1 -movflags +faststart`.
- File: `HDRE_Edit/export/HDRE_<ten-du-an>_<9x16|16x9>_<fps>fps_H265_v01.mp4`, không ghi đè. Bản H.264 dự phòng chỉ khi Dũng cần (máy cũ không phát được H.265).
- Không có shell: bước xuất nằm trong `render.ps1 final` / `render.sh final`; script tự chọn bộ mã hóa, hiện % tiến trình, ghi `export_report.txt` (`ffprobe`) để AI đọc lại.
- Luồng CapCut/DaVinci/Premiere: giao gói dự án theo Phần V, kèm thông số xuất H.265 cho phần mềm đó; hoặc AI xuất luôn bằng FFmpeg nếu Dũng muốn.
- Kiểm tra sau xuất bằng `ffprobe`: codec `hevc`, tag `hvc1`, độ phân giải đúng khung gốc, fps đúng, thời lượng khớp Preview, có âm thanh; báo vị trí file. Chỉ gửi file lớn vào chat khi Dũng yêu cầu. Tiếp tục Bước 2.6 nếu chưa làm.
- Dũng duyệt xuất kèm góp ý: xuất đúng bản đã duyệt, đồng thời ghi góp ý vào Nhánh C để áp dụng cho bản sau.

#### Bước 3.7: An toàn file
File gốc chỉ đọc (không ghi, sửa, đổi tên, di chuyển, xóa). Mọi file AI tạo nằm trong `HDRE_Edit/`. Không tự xóa; dọn dẹp chỉ khi Dũng yêu cầu và cấp quyền xóa, chưa có quyền thì chuyển vào `_to_delete` và báo Dũng.

