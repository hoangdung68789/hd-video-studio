# Template video trọn bộ (TV) — chi tiết

Một template = MỘT dòng thời gian chung, mọi lớp nằm trên cùng mốc giây, khớp toàn bộ video mẫu. Sai thì không còn là template, không được dùng; AI không tự làm khác mẫu khi chưa có lệnh của Dũng (03/11/2026). Mỗi template riêng biệt, không trộn.
8 thành phần bắt buộc: Text · SFX · VFX · Motion Graphics · Effect · BGM · A-roll và B-roll · bố trí, cấu trúc và cách dùng bố cục. Mẫu không có thành phần nào thì số đo ghi 0, không tự thêm.

## 1. Đo (bắt buộc đủ, theo viral-style-scout B2–B5)
| Lớp | Đo gì | Lệnh/nguồn |
|---|---|---|
| Cú cắt | mọi mốc cắt, độ dài shot | `select='gt(scene,0.3)',showinfo` |
| Sự kiện thị giác | mọi lần chữ/MG/hiệu ứng/chuyển cảnh xuất hiện | `select='gt(scene,0.06)'` + khung dày ±0,5s |
| Cảnh | cỡ (toàn/trung/cận/chi tiết), góc, chuyển động máy, host có trên hình không | khung tại mỗi shot |
| Chữ | nội dung vai trò (không chép chữ), font, cỡ %, vị trí %, màu hex, `cach_mo_dau` (Entrance: kiểu, số khung, easing), `cach_ket_thuc` (Exit: kiểu, số khung, easing), `ten_pho_bien`, `icon_ma` (`IC-xx` nếu có), mã E/hiệu ứng | khung chữ |
| SFX | mốc, vai trò (whoosh/pop/impact/riser/tick…), `ten_pho_bien`, `cach_mo_dau` (Pre-Roll Lead-in), `cach_ket_thuc` (Reverb Tail Decay), độ to so với nhạc, gắn với sự kiện nào | ebur128 + phổ quanh mốc |
| Nhạc | BPM, mốc phách mạnh, mốc lên/hạ/drop/rút nhạc, mức nhạc so với giọng, % cú cắt trùng phách | librosa/numpy, ebur128 |
| Lời | vai trò từng câu (hook, vấn đề, bằng chứng, giá, vị trí, chốt, kêu gọi theo dõi) — chỉ ghi vai trò + giây, không chép lời | whisper / phụ đề |
| BGM | nhãn âm thanh ghi trên trang video (không có → "Không đo được", không đoán tên bài), có nhạc hay không, mức LUFS, `cach_mo_dau` (Fade-in/Cold Drop), `cach_ket_thuc` (Auto-Ducking/Reverb Tail Out), diễn biến cả bài | trang video + ebur128 |
| VFX & Overlay (`OV-xx`) | hiệu ứng tác động lên hình & lớp phủ (`OV-01..OV-08`: tách người, chữ núp sau người, `Local Radial Gradient Dimmer`, `Light Leak`, `Light Sweep`, `Halation`, hạt phim `Film Grain`, `Spotlight`): loại, mã, `ten_pho_bien`, `z_index` (`Z-20..Z-50`), `blend_mode`, `opacity`, `cach_mo_dau`, `cach_ket_thuc`, vị trí %, màu hex, mốc + độ dài | khung dày ±0,5s |
| Effect | hiệu ứng dựng (vào/ra của chữ hoặc hình; chuyển cảnh ghi ở `chuyen_canh`): loại, mã, `ten_pho_bien`, `cach_mo_dau`, `cach_ket_thuc`, gắn với gì, số khung, easing | khung dày ±0,5s |
| Bố cục & Khung Background (`BG-xx`) | mỗi đoạn: kiểu bố trí khung, mã Khung/Background (`BG-01..BG-08`: `Split-Screen 2/3-Grid`, `PiP Floating Frame`, `Blurred Glass Canvas 9:16`, `Blueprint Grid`, `Paper Frame`, `Safe-Zone Guide`), `z_index` (`Z-0..Z-20`), vị trí chủ thể %, vùng đặt chữ %, `cach_mo_dau`, `cach_ket_thuc`, cách dùng bố cục (vì sao bố trí vậy, đổi bố cục khi nào) | khung tại mỗi shot |
| A-roll (AR) | mỗi cảnh chính: cỡ, góc, chuyển động máy (`ten_pho_bien`, `cach_mo_dau`, `cach_ket_thuc`), có người dẫn không, mốc + độ dài | khung tại mỗi shot |
| B-roll (BR) | mỗi cảnh minh họa: loại (toàn/chi tiết/đường trước nhà/flycam/nội thất), độ dài, chuyển động máy, đặt TRƯỚC/ĐÚNG/SAU câu nói bao nhiêu giây (J-cut/L-cut), câu nào được minh họa | khung tại mỗi shot + lời |
| Animation minh họa (AN) | mặt bằng vẽ nét, thước kích thước, mũi tên, icon động (`IC-xx`), số đếm, bản đồ zoom: hình dạng, `ten_pho_bien`, vị trí %, màu, `cach_mo_dau` (Trim Paths Draw-in / Pop-in), `cach_ket_thuc` (Reverse Trim Paths / Scale Down), easing, gắn từ nào, có SFX không | khung dày ±0,5s |
| MG (thẻ/nhãn) | thẻ thông tin, lower-third, nhãn phòng/tầng, bộ đếm: `ten_pho_bien`, `icon_ma` (`IC-xx`), vị trí %, cỡ, màu hex, `cach_mo_dau`, `cach_ket_thuc`, thời gian hiện, theo cảnh hay theo lời | khung dày |
| **Vì sao (bắt buộc cho AR/BR/AN/MG/VFX/Effect/chữ)** | `muc_dich` (minh_hoa_loi · chung_minh_so_lieu · dinh_vi · doi_nhip_giu_chan · chuyen_y · nhan_gia · tao_to_mo · keu_goi) + `ly_do` (1 câu: vì sao mẫu đặt ĐÚNG lúc đó, vd "nhãn phòng hiện 0,3s sau cú cắt để người xem biết đang ở đâu trước khi lời nói tới") + `gan_loi` (vai trò câu) + `gan_phach` (rơi đúng phách?) + `ket_hop` (đi cùng chữ/SFX/chuyển cảnh nào) | suy từ các lớp, nhãn Ước đoán |
| Màu chữ | trung vị pixel chữ ở khung rõ nhất → hex; lưu bộ màu vào `asset/phong_cach/mau_chu/bang_mau.json` | PIL/numpy |
| Màu | signalstats từng đoạn | ffmpeg |
| Giữ chân | hook 0–3s là gì; câu nhử (open loop) mở ở giây nào, trả lời ở giây nào; đổi nhịp (pattern interrupt) mỗi bao nhiêu giây; cao trào; lời kêu gọi theo dõi ở giây nào và được hỗ trợ bằng chữ/SFX/nhạc ra sao | suy từ các lớp trên, nhãn Ước đoán |

