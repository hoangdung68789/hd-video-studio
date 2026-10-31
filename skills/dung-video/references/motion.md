# Chuyển động: motion graphics, motion design, animation

Đọc ở giai đoạn 4–5, khi dựng chữ động, MG, b-roll animation, chuyển cảnh. Đây là gợi ý, AI được tự quyết cách làm. Luôn giữ: không che mặt người dẫn (luật 10), mọi khối xuất hiện trên timeline (luật 15).

## Thứ tự làm
| Bước | Câu hỏi | Dùng |
|---|---|---|
| 1. Định hướng | Câu này cần cảm xúc gì, nhấn vào đâu, nhịp nào? | Skill `motion-design`: `director/decision-framework.md`, `director/emotion-mapping.md`, `director/narrative-structure.md` |
| 2. Chọn mẫu | Có mẫu sẵn giống ý chưa? | Thư viện MG của Studio, `assets/awesome-opus5-5-videos/prompts/`, `<HD_VIDEO_HOME>/asset/phong_cach/ket_hop/INDEX.md`, `assets/textfx-kit/recipes/` |
| 3. Dàn cảnh | Các phần tử vào, ra theo thứ tự nào? | `motion-design`: `director/choreography.md`, `patterns/entrance-exit.md`, `patterns/multi-element.md` |
| 4. Dựng | Viết bằng gì? | Bảng công cụ bên dưới |
| 5. Kiểm | Có đúng nhịp, đúng câu nói, tua đến đâu cũng đúng không? | `motion-design`: `reference/quality-checklist.md`, `reference/timing-easing-tables.md`; skill `gsap-performance` khi xem bị giật |

## Công cụ theo nhu cầu
| Nhu cầu | Dùng chính | Dự phòng |
|---|---|---|
| Chữ động, số chạy, biểu đồ, thẻ giá, bản đồ động | `motion-graphics` | `hyperframes-animation` |
| Viết tween, easing, stagger | `gsap-core`, `gsap-timeline` | `gsap-utils` |
| Zoom, đẩy cận, Ken Burns, chuyển cảnh khớp hình | `hyperframes-keyframes` | `hyperframes-animation` |
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
4. Cần thay đổi theo thời gian mà Dũng tự chỉnh được thì dùng keyframe của HD Studio.
5. Dùng mẫu nào thì so lại với video gốc của mẫu (luật 13), ghi nguồn vào `edit-state.json`.
