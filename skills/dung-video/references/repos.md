# 19 repo công nghệ — dùng khi nào, nạp thế nào

Kiểm 2026-10-23 bằng: README gốc trên GitHub (raw.githubusercontent.com), `npm view <gói> version`, file thật trên máy.
Chỉ ghi điều xác minh được; chỗ không chắc ghi [chưa xác minh]. Cài/clone/`npx skills add`/`remotion add` → HỎI Dũng trước (luật cứng 6).
Luật render chung: mọi chuyển động phải **định thời theo khung, seek được** (HyperFrames: GSAP timeline / `hf-seek`; Remotion: `useCurrentFrame()`). Không dùng đồng hồ thời gian thực, không `autoplay`, không random không seed. 3D và Lottie render **từng khung** theo thời gian timeline.

## Bảng đối chiếu
| Lớp | Repo | Trên máy (đã kiểm) | Bản mới nhất (npm) | Giai đoạn /video | Engine chạy được |
|---|---|---|---|---|---|
| Agent skill | remotion-dev/skills | 12 skill `remotion-*` (best-practices, captions, create, docs, interactivity, maps, markup, multimedia, render, saas, studio, upgrade) — khớp danh sách README; ghi `version: 4.0.536` | remotion 4.0.538 | 1, 5, 7 (khi engine = Remotion) | Remotion |
| Agent skill | motiondivision/ai-kit | skill `motion` (best-practices, codex, css-spring, performance-audit, transition-preview) — phiên bản [chưa xác minh] | cài bằng `npx motion-ai` (README) | 5 (tham khảo easing/spring) | — (kiến thức) |
| Agent skill | greensock/gsap-skills | 8 skill `gsap-*` (core, frameworks, performance, plugins, react, scrolltrigger, timeline, utils) | gsap 3.15.0 | 5 | HyperFrames (GSAP) |
| Design | svg/svgo | chưa có | 4.1.0 | 5 (làm gọn SVG icon/logo/bản đồ trước khi animate) | công cụ dòng lệnh, ngoài engine |
| Design | vercel/satori | chưa có | 0.63.2 | 7 (ảnh tĩnh: thẻ, thumbnail từ JSX→SVG) [chưa xác minh hợp dùng cho BĐS] | Node, ngoài engine |
| Animation | greensock/GSAP | gsap 3.14.2 trong `dung-video/assets/textfx-kit/vendor/` và node_modules các kit | 3.15.0 | 5 | HyperFrames (mặc định) |
| Animation | juliangarnier/anime | adapter `hyperframes-animation/adapters/animejs.md`; gói chưa cài | animejs 4.5.0 | 5 (code anime có sẵn) | HyperFrames (`window.__hfAnime`, `autoplay:false`) |
| Animation | motiondivision/motion | chưa có gói | motion 14.6.0 | 5 [chưa xác minh có adapter seek] | không có adapter HyperFrames trong `runtimes.md` → ưu tiên GSAP |
| Animation | rive-app/rive-wasm | chưa có | @rive-app/canvas 2.45.1 | 5 [chưa xác minh] | không có trong bảng runtime HyperFrames → chỉ dùng nếu vẽ canvas từ `hf-seek` [chưa xác minh] |
| Animation | LottieFiles/dotlottie-web | adapter `hyperframes-animation/adapters/lottie.md`; `remotion-markup/lottie.md`; gói chưa cài | @lottiefiles/dotlottie-web 0.81.0 | 5 | HyperFrames (`window.__hfLottie`), Remotion (`@remotion/lottie` 4.0.538, chưa cài) |
| Video | remotion-dev/remotion | `HDRE AI\my-video` 4.0.536 | 4.0.538 | toàn luồng khi engine = Remotion | Remotion |
| Video | motion-canvas/motion-canvas | chưa có | @motion-canvas/core 3.17.2 | KHÔNG dùng | trùng vai engine; luật chọn engine 1 lần (engines.md) |
| 3D | mrdoob/three.js | `HDRE AI\my-video` three 0.186.1; adapter `hyperframes-animation/adapters/three.md` | 0.186.1 | 5 (chỉ khi Dũng chỉ định 3D) | HyperFrames (`hf-seek` + `data-duration` bắt buộc), Remotion (`@remotion/three`) |
| 3D | pmndrs/react-three-fiber | `HDRE AI\my-video` 9.8.2 | 9.8.2 | 5 (3D trong Remotion) | Remotion (`@remotion/three` → `<ThreeCanvas>`) |
| 3D | pmndrs/drei | chưa có | @react-three/drei 10.7.9 | 5 | Remotion + R3F |
| 3D | pmndrs/react-three-rapier | chưa có | @react-three/rapier 2.2.0 | KHÔNG dùng mặc định | mô phỏng vật lý chạy theo bước thời gian riêng → khó seek đúng khung [chưa xác minh cách khóa bước] |
| 3D | pmndrs/react-postprocessing | chưa có | @react-three/postprocessing 3.2.2 | 5 | Remotion + R3F |
| Âm thanh | goldfire/howler.js | chưa có | howler 2.2.4 | KHÔNG dùng để dựng | phát âm thanh thời gian thực trên web; âm thanh video đi qua `hyperframes-audio` / `<Audio>` để mix và đo LUFS |
| Xuất bản | FFmpeg/FFmpeg | ffmpeg/ffprobe 9.0.2 (full build) | — | 1, 3, 6, 7 | mọi engine (đo ffprobe/ebur128, LUT, H.265) |

