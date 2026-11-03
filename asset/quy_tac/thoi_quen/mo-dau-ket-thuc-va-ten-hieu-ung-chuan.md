---
name: Chuẩn Mở đầu & Kết thúc Hiệu ứng + Đặt tên Hiệu ứng phổ biến (03/11/2026)
description: Nhắc nhở liên tục Claude về quy trình 7 bước × 8 thành phần, cách mở đầu (Entrance) và kết thúc (Exit) mọi thể loại Hiệu ứng video của editor chuyên nghiệp, và bắt buộc dùng đúng tên phổ biến mà mọi người thường gọi.
type: feedback
---

## 1. Nhắc nhở liên tục về Cấu trúc 8 Thành phần & Quy trình 7 bước Editor Pro
- Luôn dựng **từ dưới lên (Bottom-Up Stack)**: (1) Khóa trục A-roll & Phách BGM → (2) Dựng B-roll đổi cỡ cảnh + J/L-cut → (3) Đặt Chuyển cảnh & Chuyển động máy → (4) Đặt Chữ (T0–T3), MG & Animation → (5) Khóa đỉnh SFX trùng khung hình sự kiện (±0.03s–0.15s) → (6) Phủ VFX (Tách nền chữ sau người, Speed Ramp, Light Sweep) & LUT màu → (7) Kiểm tra 3 cổng đạt tuyệt đối `100/100` (`R-L033`).
- Tuyệt đối không bỏ sót bất kỳ thành phần nào thuộc **7 thể loại được gọi là "Hiệu ứng video"**:
  1. **Hiệu ứng Chữ (`CH` - Text Effects / Kinetic Typography)**
  2. **Hiệu ứng Chuyển cảnh (`CC` - Video Transitions)**
  3. **Hiệu ứng Chuyển động Máy & Thời gian (`CM` - Camera & Time Effects / Speed Ramp)**
  4. **Hiệu ứng Đồ họa Chuyển động & Minh họa (`MG` & `AN` - Motion Graphics, Callout, Map, Floorplan)**
  5. **Hiệu ứng Kỹ xảo & Lớp phủ Ánh sáng (`VFX` & `LP` - Rotoscoping/Masking, Glow, Light Sweep, Light Leak, Halation)**
  6. **Hiệu ứng Màu sắc (`MA` - Color Grading, 3D LUT, Color Isolation, Flash Pulse)**
  7. **Hiệu ứng Âm thanh (`SF` - Sound Effects: Riser, Impact, Whoosh, Pop, Click, Shimmer, Foley, Audio Ducking)**

## 2. Cách Mở đầu (Entrance / In) và Kết thúc (Exit / Out) Hiệu ứng của Editor Chuyên nghiệp
Mọi hiệu ứng video (Chữ, MG, Animation, VFX, Chuyển cảnh, Chuyển động máy, SFX) bắt buộc phải có **3 pha rõ ràng: Mở đầu (In) → Duy trì (Hold) → Kết thúc (Out)**:

1. **Mở đầu Hiệu ứng (Entrance / In-Animation — `0.18s – 0.45s`):**
   - **Đường cong Giảm tốc (`Ease-Out`):** Lao vào nhanh rồi thắng êm tại điểm đích (`cubic-bezier(0.16, 1, 0.3, 1)` / `power3.out` / `expo.out`), hoặc nảy nhẹ có kiểm soát (`back.out(1.4)` — phóng lố `103–105%` rồi thu về `100%`). Cấm dùng `linear` cho mở đầu chữ/MG.
   - **Đa thuộc tính đồng thời (Multi-property In):** Không bao giờ chỉ bật `opacity` đơn điệu; luôn phối hợp ≥2–3 thuộc tính (VD: `Slide Up + Fade + Motion Blur nhẹ` hoặc `Mask Wipe + Scale + Glow`).
   - **Xếp tầng lệch pha (`Stagger 40ms – 70ms`):** Cụm có nhiều phần tử (Nền thẻ → Icon → Số chính → Nhãn phụ, hoặc dòng 1 → dòng 2) phải vào lệch pha nhau `0.04s–0.07s` theo chiều mắt đọc.
   - **Âm thanh dẫn đường (Audio Pre-roll):** `Riser` hoặc phần đầu tiếng `Whoosh` phải vào **sớm hơn hình `0.08s – 0.20s`**, để **đỉnh âm thanh (`Peak` của `Impact`/`Pop`/`Whoosh`) đập trùng khít khung hình hiệu ứng mở hoàn tất**.

2. **Duy trì trên khung (Hold / Micro-life — `≥ 1.5s` theo `R-L018`):**
   - Dòng chữ cuối cùng phải đứng yên tối thiểu `1.5s` (hoặc `số_ký_tự / 12s`) để người xem đọc kịp.
   - Trong pha Hold, có thể giữ chuyển động vi mô (`Slow Drift 1–2%` hoặc `Light Sweep` quét qua con số giá) nhưng chữ phải sắc nét.

