# DANH MỤC TÀI NGUYÊN OVERLAY (`OV-01..OV-08`) & KHUNG BACKGROUND (`BG-01..BG-08`) CHUẨN EDITOR PRO (`R-L038`)

> **Luật cứng (`luat-cung.md` mục 3 & `01-quy-tac-thep.md` mục 6):**
> - **CẤM** tự ý đặt hộp nền chữ nhật tối màu đặc (`solid dark box`) đè trực tiếp sau phụ đề (`T0`), nhãn (`T1`) hoặc chữ hook (`T2–T3`) trên cảnh quay nhà thực tế (trừ khi video mẫu có dùng → giữ trong `template.json` và **hỏi Dũng** trước khi áp).
> - **ĐƯỢC DÙNG & TUÂN THỦ QUY TRÌNH 6 TẦNG Z-INDEX (`Z-0` → `Z-50`):** Dùng `OV-01` (`Local Radial Gradient Dimmer` mỏng không thành hộp) để đẩy độ tương phản chữ `≥ 4.5:1` trên nền sáng; dùng `BG-01..BG-08` khi chia màn hình (`Split-Screen`), mở cửa sổ phụ (`PiP`), lấp đầy khung dọc 9:16 cho ảnh ngang/sổ hồng (`Blurred Glass Canvas`), hoặc trình chiếu sơ đồ mặt bằng (`Blueprint Grid`).

---

## 1. BẢNG 6 TẦNG Z-INDEX BẮT BUỘC TRONG `hf/index.html`

| Tầng Z-Index | Tên tầng | Mã tài nguyên đặt tại tầng này | Quy tắc Hòa trộn (`mix-blend-mode` / `opacity`) |
|---|---|---|---|
| **`Z-0` (Đáy)** | **Background Canvas Layer** | `BG-03`, `BG-04`, `BG-05`, `BG-06` | Chỉ bật khi chèn ảnh ngang/sổ hồng hoặc phân đoạn đồ họa mặt bằng/thông số. |
| **`Z-10`** | **Primary Footage & Split Frames** | Footage A-roll/B-roll + `BG-01` (`Split-Screen`) | Kèm LUT màu (`sample_look.cube` hoặc `bang_lut.json`). |
| **`Z-20`** | **Depth & Dimmer Overlays (Dưới chữ)** | `OV-01`, `OV-06`, `OV-08`, `BG-02` (`PiP Card`) | `OV-01` dùng `radial-gradient` mỏng (`opacity: 0.22–0.32`), không có viền hộp. |
| **`Z-30`** | **Subject Cutout Mask (Tách người)** | `OV-07` (`AI Subject Cutout`, `Feather 1.5px`) | Chữ Hook núp sau người đặt ở `Z-25`; dùng tối đa **1 lần/video** ở Hook đầu. |
| **`Z-40`** | **Typography, MG & Animated Icons** | `T0`, `T1`, `TX-01..TX-08`, `IC-01..IC-24`, `OV-03` | Nằm gọn trong vùng an toàn (`top ≥ 230px`, `bottom ≥ 480px`, `right ≥ 160px`). |
| **`Z-50` (Đỉnh)** | **Cinematic Finishing & QA Guide** | `OV-02`, `OV-04`, `OV-05`, `BG-07`, `BG-08` | `pointer-events: none`; `BG-08` tự động ẩn (`display: none`) khi xuất `.mp4` cuối. |

---

## 2. DANH MỤC 8 MẪU TÀI NGUYÊN OVERLAY (`OV-01..OV-08`)

