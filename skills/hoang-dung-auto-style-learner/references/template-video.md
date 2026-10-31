# Template video trọn bộ (TV) — chi tiết

Một template = MỘT dòng thời gian chung, mọi lớp nằm trên cùng mốc giây. Không lưu lớp nào riêng lẻ:
cấu trúc cảnh · chuyển cảnh · hiệu ứng · MG/animation · chữ · SFX · nhịp dựng · nhịp nhạc · cơ chế giữ chân.

## 1. Đo (bắt buộc đủ, theo viral-style-scout B2–B5)
| Lớp | Đo gì | Lệnh/nguồn |
|---|---|---|
| Cú cắt | mọi mốc cắt, độ dài shot | `select='gt(scene,0.3)',showinfo` |
| Sự kiện thị giác | mọi lần chữ/MG/hiệu ứng/chuyển cảnh xuất hiện | `select='gt(scene,0.06)'` + khung dày ±0,5s |
| Cảnh | cỡ (toàn/trung/cận/chi tiết), góc, chuyển động máy, host có trên hình không | khung tại mỗi shot |
| Chữ | nội dung vai trò (không chép chữ), font, cỡ %, vị trí %, màu hex, vào/ra (kiểu, số khung, easing), mã E/hiệu ứng | khung chữ |
| SFX | mốc, vai trò (whoosh/pop/impact/riser/tick…), độ to so với nhạc, gắn với sự kiện nào | ebur128 + phổ quanh mốc |
| Nhạc | BPM, mốc phách mạnh, mốc lên/hạ/drop/rút nhạc, mức nhạc so với giọng, % cú cắt trùng phách | librosa/numpy, ebur128 |
| Lời | vai trò từng câu (hook, vấn đề, bằng chứng, giá, vị trí, chốt, kêu gọi theo dõi) — chỉ ghi vai trò + giây, không chép lời | whisper / phụ đề |
| B-roll (BR) | mỗi cảnh minh họa: loại (toàn/chi tiết/đường trước nhà/flycam/nội thất), độ dài, chuyển động máy, đặt TRƯỚC/ĐÚNG/SAU câu nói bao nhiêu giây (J-cut/L-cut), câu nào được minh họa | khung tại mỗi shot + lời |
| Animation minh họa (AN) | mặt bằng vẽ nét, thước kích thước, mũi tên, icon, số đếm, bản đồ zoom: hình dạng, vị trí %, màu, số khung vào/ra, easing, gắn từ nào, có SFX không | khung dày ±0,5s |
| MG (thẻ/nhãn) | thẻ thông tin, lower-third, nhãn phòng/tầng, bộ đếm: vị trí %, cỡ, màu hex, thời gian hiện, theo cảnh hay theo lời | khung dày |
| **Vì sao (bắt buộc cho BR/AN/MG/chữ)** | `muc_dich` (minh_hoa_loi · chung_minh_so_lieu · dinh_vi · doi_nhip_giu_chan · chuyen_y · nhan_gia · tao_to_mo · keu_goi) + `ly_do` (1 câu: vì sao mẫu đặt ĐÚNG lúc đó, vd "nhãn phòng hiện 0,3s sau cú cắt để người xem biết đang ở đâu trước khi lời nói tới") + `gan_loi` (vai trò câu) + `gan_phach` (rơi đúng phách?) + `ket_hop` (đi cùng chữ/SFX/chuyển cảnh nào) | suy từ các lớp, nhãn Ước đoán |
| Màu chữ | trung vị pixel chữ ở khung rõ nhất → hex; lưu bộ màu vào `asset/phong_cach/mau_chu/bang_mau.json` | PIL/numpy |
| Màu | signalstats từng đoạn | ffmpeg |
| Giữ chân | hook 0–3s là gì; câu nhử (open loop) mở ở giây nào, trả lời ở giây nào; đổi nhịp (pattern interrupt) mỗi bao nhiêu giây; cao trào; lời kêu gọi theo dõi ở giây nào và được hỗ trợ bằng chữ/SFX/nhạc ra sao | suy từ các lớp trên, nhãn Ước đoán |

## 2. File template
`asset/phong_cach/template/<TV-xx>-<ten>/`
- `template.json` — dữ liệu chuẩn (dưới), `/dung-video` đọc file này.
- `the.md` — 1 trang đọc nhanh: hợp thể loại, công thức giữ chân, điểm yếu của mẫu đã sửa, video gốc + chỉ số.
- `contact.jpg` — contact sheet mọi cú cắt và mọi lần chữ.

