# Chuyển động: motion graphics, motion design, animation

Đọc ở giai đoạn 4–5, khi dựng chữ động, MG, b-roll animation, chuyển cảnh. Đây là gợi ý, AI được tự quyết cách làm. Luôn giữ: không che mặt người dẫn (luật 16), mọi khối xuất hiện trên timeline (luật 18).

## Thứ tự làm
| Bước | Câu hỏi | Dùng |
|---|---|---|
| 1. Định hướng | Câu này cần cảm xúc gì, nhấn vào đâu, nhịp nào? | Skill `motion-design`: `director/decision-framework.md`, `director/emotion-mapping.md`, `director/narrative-structure.md` |
| 2. Chọn mẫu | Có mẫu sẵn giống ý chưa? | `assets/awesome-opus5-5-videos/prompts/`, `<HD_VIDEO_HOME>/asset/phong_cach/ket_hop/INDEX.md`, `assets/textfx-kit/recipes/` |
| 3. Dàn cảnh | Các phần tử vào, ra theo thứ tự nào? | `motion-design`: `director/choreography.md`, `patterns/entrance-exit.md`, `patterns/multi-element.md` |
| 4. Dựng | Viết bằng gì? | Bảng công cụ bên dưới |
| 5. Kiểm | Có đúng nhịp, đúng câu nói, tua đến đâu cũng đúng không? | `motion-design`: `reference/quality-checklist.md`, `reference/timing-easing-tables.md`; skill `gsap-performance` khi xem bị giật |

## Tự chọn mẫu theo mốc
AI tự làm ở bước 2, không hỏi Dũng. Lọc bằng `python assets/chon_mau_mg.py <mốc>`: script bỏ mẫu thiếu prompt, không có video, game; ưu tiên mẫu dễ đưa về GSAP.

| Mốc trong video | `<mốc>` | Kiểu trong thư viện |
|---|---|---|
| Giá, diện tích | `gia`, `dien_tich` | Số liệu, biểu đồ |
| Hook, điểm mạnh | `hook`, `diem_manh` | Chữ động |
| Vị trí | `vi_tri` | Bản đồ, địa cầu |
| Chuyển cảnh | `chuyen_canh` | Chuyển cảnh |

1. Xem khung hình video của mẫu (tự cắt bằng ffmpeg); không hợp thì lấy mẫu kế.
2. Chỉ lấy cách chuyển động, đổi sang nội dung và chữ của dự án, dựng lại bằng GSAP theo mục "Bắt buộc" bên dưới. Repo chỉ có prompt, không có mã để ghép thẳng.
3. Không có mẫu hợp → tìm trên mạng theo `rules/tim-tai-nguyen.md`.
4. Ghi `ma`, `nguon`, `tac_gia` của mẫu đã dùng vào `edit-state.json`.

## Công cụ theo nhu cầu
| Nhu cầu | Dùng chính | Dự phòng |
|---|---|---|
| Chữ động, số chạy, biểu đồ, thẻ giá, bản đồ động | `motion-graphics` | `hyperframes-animation` |
| Viết tween, easing, stagger | `gsap-core`, `gsap-timeline` | `gsap-utils` |
| Chuyển cảnh khớp hình; zoom, đẩy cận, Ken Burns chỉ khi Dũng đồng ý từng trường hợp (phải mượt, không lắc khung, luật 9) | `hyperframes-keyframes` | `hyperframes-animation` |
| Định hướng hình ảnh, phong cách | `hyperframes-creative` | `motion-design` |
| Lottie, After Effects | `hyperframes-animation` (dotLottie) | Không dùng nếu không có tệp nguồn |
| Dự án đang dùng Remotion | `remotion-markup` | `remotion-best-practices` |

## Không dùng khi dựng video
- `motion` (thư viện Motion cho web): không tua theo khung hình được, chỉ dùng cho giao diện web.
- `gsap-react`, `gsap-frameworks`, `gsap-scrolltrigger`, `gsap-plugins`: dành cho trang web, trừ khi HyperFrames cần đúng plugin đó.
- `higgsfield-motion`, `higgsfield-motion-saas`: tốn credit, chỉ dùng khi Dũng yêu cầu rõ.

