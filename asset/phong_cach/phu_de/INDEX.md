# DANH MỤC CÁC MẪU HIỆU ỨNG PHỤ ĐỀ ĐỘNG (KINETIC SUBTITLES / CAPTIONS) CHUYÊN NGHIỆP (`CAP-01..CAP-06`) (`R-L039`)

> **Quy tắc phụ đề chuyên nghiệp (`R-L039` — Dũng chốt 03/11/2026):**
> 1. Phụ đề chia theo cụm nhỏ **2–5 từ (≤ 24 ký tự)** neo chính xác theo timecode từng từ (`words.json`).
> 2. Đủ 3 pha: **Xuất hiện (Entrance 0.08–0.12s)** → **Duy trì & Highlight từ đang nói / từ khóa đắt giá (Hold & Accent)** → **Kết thúc (Exit 0.05–0.08s)**.
> 3. Tương phản chuẩn: Luôn có viền đen sắc nét (`text-stroke: 3px #000000`) + bóng đổ mờ (`drop-shadow: 0 2px 4px rgba(0,0,0,0.85)`), tỷ lệ tương phản `≥ 4.5:1` trên nền sáng.
> 4. Vị trí an toàn: `bottom: 490px–520px` (tránh nút thả tim/bình luận của TikTok/Reels/Shorts).
> 5. **Quy tắc né chữ Hook Hero (`Collision Avoidance`):** Tự động hạ mờ `opacity: 0.25` hoặc ẩn tạm thời 1–2s khi có Chữ Hook Hero (`T3`) lớn xuất hiện ở giữa màn hình.

---

## 1. BẢNG 6 MẪU PRESET PHỤ ĐỀ ĐỘNG (`CAP-01..CAP-06`)

| Mã | Tên phổ biến chuẩn (`ten_pho_bien`) | Màu chữ chuẩn | Màu từ khóa nhấn / Active | Pha 1: Mở đầu Xuất hiện (Entrance) | Pha 2: Hành vi Nổi bật (Hold & Highlight) | Pha 3: Kết thúc (Exit) |
|---|---|---|---|---|---|---|
| **`CAP-01`** | **`Karaoke Gold Wave (Phụ đề Karaoke Vàng Gold thương hiệu)`** | Trắng sáng `#FFFFFF` + viền đen 3px | **Vàng Gold `#FFD700`** | `Fade Up 0.08s` (`y: +8px -> 0px`, `opacity: 0 -> 1`) | Toàn cụm hiện chữ trắng. Từ đang đọc quét đổi sang **Vàng Gold `#FFD700`** rực rỡ theo nhịp lời, giữ sáng đến hết câu. | `Snap Cut 0.05s` khi sang cụm tiếp theo |
| **`CAP-02`** | **`Word-by-Word Elastic Bounce (Từng từ nảy nhịp lò xo)`** | Trắng `#FFFFFF` | **Vàng Gold `#FFD700`** + Nảy 1.15x | `Pop-in 0.10s` (`scale 0.85 -> 1.05 -> 1.0`, `back.out(1.6)`) | Từng từ bung nảy nhún nhẹ (`scale 1.15x`) đúng miligiây phát âm. Từ khóa mang màu vàng gold + quầng sáng nhẹ. | `Shrink Down 0.06s` (`scale 1.0 -> 0.90` + `opacity 0`) |
| **`CAP-03`** | **`Smart Keyword Highlight & Glow (Nhấn sáng từ khóa đắt giá)`** | Trắng sữa `#F8F9FA` | **Vàng Chanh/Gold `#FFD700` + Glow 10px** | `Slide Up 0.10s` (`y: +10px -> 0px` `power2.out`) | Cụm từ hiện thanh lịch. **Tự động bắt từ khóa (giá, sổ, diện tích, vị trí) để bật Vàng Gold rực rỡ + Soft Glow 10px**. Từ đệm giữ trắng. | `Fade Out 0.08s` êm ái |
| **`CAP-04`** | **`Pill Highlight Box Float (Khung viền mờ trượt bám từ)`** | Trắng hoặc Đen | Khung kính mờ bo góc (`border: 1.5px gold`) | `Expand Box 0.10s` (`scaleX 0.7 -> 1.0`) | Một khung pill bo tròn kính mờ viền vàng gold tự động lướt ngang bám theo vị trí từ đang nói trên dòng chữ. | `Fade 0.06s` |
| **`CAP-05`** | **`Underline Stroke Draw (Gạch chân nét vẽ chạy theo từ khóa)`** | Trắng `#FFFFFF` | Vạch gạch chân vàng `#FFD700` | `Luma In 0.08s` | Khi người dẫn đọc đến từ khóa quan trọng, một vạch gạch chân vàng tự vẽ lướt dưới chân từ (`stroke-dashoffset 0.12s`). | `Quick Dissolve 0.06s` |
| **`CAP-06`** | **`Cinematic Minimal Subtitle (Phụ đề điện ảnh sang trọng)`** | Trắng ngà `#F0F0F0` | Vàng nhạt `rgba(255,215,0,0.90)` | `Smooth Fade 0.12s` | Font chữ mảnh tinh tế, không nảy nhót. Chỉ chuyển từ khóa sang vàng nhạt, giữ không gian yên tĩnh ngắm nhà. | `Smooth Fade 0.10s` |