3. **Kết thúc Hiệu ứng (Exit / Out-Animation — `0.15s – 0.30s`):**
   - **Nhanh và dứt khoát hơn lúc Mở đầu** (thời lượng Exit chỉ bằng `60%–70%` thời lượng Entrance).
   - **Đường cong Tăng tốc (`Ease-In`):** Bắt đầu rời nhẹ rồi vút nhanh biến mất (`cubic-bezier(0.7, 0, 0.84, 0)` / `power2.in`).
   - **3 kiểu Kết thúc chuẩn Editor chuyên nghiệp (cấm để hiệu ứng biến mất sượng giữa chừng hoặc tràn qua cảnh sau):**
     - *Kiểu 1 — Ngắt khít vết cắt cảnh (`Cut-Out on Hard Cut`):* Kết thúc đúng tại frame cuối trước cú cắt cảnh (ẩn hoàn toàn trước vết cắt `1–2 frames`), dùng chính cú đổi cảnh làm điểm thoát tự nhiên.
     - *Kiểu 2 — Thoát tiếp diễn cùng chiều (`Directional Continue Exit`):* Vào từ dưới lên (`+24px -> 0`) thì thoát trượt nhẹ tiếp lên trên (`0 -> -16px`) kèm mờ dần (`opacity: 1 -> 0`), không kéo giật lùi.
     - *Kiểu 3 — Cuốn theo chuyển cảnh (`Whip / Mask Wipe Exit`):* Bị cuốn trôi theo hướng `Whip Pan`, `Zoom Transition`, hoặc bị vật cản (`Object Wipe`) quét xóa đi cùng cảnh cũ.
   - **Đuôi âm thanh (`Audio Tail / Decay`):** Không bao giờ cắt cụt file SFX/BGM gây tiếng bụp; luôn để đuôi ngân tự nhiên (`Reverb Tail 0.15s–0.35s`) hoặc `fade-out` mượt.

## 3. Quy tắc Đặt tên & Gọi tên Hiệu ứng theo đúng Tên phổ biến trong nghề
- **Bắt buộc gọi và đặt tên hiệu ứng theo đúng tên phổ biến mà các Editor và người làm video thường gọi** (cả thuật ngữ quốc tế thông dụng trong CapCut/Premiere/After Effects/DaVinci lẫn tên tiếng Việt quen thuộc trong nghề), đối chiếu từ `asset/phong_cach/tu_dien_hieu_ung.md`.
- **CẤM tự bịa tên mơ hồ hoặc lấy câu mô tả code làm tên hiệu ứng** (VD: Không gọi là *"hiệu ứng chữ dịch chuyển trục Y"*, phải gọi đúng là **`Slide Up Fade` (Chữ trượt lên mờ dần)**; không gọi là *"cắt ghép người đè chữ"*, phải gọi đúng là **`Text Behind Subject / Rotoscoping` (Chữ sau người tách nền)**; không gọi là *"chuyển cảnh cột che"*, phải gọi đúng là **`Object Wipe / Mask Wipe` (Chuyển cảnh quét qua vật cản)**).
- Khi lưu vào `template.json`, `the.md`, `hf/index.html` (`data-name`) và báo cáo cho Dũng, luôn ghi định dạng: **`<Tên phổ biến quốc tế> (<Tên gọi thông dụng tiếng Việt>)`**.


## 4. Hệ thống 2 Dạng Template Song Song (`R-L037` — Dũng chốt 03/11/2026)
Mỗi khi tạo hoặc áp dụng Template, Claude luôn cung cấp và hỗ trợ **2 Dạng Template**:
- **Dạng 1 — `Template Video Trọn Bộ` (`TV-xx` tại `asset/phong_cach/template/`):**
  - Giống hoàn toàn video mẫu 100% trên cả 8 thành phần (`template_similarity.py` đạt `100/100`), giữ nguyên cấu trúc phân đoạn, nhịp cắt, góc máy, chuyển cảnh, chữ, MG, VFX, SFX, BGM; chỉ thay footage và lời của Dũng.
- **Dạng 2 — `Template VFX/Effects Text Cài Sẵn Tùy Chỉnh` (`TX-01`..`TX-08` & `TX-<TV>-xx` tại `asset/phong_cach/bo_chu/` và `blueprints/text_vfx_presets/`):**
  - Là các gói hiệu ứng **Chữ + Kỹ xảo VFX + Âm thanh SFX** cài sẵn (`preset.json` + `recipe.html` có biến CSS `:root`), cho phép Dũng tùy chỉnh theo ý muốn bất kỳ thông số nào: Nội dung chữ chính/phụ, Font chữ, Màu sắc/Viền/Glow, Kích thước, Vị trí X/Y, Kiểu & Tốc độ Mở đầu (`Entrance`), Lớp `VFX` đi kèm (`Light Sweep`, `Text Behind Subject`, `Halation Glow`, `Difference Blend`, `Underline Draw`), Kiểu & Tốc độ Kết thúc (`Exit`) và `SFX` qua MCP tool `antigravity_customize_text_vfx_template`.
