# Cẩm nang Tư duy Editor Chuyên nghiệp & Giải phẫu 8 Thành phần Video (Chuẩn 03/11/2026)

Tài liệu này giúp Claude (`hoang-dung-auto-style-learner` và `dung-video`) nắm vững **tư duy dựng phim của Editor thương mại/viral chuyên nghiệp**, cấu trúc **8 thành phần bắt buộc trên Timeline**, và **quy trình 2 pha phối hợp với Antigravity Bridge v3.0** để:
1. **Dựng lại Template từ video mẫu đạt 100/100 điểm** (không bỏ sót bất kỳ chi tiết nào; sai hoặc dưới 100 điểm là loại bỏ, tuyệt đối không gắn nhãn PASS hay dùng ở trạng thái Thử nghiệm — `R-L033`, `muc-dich-template.md`).
2. **Áp dụng Template nguyên khối vào footage + lời thoại của anh Dũng** để xuất ra video hoàn chỉnh (dự án HyperFrames `hf/index.html` + bản cuối 9:16 H.265 60fps). Video giao Dũng đạt `≥ 98/100`; riêng template vẫn phải đạt đúng `100/100`.

---

## PHẦN 1: TƯ DUY & QUY TRÌNH 7 BƯỚC CỦA EDITOR CHUYÊN NGHIỆP (BOTTOM-UP TIMELINE)

Lỗi lớn nhất của AI khi dựng video là nhìn video như một chuỗi ảnh rời rạc rồi gắn chữ/SFX ngẫu nhiên.Một **Senior Video Editor** luôn dựng theo kiến trúc **Từ dưới lên (Bottom-Up Layering)** gồm 7 bước khóa chặt nhau:

```
[Track V6] TEXT / KINETIC TYPOGRAPHY  (T0 Phụ đề · T1 Nhãn định vị · T2/T3 Chữ Hook + Số/Giá)
[Track V5] MOTION GRAPHICS & ANIMATION (Thẻ thông tin · Bộ đếm · Bản đồ OSM · Vẽ nét mặt bằng · Icon)
[Track V4] VFX & COMPOSITING          (Rotoscoping tách người · Chữ sau chủ thể · Speed Ramp · Glow/Flash)
[Track V3] EFFECT & COLOR GRADING     (Chuyển cảnh Whip/Match/Mask · Chuyển động máy · LUT .cube)
[Track V2] B-ROLL (CUTAWAYS)          (Cảnh minh họa lời nói · J-cut / L-cut · Đa dạng cỡ cảnh)
[Track V1] A-ROLL (SPINE)             (Người dẫn / Khung hình xương sống đã cắt sạch khoảng lặng)
---------------------------------------------------------------------------------------------------------
[Track A1] DIALOGUE / VOICE (.mp3)    (Giọng nói −14 LUFS · Đáy năng lượng 5ms · Crossfade 22ms · Giữ câu trọn vẹn)
[Track A2] MULTI-LAYER SFX (.mp3)     (Dự báo Riser → Điểm chạm Hit/Pop/Shutter → Đuôi Shimmer · Canh peak_t)
[Track A3] BGM & BEAT GRID            (Nhạc nền khóa BPM · Lưới phách mạnh · Ducking −18..−22 LUFS dưới giọng)
```

### 7 Bước Hậu kỳ Chuẩn của Editor Chuyên nghiệp:
1. **Bước 1 — Giải phẫu Kịch bản & Xương sống Giữ chân (Retention Spine):**
   - Trước khi đặt kéo cắt, Editor xác định **Đường cong chú ý (Attention Curve)**:
     - **0–3s (Triple Hook):** Hook Thị giác (cảnh đắt nhất / chuyển động mạnh) + Hook Lời nói (con số đắt giá / câu hỏi nghịch lý) + Hook Âm thanh (Riser/Impact + nhạc bắt tai từ giây 0).
     - **Open Loops (Câu nhử mở & trả lời):** Gieo câu hỏi hoặc giấu thông số quan trọng (ví dụ: giá bán, điểm đặc biệt nhất) ở đầu video và mở dần ở `30%`, `60%`, `80%` thời lượng để giữ người xem không vuốt qua.
     - **Pattern Interrupt (Đổi nhịp thị giác mỗi 1.5s–3.0s):** Mắt người xem TikTok/Reels sẽ mỏi nếu khung hình đứng yên quá 3 giây. Nếu chưa cắt cảnh, bắt buộc phải có sự kiện thị giác mới (bật chữ động, bật thẻ MG, đổi góc B-roll, hoặc tách lớp).
2. **Bước 2 — Radio Edit (Xương sống Giọng nói - Track A1 & V1):**
   - *"Âm thanh quyết định nhịp, hình ảnh đi theo âm thanh."*
   - Làm sạch giọng nói (cắt khoảng lặng `>0.25s` về `0.16s`, cắt nói vấp/lặp cụm, âm đệm `à, ừm, ờ, thì, á`, tiếng ho/thở mạnh tại đáy năng lượng 5ms + crossfade 22ms).
   - **Luật vàng của Editor (`R-L030`):** Giữ lại **quãng nghỉ có nghĩa (Dramatic Pause)** trước con số đắt giá, và đảm bảo người dẫn **nói HẾT câu** (`≥0.1s` sau từ cuối) rồi mới chuyển cảnh.
3. **Bước 3 — Thiết lập Kiến trúc Nhịp nhạc & Beat Grid (Track A3):**
   - Đo chính xác **BPM** và **danh sách giây của từng phách mạnh (`phach`)**.
   - Chia nhạc theo diễn biến cảm xúc từng phân đoạn: `len` (Build-up) → `drop` (Cao trào / Reveal) → `ha` / `rut` (Lùi xuống dưới giọng nói hoặc ngắt nhịp trước câu chốt) → `giu` (Giữ nhịp ổn định).
   - Ở các đoạn không lời hoặc chuỗi B-roll nhanh (Montage/Tour), điểm cắt hình phải khóa vào phách nhạc (`±0.05s`).
4. **Bước 4 — Phối cảnh B-Roll, Tiến trình Cỡ cảnh & J-Cut / L-Cut (Track V2 → Picture Lock):**
   - **Bằng chứng thị giác (Visual Proof):** Lời nói nhắc tới công năng/chi tiết nào thì cảnh B-roll phải hiển thị đúng chi tiết đó ngay tại từ khóa.
   - **Tiến trình cỡ cảnh (Shot Scale Progression):** Luân phiên `Toàn (Wide/Flycam)` → `Trung (Medium)` → `Cận/Đặc tả (Close-up/Detail)`. Không xếp 2 cảnh B-roll cùng góc/cùng cỡ sát nhau gây giật mắt.
   - **Kỹ thuật J-Cut & L-Cut (`lech_loi_s`):**
     - **J-Cut (`lech_loi_s < 0`):** Âm thanh của câu mới vang lên trước `0.15s–0.4s` khi hình vẫn ở cuối cảnh cũ → dẫn dắt não người xem sang phân đoạn mới mượt mà.
     - **L-Cut (`lech_loi_s > 0`):** Người dẫn đang nói ở A-roll nhưng hình B-roll đã đè lên sớm hoặc kéo dài sang câu sau `0.3s–1.0s` → che vết cắt A-roll và giữ mạch kể chuyện.
   - Hoàn tất phân đoạn nào thì **khóa phân đoạn đó (`segment_lock: true`)** để các tổ khác chạy đồng thời.
5. **Bước 5 — Phủ Chuyển cảnh, Màu sắc (`.cube`), VFX & Motion Graphics (Track V3, V4, V5):**
   - Làm đồng thời trên từng phân đoạn đã khóa, không chờ khóa cả video. Mọi hiệu ứng đều phải có **Mục đích (`muc_dich`)** và **Lý do (`ly_do`)** gắn với câu nói hoặc nhịp nhạc.
6. **Bước 6 — Thiết kế Chữ 3 Bậc (Track V6) & Âm thanh SFX Đa lớp (Track A2):**
   - Đặt chữ theo phân cấp thị giác rõ ràng (T0 Phụ đề, T1 Nhãn định vị, T2/T3 Chữ Hook/Số lớn), kiểm tra vùng mặt (`face_zones` — cấm che mặt người dẫn `R-L026`) và vùng an toàn TikTok.
   - Thiết kế SFX khớp chính xác **đỉnh âm (`peak_t`)** vào khung hình đầu tiên của chuyển động chữ/chuyển cảnh (`±0.03s`).
7. **Bước 7 — Đo kiểm Khách quan & Chấm điểm Đối sánh 100/100:**
   - Dùng bộ đo tự động (`measure_video.py`, `template_check.py`, `template_similarity.py`) để đối chiếu bản dựng với video mẫu trên cả 8 thành phần.

---

## PHẦN 2: GIẢI PHẪU 8 THÀNH PHẦN BẮT BUỘC TRONG MỌI TEMPLATE (LUẬT 03/11/2026)

Một Template hoàn chỉnh (`template.json` + `the.md` + `contact.jpg` + `sample_look.cube` + recipes) **bắt buộc phải bóc tách và tái tạo đủ 8 thành phần sau**:

### 1. TEXT (Typography & Kinetic Text)
- **Phân loại 3 bậc vai trò:**
  - **Bậc T0 (Phụ đề / Subtitles):** Font `Be Vietnam Pro` / `Montserrat` Bold, trắng `#FFFFFF` + viền đen `3–4px`, tối đa 6 từ/dòng, không tách từ ghép tiếng Việt, không hiệu ứng nảy, không SFX.
  - **Bậc T1 (Nhãn định vị / Room & Timestamp Labels):** Nhãn tên phòng/tầng (`Phòng khách`, `Tầng 2`), mốc giờ (`08:30 AM`). Hiện sau cú cắt `0.2s–0.3s` ở vùng trên (`y ≈ 12%–18%`) để định vị không gian cho người xem.
  - **Bậc T2–T3 (Chữ Hook, Số liệu đắt giá, Giá bán, Câu hỏi chuyển ý):**
    - **Phối cặp Font (Font Pairing):** Kết hợp 1 font Display dày (`Montserrat Black/ExtraBold`, `Be Vietnam Pro Black`, `SVN-Bebas Neue`) cho con số/từ khóa chính + 1 font Script viết tay (`MTD Adventures Unlimited Script`, `HLT-PF-Champion-Script`) hoặc Serif nghiêng (`PlayfairDisplay-BlackItalic`) cho từ nhấn cảm xúc.
    - **Thông số bắt buộc phải đo & tái tạo:** Mốc vào/ra (`giay`, `thoi_luong`), vị trí tâm `vi_tri_pct: [x%, y%]`, chiều cao `co_pct` (% chiều cao khung), mã màu Hex chính xác từ trung vị pixel (`mau`, khai báo biến CSS `:root`), kiểu vào/ra (`vao`, `ra`, số khung, hàm easing `easeOutCubic` / `easeOutBack`), gắn với từ khóa nào trong lời (`gan_loi`).

### 2. SFX (Sound Effects, Sonic Architecture & Psychological Pacing)
> **Đọc cẩm nang chuyên sâu:** `references/sfx-sound-design-chuyen-sau.md` (hệ thống sound design đa tầng & tâm lý học âm thanh chuẩn Editor Pro).
> **Cảnh báo lỗi AI:** CẤM bóc tách SFX cơ học theo kiểu "thấy hình gì gắn tiếng đó". Phải giải mã **Ý đồ dẫn dắt (Narrative Intent)**, **Tầng ý nghĩa tâm lý**, và **Khoảng thở âm thanh (Audio Spacing)** của video mẫu.

- **5 Nhóm chức năng sinh học bắt buộc nhận diện (`nhom_chuc_nang`):**
  1. `ambience` (**Room Tone / Không gian tiềm thức**): Dải âm nền liên tục (`-24dB` đến `-32dB`) làm keo dán (Audio Glue) liền mạch các cú cắt, giữ cảm giác chân thực khi người dẫn ngừng nói chuyển ý.
  2. `foley` (**Xúc giác thị giác - ASMR**): Tương tác vật lý thật (sột soạt giấy sổ hồng, gõ phím cơ, cộp ly nước, ngòi bút ký). Âm lượng nằm dưới giọng (`-18dB` đến `-24dB`), khóa khớp khung hình tuyệt đối (`±1 frame`).
  3. `transitions` (**Động lực học & Điều hướng mắt**): *Whoosh / Swish / Cinematic Pass-by*. **CHỈ dùng cho chuyển cảnh lớn (Macro-Transitions)**, cấm gán vào icon/chữ nhỏ. Bắt buộc có J-Cut Lead-in vào sớm `3-5 frames` (`0.08s - 0.15s`).
  4. `impacts` (**Trọng lực & Điểm nhấn nhận thức**): *Sub-Drop / Heavy Bass Thud / Stinger / Riser*. Kéo căng và giáng đòn vào thông tin sống còn (giá tiền, số liệu sốc). Video 60s chỉ có tối đa 2-3 cú Impact lớn.
  5. `textures` (**Thao túng tâm lý sâu**): *Dark Sub Drone* (ù trầm đe dọa), *High Ringing/Tinnitus* (sang chấn/choáng ngợp), *Muffled Heartbeat* (lo âu hồi hộp).