| Mã | Tên phổ biến chuẩn (`ten_pho_bien`) | Tầng Z | Blend Mode & Opacity | Khi nào dùng | Cách Mở đầu (Entrance) | Cách Kết thúc (Exit) | SFX đi kèm |
|---|---|---|---|---|---|---|---|
| **`OV-01`** | `Local Radial Gradient Dimmer (Lớp dìm tối cục bộ mỏng sau chữ)` | `Z-20` | `normal` · `0.22–0.32` | Nền nhà nắng gắt làm tương phản chữ `< 4.5:1` (`01-quy-tac-thep.md` mục 6) | `Fade-in 6f (0.10s)` cùng lúc chữ vào | `Fade-out 6f (0.10s)` cùng lúc chữ thu đi | Không SFX riêng |
| **`OV-02`** | `Light Leak / Warm Film Burn (Cháy sáng ống kính chuyển cảnh)` | `Z-50` | `screen` · `0.30–0.45` | Đặt đè qua vết cắt chuyển cảnh (`±8f`), không phủ toàn clip | `Opacity Ramp-in 4f` trước vết cắt, đạt đỉnh tại `0f` | `Smooth Dissolve Out 8f` đầu cảnh mới | `SF01 Soft Whoosh` |
| **`OV-03`** | `Light Sweep / Gold Shimmer Ray (Tia sáng vàng quét qua chữ/số giá)` | `Z-40` | `background-clip: text` / `screen` | Quét 1 lần qua số Giá (`L2`) hoặc chữ Hook (`L1`) khi vừa đứng yên | Từ mép trái `-120%` lướt chéo `45°` trong `0.55s` `power2.inOut` | Thoát hết mép phải `+120%` và tắt | `SF07 Sparkle / Shimmer` |
| **`OV-04`** | `Soft Halation / Ambient Gold Bloom (Quầng sáng điện ảnh mềm)` | `Z-40/Z-50` | `screen` · `0.20–0.35` | Nhấn nhẹ từ khóa vàng gold hoặc cảnh đèn chùm ấm (giảm 30–50% tránh sương) | Tăng `drop-shadow` / `blur` êm trong `8f` `easeOutSine` | Hạ êm về `0` trong `8f` trước vết cắt | Không SFX riêng |
| **`OV-05`** | `Subtle 35mm Film Grain (Hạt phim điện ảnh siêu mịn)` | `Z-50` | `overlay` · `0.04–0.07` | Chỉ dùng ở Hook điện ảnh hoặc khi mẫu có dùng | Khởi tạo từ frame đầu phân đoạn Hook | Ngắt sạch khi vào cảnh chi tiết nội thất | Không SFX riêng |
| **`OV-06`** | `Cinematic Soft Vignette (Làm dịu nhẹ 4 góc khung hình)` | `Z-20` | `multiply` · `0.12–0.18` | Cảnh toàn mặt tiền / Flycam gom mắt vào tâm khung | `Fade-in 10f` đầu cảnh toàn | `Fade-out 8f` khi sang cảnh cận nội thất | Không SFX riêng |
| **`OV-07`** | `AI Subject Cutout Mask (Lớp tách người đặt chữ sau lưng)` | `Z-30` | `normal` · `Feather 1.5px` | Đặt chữ Hook ở `Z-25` sau lưng người dẫn (tối đa 1 lần/video ở Hook) | Khởi tạo mặt nạ ngay frame chữ trượt lên sau lưng | Giải phóng mặt nạ khi chữ thoát hết | Theo SFX chữ Hook |
| **`OV-08`** | `Spotlight Focus Mask (Đèn rọi khoanh vùng chi tiết BĐS)` | `Z-20` | `normal` · `dim 30%` + viền vàng | Khoanh vùng 1 chi tiết cụ thể (vị trí đất, nội thất, sổ hồng) | Vòng sáng thu từ `150% -> 100%` (`8f` `expo.out`) + nền dịu `30%` | Trả sáng nền `100%` trong `6f` `power2.in` | `SF04 Soft Pop / Ping` |

---

## 3. DANH MỤC 8 MẪU TÀI NGUYÊN KHUNG & BACKGROUND (`BG-01..BG-08`)

