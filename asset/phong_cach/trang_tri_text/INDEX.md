# DANH MỤC 12 DẠNG TRANG TRÍ TEXT VIDEO CHUYÊN NGHIỆP (`DEC-01..DEC-12`) (`R-L040`)

> **Quy tắc phối màu & trang trí chuẩn Editor Pro (`R-L040` — Dũng chốt 03/11/2026):**
> 1. **Nguyên tắc 60–30–10:** 60% Nền video thực tế · 30% Thân chữ & viền tương phản (Trắng/Đen) · 10% Màu nhấn trang trí (Accent) trích xuất cùng họ màu hoặc tương phản bổ sung với cảnh quay.
> 2. **Khung viền hài hòa:** Nếu dùng khung, bắt buộc dùng **Tấm Kính Mờ Glassmorphism** (`backdrop-filter: blur(14–20px)` + viền mỏng 1px bo góc tròn `12–20px`), CẤM dùng hộp chữ nhật đen kịt đặc quánh đè sau chữ.
> 3. **Phân cấp 3–4 tầng thị giác:** Tag nhỏ mở đầu (Pre-badge) + Tiêu đề chính (Hero) + Dòng bổ nghĩa (Sub-line) + Số liệu xếp tầng lệch (Metric Callout).

---

## 1. BẢNG 12 DẠNG TRANG TRÍ TEXT CHUẨN NGÀNH (`DEC-01..DEC-12`)