```json
{"id":"TV-01","ten":"","the_loai":["review nha","chia se","q&a","vlog","phap ly","ke chuyen"],
 "nguon":{"url":"","ngay_xem":"","chi_so":"","nhan":"XM|chua xac minh"},
 "thong_so":{"khung":"9:16","fps":60,"thoi_luong":0,"lufs":-14,"bpm":0,"shot_tb":0,"su_kien_moi_giay":0},
 "giu_chan":{"hook":"","open_loops":[{"mo":0,"tra_loi":0}],"doi_nhip_moi_giay":0,"cao_trao":0,"keu_goi_theo_doi":{"giay":0,"cach":"chi khi Dung noi trong loi"}},
 "doan":[{"tu":0,"den":0,"vai_tro":"hook|van_de|bang_chung|vi_tri|gia|tien_ich|chot|cta",
   "canh":{"co":"","goc":"","chuyen_dong_may":"","host":true},
   "loi":{"vai_tro":"","o_dien":"<lời của Dũng>"},
   "chu":[{"giay":0,"ma":"E1|<mã hiệu ứng>","vai_tro":"","font":"","co_pct":0,"vi_tri_pct":[0,0],"mau":"","vao":"","ra":"","muc_dich":"","ly_do":""}],
   "mg":[{"giay":0,"ma":"","mo_ta":"","thoi_luong":0,"muc_dich":"","ly_do":"","gan_loi":"","ket_hop":[]}],
   "broll":[{"giay":0,"loai":"toan|chi_tiet|duong|flycam|noi_that","thoi_luong":0,"lech_loi_s":0,"muc_dich":"","ly_do":"","gan_loi":""}],
   "an":[{"giay":0,"loai":"mat_bang|thuoc|mui_ten|icon|so_dem|ban_do","vi_tri_pct":[0,0],"mau":"","vao":"","ra":"","co_sfx":false,"muc_dich":"","ly_do":"","gan_loi":""}],
   "chuyen_canh":{"giay":0,"ma":"TR01|cut|...","so_khung":0,"easing":""},
   "sfx":[{"giay":0,"vai_tro":"","gan_voi":"chu|mg|chuyen_canh|nhac","db_so_voi_nhac":0}],
   "nhac":{"phach":[0],"dien_bien":"len|ha|drop|rut|giu","muc_so_voi_giong_db":0},
   "cat":[0]}],
 "su_kien_do_duoc":{"cat":0,"chu":0,"mg":0,"broll":0,"an":0,"chuyen_canh":0,"sfx":0,"phach_manh":0},
 "ket_hop":[{"dau_hieu_loi":"giá|diện tích|vị trí|tên phòng|câu hỏi|CTA","combo":"broll + an/mg + chữ (kiểu, màu) + SFX vai + chuyển cảnh","thoi_diem":"so với từ khóa ±s","nguon":"<url + giây>"}],
 "diem_yeu_da_sua":[], "trang_thai":"Thu nghiem|Dung duoc|Chuan|Bo", "so_lan_dung":0, "dung_cham":[]}
```

## 3. Cổng "không bỏ sót" — chạy `scripts/template_check.py <template.json>`
Đạt khi: các đoạn liền nhau phủ đủ 0 → thời lượng (±0,2s); số cú cắt, chữ, MG, chuyển cảnh, SFX trong `doan` = `su_kien_do_duoc`; mọi đoạn có cảnh + nhạc + ít nhất 1 sự kiện (chữ/MG/chuyển cảnh/cắt) hoặc ghi lý do giữ tĩnh; mọi chữ có SFX trong ±0,15s (luật /dung-video); có hook, ≥1 open loop, mốc kêu gọi theo dõi. Thiếu → quay lại đo đúng lớp đó, tối đa 3 lượt.

## 4. Áp vào video của Dũng (`/dung-video` giai đoạn 1b → 6)
- Chọn template khớp thể loại + nội dung lời thoại; áp NGUYÊN KHỐI cho cả video, mọi agent đọc cùng `template.json`.
- Ghép: mỗi `doan` ↔ take/cảnh của Dũng theo vai trò lời. Thời lượng khác mẫu → co/giãn theo tỷ lệ từng đoạn, giữ nguyên mật độ sự kiện/giây và vị trí trên phách nhạc.
- Thiếu cảnh cho một đoạn → dùng cảnh gần vai trò nhất hoặc MG minh họa đúng thông tin Dũng có; ghi vào báo cáo danh sách cảnh nên quay thêm.
- Luật /dung-video thắng template: chữ chỉ từ lời + thông tin Dũng; không nền hộp; lời kêu gọi theo dõi chỉ khi Dũng nói.
- Dũng duyệt → template +1 `so_lan_dung`, điểm; chê → luật kiểm mới cho template đó (Vòng tự học).

## 5. Tự dựng template giống mẫu + kiểm tối đa 3 vòng tới 100 điểm (Dũng 30/10/2026)
1. Đo mẫu → `template.json` (mục 1, có đủ BR/AN/MG + "vì sao") → `template_check.py` PASS.
2. Tự dựng bản tái tạo bằng HyperFrames theo đúng `template.json`: cùng thứ tự đoạn, cú cắt (giờ tương đối), chữ (vị trí %, màu hex đo được, kiểu vào/ra), BR/AN/MG đúng mốc + mục đích, SFX đúng vai, nhạc cùng BPM/diễn biến. Footage: footage Dũng cùng thể loại; thiếu cảnh → ghi cảnh tạm, không bịa hình.
3. Render nháp 720p → đo lại bản tái tạo bằng CÙNG bộ đo → `ban_dung.json`.
4. Chấm: `python scripts/template_similarity.py template.json ban_dung.json --out diem.json` (7 lớp: nhịp cắt 20 · bố cục 15 · chữ 20 · BR/AN/MG 20 · SFX 10 · nhạc 10 · giữ chân 5).
5. Vòng 1–3: sửa lớp điểm thấp nhất theo danh sách lệch, đo + chấm lại. Đạt 100 → trạng thái "Dùng được". Sau vòng 3 chưa 100 → "Thử nghiệm", báo Dũng bảng lệch + clip so sánh; không nói đạt, không nới dung sai.
6. Luật /dung-video vẫn thắng mẫu (chữ chỉ từ lời, không che mặt người dẫn): điểm lệch do luật này ghi vào `diem_yeu_da_sua`, không tính là lỗi tái tạo.
7. Mỗi lần `/dung-video` dùng template → mở lại video gốc (skill `watch`), so khác biệt rồi mới áp (R-L025).