## 2. File template
`asset/phong_cach/template/<TV-xx>-<ten>/`
- `template.json` — dữ liệu chuẩn (dưới), `/dung-video` đọc file này.
- `the.md` — 1 trang đọc nhanh: hợp thể loại, công thức giữ chân, điểm yếu của mẫu (giữ nguyên, báo Dũng), video gốc + chỉ số, bảng hiệu ứng kèm cách Mở đầu/Kết thúc.
- `contact.jpg` — contact sheet mọi cú cắt và mọi lần chữ.
- `sample_look.cube` — file 3D LUT màu trích xuất trực tiếp từ video mẫu (dùng cho lựa chọn màu số 2 "Tạo theo video mẫu" khi dựng video).

```json
{"id":"TV-01","ten":"","the_loai":["review nha","chia se","q&a","vlog","phap ly","ke chuyen"],
 "nguon":{"url":"","ngay_xem":"","chi_so":"","nhan":"XM|chua xac minh"},
 "thong_so":{"khung":"9:16","fps":60,"thoi_luong":0,"lufs":-14,"bpm":0,"shot_tb":0,"su_kien_moi_giay":0},
 "bgm":{"co_nhac":true,"nhan_bai":"","nguon_nhan":"trang video|Khong do duoc","lufs":0,"dien_bien":"","cach_mo_dau":"Fade-in 0.3s|Cold Drop","cach_ket_thuc":"Reverb Tail Out 0.8s"},
 "giu_chan":{"hook":"","open_loops":[{"mo":0,"tra_loi":0}],"doi_nhip_moi_giay":0,"cao_trao":0,"keu_goi_theo_doi":{"giay":0,"cach":"chi khi Dung noi trong loi"}},
 "doan":[{"tu":0,"den":0,"vai_tro":"hook|van_de|bang_chung|vi_tri|gia|tien_ich|chot|cta",
   "canh":{"co":"","goc":"","chuyen_dong_may":"","host":true},
   "bo_cuc":{"loai":"","khung_background":{"ma":"BG-01..BG-08|none","ten_pho_bien":"Split-Screen 2-Grid|Blurred Glass Canvas|Blueprint Grid","z_index":0,"cach_mo_dau":"","cach_ket_thuc":""},"vi_tri_chu_the_pct":[0,0],"vung_chu_pct":[0,0],"cach_dung":""},
   "aroll":[{"giay":0,"thoi_luong":0,"co":"","goc":"","chuyen_dong_may":"","ten_pho_bien":"Slow Push-in (Zoom đẩy chậm)","cach_mo_dau":"Ease-in 10f","cach_ket_thuc":"Hold at Cut","host":true,"muc_dich":"","ly_do":""}],
   "vfx":[{"giay":0,"thoi_luong":0,"ma":"OV-01..OV-08|LP01","ten_pho_bien":"Local Radial Gradient Dimmer|Light Leak / Film Burn","loai":"tach_nguoi|chu_sau_nguoi|lop_phu|hat|light_leak|radial_dimmer|spotlight","z_index":20,"blend_mode":"normal|screen|overlay|multiply","opacity":0.25,"vi_tri_pct":[0,0],"mau":"","cach_mo_dau":"Opacity Ramp-in 6f","cach_ket_thuc":"Smooth Dissolve Out 8f","muc_dich":"","ly_do":""}],
   "effect":[{"giay":0,"ma":"CH01","ten_pho_bien":"Pop-up Elastic (Chữ bật nảy lò xo)","loai":"chu_vao|chu_ra|hinh_vao|hinh_ra","gan_voi":"","so_khung":0,"easing":"","cach_mo_dau":"Scale 0->112%->100% (8f, back.out)","cach_ket_thuc":"Scale 100%->85% + Opacity 0 (5f)","muc_dich":"","ly_do":""}],
   "loi":{"vai_tro":"","o_dien":"<lời của Dũng>"},
   "chu":[{"giay":0,"ma":"E1|<mã hiệu ứng>","ten_pho_bien":"Pop-up Elastic (Chữ bật nảy lò xo)","icon_ma":"IC-01","vai_tro":"","font":"","co_pct":0,"vi_tri_pct":[0,0],"mau":"","vao":"","ra":"","cach_mo_dau":"","cach_ket_thuc":"","muc_dich":"","ly_do":""}],
   "mg":[{"giay":0,"ma":"MG01","ten_pho_bien":"Lower Third (Thẻ tên/Chức danh)","icon_ma":"IC-02","mo_ta":"","thoi_luong":0,"cach_mo_dau":"Staggered Reveal (Bar->Box->Text)","cach_ket_thuc":"Reverse Order Collapse","muc_dich":"","ly_do":"","gan_loi":"","ket_hop":[]}],
   "broll":[{"giay":0,"loai":"toan|chi_tiet|duong|flycam|noi_that","thoi_luong":0,"lech_loi_s":0,"muc_dich":"","ly_do":"","gan_loi":""}],
   "an":[{"giay":0,"ma":"AN01","ten_pho_bien":"Trim Paths Draw-on (Vẽ nét chạy viền)","icon_ma":"IC-05","loai":"mat_bang|thuoc|mui_ten|icon|so_dem|ban_do","vi_tri_pct":[0,0],"mau":"","vao":"","ra":"","cach_mo_dau":"stroke-dashoffset 100%->0% (15f)","cach_ket_thuc":"Fade-out Opacity 8f","co_sfx":false,"muc_dich":"","ly_do":"","gan_loi":""}],
   "chuyen_canh":{"giay":0,"ma":"CC01|cut|...","ten_pho_bien":"Whip Pan (Quét ngang tốc độ cao)","so_khung":0,"easing":"","cach_mo_dau":"Ease-in 4f (A-side)","cach_ket_thuc":"Ease-out Settling 5f (B-side)"},
   "sfx":[{"giay":0,"ma":"SF01","ten_pho_bien":"Whoosh / Swish (Tiếng vút gió)","vai_tro":"","gan_voi":"chu|mg|chuyen_canh|nhac","cach_mo_dau":"Pre-Roll Lead-in -3f","cach_ket_thuc":"Reverb Tail Decay +15f","db_so_voi_nhac":0}],
   "nhac":{"phach":[0],"dien_bien":"len|ha|drop|rut|giu","muc_so_voi_giong_db":0},
   "cat":[0]}],
 "phu_de":{"co_phu_de":true,"preset":"CAP-01..CAP-06","ten_pho_bien":"Karaoke Gold Wave","font":"Be Vietnam Pro","mau_chinh":"#FFFFFF","mau_nhan":"#FFD700","vi_tri_y_pct":75,"ne_chu_hook":true},
 "text_vfx_presets":[{"preset_id":"TX-TV01-01","base_preset":"TX-01","ten_pho_bien":"","icon_ma":"IC-01","font":"","mau_chinh":"","cach_mo_dau":"","cach_ket_thuc":""}],
 "su_kien_do_duoc":{"cat":0,"chu":0,"mg":0,"aroll":0,"broll":0,"an":0,"vfx":0,"effect":0,"chuyen_canh":0,"sfx":0,"phach_manh":0},
 "ket_hop":[{"dau_hieu_loi":"giá|diện tích|vị trí|tên phòng|câu hỏi|CTA","combo":"broll + an/mg + chữ (kiểu, màu) + icon (IC-xx) + SFX vai + chuyển cảnh","thoi_diem":"so với từ khóa ±s","nguon":"<url + giây>"}],
 "diem_yeu_bao_dung":[], "trang_thai":"Chua dat|Dung duoc|Chuan|Bo", "so_lan_dung":0, "dung_cham":[]}
```