---

## 2. BỘ LỌC TỰ ĐỘNG BẮT TỪ KHÓA ĐẮT GIÁ (`SMART KEYWORD TAGGING`)

Khi hệ thống nạp `words.json`, bộ lọc sẽ tự động đánh dấu `is_keyword: true` nếu từ rơi vào một trong các nhóm:
1. **Giá tiền & Con số:** `tỷ`, `triệu`, `nghìn`, `tr/m2`, `giá ngộp`, `đầu tư`, `sinh lời`, `dòng tiền`, `100m2`, `5m`, `20m`, `3 tầng`, `4 phòng ngủ`.
2. **Vị trí & Giao thông:** `mặt tiền`, `hẻm xe hơi`, `góc 2 mặt tiền`, `sát chợ`, `gần trường`, `ven sông`, `cạnh Metro`, tên quận/huyện/phường.
3. **Pháp lý & An toàn:** `sổ hồng riêng`, `hoàn công`, `chính chủ`, `công chứng ngay`, `quy hoạch sạch`, `thổ cư 100%`.
4. **Tính từ đắt giá & Nội thất:** `siêu phẩm`, `tuyệt đẹp`, `nội thất cao cấp`, `tặng toàn bộ nội thất`, `ở ngay`, `giá rẻ nhất`.

---

## 3. MẪU CSS/KEYFRAMES CHUẨN TRONG HYPERFRAMES / REMOTION

```css
/* Container phụ đề an toàn */
.caption-container {
  position: absolute;
  left: 50%;
  bottom: 500px;
  transform: translateX(-50%);
  width: 90%;
  max-width: 960px;
  text-align: center;
  z-index: 40;
  pointer-events: none;
  font-family: 'Be Vietnam Pro', sans-serif;
  font-weight: 800;
  font-size: 42px;
  line-height: 1.35;
}

/* Từ thường */
.caption-word {
  display: inline-block;
  margin: 0 4px;
  color: #FFFFFF;
  -webkit-text-stroke: 3px #000000;
  filter: drop-shadow(0 2px 5px rgba(0,0,0,0.85));
  transition: color 0.08s ease, transform 0.10s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Từ đang đọc (Active Karaoke) */
.caption-word.is-active {
  color: #FFD700;
  transform: scale(1.10);
}

/* Từ khóa đắt giá (Smart Accent) */
.caption-word.is-keyword {
  color: #FFD700;
  -webkit-text-stroke: 3px #1A1300;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.70)) drop-shadow(0 2px 5px rgba(0,0,0,0.85));
}

/* Khi Chữ Hook Hero T3 xuất hiện -> Phụ đề tự động né */
.caption-container.hero-collision {
  opacity: 0.20;
  transition: opacity 0.15s ease-out;
}
```