- **4 Tầng ý nghĩa tự sự (`tang_y_nghia`):**
  - `T1_visual_sync`: Khớp chuyển cảnh vĩ mô.
  - `T2_cognitive_anchor`: Khắc sâu thông tin quan trọng / con số / nghịch lý (kèm hạ nhạc nền ducking 6dB).
  - `T3_emotional_arc`: Dẫn dắt nhịp thở cảm xúc (tăng áp lực bằng Clock Ticking/Drone, lắng đọng bằng Low-pass filter).
  - `T4_negative_space`: **SỰ IM LẶNG ĐẮT GIÁ (Dead Silence 0.3s - 0.8s)** ngay trước cao trào/plot twist để tạo lực nổ dopamine cực đại.
- **Bản đồ nhịp cảm xúc theo Timeline (Timeline Pacing):**
  - `Hook (0-3s)`: Cắt ngang nhịp lướt bằng Sub-drop nhẹ/Tape stop + Riser ngầm. CẤM tiếng còi xe, thét la, kính vỡ rẻ tiền.
  - `Context Setup (3-15s)`: Foley xúc giác + Ambience ấm áp, chữ hiện tĩnh kèm tiếng sột soạt nhẹ.
  - `Body Escalation (15-45s)`: Tương phản âm thanh (Audio Contrast), ngắt nhạc ở điểm xung đột gay gắt.
  - `Climax & Twist (45-55s)`: Công thức 3 bước: Riser dồn nén -> Negative Space cắt cụt 0.5s -> Sub-drop + Shimmer bùng nổ khi sự thật lộ diện.
  - `Resolution & CTA (55-60s)`: Nhạc nền dịu lại qua Low-pass filter, nốt Piano đơn sắc mỏng, không ting ting/còi dập thô bạo.
- **Kỹ thuật âm học & Cổng an toàn:**
  - **Dải tần bảo mật của Giọng nói (Mid-Range Cleansing):** Mọi SFX phát ra khi có giọng nói BẮT BUỘC phải EQ Cut dải `800Hz - 3.5kHz` (khoảng `-4dB` đến `-6dB`), chỉ chiếm dải Sub (<80Hz) hoặc Air (>5kHz) để không đè nát giọng nói.
  - **Khoảng thở âm thanh:** Khoảng cách giữa 2 cú Accent Hits tối thiểu `2.5s - 3s`. Tuyệt đối cấm spam dồn dập.
  - **Quy tắc Timeline:** Mỗi SFX là một file `.mp3` riêng (`class="clip sfx"`, `data-sfx-peak`), thấp hơn giọng `1–6 dB`, nổi trên nhạc nền `≥4.5 dB`, `true peak ≤ -1 dBTP`. CẤM tiếng `Sine/` và tiếng hoạt hình/meme rẻ tiền (`R-L032`).

### 3. VFX (Visual Effects & Compositing)
- **Các kỹ thuật VFX trong video mẫu cần nhận diện & dựng lại:**
  - **Subject Masking / Rotoscoping (Tách nền chủ thể):**
    - *Text Behind Subject (`MG24` / `E2`):* Nhân đôi lớp video người dẫn, tách nền người đè lên trên lớp chữ số lớn (vàng/xanh ngọc) đặt ngang vai/sau đầu, giữ khuôn mặt hoàn toàn sạch sẽ.
    - *Freeze-Frame Cutout Pop-in:* Đóng băng 1 khung hình chủ thể/vật thể, tách nền kèm viền trắng hoặc bóng đổ, bật lên trước cảnh nền kèm tiếng chụp ảnh (`Shutter`).
  - **Speed Ramp / Time Remapping (Đổi tốc độ đường cong):** Tua nhanh (`2.5x–4x`) ở đoạn di chuyển qua cửa/hành lang và hãm chậm mượt (`0.5x–1.0x`, `easeOutCubic`) ngay khi mở ra không gian chính của phòng.
  - **Optical & Light Overlays:** Chớp sáng (`Flash / Stinger Hit`), đảo màu âm bản ngắn (`Negative/Chrome Hit` 2–4 frames ở Hook), vệt sáng quét qua chữ số (`Light Sweep / Gold Shimmer`), quầng sáng mềm (`Soft Halation / Glow` đơn sắc).

### 4. MOTION GRAPHICS (MG & Illustrated Animation)
- **Chia làm 2 nhánh rõ rệt:**
  - **MG Thẻ & Dữ liệu (`mg[]`):** Thẻ thông tin căn nhà/dự án (`Info Cards`), thẻ so sánh các dòng sản phẩm xếp dọc/lưới, thanh tên người dẫn (`Lower-third`), nhãn phòng/tầng, bộ đếm số nhảy (`Number Counter`), thẻ bình luận Q&A.
  - **Animation Hình minh họa (`an[]`):** Bản đồ vệ tinh OSM (`zoom + pin + vòng bán kính 2km + vẽ tuyến đường`), vẽ nét mặt bằng (`SVG Floorplan stroke-dashoffset`), thước đo chiều ngang/chiều dài (`Dimension Ruler`), mũi tên chỉ hướng (`Animated Arrows`), chuỗi icon tiện ích/con người bật theo nhịp.
- **Quy tắc "Vì sao" bắt buộc:** Mọi phần tử `mg` và `an` phải ghi rõ `muc_dich` (`minh_hoa_loi | chung_minh_so_lieu | dinh_vi | doi_nhip_giu_chan | chuyen_y | nhan_gia | tao_to_mo | keu_goi`), `ly_do` (vì sao đặt đúng giây đó), `gan_loi` (minh họa từ khóa nào), và `ket_hop` (đi cùng chữ/SFX/chuyển cảnh nào).

### 5. EFFECT (Transitions, Camera Motion & Color Look `.cube`)
- **Chuyển cảnh (`chuyen_canh`):**
  - `Hard Cut on Beat`: Cắt thẳng đúng phách trống.
  - `Whip Pan / Swish Pan (TR01)`: Lia máy nhanh cùng hướng giữa cuối cảnh A và đầu cảnh B (6–10 frames + motion blur + whoosh).
  - `Match Cut`: Khớp bố cục hình học hoặc hướng chuyển động giữa 2 cảnh.
  - `Natural Mask Wipe`: Máy trượt qua cánh cửa, cột nhà, hoặc vách tường ở tiền cảnh để mở sang phòng mới.
  - `Cross Dissolve`: Hòa tan mượt `0.35s–0.5s` ở các đoạn chuyển ý cảm xúc (`R-L021`).
- **Chuyển động máy (`chuyen_dong_may`):** Phân biệt rõ **Chuyển động máy thật khi quay** (`Gimbal Push-in`, `Pull-out`, `Pan`, `Orbit`, `Walk-and-talk`, `Flycam`) với **Camera giả hậu kỳ** (`Digital Zoom`, `Punch-in`, `Ken Burns`, `Camera Shake`). Camera giả trong mẫu phải ghi nhận đầy đủ vào Template kèm cờ `camera_gia_can_hoi_dung: true` (khi dựng cho anh Dũng mặc định tắt, hỏi trước khi bật theo `luat-cung.md` mục 9).
- **Hiệu ứng Màu sắc & Tông màu hiển thị (`mau_hien_thi` & `.cube` LUT):**
  - Đo thông số màu từng đoạn (`YAVG` độ sáng, `SATAVG` độ bão hòa, `UAVG/VAVG` cân bằng trắng/ám màu) và trích xuất file **3D LUT `.cube` chuẩn của video mẫu** lưu ngay trong thư mục Template (`sample_look.cube`) để phục vụ lựa chọn (2) "Tạo màu theo video mẫu".

### 6. BGM (Background Music & Rhythm Architecture)
- Đo chính xác: **BPM**, danh sách **mốc phách (`phach`)**, **tỷ lệ cú cắt trùng phách (`ty_le_cat_dung_phach`)**, độ lớn tích hợp (`LUFS`, `LRA`), và **diễn biến năng lượng theo từng đoạn (`dien_bien`: `len | ha | drop | rut | giu`)** cùng độ chênh so với giọng nói (`muc_so_voi_giong_db`).

### 7. A-ROLL & B-ROLL (Footage Orchestration)
- Mỗi phân đoạn (`doan`) phải xác định rõ:
  - **A-Roll (`canh.host: true`):** Người dẫn xuất hiện trên hình (Toàn thân walk-and-talk, Trung cảnh nói chuyện, hay Tách nền đè trên B-roll), vị trí vùng đầu/mặt (`face_zones`) để né chữ.
  - **B-Roll (`broll[]`):** Loại cảnh (`toan | chi_tiet | duong | flycam | noi_that`), thời lượng, độ lệch J-cut/L-cut so với lời nói (`lech_loi_s`), và câu thoại được minh họa (`gan_loi`).
  - **Quy tắc Video RAW vs EDITED / Timeline Breakdown (`raw-la-footage-goc.md`, `R-L008`):** Nếu video mẫu là dạng hướng dẫn có khung `RAW` và khung `EDITED` (hoặc quay màn hình phần mềm dựng), **chỉ đo và dựng lại vùng `EDITED`**; tuyệt đối không dựng lại phần RAW hay giao diện phần mềm.

### 8. BỐ TRÍ, CẤU TRÚC & CÁCH DÙNG BỐ CỤC (Layout, Structure & Composition)
- **Cấu trúc dòng thời gian (`doan[]`):** Phủ kín từ `0.0s` đến hết `thoi_luong` (`±0.2s`), chia theo đúng vai trò kịch bản (`hook → van_de → bang_chung → vi_tri → tien_ich → gia → chot → cta`).
- **Bố cục khung hình 9:16 (Spatial Grid & Safe Zones):**
  - Vùng cấm (TikTok/Reels/Shorts UI): Trên `0–230px` (`0–12%`), Dưới `1440–1920px` (`75–100%`), Phải `920–1080px` (`85–100%`).
  - Quy tắc phân vùng hiển thị: Nhãn phòng/mốc giờ ở `12–18%` Y; Tiêu đề/Thẻ thông tin/Số lớn sau lưng host ở `22–48%` Y; Phụ đề ở `62–72%` Y (đáy phụ đề `~600px` từ dưới lên theo `R-L031`).
- **Mật độ sự kiện (`su_kien_moi_giay`) & Công thức giữ chân (`giu_chan`):** Ghi rõ mật độ sự kiện thị giác/giây, khoảng cách đổi nhịp (`doi_nhip_moi_giay`), mốc mở/trả lời câu nhử (`open_loops`), mốc cao trào (`cao_trao`), và mốc CTA (`keu_goi_theo_doi`).

---

## PHẦN 3: QUY TRÌNH KHÉP KÍN CLAUDE ↔ ANTIGRAVITY BRIDGE V3.0

Để Claude không bao giờ thiếu dữ liệu hoặc chấm trượt 100/100, quy trình được tự động hóa qua 2 pha:

### Pha A: Học & Dựng lại Template Hoàn chỉnh từ Video Mẫu (`/hoang-dung-auto-style-learner`)
1. **Bước A1 — Gọi `antigravity_learn_video` (Antigravity Deep Inspector v3.0):**
   - Claude gửi URL hoặc đường dẫn file video mẫu sang Antigravity.
   - Antigravity tự động:
     - Tải video `.mp4` + `.info.json`, tự động phát hiện và cắt vùng `EDITED` nếu là video `RAW vs EDITED` hoặc `Timeline Breakdown`.
     - Chạy `faster-whisper large-v3` lấy lời thoại từng từ (`words[]`), phân biệt video có thoại vs không thoại.
     - Quét **2 tầng sự kiện hình ảnh**: Cú cắt cảnh (`scene > 0.25`) VÀ Sự kiện thị giác chữ/MG/VFX (`scene > 0.05` + biến thiên khung hình).
     - Trích xuất **100% ảnh khung hình tại MỌI shot và MỌI sự kiện chữ/MG** + ghép **Contact Sheet tổng (`contact.jpg`)** có đóng dấu giây `0.1s` và nhãn `[CUT]` / `[EVENT]`.
     - Đo **chuyển động máy (Optical Flow)**, **thống kê màu (`signalstats`) + sinh file LUT `sample_look.cube`**, và **trích xuất bảng màu chữ Hex (`dominant_colors`)**.
     - Đo **BPM, lưới phách mạnh (`phach`), tỷ lệ cắt trùng phách, LUFS** (`measure_video.py` tương thích 100%).
     - Nghe và bóc tách **toàn bộ SFX 48kHz**, đối chiếu với từng cú cắt và từng mốc chữ/MG (`±0.15s`), ánh xạ sang file thật trong kho 863 file của anh Dũng.
     - Tạo sẵn **Bản khung `template.json` đủ 8 thành phần** vượt qua `template_check.py` (0 lỗi).
