# Font, màu chữ, hiệu ứng chữ và SFX cho chữ hook

Tra cứu ngày 02/11/2026. Nguồn là blog, trang công cụ và trang hỗ trợ, không phải nghiên cứu độc lập. Không có số liệu chứng minh font hay hiệu ứng nào tạo ra nhiều khách hơn, nên mọi mục dưới đây là **mặc định đề xuất**. Muốn nâng thành luật thì test A/B trên kênh Dũng (thời gian xem, tỉ lệ xem hết, tin nhắn/cuộc gọi).

Nhãn: **[D]** = luật Dũng chốt (thắng mọi nguồn). **[S#]** = có nguồn ở mục 9. **[Tính]** = suy ra bằng tính toán. **[Chưa xác minh]** = chưa có bằng chứng.

## 1. Ba vai chữ (Dũng chốt 02/11/2026) [D]
| Vai | Bậc | Hiệu ứng | SFX |
|---|---|---|---|
| Phụ đề | T0 | Mặc định: Không (fade ≤0.15s). Khi chọn Phụ đề động: dùng CAP-01..CAP-06 (R-L039) | Không |
| Nhãn (địa chỉ, tên, tên tiện ích, nhãn bản đồ) | T1 | Không | Không |
| Chữ hook (hook đầu, giá, diện tích/kết cấu, điểm mạnh, pháp lý, CTA đúng lời nói) | T2–T3 | Có (mục 4–5) | Có (mục 6) |

## 2. Font
Mỗi video tối đa 2 font: 1 font display cho chữ hook + Be Vietnam Pro cho phụ đề/nhãn. Nhiều nguồn khuyên dùng 1–2 font và giao mỗi font một việc [S1][S2].

| Font | Dùng cho | Dẫn chứng | Tiếng Việt |
|---|---|---|---|
| Be Vietnam Pro (SemiBold/ExtraBold) | Phụ đề, nhãn | Thiết kế riêng cho dấu tiếng Việt [S11] | Có (theo mô tả nhà thiết kế) |
| Anton | Hook, từ khóa đơn, giá | Ultra-bold condensed, "maximum-impact single words" [S1] | Có: mô tả Anton ghi phủ đầy đủ tiếng Việt [S10] (bản sao kho Google Fonts, chưa kiểm trên fonts.google.com) |
| SVN-Bebas Neue Bold | Hook chữ hoa, đếm số | Bebas Neue: chữ hoa condensed, hợp hook; không hợp phụ đề nhỏ dưới ~24px [S3] | Bản Bebas Neue gốc [Chưa xác minh]; bản SVN đã có trong `fonts/files/`, vẫn qua cổng |
| Montserrat Black (900) / Bold (700) | Hook, giá, từ đơn | Phổ biến nhất cho TikTok/Reels; Black cho tiêu đề từ đơn, Bold cho caption [S1][S2][S3] | Có file trong `fonts/files/`; vẫn qua cổng |
| Barlow Black, FZ Poppins SemiBold | Phương án thay thế | Poppins: bold sans thân thiện [S1] | Qua cổng |
| Playfair Display Italic | Chữ tâm sự (L10), câu trích | Serif làm điểm nhấn cho quote/title card [S2] | Qua cổng |

- Tránh: font mảnh, script, trang trí cho chuỗi chữ dài. Chữ hoa trang trí chỉ dùng cho một từ nhấn [S4].
- **Mọi font phải chạy `scripts/vn_font_gate.py` trước khi dùng** [D]. Font đã nằm trong `fonts/files/` là font đã qua cổng; font mới chưa qua thì không dùng.
- Font theo video mẫu: lấy font giống mẫu nhất từ phiếu font nhưng vai vẫn theo bảng mục 1 [D].

## 3. Màu chữ
- **Phụ đề:** trắng + viền đen 3–4px, bóng mềm bổ trợ 30–50% độ mờ [S4][S5][S7][S9]. Sans đậm với viền là cách phổ biến cho TikTok/Reels/Shorts [S4][S6].
- **Màu nhấn:** vàng (có viền đen) cho từ khóa hoặc nội dung năng lượng cao [S4][S6][S8]. Với Hoàng Dũng, màu nhấn chính là **vàng gold thương hiệu** [D]. Mã màu lấy từ thẻ thương hiệu/phiếu font đã có; không đoán mã hex.
- **Nguyên tắc phối màu đa dạng & hài hòa 60–30–10 (`R-L040`):** Không cố định 1 màu vàng cho mọi video. Trích xuất màu nhấn từ chính cảnh quay (Tone ấm dùng Vàng champagne/Mật ong, Tone lạnh dùng Xanh mint/Cam san hô, Sang trọng dùng Metallic Gold Chrome). Khung viền chỉ dùng kính mờ Glassmorphism (`backdrop-filter: blur(16px)` + viền mỏng 1px bo góc 16px), CẤM hộp chữ nhật đen đặc. Chi tiết: `asset/phong_cach/trang_tri_text/INDEX.md` (`DEC-01..DEC-12`). [D]
- **Tránh** đỏ, xanh lá, xanh dương làm màu chữ chính: tương phản kém trên nhiều nền và khó với người mù màu [S6].
- **Màu thương hiệu** không ép làm màu chữ chính nếu không đủ tương phản trên nền video [S7].
- **Không khung/hộp nền tối sau chữ** [D]. Một nguồn xếp hộp nền là cách dễ đọc nhất, viền đứng thứ hai [S5]; vì bỏ hộp nên **viền + bóng + làm tối nhẹ cục bộ bằng gradient mỏng** là bắt buộc, và phải đo tương phản.
- **Ngưỡng tham chiếu:** tỉ lệ tương phản 4.5:1 cho chữ thường, 3:1 cho chữ lớn (hướng dẫn WCAG của W3C, trích lại ở [S14]). Đo trên khung thật tại thời điểm chữ hiện, ở trạng thái nghỉ. Glow và bóng không thay được tương phản [S14][S15].
- Phụ đề mặc định giữ màu trắng viền đen; khi chọn Chế độ Phụ đề động (`R-L039`): áp dụng đổi màu vàng gold `#FFD700` theo từ đang nói (`CAP-01 Karaoke`) hoặc highlight từ khóa quan trọng (`CAP-03`). [D]

## 4. Hiệu ứng chữ hook thường dùng
Các họ phổ biến trong template và hướng dẫn: nảy/pop, đánh máy (typewriter), phóng/nổ (scale-slam), glitch/RGB split, sóng, xoay 3D, reveal có mặt nạ [S20][S21][S22]. Thư viện chi tiết và công thức: `05-thu-vien-hieu-ung.md`. Giới hạn của Dũng: tối đa 2 họ/video; hiệu ứng nặng (glitch, 3D) chỉ cho T3, không dùng lên số giá/diện tích đang chạy.

## 5. Hiệu ứng màu và hình dạng chữ (chỉ chữ hook)
**Glow (phát sáng)**
- Cách làm: nhiều lớp bóng cùng màu với bán kính tăng dần, cường độ giảm dần [S27]. Trong dựng phim: Soft Glow/Bloom, chỉnh gain và size nhẹ.
- Glow chỉ là trang trí, không đảm bảo đọc được [S14][S15]. Bật glow quá mạnh trên nền sáng làm hình như có sương [S16].
- Quy tắc: glow đơn sắc (trắng ấm hoặc vàng gold), mềm; vẫn giữ viền chữ; font đậm (nét mảnh bị glow nuốt) [S27]; tối đa 1 chữ có glow trong một khung; thử giảm 30–50% cường độ rồi so lại [S16]. Neon nhiều màu cấm [D]; neon nhấp nháy chỉ khi Dũng chọn style hype.

**Chữ âm bản (difference/negative)**
- Cách làm: chữ trắng, chế độ hòa trộn **Difference**, đặt trên video [S12][S13]. Trong HyperFrames/Remotion dùng `mix-blend-mode: difference` [S26].
- Màu chữ = nghịch đảo màu nền tại điểm đó. **Rủi ro [Tính]:** trên nền xám trung bình (~50%) chữ và nền gần như cùng màu nên chữ biến mất.
- Quy tắc: chỉ dùng trên vùng nền rõ tối hoặc rõ sáng; tối đa 1 mốc/video; ≤1s; chữ ngắn (1–3 từ); đo tương phản ở trạng thái nghỉ, dưới 3:1 thì đổi sang trắng + viền.

**Chữ sau người (text behind subject)**
- Cách làm: nhân đôi video, tách nền lớp trên, đặt chữ ở giữa [S23]. HyperFrames có `remove-background`.
- Quy tắc: tối đa 1 lần/video (hook đầu); không che mặt; chỉ khi tách nền sạch.

**Dải ánh vàng quét (gradient sweep)** và đếm số (count-up): giữ như `05` (họ C, D), quét 1 lần khi số đã nghỉ.

**Vệt mờ (trail)**: chỉ cho một từ đơn; nhiều từ thì thành bùn [S19].

## 6. SFX cho chữ hook
- Cấu trúc nên có: tiếng vút ngắn dẫn vào, rồi tiếng va/pop đúng khung chữ chạm [S17][S18]. Căn đỉnh âm thanh với khung chữ kết thúc chuyển động [S17].
- Hướng tiếng vút theo hướng chữ bay vào [S17].
- Tiết chế: không rải SFX khắp video [S24]. Đúng với quyết định của Dũng: chỉ chữ hook.
- Độ to, ducking, trộn, chấm 100/100: giữ như `textfx-kit/references/08-sfx.md` (SFX thấp hơn giọng 1–6 dB; nổi ≥4,5 dB trên nhạc) [D].
- Mỗi mốc: 1 âm dẫn + tối đa 1 lớp phụ. Glitch chỉ khi style hype [D].

## 7. Mặc định theo mốc hook
| Mốc | Font | Màu | Hiệu ứng | Ghi chú |
|---|---|---|---|---|
| L1 Hook đầu | Anton / SVN-Bebas / Montserrat Black | trắng + viền đen; từ khóa vàng gold | slam / kinetic build | glow nhẹ ở từ khóa được; âm bản hoặc chữ-sau-người dùng ở mốc này nếu muốn (1 lần/video) |
| L2 Giá | Montserrat Black / Anton | vàng gold | count-up + ánh vàng quét 1 lần | không glitch/âm bản khi số đang chạy; giữ ≥1.4s |
| L3 Diện tích/kết cấu | SVN-Bebas / Montserrat | trắng/vàng | ticker dọc, gạch chân vẽ nét | gom 1 lần |
| L5 Điểm mạnh | Montserrat Bold/Black | đổi sang vàng đúng từ nói | spring pop + glow nhẹ | cụm 1–3 từ |
| L7 Pháp lý | Montserrat Bold | trắng + viền mảnh vàng | stamp, đứng yên | không glow |
| L9 CTA (đúng lời nói) | Montserrat Black | trắng/vàng | build gọn rồi giữ yên | không logo/slogan thêm |
| L10 Tâm sự | Playfair Display Italic | trắng ấm | blur-resolve | không glow, không glitch |

## 8. Kiểm trước khi trình
- Tương phản chữ đo trên khung thật ≥ ngưỡng ở mục 3; dưới ngưỡng thì tăng viền/bóng hoặc đổi màu, không tăng glow.
- Dấu tiếng Việt đủ ở trạng thái nghỉ (cổng `vn_font_gate.py` + xem khung).
- Phụ đề và nhãn không có hiệu ứng/SFX; chữ hook đều có SFX.
- Âm bản, chữ-sau-người: mỗi loại ≤1 lần/video.

## 9. Nguồn
- S1 Made Good Designs, font TikTok: https://madegooddesigns.com/?p=7189
- S2 Made Good Designs, font Reels: https://madegooddesigns.com/?p=7192
- S3 Design Your Way, font TikTok: https://www.designyourway.net/blog/best-fonts-for-tiktok/
- S4 BlitzCut, caption chuyên nghiệp (màu, viền, cỡ): https://blitzcutai.com/blog/how-to-make-captions-look-professional
- S5 BlitzCut, hộp nền vs viền vs bóng: https://blitzcutai.com/blog/caption-background-vs-outline-vs-shadow
- S6 BlitzCut, caption cho Shorts 2026: https://blitzcutai.com/blog/best-caption-style-youtube-shorts-2026
- S7 OpenClip, hướng dẫn màu caption: https://openclip.app/guides/caption-color-guide
- S8 Cloudinary, chữ tương phản/viền vàng: https://cloudinary.com/documentation/accessible_media_visual_audio_clarity_text
- S9 Checksub, màu phụ đề: https://www.checksub.com/blog/the-best-subtitle-colors
- S10 Mô tả Anton (bản sao kho Google Fonts): https://secret.blahaj.dedyn.io/misc/Fonts/fonts-main/ofl/anton/DESCRIPTION.en_us.html
- S11 Fontsource, Be Vietnam Pro: https://fontsource.org/fonts/be-vietnam-pro/about
- S12 Captions.ai, hiệu ứng chữ âm bản: https://captions.ai/blog/how-to-make-the-trending-negative-text-effect-for-videos
- S13 Larry Jordan, Reversed Text (Difference): https://larryjordan.com/articles/technique-reversed-text-effect/
- S14 MacMyths, glow bằng CSS và ngưỡng WCAG: https://macmyths.com/how-to-create-glowing-effects-with-css/
- S15 Venngage, cảnh báo hiệu ứng chữ: https://help.venngage.com/hc/en-us/articles/18381199895821-Adding-Text-Effects
- S16 Cursa, hiệu ứng CapCut không lạm dụng: https://cursa.app/en/page/basic-effects-in-capcut-clean-enhancements-without-overprocessing
- S17 Pixflow, âm thanh cho chuyển động đồ họa: https://pixflow.net/blog/?p=91262
- S18 Morphic, tiếng pop: https://morphic.com/tr/resources/sounds/pop-sound-effect
- S19 Oakgen, kỹ thuật kinetic typography (vệt mờ): https://oakgen.ai/blog/kinetic-typography-without-after-effects
- S20 Filmora, các kiểu kinetic typography: https://filmora.wondershare.com/video-editing-tips/kinetic-typography.html
- S21 FreeVisuals, mẫu chữ động TikTok/Reels: https://www.freevisuals.net/post/top-5-artlist-motion-templates-for-viral-tiktok-reels
- S22 Envato, mẫu chữ glitch: https://elements.envato.com/text-animation-WN8WVB5
- S23 Recapio, hiệu ứng chữ CapCut (neon, chữ sau người): https://recapio.com/digest/11-best-free-text-effects-in-capcut-tutorial-by-matt-loui
- S24 Info Shortform, SFX cho clip ngắn: https://info-shortform-studio.pages.dev/article/sound-effects-that-elevate-basic-clipsfree-resources
- S26 CSS mix-blend-mode (difference): https://generalistprogrammer.com/glossary/css-mix-blend-mode
- S27 RAXXO, glow và neon (độ đậm, lạm dụng): https://raxxo.shop/blogs/lab/neon-aesthetics-in-web-design-beyond-the-trend