## Bắt buộc với mọi chuyển động
1. Chuyển động chỉ hiện đúng câu thoại nói tới nó.
2. Mọi tween nằm trên timeline GSAP đã đăng ký, có vị trí là số giây, không dùng `setTimeout`, `requestAnimationFrame`, hay CSS animation tự chạy, để tua và render đúng.
3. Mọi hiệu ứng là clip riêng trên timeline, mẫu ở `templates/khoi-timeline.html`; tween tác động lên phần tử khác phải ghi `data: "<id clip>"`.
4. Cần thay đổi theo thời gian thì dùng keyframe trên timeline GSAP (`hyperframes-keyframes`).
5. Dùng mẫu nào thì so lại với video gốc của mẫu (`R-L025`), ghi nguồn vào `edit-state.json`.


## Chuẩn Mở đầu (Entrance) & Kết thúc (Exit) Hiệu ứng + Đặt tên Phổ biến (`R-L034` – `R-L036`, 03/11/2026)
1. **Đủ 7 thể loại "Hiệu ứng video" không bỏ sót:** Chữ (`CH`), Chuyển cảnh (`CC`), Chuyển động máy & Thời gian (`CM`), Đồ họa chuyển động & Minh họa (`MG`/`AN`), Kỹ xảo & Lớp phủ (`VFX`/`LP`), Màu sắc (`MA`), và Âm thanh (`SF`). Chi tiết tra tại `<HD_VIDEO_HOME>/asset/phong_cach/tu_dien_hieu_ung.md` và `~/.claude/skills/hoang-dung-auto-style-learner/references/editor-chuyen-nghiep-8-thanh-phan.md`.
2. **Đặt tên theo đúng tên phổ biến trong nghề (`R-L036`):** Mọi clip hiệu ứng trên timeline (`data-name` trong `hf/index.html`), trong `template.json`, `edit-state.json` và báo cáo phải ghi theo đúng tên phổ biến mà các Editor thường gọi: `<Tên phổ biến quốc tế> (<Tên thông dụng tiếng Việt>)` — VD: `Slide Up Fade (Chữ trượt lên mờ dần)`, `Pop-in / Bounce Pop (Chữ nảy)`, `Text Behind Subject (Chữ sau người tách nền)`, `Whip Pan (Lia máy nhanh)`, `Mask Wipe / Object Wipe (Chuyển cảnh quét qua vật cản)`, `Callout Box / Spec Card (Thẻ thông số kính mờ)`, `Satellite Map Zoom-in + Pin Drop (Bản đồ vệ tinh thu phóng + Thả ghim)`. Cấm tự bịa tên hoặc lấy mô tả code làm tên hiệu ứng.
3. **3 Pha Mở đầu – Duy trì – Kết thúc của Editor chuyên nghiệp (`R-L034`):**
   - **Mở đầu (Entrance / In — `0.18s–0.45s`):** Luôn dùng đường cong giảm tốc `Ease-Out` (`cubic-bezier(0.16, 1, 0.3, 1)` / `expo.out` hoặc nảy nhẹ `back.out(1.4)`), phối hợp ≥2–3 thuộc tính (`y + opacity + blur` hoặc `scale + opacity`), xếp tầng `Stagger 40–70ms` giữa các phần tử trong cùng một cụm, và đặt âm thanh `Riser/Whoosh` dẫn trước `0.08s–0.20s` để đỉnh `Peak` của `Impact/Pop` đập trùng khít frame hiệu ứng mở hoàn tất.
   - **Duy trì (Hold — `≥1.5s` theo `R-L018`):** Dòng chữ cuối phải đứng yên sắc nét ≥1.5s để đọc trọn vẹn; có thể kèm chuyển động vi mô (`Light Sweep` quét qua giá, `Pulse Ring` ở ghim bản đồ).
   - **Kết thúc (Exit / Out — `0.15s–0.30s`):** Dùng đường cong tăng tốc `Ease-In` (`power2.in`) nhanh gọn bằng 60% thời gian vào, hoặc **ngắt dứt khoát trước vết cắt cảnh 1–2 frames (`Cut-Out on Hard Cut`)**, hoặc **trượt tiếp cùng chiều vào (`Directional Continue Exit`)**, hoặc **cuốn theo chuyển cảnh (`Whip / Mask Wipe Exit`)**. Âm thanh kết thúc phải có đuôi ngân (`Reverb Tail`) hoặc `fade-out` mượt.
