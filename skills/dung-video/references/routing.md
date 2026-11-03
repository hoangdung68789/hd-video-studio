# Bảng Định tuyến Công cụ & Đội ngũ Sub-Agents (Cập nhật 03/11/2026)

Credit: **Có** = tốn credit/API trả phí → PHẢI hỏi Dũng trước. **?** = có thể cần đăng nhập HeyGen → hỏi trước.
Nhóm C, H và thư viện SFX nằm trên máy Dũng: kiểm `Test-Path` khi chạy; không có → ghi `missing`, dùng dự phòng, tuyệt đối không tự đoán.

| Chức năng | Pha / Giai đoạn | CHÍNH | DỰ PHÒNG | Quy tắc vận hành (Đồng thời & Kiểm chéo) | Credit |
|---|---|---|---|---|---|
| Nạp thói quen & Sổ nhân sự | Pha 0 (0) | `HDRE_Library/training/rules.md` + `agent-roster.json` | memory dự án (chỉ đọc) | Mọi lần `/video`; ưu tiên gọi lại Sub-Agents đạt `RETAINED` | Không |
| Điều phối tổng, cấp phát ≤50 Sub-Agents (vừa đủ), kiểm nhanh tổng thể `≥ 98/100`, đánh giá/loại bỏ Sub-Agents (`>2 lần lỗi`) | Pha 0, Pha 1, Pha 2 (0–7) | `hoang-dung-agent-orchestrator` (`rules/dieu-phoi.md`) | — | Mọi lần `/video`; tất cả Sub-Agents chạy đồng thời, kiểm chéo & sửa lỗi ngay tại chỗ | Không |
| Brief & `master-timeline` | Pha 0 (1) | `ffprobe` + `signalstats` + `presets.md` | `hyperframes` (brief-contract) | Chạy ngay 30s đầu để mở luồng đồng thời cho toàn bộ Sub-Agents | Không |
| Phân tích video mẫu, chuẩn MG/SFX | Pha 0–1 (1, 4) | `hoang-dung-viral-style-scout` (Chế độ B; đo bằng `watch`) | `video_analysis_create` (G) | Có video mẫu | G: Có |
| Chép lời có `word_id` | Pha 1 (2) | `video-use` (transcribe) + `antigravity-video-bridge` | `hyperframes-cli transcribe` | Có giọng nói; Tổ Cắt dựng & Đồ họa kiểm chéo ngay | Không |
| Cắt dựng theo `segment_id` | Pha 1 (2) | `video-use` + `voice_cleaner_pro.py` | `herk-edit-kit` (H) | Chạy đồng thời theo phân đoạn; sửa điểm cắt ngay tại chỗ | Không |
| Recut người nói + overlay | Pha 1 (2, 5) | `talking-head-recut` | `video-use` | Preset talking, người nói nhìn camera | Không |
| Đo màu & Áp lựa chọn màu của Dũng | Pha 0–1 (3) | `color_engine.py` + 3 lựa chọn màu (`workflow/03-mau.md`, `color-pipeline.md`) | `media-use --type lut/grade` | Luôn hỏi Dũng 3 lựa chọn (giữ gốc / theo mẫu / ≤3 LUT kho); không trả lời → giữ gốc | Không |
| Che địa chỉ tự động | Pha 1 (2b) | Quét 0.5s + `ffmpeg boxblur` tracking | `blur_plates.py` | Chạy đồng thời trên từng clip; 0 khung lộ địa chỉ | Không |
| Đánh dấu mốc chữ hook (`moments.json`) | Pha 1 (4) | Transcript `word_id` + Thẻ phong cách | `virality_predictor` (G) | Tổ Âm thanh kiểm chéo ngay trước khi làm SFX | G: Có |
| MG / Kinetic Type (3 pha Editor Pro) | Pha 1 (5) | `motion-graphics` + `textfx-kit/recipes/` | `hyperframes-animation` | Sửa ngay từng mốc khi dựng (trích 3 khung `vào/đỉnh/nghỉ` ngay tại chỗ) | Không |
| Keyframe / Camera giả (mặc định TẮT) | Pha 1 (5) | `hyperframes-keyframes` | `remotion-best-practices` | CHỈ khi Dũng đồng ý từng trường hợp (hỏi trước kèm mốc giây + lý do) | Không |
| Chuyển cảnh / Match cut | Pha 1 (5) | `cut-the-curve`, `seam-craft` (C) | `hyperframes-animation` | Nói hết câu mới chuyển cảnh (`≥0.1s` sau từ cuối) | Không |
| Khối registry | Pha 1 (5) | `registry\blocks` (C) | `hyperframes-registry` | Hiệu ứng có tên phổ biến chuẩn giới Editor | Không |
| Chuẩn timing/easing (3 pha In-Hold-Out) | Pha 1 (5) | `motion-design` | `motion-doctrine` (C) | Mọi hiệu ứng chữ/MG/VFX/chuyển cảnh | Không |
| Phụ đề (T0) & Nhãn (T1) | Pha 1 (5) | `embedded-captions` (`Be Vietnam Pro`) | `remotion-captions`; `captions-overlay` (C) | Phẳng, trắng + viền đen 3–4px, KHÔNG hiệu ứng, KHÔNG SFX | Không |
| Bản đồ MG kiểu Google Maps | Pha 1 (5b) | Overpass OSM + SVG/MapLibre (`references/ban-do.md`) | `remotion-maps` | Chạy đồng thời khi lời nói về vị trí/tiện ích; pin lệch 80–150m | Không |
| BGM (Bắt buộc) | Pha 1 (6) | Thư viện nhạc cục bộ | `media-use --type bgm` → `tiktok_music_trending` | Bắt tai từ giây đầu, không át giọng, cấm tổng hợp bằng code | media-use: ?; G: Có |
| SFX Chữ Hook (T2–T3) | Pha 1 (6) | `sfx-catalog` + `sfx_plan.py` / `sfx_render.py` (863 file) | `media-use --type sfx` | Chỉ chữ hook + chuyển động MG; kiểm & sửa ngay từng mốc | Không |
| Ducking / Mix & Đo LUFS | Pha 1 (6) | `sfx_mix.py` + `ffmpeg ebur128` + `sfx_audit.py` | `hyperframes-audio` | Đo thật ngay khi trộn (`giọng ≈ -14`, `BGM -18…-22`, `peak ≤ -1 dBTP`) | Không |
| Tách nền (Text Behind Subject) | Pha 1 (5) | `hyperframes-cli remove-background` | `remove_background` (G) | Tối đa 1 lần/video ở hook đầu, không che mặt | G: Có |
| Kiểm nhanh tổng thể (`≥ 98/100`) & Vá cục bộ | Pha 2 (7) | `hoang-dung-agent-orchestrator` + Contact Sheet tổng hợp | `ffmpeg` trích khung nhanh | Đạt `≥ 98/100` bàn giao ngay kèm chi tiết; lỗi đâu sửa cục bộ ngay đoạn đó | Không |
| Render bản cuối H.265 60fps | Pha 2 (7) | `hyperframes-cli --quality delivery` → `ffmpeg libx265` | `remotion-render` | Xuất đúng 1 lần 1 file 9:16 H.265 dùng chung TikTok, Shorts, Reels | Không |