2. **Bước A2 — Claude Đọc Khung hình & Hoàn thiện Tinh chỉnh Ngữ nghĩa (`Thợ Đo` + `Định Danh`):**
   - Claude dùng tool `Read` xem `contact.jpg` và các khung hình sự kiện để điền chính xác tên hiệu ứng `[Có nguồn]` / `[Quen thuộc trong nghề]`, kiểm chứng font chữ (Phiếu font B5), và tinh chỉnh câu giải thích `muc_dich` + `ly_do` cho từng phần tử `chu`, `mg`, `broll`, `an`.
   - Cập nhật đồng thời vào:
     - `asset/phong_cach/template/<TV-xx>-<ten>/template.json` + `the.md` + `contact.jpg` + `sample_look.cube`
     - `asset/phong_cach/hieu_ung/INDEX.md` & `tu_dien_hieu_ung.md`
     - `asset/phong_cach/ket_hop/INDEX.md` & `mau_chu/bang_mau.json`
3. **Bước A3 — Tự dựng lại Template & Chấm điểm 3 Vòng tới 100/100 (`antigravity_build_from_template` chế độ `reconstruct`):**
   - Chạy `template_check.py <template.json>` → Bắt buộc **PASS (0 lỗi, phủ 100% sự kiện)**.
   - Tự dựng bản tái tạo HyperFrames (`hf/index.html` + render nháp) và chấm bằng `template_similarity.py template.json ban_dung.json` trên 8 thành phần (Text 15 · SFX 10 · VFX 10 · Motion Graphics 15 · Effect 10 · BGM 10 · A-roll và B-roll 15 · Bố cục 15).
   - Nếu `< 100/100`: Tự động sửa các lớp bị trừ điểm trong tối đa 3 vòng.
   - **Cổng chất lượng R-L033:** Chỉ khi đạt **100/100** mới ghi trạng thái `"Dùng được"`. Nếu sau 3 vòng vẫn `< 100/100`, bắt buộc ghi `"Chưa đạt — <điểm>/100"` và loại bỏ/báo bảng lệch, tuyệt đối không dùng để dựng video cho anh Dũng.

### Pha B: Sử dụng Template Đạt Chuẩn 100/100 để Dựng Video Hoàn chỉnh (`/dung-video`)
1. **Bước B1 — Khởi động & Hỏi xác nhận (Giai đoạn 0–1b):**
   - Đọc `INDEX.md`, hỏi anh Dũng chọn Template (nếu lệnh chưa có `tpl:` hoặc `mau:`) và hỏi 3 lựa chọn Màu/LUT (Giữ màu gốc / Dùng `sample_look.cube` của Template / Chọn từ 3 LUT gợi ý).
2. **Bước B2 — Xử lý Giọng nói & Phụ đề Chuẩn (Giai đoạn 2):**
   - Gọi `antigravity_clean_voice_stumbles` để lọc sạch khoảng lặng/vấp/âm đệm của anh Dũng (canh đáy năng lượng 5ms + crossfade 22ms, giữ trọn từ cuối câu `R-L030`).
   - Gọi `antigravity_create_srt` tạo phụ đề `.srt` + `_words.json` chuẩn từ vựng BĐS, hỏi xác nhận 1 lần nếu có từ xác suất thấp `<0.65`.
3. **Bước B3 — Ánh xạ Nguyên khối Template sang Footage của anh Dũng (`antigravity_build_from_template`):**
   - Ghép từng `doan` của `template.json` với A-roll và B-roll của anh Dũng theo vai trò lời thoại; co giãn thời lượng theo tỷ lệ đoạn nhưng giữ nguyên mật độ sự kiện/giây và khóa điểm cắt vào phách nhạc.
   - Sinh dự án **HyperFrames (`hf/index.html`)** đầy đủ 8 thành phần:
     - Tách riêng từng file thoại `.mp3` (`assets/audio/thoai/`) và từng file SFX `.mp3` (`assets/audio/sfx/`, có `data-sfx-peak`).
     - Mọi hiệu ứng Chữ, MG, Animation, VFX, Chuyển cảnh đều là clip riêng trên timeline (`class="clip fx"`, tween GSAP gắn `data: "<id>"`).
     - Khai báo bảng màu `:root` CSS từ `bang_mau.json` của Template.
     - Kiểm tra vùng mặt (`face_zones`) để chữ/MG không bao giờ đè lên mặt anh Dũng (`R-L026`).
4. **Bước B4 — Mở lại Video Mẫu Đối chiếu (`R-L025`), Kiểm nhanh Tổng thể `≥ 98/100` & Render Bản Cuối (Giai đoạn 7):**
   - So sánh từng mốc của bản dựng với video mẫu gốc; kiểm tra đủ cổng G0–G7 (`dung-video/rules/cong-chat-luong.md`).
   - Xuất **1 file duy nhất 9:16 H.265 60fps** vào `<HD_VIDEO_HOME>\Videos`, kèm liên kết video mẫu `ref_videos` trong `edit-state.json` và báo cáo.


---

## PHẦN 4: GIẢI PHẪU CÁCH MỞ ĐẦU (ENTRANCE) & KẾT THÚC (EXIT) CỦA MỌI THỂ LOẠI "HIỆU ỨNG VIDEO" + QUY TẮC ĐẶT TÊN PHỔ BIẾN (`R-L034` – `R-L036`)

> **NHẮC NHỞ LIÊN TỤC CHO CLAUDE:**
> 1. Không bao giờ chỉ ghi hiệu ứng chung chung (như `"fade"` hay `"zoom"`). Mọi phần tử thuộc **7 thể loại được gọi là "Hiệu ứng video"** phải được bóc tách và dựng lại đủ **3 pha: Mở đầu (Entrance / In) → Duy trì (Hold) → Kết thúc (Exit / Out)**.
> 2. **Bắt buộc gọi và đặt tên hiệu ứng theo đúng tên phổ biến mà các Editor và người làm video thường gọi** (tra cứu từ `asset/phong_cach/tu_dien_hieu_ung.md`), định dạng: **`<Tên phổ biến quốc tế> (<Tên gọi thông dụng tiếng Việt>)`**. Cấm tự bịa tên hoặc dùng câu mô tả code làm tên hiệu ứng.

### 4.1. Quy luật 3 Pha Mở đầu – Duy trì – Kết thúc của Editor Chuyên nghiệp (`R-L034`)

```
[PHA 1: MỞ ĐẦU (ENTRANCE / IN)]         [PHA 2: DUY TRÌ (HOLD / MICRO-LIFE)]      [PHA 3: KẾT THÚC (EXIT / OUT)]
├─ Thời lượng: 0.18s – 0.45s            ├─ Thời lượng: ≥ 1.5s (R-L018)            ├─ Thời lượng: 0.15s – 0.30s (60% pha In)
├─ Easing: Giảm tốc (Ease-Out)          ├─ Chữ đứng nét 100% để đọc               ├─ Easing: Tăng tốc (Ease-In: power2.in)
│  cubic-bezier(0.16, 1, 0.3, 1)        ├─ Đồ họa/VFX có chuyển động vi mô:       ├─ 3 Kiểu thoát chuẩn Editor Pro:
│  hoặc nảy nhẹ back.out(1.4)           │  + Slow Drift 1–2%                      │  (1) Cut-Out on Hard Cut (ngắt trước
├─ Đa thuộc tính (≥2-3 thuộc tính):      │  + Light Sweep (vệt sáng quét qua giá)  │      vết cắt cảnh 1–2 frames)
│  Translate + Opacity + Blur/Scale     │  + Pulse Ring (vòng sóng ghim bản đồ)   │  (2) Directional Continue Exit (trượt
├─ Stagger (Xếp tầng lệch pha):         └─ Nhạc nền Ducking -18dB dưới giọng      │      tiếp cùng chiều vào + mờ dần)
│  Nền -> Icon -> Số -> Nhãn (40-70ms)                                            │  (3) Whip / Mask Wipe Exit (cuốn theo
└─ Âm thanh dẫn trước (Audio Pre-roll):                                           │      chuyển cảnh hoặc vật cản quét qua)
   Riser/Whoosh vào sớm 0.08–0.20s,                                               └─ Đuôi âm thanh (Audio Tail):
   Đỉnh (Peak) đập trúng frame mở xong                                               Reverb Tail 0.15–0.35s / Fade-out mượt
```

### 4.2. Bảng tra cứu đầy đủ 7 Thể loại "Hiệu ứng Video": Tên gọi phổ biến + Cách Mở đầu & Kết thúc

#### Nhóm 1 — Hiệu ứng Chữ (`CH` — Text Effects & Kinetic Typography)
| Tên phổ biến chuẩn (Đặt tên file/clip) | Tên thường gọi tại VN | Cách Mở đầu chuẩn Editor Pro (Entrance / In) | Cách Kết thúc chuẩn Editor Pro (Exit / Out) |
|---|---|---|---|
| **`Pop-in (Bounce Pop)`** | Chữ nảy / Pop chữ | `0.22s–0.30s` `back.out(1.4)`: phóng từ `scale: 0.75 -> 1.04 -> 1.0` + `opacity: 0 -> 1`; đỉnh SFX `Pop / Impact` đập đúng frame đạt `1.04`. | Ngắt dứt khoát trước vết cắt cảnh `1–2 frames` (`Cut-Out on Hard Cut`) hoặc thu nhanh `0.15s` `power2.in` (`scale: 1 -> 0.9`, `opacity: 1 -> 0`). |
| **`Slide Up Fade`** | Chữ trượt lên mờ dần | `0.28s–0.40s` `cubic-bezier(0.16, 1, 0.3, 1)`: `y: +24px -> 0`, `opacity: 0 -> 1`, `blur: 4px -> 0`; SFX `Soft Whoosh` vào sớm `0.08s`. | Trượt tiếp lên trên `0.18s` `power2.in` (`y: 0 -> -14px`, `opacity: 1 -> 0`) hoặc ngắt khít tại vết cắt cảnh. |
| **`Text Reveal (Mask Reveal)`** | Chữ hiện qua mặt nạ / Mọc từ đường cắt | `0.30s–0.45s` `expo.out`: mở `clip-path: inset(100% 0 0 0) -> inset(0 0 0 0)` từ đường chân chữ đi lên. | Đóng mặt nạ `0.20s` `expo.in` hoặc ngắt khít vết cắt cảnh. |
| **`Typewriter Effect`** | Hiệu ứng gõ chữ / Máy đánh chữ | Con trỏ bật trước `0.10s`, ký tự hiện `25–40ms/chữ` (`steps(1)`) kèm tiếng gõ phím `Mechanical Tick`. | Giữ đứng yên `≥1.5s` sau ký tự cuối (`R-L018`), tắt con trỏ rồi `Fade out 0.18s`. |
| **`Word-by-Word Highlight (Karaoke Subtitles)`** | Phụ đề nhảy màu từng từ | Cụm câu vào bằng `Slide Up Fade 0.18s`; từng từ đang nói đổi sang màu Accent + phóng nhẹ `106%` trong `0.08s` `power2.out`. | Chuyển sang cụm câu kế tiếp bằng `Hard Cut` đúng khoảng nghỉ lấy hơi của người dẫn. |
| **`Text Behind Subject (Depth Text)`** | Chữ sau người tách nền | Tách nền chủ thể (`Rotoscoping`); chữ lớn trượt từ sau lưng người dẫn lên (`0.35s–0.50s` `expo.out`) kèm `Riser -> Impact`. | Chữ hạ/trượt khuất lại vào sau lưng người dẫn `0.25s` `power2.in` hoặc ngắt đúng lúc chuyển sang cảnh B-roll. |
| **`Number Counter (Rolling Odometer)`** | Số chạy / Bộ đếm số tăng dần | Con số chạy từ `0` lên số đích trong `0.60s–1.10s` `expo.out` (nhanh ở đầu, hãm chậm 2 số cuối) kèm chuỗi `Tick` + chốt `Ding/Impact`. | Giữ đứng yên số đích `≥1.5s`, sau đó thoát đồng thời cùng thẻ thông số trong `0.18s`. |
| **`Handwritten Stroke Reveal`** | Chữ viết tay tự vẽ nét | Vẽ nét bút theo `stroke-dashoffset: 100% -> 0%` trong `0.45s–0.75s` `power2.inOut`, mở đầu trước chữ in hoa chính `0.15s`. | Mờ dần `0.20s` cùng lúc với cụm chữ chính (không bao giờ tua ngược nét bút). |