## 3. Cổng "không bỏ sót" — chạy `scripts/template_check.py <template.json>`
Đạt khi: các đoạn liền nhau phủ đủ 0 → thời lượng (±0,2s); số đo của cả 8 thành phần trong `doan` = `su_kien_do_duoc`; có `bgm.nguon_nhan`; mọi đoạn có cảnh + `bo_cuc.cach_dung` + nhạc + ít nhất 1 sự kiện hoặc ghi lý do giữ tĩnh; SFX đúng số đo của mẫu, không thêm; có hook, ≥1 open loop, mốc kêu gọi theo dõi; không có `diem_yeu_da_sua`. Thiếu → quay lại đo đúng lớp đó, tối đa 3 lượt. PASS chỉ là đủ dữ liệu, chưa phải template đạt.

## 4. Áp vào video của Dũng (`/dung-video` giai đoạn 1b → 6)
- Dũng tự chọn template. Việc của Claude: gửi liên kết thư mục chứa template liên quan + gợi ý mã khớp thể loại và lời thoại, chỉ trong trạng thái Dùng được/Chuẩn. Dũng chọn xong mới áp NGUYÊN KHỐI đúng mã đó, mọi agent đọc cùng `template.json`.
- Ghép: mỗi `doan` ↔ take/cảnh của Dũng theo vai trò lời. Thời lượng khác mẫu → co/giãn theo tỷ lệ từng đoạn, giữ nguyên mật độ sự kiện/giây và vị trí trên phách nhạc.
- Thiếu cảnh cho một đoạn → báo Dũng danh sách cảnh còn thiếu, chờ lệnh; không tự thay cảnh hay thêm MG.
- Mẫu thắng luật dựng chung. Chỉ thay footage, nội dung chữ và lời bằng của Dũng; lời kêu gọi theo dõi chỉ khi Dũng nói. Mẫu làm khác luật chung (SFX phụ đề, camera giả, che mặt, nền hộp…) → giữ trong template, lúc dựng hỏi Dũng từng trường hợp.
- Dũng duyệt → template +1 `so_lan_dung`, điểm; chê → luật kiểm mới cho template đó (Vòng tự học).