| Mã | Tên phổ biến chuẩn (`ten_pho_bien`) | Tầng Z | Cấu trúc CSS / SVG | Khi nào dùng | Cách Mở đầu (Entrance) | Cách Kết thúc (Exit) | SFX đi kèm |
|---|---|---|---|---|---|---|---|
| **`BG-01`** | `Split-Screen 2-Grid / 3-Grid Frame (Khung chia đôi / chia ba màn hình)` | `Z-10` | CSS Grid 9:16 + đường ngăn `2px #FFD700` | So sánh Trước/Sau hoặc Host nói (dưới) + Flycam/Nội thất (trên) | Đường kẻ vàng cắt ngang (`6f` `expo.out`), ô 2 `Slide Reveal 8f` | 1 ô phóng mượt ra toàn màn hình (`Expand Fullscreen 8f`) | `SF01 Whoosh` |
| **`BG-02`** | `PiP Floating Card Frame (Khung hình-trong-hình bo góc nổi)` | `Z-20` | `border-radius: 20px`, viền `1.5px #FFD700`, `box-shadow` sâu | Host đang nói (A-roll) bật thêm cửa sổ nhỏ chiếu chi tiết/vị trí | `Spring Pop-in` (`0.7 -> 1.03 -> 1.0`, `8f` `back.out(1.6)`) | `Scale Down 1.0 -> 0.85` + `Opacity 0` (`6f` `power2.in`) | `SF04 Soft Pop` |
| **`BG-03`** | `Blurred Glass Canvas Background (Nền kính mờ lấp đầy khung dọc 9:16)` | `Z-0` + `Z-10` | `Z-0`: `filter: blur(28px) brightness(0.55)`; `Z-10`: khung nét | Chèn ảnh chụp ngang (16:9), sổ hồng, bản vẽ quy hoạch không bị viền đen | Nền mờ `Fade-in 6f`, khung chính `Pop-up` (`0.92 -> 1.0`, `8f`) | Cắt gọn hoặc `Cross Dissolve 6f` sang cảnh dọc tiếp theo | `SF04 Soft Pop` |
| **`BG-04`** | `Architectural Blueprint Grid Background (Nền lưới bản vẽ kiến trúc)` | `Z-0` | `#0B132B` + SVG Grid `stroke rgba(255,255,255,0.10)` | Phân đoạn vẽ sơ đồ mặt bằng (`Floorplan Stroke Draw`), thước đo `5m × 20m` | `Luma Fade / Cross Dissolve 8f`, lưới kỹ thuật sáng dần từ tâm | `Fade-out 8f` + `Match Cut` vào không gian phòng thật | Không SFX nền |
| **`BG-05`** | `Luxury Dark Gold Studio Backdrop (Nền đồ họa thông số/tài chính)` | `Z-0` | Radial `#141A29 -> #070A12` + viền vàng mảnh | Khi mẫu có màn hình tổng kết bảng dòng tiền/so sánh giá hoặc Dũng yêu cầu | `Slide Wipe` hoặc `Smooth Fade 8f` kèm thẻ thông số `Stagger` | Thoát về A-roll bằng `Whip Pan` hoặc `Cut on Beat` | `SF01 Soft Swish` |
| **`BG-06`** | `Legal Document / Paper Frame (Khung trình chiếu Sổ hồng / Pháp lý)` | `Z-0/Z-10` | Khung bo viền giấy + bóng 3D `perspective(900px) rotateX(4deg)` | Nhấn mạnh "Sổ hồng riêng / Hoàn công chuẩn / Quy hoạch sạch" (`L7`) | Trượt lên từ cạnh dưới (`Slide Up + Tilt 9f` `expo.out`) | Giữ đọc `≥1.5s` sau đóng dấu `Stamp`, rồi hạ xuống `6f` | `Paper Rustle + Stamp Slam` |
| **`BG-07`** | `Camera Viewfinder / Drone HUD Frame (Khung ngắm máy quay / Flycam HUD)` | `Z-50` | 4 góc chữ L mảnh + nhãn `REC` / `ALT` | Cảnh mở đầu Flycam trên cao hoặc POV khảo sát (khi mẫu có / Dũng đồng ý) | 4 góc thu từ `108% -> 100%` trong `6f` | Tắt gọn tại vết cắt chuyển xuống cảnh mặt đất | `Camera Shutter / Beep nhẹ` |
| **`BG-08`** | `TikTok/Reels/Shorts Safe-Zone QA Frame (Khung kiểm duyệt vùng an toàn)` | `Z-50` | Viền nét đứt `top:230px`, `bottom:480px`, `right:160px` | Bật bắt buộc ở bước Preview/QA (G4 & G7) để kiểm vùng chết giao diện | Bật bằng `--show-safe-zone: 1` khi kiểm trên HD Studio | Tự động đặt `--show-safe-zone: 0` (`display: none`) khi render `.mp4` | Không SFX |