#### Nhóm 2 — Hiệu ứng Chuyển cảnh (`CC` — Video Transitions)
| Tên phổ biến chuẩn (Đặt tên file/clip) | Tên thường gọi tại VN | Cách Mở đầu chuẩn Editor Pro (Cuối Cảnh A — Outgoing) | Cách Kết thúc chuẩn Editor Pro (Đầu Cảnh B — Incoming) |
|---|---|---|---|
| **`Hard Cut (Cut on Beat)`** | Cắt thẳng đúng phách nhạc | Giữ cảnh A ổn định đến sát frame trước phách mạnh của nhạc nền. | Mở cảnh B chính xác tại frame đầu tiên của phách trống (`Beat/Downbeat` sai số `≤0.04s`). |
| **`J-Cut / L-Cut (Split Edit)`** | Cắt J (tiếng vào trước) / Cắt L (tiếng ngân sang) | **J-Cut:** Âm thanh của cảnh B mở đầu sớm hơn hình cảnh B `0.15s–0.30s`. | **L-Cut:** Người dẫn nói hết câu (`R-L030`) khi hình B-roll đã vào, tiếng ngân thêm `0.15s` rồi mới dứt. |
| **`Whip Pan (Swish Pan)`** | Lia máy nhanh nhòe hướng | `4–5 frames` cuối cảnh A: tăng tốc lia nhanh (`expo.in`) + `Directional Motion Blur` + SFX `Whoosh` bắt đầu dâng. | `4–5 frames` đầu cảnh B: trượt cùng hướng vào với tốc độ giảm dần (`expo.out`) và trả nét về `0`; đỉnh `Whoosh` nằm đúng giữa vết nối. |
| **`Match Cut (Graphic / Action Match)`** | Cắt khớp hình / Cắt khớp chuyển động | Cuối cảnh A: chủ thể/máy quay bắt đầu chuyển động theo một hướng và bố cục khung xác định. | Đầu cảnh B: tiếp nối đúng vị trí, kích thước và véc-tơ vận tốc đó tại không gian phòng mới. |
| **`Mask Wipe (Object / Walk-by Wipe)`** | Chuyển cảnh quét mặt nạ / Cắt ngang cột-tường-người | Khi mép cột nhà/tường/bóng người vừa chạm vào khung hình: bám đường `Mask Feather 15–25px` theo cạnh vật cản. | Khi vật cản vừa lướt qua hết khung hình (`0.25s–0.45s`): cảnh B đã lộ ra 100%, tắt Mask. |
| **`Speed Ramp Zoom Transition (Crash Zoom)`** | Chuyển cảnh zoom nhanh dồn tốc | `4–6 frames` cuối cảnh A: phóng nhanh `scale: 1.0 -> 2.2` (`expo.in`) + `Radial Blur` + `Fast Whoosh`. | `4–6 frames` đầu cảnh B: bung từ `scale: 1.8 -> 1.0` (hoặc `0.6 -> 1.0`) `expo.out`, trả nét mượt. |
| **`Cross Dissolve (Smooth Dissolve)`** | Hòa tan / Chồng mờ | Bắt đầu giảm `opacity` cảnh A từ `0.20s` trước điểm cắt tại khoảng nghỉ giữa 2 câu thoại (`R-L021`). | Cảnh B đạt `opacity: 1.0` sau điểm cắt `0.20s–0.25s` (tổng thời gian hòa tan `0.40s–0.50s` `easeInOutSine`). |
| **`Luma Fade (Light Leak Transition)`** | Chuyển cảnh theo vùng sáng / Lọt sáng | `0.15s–0.20s` cuối cảnh A: vùng sáng cửa sổ/đèn hoặc vệt `Light Leak` bừng sáng tràn khung kèm SFX `Shimmer/Swoosh`. | `0.20s–0.30s` đầu cảnh B: độ chói dịu êm về mức sáng chuẩn, để lộ cảnh mới sang trọng. |
| **`Shutter / Freeze-Frame Cutout Transition`** | Chuyển cảnh chụp cắt hình tách nền | Trước vết cắt `0.25s`: chủ thể tách nền của cảnh B bật `Pop-in` đè lên cảnh A kèm tiếng chụp ảnh `Camera Shutter`. | Đúng tại vết cắt `0.00s` của cảnh B: hình tách nền khớp khít 100% vào khung hình cảnh B và chuyển động tiếp. |

#### Nhóm 3 — Hiệu ứng Chuyển động Máy & Thời gian (`CM` — Camera & Time Effects)
| Tên phổ biến chuẩn (Đặt tên file/clip) | Tên thường gọi tại VN | Cách Mở đầu chuẩn Editor Pro (Entrance / In) | Cách Kết thúc chuẩn Editor Pro (Exit / Out) |
|---|---|---|---|
| **`Push-in / Dolly-in & Pull-out (Ken Burns)`** | Đẩy cận từ từ / Kéo lùi máy | Khởi động ngay từ frame đầu tiên của cảnh (`scale: 1.0 -> 1.06`, `easeInOutSine`) — *Lưu ý: giả lập bằng phần mềm phải hỏi Dũng trước theo luật 02/11*. | Duy trì vận tốc mượt đến tận frame cuối của cảnh, tuyệt đối không dừng khựng giữa cảnh. |
| **`Punch-in (Jump Zoom)`** | Phóng cận đột ngột nhấn từ khóa | Bật tức thời ở frame phụ âm đầu của từ khóa đắt giá (`scale: 1.0 -> 1.14`) — *Mặc định tắt, hỏi Dũng trước*. | Giữ nguyên khung cận đến hết ý nói, trả về `1.0` đúng tại vết cắt chuyển sang B-roll. |
| **`Speed Ramp (Time Remapping)`** | Đổi tốc độ mượt (Nhanh–Chậm–Nhanh) | Tăng tốc theo đường cong chữ S (`Bezier Velocity Curve`) từ `100% -> 300%` ở phần di chuyển dẫn cảnh kèm `Whoosh`. | Hãm tốc mượt (`Ease-Out`) về `60%–80%` (Slow Motion) đúng vào phách nhạc (`Beat Drop`) tại góc đẹp nhất của căn phòng. |
| **`Parallax (2.5D Depth Effect)`** | Hiệu ứng thị sai đa lớp | Tách Tiền cảnh (`1.4x`), Chủ thể (`1.0x`), Hậu cảnh (`0.7x`) chuyển động ngay từ frame đầu của cảnh. | Kết thúc mượt tại vết cắt cảnh kế tiếp. |

#### Nhóm 4 — Hiệu ứng Đồ họa Chuyển động & Minh họa (`MG` & `AN` — Motion Graphics & Animation)
| Tên phổ biến chuẩn (Đặt tên file/clip) | Tên thường gọi tại VN | Cách Mở đầu chuẩn Editor Pro (Entrance / In) | Cách Kết thúc chuẩn Editor Pro (Exit / Out) |
|---|---|---|---|
| **`Callout Box / Spec Card (Glassmorphism Card)`** | Thẻ thông số kính mờ / Hộp chỉ dẫn | Xếp tầng `Stagger 50ms`: Khung kính mờ mở trước (`0.22s` `expo.out`) → Icon bật (`back.out`) → Số & Nhãn trượt lên. | Thu gọn đồng thời toàn thẻ trong `0.18s` `power2.in` (`opacity: 1 -> 0`, `y: 0 -> -10px`) trước khi cắt cảnh. |
| **`Pointer Line (Motion Tracked Callout)`** | Đường kẻ chỉ điểm bám vật thể | Chấm tròn `Pop-in` (`0.12s`) tại vật thể → Đường gấp khúc tự vẽ ra (`stroke-dashoffset` `0.20s`) → Nhãn chữ `Fade Up`. | Thu ngược nhanh: Nhãn mờ đi (`0.10s`) → Đường kẻ rút về chấm tròn (`0.15s`) → Chấm tròn biến mất. |
| **`Satellite Map Zoom-in + Pin Drop`** | Bản đồ vệ tinh thu phóng + Thả ghim | Bản đồ vệ tinh sáng phóng mượt vào tâm (`0.60s` `expo.out`) → Ghim đỏ rơi từ trên xuống (`back.out(1.6)`) + vòng sóng `Pulse Ring`. | Vẽ xong tuyến đường + hiện nhãn tên đường tiếng Việt (không tràn khung), giữ đọc `≥1.5s`, thoát bằng `Zoom Transition / Match Cut` vào cảnh thật. |
| **`Route Path Draw / Neon Boundary Outline`** | Vẽ đường đi / Khoanh ranh giới đất phát sáng | Đường line phát sáng chạy khép kín ranh giới theo `stroke-dashoffset: 100% -> 0%` (`0.60s–1.00s` `power2.inOut`). | Vùng đất bên trong nháy sáng nhẹ (`fill-opacity: 0 -> 0.15`), giữ `1.2s` rồi `Fade out 0.20s`. |
| **`Dimension Ruler / Laser Measure Line`** | Thước đo kích thước (Ngang × Dài) | Hai đầu mốc bật lên (`0.12s`), tia thước bắn nối 2 đầu (`0.25s` `expo.out`), số đo (`5m × 20m`) nảy lên ở tâm. | Giữ đứng yên `≥1.5s`, mờ dần toàn bộ thước trong `0.18s` trước khi chuyển góc máy. |
| **`Floorplan Stroke Draw`** | Sơ đồ mặt bằng tự vẽ nét | Nét tường vẽ tự động (`0.50s` `power2.out`), nhãn các phòng `Pop-in` lệch pha `Stagger 60ms`. | Giữ toàn cảnh mặt bằng `≥1.8s`, thu mờ `0.20s` khi bước vào cảnh quay thực tế. |

#### Nhóm 5 — Hiệu ứng Kỹ xảo & Lớp phủ Ánh sáng (`VFX` & `LP` — Visual Effects & Overlays)
| Tên phổ biến chuẩn (Đặt tên file/clip) | Tên thường gọi tại VN | Cách Mở đầu chuẩn Editor Pro (Entrance / In) | Cách Kết thúc chuẩn Editor Pro (Exit / Out) |
|---|---|---|---|
| **`Rotoscoping / AI Subject Masking`** | Tách nền chủ thể / Cắt mask người | Khởi tạo lớp mặt nạ tách người dẫn sắc nét (`Feather 1.5px`, khử viền lem) ngay frame đầu chữ/MG xuất hiện sau lưng. | Giải phóng lớp mặt nạ ngay sau khi chữ/MG phía sau đã thoát hoàn toàn. |
| **`Light Sweep / Shimmer Ray`** | Tia sáng quét ngang chữ/vật thể | Bắt đầu quét từ mép trái sau khi chữ/logo vừa đứng yên `0.10s`, lướt chéo `45°` trong `0.55s` `power2.inOut`. | Thoát hết khỏi mép phải và tắt `opacity` lớp sáng, giữ nguyên chữ sắc nét. |
| **`Halation / Bloom / Glow`** | Quầng sáng điện ảnh / Phát sáng | Tăng êm `Glow Intensity` từ `0 -> mục tiêu` trong `0.30s` `easeOutSine` tại cảnh có đèn chùm/nắng đẹp. | Hạ êm về `0` tại vết cắt chuyển sang cảnh khác. |
| **`Spotlight / Background Dimmer`** | Đèn rọi làm tối nền nổi bật thông số | Làm dịu tối vùng nền xung quanh (`-30%` bằng `Radial Mask`) trong `0.25s` `power2.out` đúng lúc thẻ số liệu bật lên. | Trả độ sáng nền về `100%` trong `0.20s` `power2.in` ngay khi thẻ số liệu rút đi. |

#### Nhóm 6 — Hiệu ứng Màu sắc (`MA` — Color Grading & Color FX)
| Tên phổ biến chuẩn (Đặt tên file/clip) | Tên thường gọi tại VN | Cách Mở đầu chuẩn Editor Pro (Entrance / In) | Cách Kết thúc chuẩn Editor Pro (Exit / Out) |
|---|---|---|---|
| **`3D LUT Look / Color Grading`** | Áp bảng màu LUT 3D / Chỉnh màu | Áp đúng từ frame đầu tiên của từng clip theo phân loại ánh sáng (Nội thất ấm / Ngoại thất ban ngày / D-Log), giữ chuẩn màu da. | Duy trì đồng nhất xuyên suốt phân đoạn, không đổi màu giật cục giữa 2 cảnh cùng phòng. |
| **`Color Isolation / B&W Desaturate`** | Giữ 1 màu nổi bật / Đổi trắng đen nhấn lỗi | Rút độ bão hòa màu nền về `0%` (Trắng-Đen) trong `0.20s` đúng lúc người dẫn nêu điểm yếu/sai lầm. | Bật trả lại màu tươi `100%` trong `0.15s` đúng tại phách nhạc khi người dẫn đưa ra giải pháp/ưu điểm. |

