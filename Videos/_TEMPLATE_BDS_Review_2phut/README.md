# Template: review BĐS ~1:20–2:00 (người dẫn + tour nhà)

Dựng bằng HyperFrames 0.8.171. Gốc: DU-AN-MAU (Dũng duyệt 26/10/2026), nâng cấp từ DU-AN-MAU Bình Thành (30/10/2026). Đọc `LOI_CAN_TRANH.md` trước khi dựng.

## Công thức
Hook (người dẫn nói trọn câu, nhạc nhỏ −28 LUFS) → **3 cảnh nhà ~4,7–5s** (nhạc lớn −11 LUFS, vào đúng drop) → thoại → 3 cảnh nhà → … → CTA.
- Nói **hết câu** rồi mới chuyển cảnh (`build.py` có cổng kiểm; thiếu chỗ → thêm phách hoặc `"hard_out": True`).
- Mỗi clip b-roll dùng 1 lần; chuyển cảnh mờ 0,36s đúng phách; không chớp trắng, không punch-in.
- Clip lẫn giọng người khác → không lấy lời, chỉ lấy hình.

## Chữ, MG, SFX
- Chữ chỉ lấy từ lời. Kiểu theo mẫu viral có nguồn: xếp tầng trái (@quynhanhbds), câu hỏi slam giữa khung `q`, giá số chạy `p`, nhãn phòng (@vietnamhousetour). Mỗi dòng có thể gán màu/animation (`project.py`).
- **Không che mặt người dẫn**: chạy `face_zones.py <id host…>` → build tự dời/thu nhỏ chữ.
- Màu = biến CSS `:root` (đổi trong Studio, tab Code). Bộ màu đo từ mẫu: `asset/phong_cach/mau_chu/bang_mau.json`.
- SFX: tự chọn theo phân loại (`sfx_plan.py`, ý định L + bậc T), không spam 1 khuôn. Chữ + số chạy có SFX; hình minh họa (MG, bản đồ, thước) không SFX. Không dùng họ `Sine/`. Đổi âm 1 mốc: `SFX_OVERRIDE`.
- 1 bản đồ vệ tinh Esri + nhãn đường tiếng Việt, ghim lệch 80–150m, 2–3 tiện ích thật OSM, `© Esri · © OpenStreetMap`.

## Chạy (Git Bash, đứng ở thư mục dự án; `P="<HD_VIDEO_HOME>/venv/Scripts/python.exe"`)
1. Tạo dự án: `new_project.ps1 -Name "123A-TenDuong"` → sửa **chỉ `project.py`**.
2. Nhạc: (`loop_music.py` nếu bài ngắn) → `prep_music.py`.
3. Lời: `transcribe.py` → `voice_audit.py` (whisper nghe sai → hỏi Dũng 1 lần, sửa trong `.srt`).
4. Màu: `grade_clips.py` (Rec.709 → `MASTER_LUT = None`; cảnh gốc phẳng chưa có màu → `match_grade.py`).
5. Che số nhà: `blur_plates.py <id>` (khung `BLUR`, thêm `keys` khi bảng đi vào từ mép khung) — làm cuối, soát lại trên bản render.
6. Bản đồ: `fetch_map.py`. Mặt người dẫn: `face_zones.py <id…>`.
7. Dựng: `build.py` → `cd hf && npx --yes hyperframes@0.8.171 check` (0 lỗi) → `bash scripts/sfx.sh`.
8. Render 1 lần: `npx --yes hyperframes@0.8.171 render --quality delivery --fps 60 --gpu -o ../final/<NAME>.mp4`. Chỉ đổi tiếng → ghép lại bằng ffmpeg, không render lại hình.