## Từng repo — dùng khi nào, nạp thế nào, cần làm trước
- **remotion-dev/skills** — Nguồn: README "Remotion Agent Skills", lệnh `npx skills add remotion-dev/skills`. Đã cài 12 skill (4.0.536); bản npm 4.0.538 → chênh 2 bản vá. KHÔNG cài đè; muốn cập nhật thì hỏi Dũng (`remotion-upgrade`).
- **motiondivision/ai-kit** — Nguồn: README, lệnh `npx motion-ai` (Motion+: `npx motion-ai --plus`, trả phí). Cài skill `/motion` + cấu hình MCP. Đã có skill `motion` trên máy; KHÔNG cài đè.
- **greensock/gsap-skills** — Nguồn: README, lệnh `npx skills add https://github.com/greensock/gsap-skills`. Đã có đủ 8 skill; KHÔNG cài đè.
- **svgo** — `npm install -g svgo` (README). Dùng: `svgo icon.svg -o icon.min.svg` trước khi đưa SVG vào MG. Cần: hỏi Dũng cài.
- **satori** — gói `satori` (npm). Đổi JSX/HTML+CSS giới hạn → SVG; dùng cho ảnh thẻ tĩnh. Không làm chuyển động. Cần: hỏi cài; font phải đọc thành Buffer/ArrayBuffer và truyền qua tùy chọn `fonts` (README: chỉ font truyền vào mới được dùng).
- **GSAP** — `npm install gsap` (README). Đang dùng bản 3.14.2 cục bộ; bản 3.15.0 có trên npm — chưa cần nâng.
- **anime.js** — v4 import ES module (README). Trong HyperFrames: `autoplay:false`, đẩy vào `window.__hfAnime`, random dùng `anime.createSeededRandom` (`hyperframes/references/runtimes.md`).
- **motion (motion.dev)** — `npm install motion` (README). Không có trong bảng runtime HyperFrames → không dùng cho render video; dùng làm tham khảo spring/easing qua skill `motion`.
- **rive-wasm** — gói `@rive-app/canvas` / `@rive-app/webgl2` (npm 2.45.1). README không nêu cách seek theo khung → [chưa xác minh]; chỉ thử khi Dũng có file .riv và đồng ý.
- **dotlottie-web** — `npm install @lottiefiles/dotlottie-web` (README). HyperFrames: `autoplay:false`, luôn đặt `loop`, đẩy instance vào `window.__hfLottie` (runtimes.md, adapters/lottie.md). Remotion: `npx remotion add @remotion/lottie` (hỏi trước).
- **remotion** — `npx create-video@latest` (README) để tạo mới; dự án Dũng dùng `HDRE AI\my-video` làm mẫu. Chỉ khi engine = Remotion.
- **motion-canvas** — KHÔNG dùng: là một engine dựng video thứ 3, trùng vai HyperFrames/Remotion; luật chọn engine 1 lần.
- **three.js** — HyperFrames: vẽ theo `e.detail.time` trong listener `hf-seek`, BẮT BUỘC `data-duration` ở root (adapters/three.md: thiếu thì lỗi "Composition has zero duration"). Remotion: `npx remotion add @remotion/three` (remotion-markup/3d.md). 3D chỉ khi Dũng chỉ định (presets.md).
- **react-three-fiber / drei / postprocessing** — chỉ trong Remotion qua `@remotion/three`; `npm install @react-three/drei`, `npm install @react-three/postprocessing` (README). Hỏi trước khi cài. Hiệu ứng hậu kỳ nặng → render chậm.
- **react-three-rapier** — README gốc chỉ trỏ `packages/react-three-rapier/readme.md`; gói npm `@react-three/rapier` 2.2.0. Vật lý chạy bước thời gian riêng → không dùng trừ khi khóa bước theo khung [chưa xác minh].
- **howler.js** — `npm install howler` (README). Không dùng để dựng video: âm thanh render phải đi qua `hyperframes-audio` / `<Audio>` để mix, ducking và đo LUFS (audio-gate.md).
- **FFmpeg** — đã có 9.0.2 full build (có ssim, psnr, ebur128, silencedetect, astats). Dùng theo engines.md.

## Việc cần Dũng quyết (chưa làm)
- Cài thêm: svgo, satori, @remotion/lottie, @react-three/drei, @react-three/postprocessing (chỉ khi dự án cần).
- Cập nhật remotion 4.0.536 → 4.0.538, gsap 3.14.2 → 3.15.0: không bắt buộc.