## 5. Tự dựng template giống mẫu + kiểm tối đa 3 vòng tới 100 điểm (`R-L033`, Dũng 30/10/2026)
1. Đo mẫu → `template.json` (mục 1, có đủ 8 thành phần + "vì sao" + `ten_pho_bien` + `cach_mo_dau` + `cach_ket_thuc`) → `template_check.py` PASS.
2. Tự dựng bản tái tạo bằng HyperFrames theo đúng `template.json`: cùng thứ tự đoạn, cú cắt (giờ tương đối), chữ (vị trí %, màu hex đo được, kiểu vào/ra), BR/AN/MG đúng mốc + mục đích, SFX đúng vai, nhạc cùng BPM/diễn biến. Footage: footage Dũng cùng thể loại; thiếu cảnh → ghi cảnh tạm, không bịa hình.
3. Render nháp 720p → đo lại bản tái tạo bằng CÙNG bộ đo → `ban_dung.json`.
4. Chấm: `python scripts/template_similarity.py template.json ban_dung.json --out diem.json` (8 thành phần: Text 15 · SFX 10 · VFX 10 · Motion Graphics 15 · Effect 10 · BGM 10 · A-roll và B-roll 15 · bố trí-cấu trúc-bố cục 15; thành phần cuối gồm nhịp cắt, vai trò đoạn, bố cục, giữ chân).
5. Vòng 1–3: sửa bản dựng ở thành phần điểm thấp nhất theo danh sách lệch, đo + chấm lại. Đạt 100 → trạng thái "Dùng được". Sau vòng 3 chưa 100 → "Chưa đạt — điểm/100", báo Dũng bảng lệch + clip so sánh, không được dùng; không nói đạt, không nới dung sai.
6. Mẫu thắng luật dựng chung: không miễn trừ điểm lệch nào. Lệch vì nội dung chữ/lời của Dũng thì chỉ thay nội dung, vị trí + màu + kiểu vào vẫn giữ đúng mẫu.
7. Mỗi lần `/dung-video` dùng template → mở lại video gốc (skill `watch`), so khác biệt rồi mới áp (R-L025).