#### Nhóm 7 — Hiệu ứng Âm thanh (`SF` — Sound Effects & Audio Mixing)
| Tên phổ biến chuẩn (Đặt tên file/clip) | Tên thường gọi tại VN | Cách Mở đầu chuẩn Editor Pro (Attack / Pre-roll) | Cách Kết thúc chuẩn Editor Pro (Decay / Tail) |
|---|---|---|---|
| **`Riser / Suck-back (Reverse Cymbal)`** | Tiếng dâng / Tiếng hút ngược dẫn điểm nổ | Bắt đầu nhỏ từ `-24dB` sớm hơn sự kiện hình `0.25s–0.50s`, tăng dần theo đường cong mũ (`Exponential Fade-in`). | **Ngắt dứt khoát (Hard Cut) đúng tại `0.00s` khi chữ/cảnh mới bung ra**, nhường chỗ ngay lập tức cho tiếng `Impact`. |
| **`Impact / Sub Boom / Bass Drop`** | Tiếng đập mạnh / Tiếng trầm dội điểm nhấn | Đặt đỉnh sóng âm (`Transient Peak` / `data-sfx-peak`) **trùng khít 100% (`±0.02s`)** với frame chữ/cảnh mở cực đại. | Để đuôi âm trầm ngân tự nhiên (`Reverb Tail 0.35s–0.80s`), tuyệt đối không cắt cụt gây tiếng bụp. |
| **`Whoosh / Swish`** | Tiếng gió vút theo chuyển động | Vào sớm hơn chuyển động trượt của chữ/MG/máy quay `0.05s–0.10s`; đỉnh âm lượng nằm đúng giữa quãng đường trượt. | `Fade-out` êm `0.08s` đúng lúc chữ/MG thắng lại tại vị trí đích. |
| **`Pop / Click / Tick / Camera Shutter / Ding / Shimmer`** | Tiếng nảy pop / Tiếng bấm click / Tiếng chụp hình / Tiếng chuông / Lấp lánh | Căn `data-sfx-peak` trùng khít frame phần tử nảy lên hoặc chạm đích (thấp hơn giọng `6–12dB`, cấm họ `Sine/` `R-L032`). | Đuôi âm ngắn gọn tự nhiên (`0.08s–0.25s`), không chồng chéo làm đục giọng nói. |
| **`Audio Ducking (Sidechain Compression)`** | Tự động dìm nhạc nền dưới giọng nói | Hạ nhạc nền mượt (`0.15s–0.25s`) xuống `-18dB..-22dB` trước âm tiết đầu tiên của câu thoại `0.10s`. | Nâng nhạc nền êm (`0.25s–0.40s`) lên `-10dB..-12dB` sau âm tiết cuối cùng của câu thoại `0.15s` khi sang đoạn B-roll. |


---

## PHẦN 5: DANH MỤC ĐẦY ĐỦ CÁC TÀI NGUYÊN (ASSETS & TOOLKITS) CỦA EDITOR CHUYÊN NGHIỆP (10 NHÓM × 60+ THÀNH PHẦN)

Để dựng một video chuyên nghiệp không thiếu chi tiết nào, một Editor chuyên nghiệp luôn sở hữu và phối hợp **10 nhóm tài nguyên (Asset Library)** dưới đây:

1. **Nhóm 1 — Tài nguyên Quay dựng gốc (Raw Footage & Stock Media):** A-roll (Talking-head/Host, Walk-and-Talk), B-roll thực tế (Establishing shot toàn cảnh, Flycam/Drone, Gimbal walkthrough, Detail/Close-up shot), Stock Footage bổ trợ, Green Screen / Alpha Matte footage.
2. **Nhóm 2 — Tài nguyên Typography & Hệ thống Chữ (Fonts & Text Presets):** Font Display/Impact (tiêu đề/hook), Font Sans-serif đọc nhanh (phụ đề/nhãn), Font Serif/Script (cảm xúc/điểm nhấn), Bảng phối cặp Font (Font Pairing), Bảng màu Chữ đo sẵn (`bang_mau.json`), Bộ Preset Hiệu ứng Chữ & VFX cài sẵn (`TX-01..TX-08`), Mẫu Phụ đề động (`.srt` / Karaoke Word-by-Word).
3. **Nhóm 3 — Tài nguyên Âm thanh & Sound Design (SFX & Audio Stems):**
   - *Transitional SFX:* Whoosh, Swish, Whip, Air Pass.
   - *Build-up SFX:* Riser, Suck-back, Reverse Cymbal, Drone/Tension.
   - *Impact & Accent SFX:* Sub Drop, Boom, Cinematic Hit, Slam, Thud.
   - *UI & Text Micro-SFX:* Pop, Bubble, Pluck, Click, Mechanical Tick (đếm số), Typing (gõ chữ), Ding, Bell Chime, Shimmer/Sparkle.
   - *Foley & Ambience:* Camera Shutter (chụp ảnh), Paper Rustle (lật sổ hồng/giấy tờ), Pen Write/Stamp (đóng dấu), Footsteps, Room Tone / Ambience tự nhiên.
4. **Nhóm 4 — Tài nguyên Nhạc nền & Nhịp điệu (BGM & Music Stems):** Nhạc nền phân theo Mood/Thể loại (Luxury Lounge, Cinematic Epic, Lo-fi Chill, Upbeat Modern, Emotional Piano), Nhạc tách Stems (Drums/Bass/Melody riêng để cắt chuẩn phách), Lưới Beat Grid / Marker BPM, Hiệu ứng kết nhạc (Audio Stinger / Reverb Tail Out).
5. **Nhóm 5 — Tài nguyên Đồ họa Chuyển động & Giao diện (Motion Graphics / MOGRTs / UI Kits):** Lower Thirds (thanh tên/chức danh), Callout Boxes & Spec Cards (thẻ thông số kính mờ Glassmorphism), Pointer Lines / Tracked Callouts (đường chỉ điểm bám vật thể), Number Counters / Rolling Odometers (bộ đếm số chạy), Progress Bars / Chapter Timers (thanh tiến trình/mục lục giờ), Badges / Stickers / Animated Icons (SVG/Lottie/3D Clay Icons), Social Proof Overlays (khung bình luận/tin nhắn/báo chí).
6. **Nhóm 6 — Tài nguyên Bản đồ, Mặt bằng & Không gian 3D (Geo-Map & Architectural Assets):** Bản đồ vệ tinh độ phân giải cao (Google Earth Studio / OpenStreetMap Tiles), Ghim vị trí 3D & Vòng sóng (`Pin Drop + Pulse Ring`), Đường dẫn lộ trình & Khoanh vùng ranh giới đất (`Route Path & Neon Boundary`), Thước đo kích thước (`Dimension Ruler / Laser Measure`), Sơ đồ mặt bằng tự vẽ nét (`Floorplan SVG Stroke`), Mô hình khối 3D / Walkthrough.
7. **Nhóm 7 — Tài nguyên Chuyển cảnh (Transition Packs):** Whip Pan / Swish Pan presets, Speed Ramp / Crash Zoom presets, Luma Fade / Light Leak transitions, Mask Wipe / Object Wipe guides, Glitch / RGB Split / Shutter Freeze-Frame transitions, Audio Crossfade / J-Cut & L-Cut templates.
8. **Nhóm 8 — Tài nguyên Kỹ xảo & Lớp phủ Điện ảnh (VFX & Compositing Overlays):** Light Leaks & Lens Flares (vệt nắng/lóa ống kính), Light Sweep / Shimmer Rays (tia sáng quét ngang chữ/logo), Halation / Bloom / Glow shaders (quầng sáng điện ảnh), Film Grain (16mm/35mm) & Dust/Texture, Vignette & Spotlight Radial Dimmer (làm tối nền nổi bật thông số), Alpha Matte / Ink Bleed / Paper Rip masks, AI Rotoscoping / Subject Segmentation models (`rembg` / Mask tách người).
9. **Nhóm 9 — Tài nguyên Chỉnh màu & Lookbook (Color Grading & LUTs):** Technical Conversion LUTs (DJI D-Log / Sony S-Log3 / Apple Log sang Rec.709), Creative Look 3D LUTs (`.cube`: Warm Luxury, Clean Real Estate, Cinematic Teal & Orange, Neutral Daylight), File LUT trích xuất trực tiếp từ video mẫu (`sample_look.cube`), Đường cong Tone Curve & Skin Tone Protection masks.
10. **Nhóm 10 — Tài nguyên Bố cục, Khung An toàn & Nhận diện Thương hiệu (Layout Guides, Safe Zones & Branding Kit):** Lưới Safe Zone đa nền tảng (TikTok / Reels / Shorts UI Overlay), Lưới bố cục (Rule of Thirds, Center Frame, Split-Screen 2–3 ô), Bộ nhận diện thương hiệu (Logo động Intro/Outro, Watermark chìm, Bảng mã màu thương hiệu, Card CTA cuối video), và Hồ sơ Template trọn bộ (`template.json`, `contact.jpg`, `hf/index.html`).

---

## PHẦN 7: QUY TRÌNH TẠO HIỆU ỨNG PHỤ ĐỀ VIDEO (KINETIC SUBTITLES / CAPTIONS) TỪ XUẤT HIỆN ĐẾN KẾT THÚC & TẠO ĐIỂM NỔI BẬT (`R-L039` — DŨNG CHỐT 03/11/2026)

### 7.1. Phân định Vai trò: Phụ đề Động (Captions) vs. Chữ Hook Hero (T2–T3)
- **Chữ Hook Hero (`T2–T3` / `TX-01..TX-08`):** Là các điểm nhấn lớn giật tít, nêu giá tiền khổng lồ, diện tích, vị trí hoặc CTA. Xuất hiện có chọn lọc (3–6 lần/video), kích thước lớn (`64–96px`), hiệu ứng mạnh, có SFX đi kèm.
- **Phụ đề Động (Captions `CAP-01..CAP-06`):** Là dòng chữ chạy liên tục theo từng câu thoại của người dẫn (hiển thị từng cụm 2–5 từ). Kích thước vừa phải (`40–48px`), đặt cố định tại vùng an toàn dưới (`bottom: 480–520px`).
- **Quy tắc né chữ khi Chữ Hook xuất hiện (`Collision Avoidance`):** Khi Chữ Hook Hero (`T3` lớn ở giữa khung hình) xuất hiện, phụ đề tại mốc giây đó **tự động hạ độ mờ (`opacity: 0.25`) hoặc ẩn tạm thời 1–2 giây** để mắt người xem tập trung 100% vào Chữ Hook Hero, không bị rối mắt vì 2 tầng chữ cùng nhấp nháy.

---

### 7.2. Giải phẫu Chi tiết 3 Pha của Từng Dòng Phụ đề (Entrance → Active Highlight → Exit)

Mỗi cụm phụ đề (2–5 từ) được gắn trực tiếp với timecode từng từ từ `words.json` và trải qua đúng 3 pha:

```
[Thời gian câu nói: 0.00s -----------------------------------------------------> Dứt câu]
┌─────────────────┬───────────────────────────────────────────────┬────────────────┐
│ 1. XUẤT HIỆN    │ 2. DUY TRÌ & TẠO ĐIỂM NỔI BẬT (HIGHLIGHT)      │ 3. KẾT THÚC    │
│ (Entrance 0.10s)│ - Từ bình thường: Trắng viền đen 3px           │ (Exit 0.08s)   │
│ - Pop-in nhẹ    │ - Từ đang đọc (Active): Nảy 1.1x / Đổi màu    │ - Fade-out     │
│ - hoặc Slide Up │ - Từ khóa đắt giá: Vàng Gold #FFD700 + Glow    │ - hoặc Snap Cut│
└─────────────────┴───────────────────────────────────────────────┴────────────────┘
```

#### Pha 1: Mở đầu Xuất hiện (Entrance / In-Animation — 4–6 frame / 0.08–0.12s)
- **Thời điểm kích hoạt:** Bắt đầu trước âm tiết đầu tiên của cụm từ đúng `2 frame (≈ 0.03s)` để khi âm thanh vừa phát ra thì chữ đã hoàn tất chuyển động vào.
- **Kỹ thuật mở đầu chuẩn:**
  1. *Pop-in Elastic nhẹ:* Cả cụm phóng từ `scale: 0.88 -> 1.05 -> 1.0` trong `0.10s` với easing `cubic-bezier(0.34, 1.56, 0.64, 1)` (`back.out(1.4)`).
  2. *Slide Up & Fade:* Cụm từ trượt từ dưới lên `8px` đồng thời mờ sang rõ (`opacity: 0 -> 1`) trong `0.08s` `power2.out`.
  3. *Word-by-word Reveal:* Từng từ lần lượt xuất hiện theo đúng miligiây giọng nói chạm tới từ đó.

#### Pha 2: Duy trì & Tạo Điểm Nổi Bật (Hold & Active Word Highlighting — Xuyên suốt câu nói)
Đây là trái tim của phụ đề viral giúp giữ chân người xem đọc theo từng từ của Dũng:
1. **Highlight Từ đang phát âm (`Active Word Animation`):**
   - Từ đang được người dẫn phát âm (`active word`) lập tức đổi từ màu trắng sang màu nổi bật, kết hợp nhún nhẹ (`scale: 1.0 -> 1.10 -> 1.05` trong `0.10s`).
   - Ngay khi chuyển sang từ kế tiếp, từ trước đó hạ nhẹ về kích thước chuẩn nhưng vẫn giữ trạng thái đã đọc.
