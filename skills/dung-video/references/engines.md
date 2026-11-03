# Chọn engine

| Engine | Dùng khi | Không dùng khi |
|---|---|---|
| **HyperFrames** (mặc định) | mọi dự án mới: phụ đề, MG, keyframe, registry, mix âm thanh, preview Studio, render | dự án đã là Remotion, hoặc Dũng yêu cầu dựng bằng Remotion |
| **Remotion** | thư mục dự án đã có `remotion.config.*` hoặc `package.json` chứa `remotion`; hoặc Dũng yêu cầu rõ dựng bằng Remotion | dự án mới mà Dũng không yêu cầu Remotion |
| **Higgsfield MCP** | CHỈ tạo/xử lý asset AI: nhạc (generate_audio), nhạc TikTok, reframe, upscale, tách nền, phân tích video, dự đoán viral | không dùng để dựng timeline hay render |
| **ffmpeg** | đo ffprobe/ebur128, LUT, trích khung QA, mã hóa H.265 cuối | không dùng làm MG |
| **3D** (three.js / R3F) | Dũng chỉ định 3D (presets.md). HyperFrames: vẽ theo `hf-seek`, root BẮT BUỘC `data-duration`; Remotion: `@remotion/three` — render từng khung, không đồng hồ thật | video không được chỉ định 3D; không dùng rapier |
| **Lottie** (dotlottie-web) | có file AE/Lottie. HyperFrames: `autoplay:false`, `window.__hfLottie`; Remotion: `@remotion/lottie` (hỏi trước khi cài) — render từng khung | chữ hiệu ứng tự dựng được bằng GSAP |

## Quy tắc
- Chọn engine 1 lần ở giai đoạn 1, ghi vào `edit-state.json`. Không đổi giữa chừng.
- HyperFrames: điểm vào `hyperframes` → nạp skill con theo giai đoạn (core, animation, keyframes, audio, cli).
- Remotion: điểm vào `remotion-best-practices` → nạp skill con theo giai đoạn.
- Dự án Remotion mới (Dũng yêu cầu): chép `template/` của `hoang-dung-remotion-studio` vào thư mục dự án rồi `npm i`, không dùng `create-video` trống. Skill đó chỉ cung cấp template, component MG và cách làm trong Remotion; quy trình theo dung-video. Khi mâu thuẫn, dung-video thắng: không preview, không chờ "DUYỆT XUẤT", không dùng `hoang-dung-bds-video-master` làm điều phối, template 30fps phải đổi theo thông số xuất bên dưới.
- Muốn chuyển dự án Remotion cũ sang HyperFrames → `remotion-to-hyperframes`, hỏi Dũng trước.
- Mọi lệnh Higgsfield: báo số credit dự kiến (balance / quote) và chờ Dũng đồng ý.
- Lệnh `npx hyperframes skills update ...` = cập nhật package → hỏi Dũng trước.

## Thông số xuất
- Không xuất preview cho Dũng; chỉ giao bản cuối (bản nháp 720p chỉ dùng nội bộ khi chấm template).
- Bản cuối: giữ độ phân giải và khung gốc; fps < 60 → 60fps; H.265 (libx265), bitrate tăng phù hợp; nhạc nền có mặt.
- Kiểm bằng `ffprobe -v error -show_format -show_streams` trước khi báo xong.