## 6. Hệ thống 2 Dạng Template Song Song (`R-L037`, Dũng chốt 03/11/2026)
Mỗi lần học từ video mẫu hoặc dựng video cho Dũng, hệ thống cung cấp song song **2 dạng Template**:
1. **Dạng 1 — Template Video Trọn Bộ (`TV-xx`, Giống hoàn toàn video mẫu 100%):**
   - Lưu tại `asset/phong_cach/template/<TV-xx>-<ten>/` (`template.json`, `the.md`, `contact.jpg`, `sample_look.cube`, `hf/index.html`).
   - Sao chép nguyên khối 100% của cả 8 thành phần trên một timeline duy nhất, chấm đạt `100/100` qua `template_similarity.py` (`R-L033`).
   - Dựng bằng MCP Tool `antigravity_reconstruct_and_score_template_100` và áp vào video của Dũng bằng `antigravity_build_from_template` (hỗ trợ 3 lựa chọn màu `color_choice=1|2|3`).
2. **Dạng 2 — Mẫu VFX/Effects Text + Icon Động Cài Sẵn Có Thể Tùy Chỉnh (`TX-01..TX-08` & `TX-<TV>-xx`):**
   - Lưu tại `asset/phong_cach/bo_chu/INDEX.md` (8 mẫu chuẩn ngành `TX-01..TX-08` + các mẫu `TX-<TV>-xx` trích xuất tự động từ mỗi video mẫu) kèm 24 Icon SVG động (`IC-01..IC-24` tại `asset/phong_cach/icons/INDEX.md`).
   - Cho phép Dũng tùy chỉnh tự do **9 thông số** qua biến CSS `:root`, `data-*` hoặc MCP Tool `antigravity_customize_text_vfx_template`:
     1. Nội dung chữ (`custom_text`, `sub_text`, số đếm `data-target`)
     2. Icon SVG động đi kèm (`icon_id`: `IC-01..IC-24`, `icon_pos`: `left|right|top|inline|none`)
     3. Font chữ tiếng Việt (`--tx-font`, kiểm duyệt qua `vn_font_gate.py`)
     4. Bảng màu (`--tx-primary`, `--tx-accent`, `--tx-glow`, `--tx-stroke`)
     5. Kích thước & Vị trí X/Y (`--tx-size`, `--tx-x`, `--tx-y`)
     6. Cách Mở đầu (`--tx-enter-dur`, `--tx-enter-ease`, kiểu Entrance)
     7. Lớp VFX đi kèm (`--tx-blur`, `--tx-glow-radius`, Shimmer, Mask Behind Person, Glassmorphism)
     8. Cách Kết thúc (`--tx-exit-dur`, `--tx-exit-ease`, kiểu Exit)
     9. SFX đồng bộ (`sfx_in`, `sfx_out`, Pre-Roll Lead-in `-3f`, Peak Sync `0f`, Reverb Tail `+15f`)