2. **Tự động Bắt & Làm Rực Sáng Từ Khóa Đắt Giá (`Smart Keyword Auto-Accent`):**
   - Bộ lọc AI tự động quét từ khóa trong câu thoại thuộc 4 nhóm giá trị:
     - *Nhóm Giá trị & Con số:* Số tiền ("5 tỷ", "800 triệu", "giá ngộp"), số đo ("100m2", "ngang 5m", "3 lầu", "4 phòng ngủ").
     - *Nhóm Vị trí & Khu vực:* "Thủ Đức", "Quận 2", "mặt tiền", "hẻm xe hơi", "gần Metro", "ven sông".
     - *Nhóm Pháp lý & Đảm bảo:* "Sổ hồng riêng", "hoàn công đủ", "công chứng ngay", "chính chủ".
     - *Nhóm Tính từ đắt giá:* "Tuyệt đẹp", "siêu phẩm", "hiếm có", "rẻ nhất khu vực", "nội thất nhập khẩu".
   - **Cách tạo nổi bật cho từ khóa đắt giá:**
     - **Màu sắc:** Áp màu **Vàng Gold thương hiệu (`#FFD700`)** hoặc Vàng Chanh (`#FFE600`), trong khi các từ đệm xung quanh giữ màu trắng sáng (`#FFFFFF`).
     - **Quầng sáng phát quang (Soft Glow):** Thêm lớp `drop-shadow(0 0 10px rgba(255, 215, 0, 0.65))` chỉ riêng trên từ khóa đó.
     - **Gạch chân phát sáng (Underline Accent):** Nét gạch chân mảnh màu vàng gold chạy vẽ nét (`0.12s`) dưới chân từ khóa.
3. **Quy tắc Đảm bảo Đọc Rõ & Không Che Mặt:**
   - **Tương phản:** Mọi chữ phụ đề bắt buộc có viền đen sắc nét (`-webkit-text-stroke: 3px #000000` hoặc `paint-order: stroke fill`) + bóng đổ mờ nhẹ (`filter: drop-shadow(0 2px 4px rgba(0,0,0,0.85))`). Tỷ lệ tương phản trên khung hình thật luôn `≥ 4.5:1`.
   - **Vị trí an toàn:** Cố định ở trục dọc `bottom: 490px–520px`. CẤM đặt quá thấp lọt vào vùng bình luận/nút thả tim của TikTok (`< 480px`), và cấm đặt quá cao đè lên mặt người dẫn.

#### Pha 3: Kết thúc & Chuyển cụm (Exit / Out-Animation — 3–5 frame / 0.05–0.08s)
- **Khi dứt câu thoại / chuyển sang cụm từ tiếp theo:**
  1. *Snap Transition (Cắt tức thì):* Cụm cũ biến mất đúng frame cụm mới bung ra tại cùng vị trí, không tạo khoảng trống trễ nhịp.
  2. *Quick Dissolve Out:* Mờ dần cực nhanh trong `0.06s` (`opacity: 1 -> 0`) nếu câu tiếp theo có khoảng lặng `> 0.35s`.
  3. *Slide Down Collapse:* Toàn cụm trượt nhẹ xuống `6px` và biến mất nếu kết thúc một phân đoạn ý.

---

### 7.3. Danh mục 6 Mẫu Preset Phụ đề Động Chuẩn Ngành (`CAP-01..CAP-06`)

Lưu tại `HDRE AI/asset/phong_cach/phu_de/INDEX.md` và thư viện blueprint:

| Mã | Tên phổ biến chuẩn (Preset) | Phong cách thị giác | Hành vi Active Highlight (Pha 2) | Easing & Thời lượng (Pha 1 / Pha 3) | Phù hợp thể loại |
|---|---|---|---|---|---|
| **`CAP-01`** | **`Karaoke Gold Wave (Phụ đề Karaoke Vàng Gold thương hiệu)`** | Toàn cụm hiện sẵn màu trắng viền đen 3px. | Từng từ nói tới đâu quét đổi sang màu vàng gold `#FFD700` rực rỡ tới đó, giữ sáng đến hết cụm. | Vào: `Fade Up 0.08s`<br>Ra: `Snap Cut 0.05s` | BĐS review tiêu chuẩn, chia sẻ, tư vấn (Khuyên dùng mặc định) |
| **`CAP-02`** | **`Word-by-Word Elastic Bounce (Từng từ nảy nhịp lò xo)`** | Chữ hiện từng từ đơn hoặc cụm 2 từ theo nhịp nói dứt khoát. | Từ đang nói nảy bật `scale 0.85 -> 1.15 -> 1.0` (`back.out(1.8)`), từ khóa mang màu vàng gold + bóng sâu. | Vào: `Pop-in 0.10s`<br>Ra: `Shrink Down 0.06s` | Video năng lượng cao, Hook 3s đầu, Promo, BĐS giá sốc |
| **`CAP-03`** | **`Smart Keyword Highlight & Glow (Nhấn sáng từ khóa đắt giá)`** | Cả cụm từ hiện êm ái, cấu trúc thanh lịch. | Từ đệm giữ màu trắng tĩnh. **Riêng từ khóa (giá, sổ, diện tích) tự động sáng bừng vàng gold + quầng sáng glow 10px**. | Vào: `Slide Up 0.10s`<br>Ra: `Fade Out 0.08s` | BĐS cao cấp, pháp lý, tâm sự thấu hiểu khách hàng |
| **`CAP-04`** | **`Pill Highlight Box Float (Khung viền mờ trượt bám từ)`** | Có một khung bo góc tròn kính mờ (`border-radius: 8px`, viền mảnh gold). | Khung highlight tự động lướt mượt (`x`, `width`) bám theo vị trí từ đang nói trên dòng chữ. | Vào: `Expand Box 0.10s`<br>Ra: `Fade 0.06s` | Video hướng dẫn, kiến thức đầu tư, tin tức BĐS |
| **`CAP-05`** | **`Underline Stroke Draw (Gạch chân nét vẽ chạy theo từ khóa)`** | Chữ phong cách typographic hiện đại. | Khi nói đến từ khóa nhấn, một nét gạch chân màu vàng gold tự vẽ lướt dưới chân từ trong `0.12s`. | Vào: `Luma In 0.08s`<br>Ra: `Quick Dissolve 0.06s` | Kể chuyện, phân tích quy hoạch, định giá nhà đất |
| **`CAP-06`** | **`Cinematic Minimal Subtitle (Phụ đề điện ảnh sang trọng)`** | Chữ font Sans-serif mỏng tinh tế, trắng viền đen mảnh 2px. | Không nảy nhót. Chỉ chuyển từ khóa sang vàng nhạt `rgba(255, 215, 0, 0.90)`, giữ không gian tĩnh để người xem ngắm nhà. | Vào: `Smooth Fade 0.12s`<br>Ra: `Smooth Fade 0.10s` | Biệt thự triệu đô, Penthouse, Resort nghỉ dưỡng |

---

### 7.4. Quy trình Triển khai Tạo Hiệu ứng Phụ đề (5 Bước Đồng bộ)
1. **Bước 1 — Nhận diện dữ liệu transcript từng từ (`words.json`):**
   - Lấy mốc thời gian bắt đầu (`start`) và kết thúc (`end`) của từng từ từ Tổ Chép lời.
   - Nhóm các từ thành từng cụm hiển thị tối ưu: mỗi dòng chứa từ **2 đến 5 từ** (độ dài tối đa 24 ký tự) để người xem quét mắt kịp trong 0.8–1.5s.
2. **Bước 2 — Phân tích từ khóa để gắn nhãn Highlight (`keyword_tagging`):**
   - Quét qua danh sách từ trong cụm: gắn cờ `is_keyword: true` cho các từ chỉ giá tiền, diện tích, kết cấu, vị trí, pháp lý.
3. **Bước 3 — Chọn Mẫu Preset Phụ đề (`CAP-01..CAP-06`):**
   - Mặc định chọn **`CAP-01` (Karaoke Gold Wave)** hoặc theo mẫu Dũng chỉ định/học từ video viral.
4. **Bước 4 — Render lớp Phụ đề với đầy đủ 3 Pha (`hf/index.html` hoặc Remotion):**
   - Áp CSS `:root` và hiệu ứng biến đổi màu/nảy theo timecode.
   - Đảm bảo font chữ đã qua cổng `vn_font_gate.py` (Be Vietnam Pro hoặc Montserrat Bold) và không bị cắt dấu tiếng Việt.
5. **Bước 5 — Kiểm tra Vùng an toàn & Né Chữ Hook Hero (Cổng QA G4):**
   - Bật khung an toàn `BG-08` để kiểm tra phụ đề không bị che khuất.
   - Kiểm tra các đoạn có Chữ Hook Hero (`T3`): phụ đề phải tự động giảm sáng hoặc ẩn để nhường sân khấu chính cho Chữ Hook.

### 6.1. Nguyên tắc phân định rạch ròi (Tránh nhầm lẫn với luật cấm "Hộp nền tối sau chữ")
1. **CÁI BỊ CẤM (`luat-cung.md` mục 7 & `01-quy-tac-thep.md` mục 6):**
   - **CẤM** tự ý đặt khung/hộp chữ nhật nền tối đặc (`solid dark box` kiểu phụ đề cũ) đè trực tiếp phía sau phụ đề (`T0`), nhãn (`T1`) hoặc chữ hook (`T2–T3`) trên cảnh quay nhà thực tế.
   - *Ngoại lệ duy nhất:* Nếu **video mẫu** có dùng hộp nền sau chữ, khi học Template (`TV-xx`) vẫn phải ghi trung thực vào `template.json`, nhưng khi dựng video cho Dũng phải **hỏi Dũng từng trường hợp** trước khi áp.
2. **CÁI ĐƯỢC DÙNG & BẮT BUỘC TUÂN THỦ QUY TRÌNH (`R-L038`):**
   - **Tài nguyên Overlay (`OV-01..OV-08`):** Là các lớp ánh sáng, chiều sâu, hạt phim, đèn rọi cục bộ (`Radial Gradient Dimmer` mỏng không thành hộp, `Light Leak`, `Light Sweep`, `Halation`, `Subject Cutout Mask`) giúp tách lớp chữ/chủ thể, tạo chất điện ảnh mà **không làm sai lệch màu thực tế của ngôi nhà** (`luat-cung.md` mục 10).
   - **Tài nguyên Khung & Background (`BG-01..BG-08`):** Là các khung bố cục chia màn hình (`Split-Screen 2–3 ô`), khung nổi (`PiP Floating Frame`), nền kính mờ (`Blurred Glass Canvas` khi chèn ảnh ngang/sổ hồng vào khung dọc 9:16), hoặc nền đồ họa kỹ thuật (`Blueprint Grid`) khi vẽ sơ đồ mặt bằng/thông số.

---

### 6.2. Kiến trúc 6 Tầng Z-Index Chuẩn Editor Pro (Từ đáy lên đỉnh)
Mọi dự án HyperFrames (`hf/index.html`) và Template (`template.json`) phải xếp đúng thứ tự 6 tầng `Z-index` sau để Khung Background và Overlay không bao giờ đè hỏng chữ hay làm đục mặt người dẫn:

| Tầng Z-Index | Tên tầng | Thành phần đặt tại tầng này | Quy tắc Hòa trộn (`mix-blend-mode` / `filter`) |
|---|---|---|---|
| **`Z-0` (Đáy)** | **Background Canvas Layer** | `BG-03` (Blurred Glass Canvas), `BG-04` (Blueprint Grid), `BG-05` (Luxury Dark Studio), `BG-06` (Paper Texture) | Chỉ hiện khi footage/ảnh gốc không phủ kín 9:16 hoặc trong phân đoạn đồ họa mặt bằng/pháp lý. |
| **`Z-10`** | **Primary Footage & Split Frames** | Video A-roll / B-roll chính, hoặc Khung chia bố cục `BG-01` (Split-Screen 2/3 ô) | Kèm LUT màu (`sample_look.cube` hoặc `bang_lut.json`). |
| **`Z-20`** | **Depth & Dimmer Overlays (Dưới chữ)** | `OV-01` (Local Radial Gradient Dimmer mỏng), `OV-06` (Soft Vignette), `OV-08` (Spotlight Focus Mask), `BG-02` (PiP Floating Frame) | `mix-blend-mode: multiply` hoặc `normal` với `opacity: 0.15–0.32` để đẩy độ tương phản chữ lên `≥ 4.5:1` mà không tạo hộp. |
| **`Z-30`** | **Subject Cutout Mask (Tách người)** | `OV-07` (Lớp nhân đôi người dẫn đã tách nền `Feather 1.5px`) | Chỉ bật khi dùng hiệu ứng **Chữ/MG núp sau người** (tối đa 1 lần/video ở Hook đầu). Chữ sau người nằm ở `Z-25`. |
| **`Z-40`** | **Typography, MG & Animated Icons** | Phụ đề (`T0`), Nhãn (`T1`), Chữ Hook (`T2–T3` / `TX-01..TX-08`), Thẻ MG, Icon động (`IC-01..IC-24`), Tia quét chữ `OV-03` (`Light Sweep`) | Luôn nằm trong vùng an toàn (`top ≥ 230px`, `bottom ≥ 480px`, `right ≥ 160px`). |
| **`Z-50` (Đỉnh)** | **Cinematic Finishing Overlays** | `OV-02` (Light Leak tại điểm cắt), `OV-04` (Soft Ambient Glow), `OV-05` (35mm Film Grain 4–8%), `BG-07` (Viewfinder HUD), `BG-08` (Safe-Zone QA Guide) | `mix-blend-mode: screen` hoặc `overlay`; `pointer-events: none`; `BG-08` tự động ẩn (`display: none`) khi xuất file `.mp4` cuối. |

