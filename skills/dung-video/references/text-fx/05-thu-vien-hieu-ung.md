# Thư viện hiệu ứng chữ

Chia theo **họ** để giữ thống nhất. Một video chọn tối đa 2 họ. Cột "Công cụ" trỏ tới thứ ĐÃ có trên máy; công thức chi tiết nằm ở đó, không chép lại.

## 1. Họ hiệu ứng
| Họ | Cảm giác | Hiệu ứng tiêu biểu | Công cụ trên máy | Bậc | Phù hợp BĐS |
|---|---|---|---|---|---|
| **A. Reveal mượt** | sang, tin cậy | soft-blur-in / focus-blur-resolve, mask-reveal-up, fade-through, shared-axis | `animate-text` (24 hiệu ứng có tên), `hyperframes-animation/techniques.md` #12 clip-path mask | T1–T2 | Rất hợp: vị trí, pháp lý, tâm sự |
| **B. Nhịp & nhấn** | mạnh, có năng lượng | kinetic-center-build, spring-scale-in, kinetic-beat-slam, press-release-spring, spring-pop-entrance | rules `kinetic-beat-slam`, `spring-pop-entrance`, `press-release-spring`; `animate-text` | T2–T3 | Hook, điểm mạnh, CTA |
| **C. Sáng & màu** | khao khát, cao cấp | gradient-text-sweep (ánh vàng quét), shimmer-sweep, ambient-glow-bloom, asr-keyword-glow | rules `gradient-text-sweep`, `ambient-glow-bloom`, `asr-keyword-glow` | T2–T3 | Giá, điểm mạnh, tên dự án |
| **D. Số liệu** | chính xác, dễ nhớ | count-up, vertical-spring-ticker, stat-bars-and-fills | rules `counting-dynamic-scale`, `vertical-spring-ticker`, `stat-bars-and-fills` | T2–T3 | Giá, diện tích, số phòng |
| **E. Nét & bản đồ** | dẫn đường | svg-path-draw (vẽ line, pin), waterfall-entry (danh sách nối dòng), icon SVG | rules `svg-path-draw`, `waterfall-entry`, `svg-icon-enrichment` | T1 | Vị trí, tiện ích, thời gian di chuyển |
| **F. Chiều sâu** | ấn tượng điện ảnh | depth-parallax-words, 3d-text-depth-layers, depth-of-field-blur, motion-blur-streak | rules cùng tên; `animate-text/depth-parallax-words` | T3 (hiếm) | Hook điện ảnh / dự án lớn; dùng nhẹ |
| **G. Cá tính mạnh** | trẻ, hype | chromatic-glitch / RGB split, offset text, stomp, thunder | rule `chromatic-glitch`; `embedded-captions` themes (`stomp`, `thunder`, `laser`…) | T3 (rất hiếm) | CHỈ khi Dũng muốn phong cách trẻ/hype. Không dùng cho giá hoặc video thấu hiểu |

Ghi chú nguồn: các nhóm glitch, RGB, offset, line, reveal blur, nhịp scale đều xuất hiện trên trang Envato text presets; các nhóm khác tổng hợp từ bài kinetic typography công khai và thư viện cục bộ.

## 2. Gợi ý cặp họ theo loại video
| Loại video | Họ chính | Họ phụ |
|---|---|---|
| BĐS review tiêu chuẩn | **B + C** | E cho bản đồ |
| BĐS cao cấp / dự án lớn | **A + C** | F ở hook |
| Kể chuyện / tâm sự / thấu hiểu khách | **A** | D khi có số |
| Promo trẻ, tốc độ nhanh | **B + G** | D |
| Giáo dục / môi giới chia sẻ | **A + D** | E |

## 3. Chọn công cụ theo engine
| Việc | HyperFrames | Remotion |
|---|---|---|
| Phụ đề/chữ theo lời | `embedded-captions` (35 mẫu, có `CATALOG.md`) | `remotion-captions` |
| Hiệu ứng chữ tùy biến | rules trong `hyperframes-animation`, GSAP adapter | `remotion-markup` (+ `@remotion/effects`, `@remotion/transitions`) |
| Tên hiệu ứng có spec sẵn | `animate-text` (cài riêng bằng lệnh của skill này; hỏi Dũng trước khi cài) | tự viết theo mô tả |
| 3D chữ | adapter `three.md` | `remotion-markup/3d.md` (cần `@remotion/three`, hỏi trước khi cài) |
| Lottie | adapter `lottie.md` | `remotion-markup/lottie.md` (cần `@remotion/lottie`) |

## 4. Công thức mặc định hay dùng (BĐS)
| Mốc | Công thức |
|---|---|
| Hook | Họ B: từ khóa vào bằng `kinetic-center-build` hoặc `slam` đúng nhịp từ nói; nền chữ có bóng mềm; SFX hit + riser ngắn trước. |
| Giá | Họ D+C: số đếm lên (0.6–0.9s) rồi dừng; ánh vàng quét 1 lần ngay khi số nghỉ; giữ ≥ 1.4s. |
| Diện tích/kết cấu | Họ D: số xuất hiện bằng ticker dọc, gạch chân vàng vẽ nét dưới số. |
| Điểm mạnh | Họ C: cụm 1–3 từ sáng lên + scale 1.0 → 1.08 đúng lúc nói rồi về mức nghỉ; đổi sang vàng. |
| Tiện ích | Họ E: từng dòng nối nhau (waterfall) + icon SVG vẽ nét. |
| Pháp lý | Họ B nhẹ: `press-release-spring` kiểu đóng dấu, viền mảnh vàng, đứng yên rõ. |
| CTA | Họ A/B gọn: build một nhịp rồi giữ yên, chữ đúng câu người dẫn nói. |

## 5. Lỗi tiếng Việt phải tránh khi dùng hiệu ứng
- Mask/`overflow:hidden` cắt dấu: cộng padding 0.2em trở lên hoặc gỡ clip khi hiệu ứng xong; kiểm khung nghỉ.
- Tách theo ký tự làm rời dấu: tách theo từ hoặc theo cụm ký tự đã ghép (grapheme), không tách codepoint.
- `background-clip:text` cắt dấu chồng: padding trên ≈ 0.34em.
- Chữ in hoa toàn bộ + dấu kép (Ệ, Ấ…) cần line-height ≥ 1.25.
- Glitch/RGB split làm dấu dính vào nhau: chỉ dùng ở T3, chữ ngắn, có khung nghỉ sạch.
- Typewriter chậm: chỉ dùng cho tâm sự (L10), mỗi ký tự ≤ 45ms.
