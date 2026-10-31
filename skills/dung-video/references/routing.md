# Bảng định tuyến

Credit: **Có** = tốn credit/API trả phí → PHẢI hỏi Dũng trước. **?** = có thể cần đăng nhập HeyGen → hỏi trước.
Nhóm C, H và thư viện SFX nằm trên máy Dũng: kiểm `Test-Path` khi chạy; không có → ghi `missing`, dùng dự phòng.

| Chức năng | Giai đoạn | CHÍNH | DỰ PHÒNG | Kích hoạt khi | Credit |
|---|---|---|---|---|---|
| Nạp thói quen | 0 | sổ `HDRE_Library/training/rules.md` (vòng tự học của hoang-dung-auto-style-learner) | memory dự án (chỉ đọc) | mọi lần /video | Không |
| Sơ đồ phân công, kiểm 3–5 vòng | 0, 7 | hoang-dung-agent-orchestrator | — | mọi lần /video | Không |
| Brief | 1 | ffprobe + presets.md | hyperframes (brief-contract) | mọi lần | Không |
| Phân tích video mẫu, chuẩn MG/SFX | 1, 4 | hoang-dung-viral-style-scout (Chế độ B) | video_analysis_create (G) | có video mẫu | G: Có |
| Chép lời | 2 | video-use (transcribe) | hyperframes-cli `transcribe` | có giọng nói | Không |
| Cắt / chọn take | 2 | video-use | herk-edit-kit (H) | footage nhiều take | Không |
| Recut người nói + overlay | 2, 5 | talking-head-recut | video-use | preset talking, người nói nhìn camera | Không |
| Chỉnh màu / LUT | 3 | AI đo footage rồi chọn: video-use grade; LUT DJI V1.0 chỉ khi đo ra D-Log | media-use `--type lut/grade` | luôn (không mặc định LUT) | Không |
| Đánh dấu cảnh quan trọng | 4 | transcript + Thẻ phong cách (viral-style-scout / auto-style-learner) | virality_predictor (G) để kiểm hook | luôn | G: Có |
| MG / kinetic type | 5 | motion-graphics | hyperframes-animation, higgsfield-motion | mốc giá/số liệu/vị trí | Không |
| Keyframe / camera / punch-in | 5 | hyperframes-keyframes | remotion-best-practices | nhấn ý, shot dài cần nhịp | Không |
| Chuyển cảnh / match cut | 5 | cut-the-curve, seam-craft (C) | hyperframes-animation, higgsfield-motion-saas | mọi điểm cắt giữa cảnh | Không |
| Khối registry | 5 | registry\blocks (C, 7 khối title/camera) | hyperframes-registry | hiệu ứng có tên sẵn | Không |
| Quy trình chuyển động | 4–5 | `references/motion.md` | — | mọi MG, animation | Không |
| Chuẩn timing/easing | 5 | motion-design | motion-doctrine (C) | mọi MG | Không |
| Phụ đề | 5 | embedded-captions | remotion-captions; captions-overlay (C) | có lời thoại | Không |
| Định hướng hình ảnh/nhịp | 5 | hyperframes-creative | hyperframes-core | preset promo/explainer | Không |
| BGM | 6 | thư viện nhạc cục bộ | media-use `--type bgm` → tiktok_music_trending/tune → generate_audio | luôn (bắt buộc) | media-use: ?; G: Có |
| SFX | 6 | sfx-catalog + sfxlib.py (863 file) | media-use `--type sfx` | mọi chữ + cảnh quan trọng | Không |
| Ducking / mix | 6 | hyperframes-audio | ffmpeg sidechaincompress | luôn | Không |
| Đo LUFS | 6 | ffmpeg ebur128 | — | trước mọi render | Không |
| Đổi khung 9:16 / 16:9 | 1, 7 | ffmpeg crop/pad theo bố cục | reframe (G) | Dũng yêu cầu khung khác gốc | G: Có |
| Upscale | 7 | — (giữ thông số gốc) | upscale_video (G) | nguồn < 1080p và Dũng đồng ý | Có |
| Tách nền | 5 | hyperframes-cli `remove-background` | remove_background (G) | chữ chìm sau người | G: Có |
| Dự đoán độ viral | 7 | virality_predictor (G) | — | Dũng yêu cầu | Có |
| QA | 7 | hoang-dung-agent-orchestrator + `hyperframes check --snapshots` | ffmpeg trích khung | luôn | Không |
| Preview 720p | 7 | hyperframes-cli `--quality draft` / hyperframes-studio | remotion-studio | luôn | Không |
| Render cuối H.265 | 7 | hyperframes-cli `--quality delivery` → ffmpeg libx265 | remotion-render | sau khi Dũng duyệt | Không |

## Thư viện hỗ trợ MG (chi tiết, lệnh cài, giới hạn: `repos.md`)
| Nhu cầu | HyperFrames (mặc định) | Remotion | Không dùng |
|---|---|---|---|
| Chuyển động chữ/MG | GSAP (skill `gsap-*`) | `remotion-markup` + `interpolate` | motion (không adapter seek) |
| Code anime có sẵn | anime.js v4 (`adapters/animejs.md`) | — | — |
| After Effects / Lottie | dotlottie-web (`adapters/lottie.md`) | `@remotion/lottie` (chưa cài) | — |
| 3D (không bắt buộc; AI tự quyết theo nội dung hoặc Dũng chỉ định) | three.js (`adapters/three.md`) | `@remotion/three` + R3F (+ drei, postprocessing) | rapier (vật lý khó seek), motion-canvas (engine thứ 3) |
| SVG icon/bản đồ | svgo làm gọn (chưa cài) | svgo | — |
| Âm thanh | `hyperframes-audio` | `<Audio>` | howler.js (phát thời gian thực) |

## Nguồn dùng theo preset (không phải bước mặc định)
| Nguồn | Khi dùng |
|---|---|
| music-to-video | preset music |
| slideshow | footage chủ yếu là ảnh |
| faceless-explainer | preset explainer không có người |
| product-launch-video, pr-to-video | preset promo có URL/brief sản phẩm |
| general-video | video dài/nhiều cảnh không khớp preset nào |
| figma | Dũng đưa thiết kế Figma |
| remotion-to-hyperframes | chuyển dự án Remotion cũ sang HyperFrames |
| media-use | lấy ảnh/icon/logo/LUT cho MG |
| remotion-create, -multimedia, -markup, -maps, -interactivity, -docs, -saas, -upgrade, -studio | chỉ khi engine = Remotion (xem engines.md) |
| oversized-cursor, changelog-video (C) | không dùng cho BĐS; chỉ khi video quay màn hình |
| herk-edit-kit (H) | đọc `~\Downloads\herk-edit-kit\README*` trước; dùng theo đúng README |

## Đường dẫn nhóm C
- `~\.claude\plugins\cache\hyperframes\hyperframes\0.8.162\.claude\skills\` → cut-the-curve, seam-craft, motion-doctrine, captions-overlay, oversized-cursor, changelog-video
- `~\.claude\plugins\cache\hyperframes\hyperframes\0.8.162\registry\blocks\`
Đọc theo đường dẫn, không gọi bằng tên, không sửa file trong cache.