## 7. Quy tắc Mở đầu (Entrance) · Duy trì (Hold) · Kết thúc (Exit) & Đặt tên phổ biến (`R-L034`–`R-L036`)
- **Luật 3 pha bắt buộc (`R-L034`):** Không hiệu ứng nào được bật/tắt đột ngột (trừ Hard Cut có chủ đích). Mọi thành phần trong 7 nhóm Hiệu ứng video (`CH` Chữ, `CC` Chuyển cảnh, `CM` Chuyển động máy/Speed Ramp, `MG/AN` Đồ họa & Icon động, `VFX/LP` Kỹ xảo & Lớp phủ, `MA` Màu sắc, `SF` Âm thanh) phải ghi rõ `cach_mo_dau` (Entrance: số frame, easing `cubic-bezier(0.22, 1, 0.36, 1)` / `back.out(1.7)`) và `cach_ket_thuc` (Exit: nhanh hơn Entrance 30–40%, easing `cubic-bezier(0.55, 0, 1, 0.45)`).
- **Luật Pre-Roll SFX & Whip/Transition (`R-L035`):** Chuyển cảnh (`CC`) phải bắt đầu gia tốc từ **3–6 frame trước vết cắt** (Clip A) và giảm tốc trả nét **4–8 frame sau vết cắt** (Clip B). SFX (`SF`) đi kèm phải mở đầu sớm **2–4 frame trước sự kiện hình** để đỉnh sóng âm (Waveform Peak) rơi chính xác vào frame cắt/chữ nảy (`0f`), và kết thúc bằng **Reverb Tail 10–25 frame**.
- **Luật Đặt tên phổ biến (`R-L036`):** Luôn ghi trường `ten_pho_bien` theo chuẩn **`Tên phổ biến quốc tế (Tên thông dụng tiếng Việt)`** mà cộng đồng Editor dùng trong CapCut, Premiere, After Effects, DaVinci (ví dụ: `Pop-up Elastic (Chữ bật nảy lò xo)`, `Whip Pan (Quét ngang tốc độ cao)`, `Speed Ramp (Đổi tốc độ đường cong)`, `Trim Paths Draw-on (Vẽ nét chạy viền)`, `Light Leak / Film Burn (Cháy sáng ống kính)`). Tra cứu đầy đủ tại `asset/phong_cach/tu_dien_hieu_ung.md` và `references/editor-chuyen-nghiep-8-thanh-phan.md` (Phần 4 & Phần 5).