| Mã | Tên hiệu ứng phổ biến quốc tế (Tên thông dụng VN) | Bảng màu & Bề mặt (Color & Surface) | Khung viền & Chi tiết trang trí | Easing & 3 Pha (Entrance / Hold / Exit) | SFX đi kèm |
|---|---|---|---|---|---|
| **`DEC-01`** | **`Hormozi Kinetic Bold & Punch Badge (Chữ nảy khối + Tag màu nổi bật)`** | Vàng Cyber (`#FFE600`) + Xanh dạ quang (`#00F5D4`) trên nền tag tối than chì. | Badge bo tròn `border-radius: 12px`, viền mỏng neon `1.5px`, icon lửa 🔥 hoặc sao lấp lánh. | `Pop-in Elastic 0.10s` (`back.out(1.8)`) → Nhún nhẹ → `Shrink 0.06s` | `SF04 Pop / Punch Hit` |
| **`DEC-02`** | **`Ali Abdaal Soft Highlighter & Paper Note (Vệt bút dạ quang + Thẻ giấy mờ)`** | Chữ than chì `#1E293B` trên vệt highlight vàng pastel (`#FEF08A`) bán trong suốt. | Vệt bút nhớ vẽ nét dưới từ khóa (`Highlighter draw 0.12s`) + Font viết tay ghi chú bên cạnh. | `Fade Up 0.08s` + Vệt bút quét từ trái sang phải (`0.12s`) | `Paper Rustle / Marker Scratch` |
| **`DEC-03`** | **`Iman Gadzhi Luxury Metallic Gold & Glint (Chữ vàng kim loại + Tia sáng quét)`** | Gradient vàng ánh kim 3 điểm dừng (`#FFF5C0 -> #D4AF37 -> #996515`) viền đen sâu. | Tia sáng vàng `Light Sweep` lướt chéo 45° qua mặt chữ + Quầng sáng `Halation` ấm. | `Scale Settle 0.12s` (`expo.out`) → Quét tia sáng `0.55s` → `Dissolve Out` | `SF07 Shimmer Glint / Swish` |
| **`DEC-04`** | **`Vox Investigative Split Callout (Khung ngắm kỹ thuật + Vạch chỉ báo đứng)`** | Trắng tinh khiết (`#FFFFFF`) phối Vạch vàng champagne (`#F4E0A5`) hoặc Xanh navy. | Vạch chỉ báo màu đứng (`width: 4px`) bên trái + 2 đường kẻ ngang kẹp chữ + chấm đỏ REC. | Vạch đứng vươn dài (`0.08s`) → Chữ trượt ngang ra (`Slide Right 0.10s`) | `SF01 Soft Whoosh / Click` |
| **`DEC-05`** | **`MagnatesMedia 3D Cinematic Extrusion (Chữ 3D dày khối + Đèn rọi Spotlight)`** | Vàng đồng cổ điển (`#D4AF37`) đổ bóng sâu 6 tầng `text-shadow` 3D isometric xuống `#1A1300`. | Lớp đèn rọi `Spotlight Dimmer` làm tối nền xung quanh 30% để khối chữ 3D rực sáng ở tâm. | Phóng từ sâu ra (`scale 0.7 -> 1.0` `power3.out`) + Spotlight thu hẹp | `Sub Boom / Cinematic Impact` |
| **`DEC-06`** | **`Glassmorphism Spec Card / Tech HUD (Thẻ thông số kính mờ bo góc)`** | Khung thẻ kính mờ `rgba(15,23,42,0.45)` + Viền sáng vàng/xanh mint 1px + Chữ trắng ngọc trai. | `backdrop-filter: blur(16px)`, `border-radius: 16px`, Icon SVG động + Số đếm chạy `Rolling Counter`. | `Stagger Reveal 0.15s`: Khung mở trước → Icon nảy → Số liệu trượt lên | `Soft Pop / Beep nhẹ` |
| **`DEC-07`** | **`Streetwear Slanted Tag & Sticker Label (Nhãn tem dán nghiêng 8° + Viền đứt nét)`** | Cam Hỏa tiễn (`#FF5E1E`) phối Trắng và Đen than, viền đứt nét vàng (`border: 2px dashed`). | Cụm chữ xoay nghiêng `6°–10°`, sticker nhãn giá `[ HOT DEAL ]`, mã vạch mini hoặc icon ngón tay ↗. | Dán cộp vào màn hình (`scale 1.2 -> 1.0` `0.08s`) + Rung nhẹ | `Slam / Sticker Slap` |
| **`DEC-08`** | **`Cinematic Split-Tone Dual Color (Chữ chia đôi 2 nửa màu tương phản)`** | Nửa đầu Trắng sữa (`#FFFFFF`), nửa sau Vàng Gold (`#FFD700`) hoặc Cam san hô (`#FF7A59`). | Dấu gạch chéo `/` hoặc chấm tròn ngăn đôi 2 vế câu, đổi màu rực rỡ trúng phách mạnh BGM. | Nửa đầu hiện trước `0.10s` → Nửa sau bung nảy trúng phách nhạc | `Tick + Impact Drop` |
| **`DEC-09`** | **`Legal Paper Tape & Stamp Slam (Băng keo giấy dán + Con dấu đóng nảy)`** | Khung giấy màu kem `#FFFDF9`, chữ đen than `#1A1A1A`, con dấu đỏ son hoặc vàng đồng `#C92A2A`. | Dán 2 miếng băng keo trong suốt góc trên + Con dấu đóng dập xuống nảy bụi (`Stamp Slam 0.15s`). | Tờ giấy trượt lên từ dưới (`0.12s`) → Con dấu dập xuống đè lên | `Paper Rustle + Heavy Stamp` |
| **`DEC-10`** | **`Modern Minimalist Bracket Frame (Khung 4 góc ngắm chữ L mảnh)`** | Trắng ngà `#F8F9FA` phối góc L vàng gold mỏng 1.5px. | Bốn góc chữ L mảnh `┌ ┐ └ ┘` bo quanh cụm chữ, ôm khít thông số quan trọng. | 4 góc thu từ ngoài vào vị trí chuẩn (`scale 1.15 -> 1.0`) ôm chặt chữ | `Mechanical Click / Ping` |
| **`DEC-11`** | **`Neon Cyberpunk Outline Stroke (Chữ rỗng viền neon phát quang)`** | Thân chữ trong suốt, viền `stroke: 2.5px` Xanh Cyan Neon (`#00F5D4`) hoặc Vàng Neon (`#FFE600`). | Quầng glow phát quang mờ 12px; nháy sáng bừng lấp đầy màu thân chữ đúng phách drop nhạc. | Viền neon vẽ nét nhanh (`0.10s`) → Nháy sáng thân chữ → Tắt êm | `Electric Buzz / Neon Zap` |
| **`DEC-12`** | **`Vintage Editorial Serif & Golden Quote (Chữ Serif cổ điển + Khung chỉ vàng)`** | Font Serif sang trọng (`Playfair Display Italic`) màu Vàng Champagne nhạt (`#F5E6BE`). | Khung viền chỉ vàng siêu mảnh 1px bo 4 góc kẹp giữa 2 dấu ngoặc kép nghệ thuật `“ ”`. | Chữ hiện êm ái kiểu `Blur Resolve` trong `0.35s` mượt mà, tĩnh lặng ngắm nhà. | `Soft Swish / Air Pass` |

---

## 2. NGUYÊN TẮC PHỐI MÀU HÀI HÒA THEO VIDEO (COLOR HARMONY WHEEL)

```
[Màu Video: Nắng vàng ấm / Gỗ nội thất] ──► Phối Tương Đồng (Analogous)  ──► Vàng Champagne + Cam Mật Ong
[Màu Video: Bầu trời / Hồ bơi xanh]     ──► Phối Bổ Sung (Complementary) ──► Cam San Hô + Vàng Ánh Kim
[Màu Video: Kiến trúc hiện đại xám trắng]──► Phối Đơn Sắc (Monochromatic) ──► Trắng Bạc + Xanh Mint Mint Emerald
```

- **Độ sáng tương phản:** Nếu cảnh quay có độ sáng trung bình `Luma > 65%` (nắng gắt, phòng trắng xóa), chữ bắt buộc phải có viền đen sắc `3px` hoặc đặt trên tấm kính mờ `DEC-06` để đạt độ tương phản `≥ 4.5:1`.
- **Nếu cảnh quay tối:** Dùng chữ màu trắng ngọc trai phối viền phát sáng neon hoặc quầng sáng `Halation` ấm (`DEC-03` hoặc `DEC-11`).