## Thư viện hỗ trợ MG (chi tiết, lệnh cài, giới hạn: `repos.md`)
| Nhu cầu | HyperFrames (mặc định) | Remotion | Không dùng |
|---|---|---|---|
| Chuyển động chữ/MG | GSAP (skill `gsap-*`) | `remotion-markup` + `interpolate` | `motion` (không adapter seek) |
| Code anime có sẵn | `anime.js` v4 (`adapters/animejs.md`) | — | — |
| After Effects / Lottie | `dotlottie-web` (`adapters/lottie.md`) | `@remotion/lottie` (hỏi trước) | — |
| 3D (chỉ khi Dũng chỉ định) | `three.js` (`adapters/three.md`) | `@remotion/three` + R3F | `rapier`, `motion-canvas` |
| Âm thanh | `hyperframes-audio` / `sfx_mix.py` | `<Audio>` | `howler.js` (thời gian thực) |

## Đường dẫn nhóm C
- `~\.claude\plugins\cache\hyperframes\hyperframes\0.8.162\.claude\skills\` → `cut-the-curve`, `seam-craft`, `motion-doctrine`, `captions-overlay`, `oversized-cursor`, `changelog-video`
- `~\.claude\plugins\cache\hyperframes\hyperframes\0.8.162\registry\blocks\`
Đọc theo đường dẫn, không gọi bằng tên, không sửa file trong cache.