## 8. Quy trình sử dụng Tài nguyên Overlay (`OV-01..OV-08`) & Khung Background (`BG-01..BG-08`) (`R-L038`, Dũng chốt 03/11/2026)
- **Phân định rạch ròi với luật cấm "Hộp nền tối sau chữ" (`luat-cung.md` mục 7 & `01-quy-tac-thep.md` mục 6):**
  - **CẤM:** Tự ý đặt hộp chữ nhật nền tối đặc (`solid dark box`) đè trực tiếp sau phụ đề (`T0`), nhãn (`T1`) hoặc chữ hook (`T2–T3`) trên cảnh nhà thật. (Nếu video mẫu có dùng hộp nền sau chữ → giữ trong `template.json` để tái tạo mẫu đạt `100/100`, nhưng khi dựng cho Dũng phải **hỏi Dũng** trước khi áp).
  - **ĐƯỢC DÙNG & TUÂN THỦ 6 TẦNG Z-INDEX (`R-L038`):**
    1. `Z-0 (Background Canvas)`: `BG-03` (`Blurred Glass Canvas` lấp đầy khung dọc 9:16 khi chèn ảnh ngang/sổ hồng), `BG-04` (`Architectural Blueprint Grid` khi vẽ sơ đồ mặt bằng), `BG-05` (`Luxury Dark Studio`), `BG-06` (`Legal Paper Frame`).
    2. `Z-10 (Primary Footage & Split Frames)`: A-roll/B-roll chính + `BG-01` (`Split-Screen 2-Grid / 3-Grid Frame`).
    3. `Z-20 (Depth & Dimmer Overlays dưới chữ)`: `OV-01` (`Local Radial Gradient Dimmer` mỏng `opacity: 0.22–0.32` không viền hộp để đẩy tương phản chữ `≥ 4.5:1`), `OV-06` (`Soft Vignette`), `OV-08` (`Spotlight Focus Mask`), `BG-02` (`PiP Floating Card Frame`).
    4. `Z-30 (Subject Cutout Mask)`: `OV-07` (`AI Subject Cutout` đặt chữ Hook ở `Z-25` sau lưng người dẫn, tối đa 1 lần/video ở Hook đầu).
    5. `Z-40 (Typography, MG & Icons)`: Phụ đề (`T0`), Nhãn (`T1`), Chữ Hook (`TX-01..TX-08`), Icon động (`IC-01..IC-24`), Tia sáng quét chữ `OV-03` (`Light Sweep / Gold Shimmer Ray`).
    6. `Z-50 (Cinematic Finishing & QA Guide)`: `OV-02` (`Light Leak` chỉ đặt qua vết cắt chuyển cảnh `±8f`, không phủ toàn clip làm sai màu nhà), `OV-04` (`Soft Halation`), `OV-05` (`35mm Film Grain 4–7%`), `BG-07` (`Viewfinder HUD`), `BG-08` (`Safe-Zone QA Guide` — bật khi kiểm G4/G7, ẩn khi render `.mp4`).
- Tra cứu danh mục đầy đủ tại `asset/phong_cach/overlays_va_khung/INDEX.md` và `references/editor-chuyen-nghiep-8-thanh-phan.md` (Phần 6).

## 9. Quy trình tạo hiệu ứng Phụ đề Video (Kinetic Captions `CAP-01..CAP-06`) (`R-L039`, Dũng chốt 03/11/2026)
- **Cấu trúc 3 Pha cho từng cụm phụ đề (2–5 từ):**
  1. *Pha 1 (Mở đầu Xuất hiện — 0.08–0.12s):* Bắt đầu trước âm tiết 2 frame. Kiểu vào: `Pop-in Elastic 0.10s` (`scale 0.88 -> 1.05 -> 1.0`), `Fade Up 0.08s` (`y: +8px -> 0px`), hoặc `Word-by-word Reveal`.
  2. *Pha 2 (Duy trì & Tạo điểm nổi bật — Hold & Active Highlight):*
     - *Active Word:* Từ đang nói đổi sang Vàng Gold `#FFD700`, nhún nhẹ `scale 1.1x` theo timecode `words.json`.
     - *Smart Keyword Auto-Accent:* Tự động phát hiện 4 nhóm từ khóa đắt giá (Giá & Con số, Vị trí & Khu vực, Pháp lý, Tính từ đắt giá) để áp **Vàng Gold `#FFD700` + Soft Glow 10px**, từ đệm giữ màu trắng viền đen 3px.
     - *Né Chữ Hook Hero (`Collision Avoidance`):* Khi Chữ Hook lớn (`T3`) xuất hiện ở giữa màn hình, phụ đề tự động hạ mờ `opacity: 0.25` hoặc ẩn tạm thời 1–2s để tránh tranh chấp thị giác.
  3. *Pha 3 (Kết thúc — 0.05–0.08s):* `Snap Cut 0.05s` khi sang cụm từ tiếp theo hoặc `Quick Dissolve Out 0.06s` khi có khoảng lặng.
- **6 Mẫu Preset Phụ đề:** `CAP-01` (Karaoke Gold Wave — Mặc định), `CAP-02` (Word-by-Word Elastic Bounce), `CAP-03` (Smart Keyword Highlight & Glow), `CAP-04` (Pill Highlight Box Float), `CAP-05` (Underline Stroke Draw), `CAP-06` (Cinematic Minimal). Chi tiết xem `asset/phong_cach/phu_de/INDEX.md` và `references/editor-chuyen-nghiep-8-thanh-phan.md` (Phần 7).