---

### 6.3. Bảng 8 Mẫu Tài Nguyên Overlay Chuẩn (`OV-01..OV-08`) — Cách Mở Đầu & Kết Thúc
Lưu tại `HDRE AI/asset/phong_cach/overlays_va_khung/INDEX.md`:

| Mã | Tên phổ biến chuẩn (Đặt tên file/preset) | Tầng Z & Blend Mode | Khi nào dùng (Đúng luật Dũng) | Cách Mở đầu (Entrance) | Cách Kết thúc (Exit) |
|---|---|---|---|---|---|
| **`OV-01`** | **`Local Radial Gradient Dimmer (Lớp dìm tối cục bộ mỏng sau chữ)`** | `Z-20` · `normal` (`opacity: 0.22–0.32`) | Khi nền nhà quá sáng/nắng gắt làm tương phản chữ `< 4.5:1` (`01-quy-tac-thep.md` mục 6 — tuyệt đối không viền hộp). | `Fade-in` mượt `6f (0.10s)` cùng lúc chữ Hook bắt đầu vào. | `Fade-out` `6f (0.10s)` ngay khi chữ Hook bắt đầu thu đi. |
| **`OV-02`** | **`Light Leak / Warm Film Burn (Cháy sáng ống kính chuyển cảnh)`** | `Z-50` · `screen` (`opacity: 0.30–0.45`) | Đặt đè qua vết cắt chuyển cảnh giữa 2 không gian (Ngoại thất → Phòng khách); không phủ toàn clip. | Tăng sáng từ `4f` trước vết cắt (`Opacity 0 -> 45%`), đạt đỉnh đúng frame cắt `0f`. | Tan dần (`Smooth Dissolve Out`) trong `8f` đầu của cảnh mới + SFX `Soft Whoosh`. |
| **`OV-03`** | **`Light Sweep / Gold Shimmer Ray (Tia sáng vàng quét qua chữ/số giá)`** | `Z-40` · `background-clip: text` / `screen` | Quét 1 lần duy nhất qua con số Giá (`L2`) hoặc Từ khóa Hook (`L1`) ngay khi chữ vừa đứng yên. | Bắt đầu từ mép trái (`-120%`) sau khi chữ nghỉ `0.10s`, lướt chéo `45°` trong `0.55s` `power2.inOut`. | Thoát hết khỏi mép phải (`+120%`) và tắt hoàn toàn + SFX `Sparkle/Shimmer`. |
| **`OV-04`** | **`Soft Halation / Ambient Gold Bloom (Quầng sáng điện ảnh mềm)`** | `Z-40/Z-50` · `screen` (`opacity: 0.20–0.35`) | Nhấn nhẹ cho từ khóa vàng gold hoặc cảnh đèn chùm nội thất ấm; giảm 30–50% để không bị sương. | Tăng `filter: drop-shadow` / `blur` êm trong `8f (0.13s)` `easeOutSine`. | Hạ êm về `0` trong `8f` trước vết cắt chuyển cảnh. |
| **`OV-05`** | **`Subtle 35mm Film Grain (Hạt phim điện ảnh siêu mịn)`** | `Z-50` · `overlay` (`opacity: 0.04–0.07`) | Chỉ dùng cho Hook điện ảnh hoặc khi mẫu có dùng để tạo độ liền mạch giữa chữ đồ họa và video. | Khởi tạo từ frame đầu của phân đoạn Hook với `opacity ≤ 0.07`. | Ngắt sạch khi vào cảnh chi tiết nội thất cần độ trong trẻo tuyệt đối. |
| **`OV-06`** | **`Cinematic Soft Vignette (Làm dịu nhẹ 4 góc khung hình)`** | `Z-20` · `multiply` (`opacity: 0.12–0.18`) | Cảnh toàn mặt tiền hoặc Flycam để gom ánh nhìn của người xem vào ngôi nhà ở tâm khung. | `Fade-in` `10f` từ đầu cảnh toàn. | `Fade-out` `8f` khi chuyển sang cảnh cận nội thất sáng sủa. |
| **`OV-07`** | **`AI Subject Cutout Mask (Lớp tách người đặt chữ sau lưng)`** | `Z-30` · `normal` (`Feather 1.5px`) | Đặt chữ Hook lớn ở `Z-25` phía sau lưng người dẫn (tối đa **1 lần/video** ở Hook 0–3s). | Khởi tạo mặt nạ tách nền sạch ngay frame chữ bắt đầu trượt lên sau lưng. | Giải phóng lớp mặt nạ ngay khi chữ Hook sau lưng đã thoát hết. |
| **`OV-08`** | **`Spotlight Focus Mask (Đèn rọi khoanh vùng chi tiết BĐS)`** | `Z-20` · `normal` (`dim 30%` + viền sáng) | Khi người dẫn chỉ vào 1 vị trí cụ thể (vệt nứt, sổ hồng, vị trí đất, nội thất đắt giá). | Vòng tròn sáng thu nhỏ từ `150% -> 100%` (`8f` `expo.out`) đồng thời nền ngoài dịu xuống `30%`. | Trả độ sáng nền về `100%` trong `6f` `power2.in` ngay khi chuyển câu thoại. |

---

### 6.4. Bảng 8 Mẫu Tài Nguyên Khung & Background Chuẩn (`BG-01..BG-08`) — Cách Mở Đầu & Kết Thúc

| Mã | Tên phổ biến chuẩn (Đặt tên file/preset) | Tầng Z & Cấu trúc | Khi nào dùng (Đúng luật Dũng) | Cách Mở đầu (Entrance) | Cách Kết thúc (Exit) |
|---|---|---|---|---|---|
| **`BG-01`** | **`Split-Screen 2-Grid / 3-Grid Frame (Khung chia đôi / chia ba màn hình)`** | `Z-10` · CSS Grid 9:16 + viền ngăn `2px #FFD700` | Khi so sánh "Trước/Sau", hoặc vừa chiếu Host nói (ô dưới) vừa chiếu Flycam/Nội thất (ô trên). | Đường kẻ vàng cắt ngang/dọc (`6f` `expo.out`), ô thứ 2 trượt vào (`Slide Reveal 8f`) + SFX `Whoosh`. | Một ô phóng mượt ra toàn màn hình (`Expand Fullscreen 8f` `cubic-bezier(0.22,1,0.36,1)`). |
| **`BG-02`** | **`PiP Floating Card Frame (Khung hình-trong-hình bo góc nổi)`** | `Z-20` · `border-radius: 20px`, viền `1.5px gold`, bóng sâu | Khi người dẫn đang nói (A-roll) và cần bật thêm 1 cửa sổ nhỏ chiếu cận cảnh chi tiết hoặc vị trí. | `Spring Pop-in` (`scale 0.7 -> 1.03 -> 1.0`, `8f` `back.out(1.6)`) + SFX `Soft Pop`. | `Scale Down 1.0 -> 0.85` + `Opacity 1 -> 0` trong `6f` `power2.in`. |
| **`BG-03`** | **`Blurred Glass Canvas Background (Nền kính mờ lấp đầy khung dọc 9:16)`** | `Z-0` (nền mờ `blur(28px) brightness(0.55)`) + `Z-10` (khung ảnh nét) | Khi chèn ảnh chụp ngang (16:9), ảnh sổ hồng, bản vẽ quy hoạch để **không bị 2 dải đen chết** trên-dưới. | Nền mờ `Fade-in 6f`, khung ảnh chính ở tâm `Pop-up` nhẹ (`scale 0.92 -> 1.0`, `8f` `expo.out`). | Cắt gọn hoặc `Cross Dissolve 6f` sang cảnh video dọc tiếp theo. |
| **`BG-04`** | **`Architectural Blueprint Grid Background (Nền lưới bản vẽ kiến trúc)`** | `Z-0` · `#0B132B` + lưới SVG `stroke rgba(255,255,255,0.10)` | Phân đoạn giải thích sơ đồ mặt bằng (`Floorplan Stroke Draw`), kích thước đất (`5m × 20m`). | Chuyển vào từ cảnh thật bằng `Luma Fade / Cross Dissolve 8f`, lưới kỹ thuật sáng dần từ tâm. | Thu mờ lưới (`Fade-out 8f`) đồng thời `Match Cut` vào không gian phòng thật. |
| **`BG-05`** | **`Luxury Dark Gold Studio Backdrop (Nền đồ họa tổng kết thông số/tài chính)`** | `Z-0` · Radial `#141A29 -> #070A12` + hạt sáng vàng nhẹ | Chỉ dùng khi video mẫu có màn hình tổng kết bảng dòng tiền/so sánh giá hoặc khi Dũng yêu cầu. | `Slide Wipe` hoặc `Smooth Fade 8f` kèm thẻ thông số `Stagger Reveal`. | Thoát về cảnh A-roll chốt câu cuối bằng `Whip Pan` hoặc `Cut on Beat`. |
| **`BG-06`** | **`Legal Document / Paper Frame (Khung trình chiếu Sổ hồng / Pháp lý)`** | `Z-0/Z-10` · Khung bo viền giấy + bóng 3D nghiêng nhẹ `perspective` | Khi nhấn mạnh yếu tố "Sổ hồng riêng / Hoàn công chuẩn / Quy hoạch sạch" (`L7 Pháp lý`). | Trượt lên từ cạnh dưới như cầm tờ hồ sơ đưa lên (`Slide Up + Tilt 9f` `expo.out`) + SFX `Paper Rustle`. | Đóng dấu `Stamp Slam` xong giữ đọc `≥1.5s`, rồi hạ xuống trong `6f`. |
| **`BG-07`** | **`Camera Viewfinder / Drone HUD Frame (Khung ngắm máy quay / Flycam HUD)`** | `Z-50` · 4 góc chữ L mảnh + chấm `REC` / độ cao `ALT` | Cảnh mở đầu Flycam trên cao hoặc cảnh POV khảo sát thực địa (chỉ bật khi mẫu có hoặc Dũng đồng ý). | 4 góc khung thu từ ngoài vào vị trí chuẩn (`Scale 1.08 -> 1.0` trong `6f`). | Tắt gọn tại vết cắt chuyển xuống cảnh mặt đất. |
| **`BG-08`** | **`TikTok/Reels/Shorts Safe-Zone QA Frame (Khung kiểm duyệt vùng an toàn)`** | `Z-50` · Khung viền đỏ/vàng nét đứt (`230px` trên, `480px` dưới, `160px` phải) | Bật bắt buộc ở bước QA (G4 & G7) để kiểm tra không có chữ/icon/PiP nào lọt vào vùng chết. | Bật bằng biến `--show-safe-zone: 1` khi kiểm tra trên HyperFrames Studio. | Tự động đặt `--show-safe-zone: 0` (`display: none`) trước khi render bản `.mp4` giao cho Dũng. |

---

---

## PHẦN 8: QUY TRÌNH THIẾT KẾ & TRANG TRÍ TEXT VIDEO CHUYÊN NGHIỆP ĐA DẠNG (PRO MOTION TYPOGRAPHY & DECORATION WORKFLOW) (`R-L040` — DŨNG CHỐT 03/11/2026)

### 8.1. Nguyên tắc Phối màu Đa dạng & Hài hòa với Video (Color Harmony & 60-30-10 Rule)
Tuyệt đối không dùng một màu vàng gold duy nhất cho mọi video! Một Editor chuyên nghiệp luôn trích xuất màu sắc từ chính cảnh quay để tạo sự hòa quyện tự nhiên:

1. **Nguyên tắc Tỷ lệ 60–30–10 trong Video Typography:**
   - **60% Nền Video Thực tế (Base Canvas):** Màu sắc tự nhiên của ngôi nhà, không gian nội thất, ánh sáng trời hoặc tường nhà.
   - **30% Màu Chữ Cơ bản & Viền (Structural Color):** Trắng sáng (`#FFFFFF`), Trắng ngọc trai (`#F8F9FA`), hoặc Đen than (`#0F172A`) có viền tương phản kép để đảm bảo người xem đọc được 100% trong mọi điều kiện ánh sáng.
   - **10% Màu Nhấn Trang trí (Accent Pop Color):** Chiếm diện tích nhỏ trên từ khóa, icon, vạch kẻ hoặc tag, được chọn dựa trên bánh xe màu sắc (Color Wheel) để **hài hòa với tone màu video**:
     - *Video Tone Ấm (Nội thất gỗ, ánh đèn vàng ấm, nắng chiều):* Nhấn bằng **Vàng Champagne (`#F4E0A5`)**, **Vàng Mật ong (`#FFB703`)**, hoặc **Cam Đất Pastel (`#E76F51`)**.
     - *Video Tone Lạnh / Hiện đại (Hồ bơi, kính xanh, bầu trời, kim loại):* Nhấn bằng **Xanh Bạc Hà / Mint Emerald (`#10B981`)**, **Xanh Cyan Neon (`#00F5D4`)**, hoặc phối màu tương phản bổ sung bằng **Cam San Hô (`#FF7A59`)**.
     - *Video Sang trọng / Biệt thự triệu đô:* Nhấn bằng **Vàng Kim loại Metallic Chrome Gradient (`#FFF5C0 -> #D4AF37 -> #AA771C`)** kết hợp quầng sáng mềm.
     - *Video Pháp lý / Tài chính / Phân tích:* Nhấn bằng **Xanh Dương Royal Blue (`#2563EB`)** hoặc **Vàng Đồng Huân chương (`#EAB308`)**.

2. **Quy tắc Thêm Khung Viền Hài hòa (Không thô ráp, không gây khó chịu):**
   - **CẤM:** Hộp chữ nhật đen kịt đặc quánh đè sau chữ (`solid dark box`).
   - **CHUẨN EDITOR PRO:** Khi cần khung viền để tách chữ trên nền video quá rối hoặc sáng gắt:
     - Dùng **Tấm Kính Mờ Glassmorphism** (`backdrop-filter: blur(14–20px)`) với nền bán trong suốt `rgba(15, 23, 42, 0.40)`.
     - Viền khung siêu mảnh (`border: 1px–1.5px`) mang chính màu nhấn của chữ (`rgba(255, 215, 0, 0.45)` hoặc `rgba(16, 185, 129, 0.45)`).
     - Bo góc mềm mại (`border-radius: 12px–20px`) và bóng đổ sâu êm dịu (`box-shadow: 0 16px 36px rgba(0,0,0,0.40)`).

---

### 8.2. Danh mục 12 Dạng Trang trí Text Video Phổ biến Nhất của các Top Editor

Dưới đây là 12 phong cách trang trí Text được các nhà sáng tạo nội dung hàng đầu thế giới (Alex Hormozi, Ali Abdaal, Vox, Iman Gadzhi, MagnatesMedia...) và các Editor chuyên nghiệp sử dụng nhiều nhất:

| Mã | Tên hiệu ứng phổ biến quốc tế (Tên thông dụng tiếng Việt) | Cấu trúc Bố cục & Khung viền | Bảng màu & Bề mặt (Color & Surface) | Chi tiết trang trí phụ trợ (Accents) | Cảm xúc & Thể loại phù hợp |
|---|---|---|---|---|---|
| **`DEC-01`** | **`Hormozi Kinetic Bold & Punch Badge (Chữ nảy khối + Tag màu nổi bật)`** | Chữ in hoa cực đậm (`Montserrat Black 900`), tiêu đề kẹp trong 1 badge bo tròn nổi. | Vàng Neon Cyber (`#FFE600`) + Xanh dạ quang (`#00F5D4`) trên nền tag đen than viền sáng. | Icon ngọn lửa 🔥 hoặc tia chớp ⚡ nảy nhẹ góc trên. Nảy lò xo `back.out(1.8)`. | Hook 3s đầu, Giá ngộp, Bán gấp, Video nhịp nhanh năng lượng cao. |
| **`DEC-02`** | **`Ali Abdaal Soft Highlighter & Paper Note (Vệt bút dạ quang + Thẻ giấy mờ)`** | Chữ thường sạch sẽ (`Be Vietnam Pro / Poppins`), phía dưới từ khóa có vệt highlight lướt qua. | Vàng pastel (`#FEF08A`) hoặc Xanh mint nhạt (`#A7F3D0`) bán trong suốt `opacity: 0.55`. | Nét cọ vẽ vệt bút nhớ (`Highlighter draw 0.12s`) + Font viết tay ghi chú bên cạnh. | Chia sẻ kiến thức, tư vấn đầu tư, mẹo mua nhà, tâm sự thấu hiểu. |
| **`DEC-03`** | **`Iman Gadzhi Luxury Metallic Gold & Glint (Chữ vàng kim loại + Tia sáng quét)`** | Xếp tầng 3 lớp: Tag nhỏ `[ PENTHOUSE ]` trên + Số tiền khổng lồ ở giữa + Dòng phụ thanh lịch dưới. | Gradient vàng ánh kim 3 điểm dừng (`#FFF5C0 -> #D4AF37 -> #996515`) có viền đen sắc. | Tia sáng vàng `Light Sweep` lướt chéo 45° qua mặt chữ + Quầng sáng `Halation` ấm. | Biệt thự ven sông, Penthouse cao cấp, BĐS nghỉ dưỡng triệu đô. |
| **`DEC-04`** | **`Vox Investigative Split Callout (Khung ngắm kỹ thuật + Vạch chỉ báo đứng)`** | Căn lề trái, bên trái có vạch màu đứng (`width: 4px`), bên phải kẹp giữa 2 đường kẻ ngang thanh mảnh. | Trắng tinh khiết (`#FFFFFF`) + Vạch vàng champagne (`#F4E0A5`) hoặc Xanh navy. | Chấm tròn focus đỏ/vàng + Số liệu % hoặc tọa độ kỹ thuật nhỏ ở góc. | Phân tích quy hoạch, so sánh giá thị trường, báo chí tài chính BĐS. |
| **`DEC-05`** | **`MagnatesMedia 3D Cinematic Extrusion (Chữ 3D dày khối + Đèn rọi Spotlight)`** | Chữ 3D Isometric có độ dày bóng đổ sâu nhiều tầng nghiêng góc 45°, tạo cảm giác như khối kim loại/đá. | Vàng đồng cổ điển (`#D4AF37`) có đổ bóng sâu 6 tầng `text-shadow` xuống `#1A1300`. | Lớp đèn rọi `Spotlight Dimmer` làm tối nền xung quanh để khối chữ 3D rực sáng ở tâm. | Phim tài liệu doanh nhân, câu chuyện lịch sử dự án, đòn bẩy tài chính. |
| **`DEC-06`** | **`Glassmorphism Spec Card / Tech HUD (Thẻ thông số kính mờ bo góc)`** | Khung thẻ kính mờ `border-radius: 16px`, viền phát sáng 1px, bên trong chứa Icon + Số đo + Nhãn. | Kính mờ `rgba(15,23,42,0.45)` + Viền sáng vàng/xanh mint + Chữ trắng ngọc trai. | Icon SVG động (`IC-xx`) + Số đếm chạy (`Rolling Counter`) + Vạch ngăn cách chấm bi. | Giới thiệu công năng phòng, diện tích 5m×20m, kết cấu 4 tầng, nội thất nhập. |
| **`DEC-07`** | **`Streetwear Slanted Tag & Sticker Label (Nhãn tem dán nghiêng + Viền đứt nét)`** | Cụm chữ xoay nghiêng góc `6°–10°` tạo động lực chuyển động, đặt trên tem dán bo góc. | Cam Hỏa tiễn (`#FF5E1E`) phối Trắng và Đen than, viền đứt nét vàng (`border: 2px dashed`). | Sticker nhãn giá `[ SALE 20% ]`, mã vạch mini hoặc icon ngón tay chỉ ↗. | BĐS giá rẻ cho người trẻ, căn hộ studio, ưu đãi quà tặng nội thất. |
| **`DEC-08`** | **`Cinematic Split-Tone Dual Color (Chữ chia đôi 2 nửa màu tương phản)`** | Nửa đầu của câu mang màu trắng, nửa sau (từ khóa đắt) mang màu tương phản rực rỡ. | Nửa đầu Trắng sữa (`#FFFFFF`), nửa sau Vàng Gold (`#FFD700`) hoặc Cam san hô (`#FF7A59`). | Dấu gạch chéo `/` hoặc chấm tròn ngăn đôi 2 vế câu, chuyển màu đúng phách nhạc. | So sánh "Trước vs Sau", Nêu nghịch lý "Giá rẻ nhưng Nhà to", Cảnh báo rủi ro. |
| **`DEC-09`** | **`Legal Paper Tape & Stamp Slam (Băng keo giấy dán + Con dấu đóng nảy)`** | Khung giấy màu kem mô phỏng tờ trích lục sổ hồng, dán 2 miếng băng dính trong suốt ở góc. | Nền giấy kem `#FFFDF9`, chữ đen than `#1A1A1A`, con dấu đỏ son hoặc vàng đồng `#C92A2A`. | Con dấu đóng dập xuống (`Stamp Slam 0.15s`) nảy nhẹ + SFX tiếng cộp và tiếng sột soạt giấy. | Pháp lý sổ hồng riêng, hoàn công chuẩn, công chứng trong ngày. |
| **`DEC-10`** | **`Modern Minimalist Bracket Frame (Khung 4 góc ngắm chữ L mảnh)`** | Bốn góc chữ L mảnh `┌ ┐ └ ┘` bo quanh cụm chữ, ôm khít thông số quan trọng. | Trắng ngà `#F8F9FA` phối góc L vàng gold mỏng 1.5px. | Bốn góc chữ L thu phóng từ ngoài vào (`scale 1.15 -> 1.0`) ôm chặt lấy chữ khi chữ hiện. | BĐS tối giản phong cách Nhật/Bắc Âu (Japandi, Minimalist, Scandinavian). |
| **`DEC-11`** | **`Neon Cyberpunk Outline Stroke (Chữ rỗng viền neon phát quang)`** | Thân chữ trong suốt nhìn xuyên qua video, chỉ có đường viền `stroke 2.5px` phát sáng rực rỡ. | Viền Xanh Cyan Neon (`#00F5D4`) hoặc Vàng Neon (`#FFE600`) + Lớp glow mờ 12px. | Khi đến phách nhạc, thân chữ nháy sáng bừng lên lấp đầy màu trong `0.10s`. | Video về đêm, phố đi bộ, nhà view pháo hoa, trung tâm tài chính sầm uất. |
| **`DEC-12`** | **`Vintage Editorial Serif & Golden Quote (Chữ Serif cổ điển + Khung chỉ vàng)`** | Font Serif sang trọng (`Playfair Display Italic`), kẹp giữa 2 dấu ngoặc kép nghệ thuật `“ ”`. | Vàng Champagne nhạt (`#F5E6BE`) + Khung viền chỉ vàng siêu mảnh 1px bo 4 góc. | Chữ hiện êm ái kiểu `Blur Resolve` trong `0.35s` mượt mà không rung nảy. | Lời đúc kết tâm sự, trích dẫn triết lý sống của gia chủ, video biệt thự cổ điển. |

---

### 8.3. Quy trình 5 Bước Trang trí Text chuẩn Editor Chuyên nghiệp
1. **Bước 1 — Đo & Trích xuất Palette màu từ Cảnh quay:**
   - Trước khi đặt chữ lên bất kỳ cảnh nào, trích xuất 2 màu chủ đạo của cảnh (màu tường/nội thất + màu ánh sáng).
   - Chọn màu nhấn từ bảng 5 bảng màu cảm xúc sao cho cùng họ tương đồng hoặc tương phản bổ sung với cảnh quay, tuân thủ nguyên tắc 60–30–10.
2. **Bước 2 — Xác định Cấu trúc Bố cục (Layout & Hierarchy):**
   - Không đặt chữ ngang phè phỡn. Bắt buộc có: **Pre-badge (Tag danh mục)** + **Hero Title (Tiêu đề chính/Số đo)** + **Sub-line (Dòng bổ nghĩa)**.
3. **Bước 3 — Chọn Phong cách Trang trí (`DEC-01..DEC-12`):**
   - Khớp phong cách với nội dung câu nói (Giá ngộp chọn `DEC-01`, Kính mờ thông số chọn `DEC-06`, Sổ hồng chọn `DEC-09`, Biệt thự chọn `DEC-03` hoặc `DEC-12`).
4. **Bước 4 — Thêm Chi tiết Phụ trợ & Khung viền Kính mờ:**
   - Thêm vạch chỉ báo đứng, nét vẽ gạch chân, hoặc 4 góc ngắm chữ L.
   - Nếu nền video lộn xộn, áp dụng khung kính mờ Glassmorphism bo góc (`backdrop-filter: blur(16px)` + viền mỏng 1px), tuyệt đối không dùng hộp đen đặc.
5. **Bước 5 — Đồng bộ 3 Pha & SFX:**
   - Đặt Entrance mượt mà (Pop-in elastic hoặc Slide Up), quét tia sáng `Light Sweep` ở trạng thái Hold, và kết thúc bằng Fade-out nhanh gọn. Căn SFX (Pop/Whoosh/Stamp) trùng khít frame bung cực đại của chữ.
