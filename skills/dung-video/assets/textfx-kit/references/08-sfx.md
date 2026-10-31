# 08 — SFX theo ý nghĩa lời thoại: quy tắc + quy trình phân loại

Nguồn luật duy nhất về SFX đi kèm chữ/khoảnh khắc trong `dung-video` (bộ `assets/textfx-kit/`, gộp từ dung-text-fx 27/10/2026) và luồng `/video`.
Script thực thi đúng các luật dưới: `scripts/sfx_tag.py` → `sfx_plan.py` → `sfx_render.py` → `sfx_mix.py` → `sfx_audit.py`.
Ngưỡng nằm trong code; sửa luật ở đây thì sửa code cùng lúc, và chạy lại 5 vòng ở `07-kiem-chung.md`.

## 0. Vì sao SFX cũ bị "lặp, không rõ" (đã đo 2026-10-23)
| # | Nguyên nhân | Bằng chứng |
|---|---|---|
| N1 | Luật đa dạng + canh SFX theo lời (Bước 4.7, 4.8) nằm trong `hoang-dung-bds-video-master`, mà `/video` luật cứng 1 cấm gọi → luồng /video mất luật | `dung-video/SKILL.md` luật cứng 1; `hoang-dung-bds-video-master/SKILL.md` dòng 549+ |
| N2 | Chọn SFX theo **kiểu hình** (pop khi chữ bật, whoosh khi trượt), không theo **nghĩa lời** → mốc nào cũng "whoosh + pop" | bảng SFX DU-AN-MAU: 13/16 mốc là swish/whoosh + pop |
| N3 | `catalog.json` đo trên đường bao thô: `peak_t` lệch > 1 khung ở **423/863 file**; `peak_db` lệch trung vị **+6.9 dB** (tối đa 40 dB) → `sfxlib.py` canh lệch giờ và chuẩn hoá sai độ to | `library/sfx-tags.json` (catalog_peak_t vs peak_t đo lại) |
| N4 | Độ to không có luật đo: ở DU-AN-MAU âm dẫn thấp hơn giọng 0.9–8.2 dB, lúc lấn lời lúc chìm; nhạc nền KHÔNG né SFX → Dũng nghe SFX bị cả giọng lẫn nhạc đè (2026-10-23) | đo `work/audio/sfx.wav` vs `voice.wav` |
| N5 | Kho lệch tông: kịch tính 252 + công nghệ 243 file; ấm áp 30, sang trọng 39; không có tiếng thật BĐS (cửa, bước chân, nước, chim, chìa khóa) | `sfx-tags.json → dem_sac_thai, nhom_thieu` |
| N6 | `audio-gate.md` chỉ kiểm "có SFX", không kiểm đúng nghĩa / đa dạng / dưới giọng | `dung-video/references/audio-gate.md` mục 2, 5 |
| N7 | Memory ghi sai đường dẫn catalog (`Downloads\whisper-20250625\sfx-catalog`); đúng là `<HD_VIDEO_HOME>\sfx-catalog` | `Test-Path` |

Điểm chấm bằng cùng `sfx_audit.py` trên video DU-AN-MAU: **SFX cũ 72.57/100** (đồng bộ 7.8/20, đúng nghĩa 18.9/25) → **SFX mới 100/100**.

## 1. Phân loại 3 trục cho MỌI file (`library/sfx-tags.json`)
| Trục | Giá trị | Ý nghĩa |
|---|---|---|
| **Vai** (chức năng) | `du_bao` dâng trước · `cham_manh` va/đập · `nhan_chu` chữ bật · `lap_lanh` ánh sáng/đuôi · `chuyen_canh` lướt · `danh_sach` tick từng mục · `giao_dien` thông báo · `foley` tiếng thật · `xac_nhan` chuông đúng · `sai` sai/cảnh báo · `ket_cau` lắp ghép · `xoay` · `bien_mat` chữ đi ra | âm đó LÀM gì trong khung |
| **Cảm xúc** | năng lượng `nhe/vua/manh` × sắc thái `am_ap/sang_trong/vui_tuoi/tin_cay/kich_tinh/cong_nghe/hai_huoc` | người xem CẢM gì |
| **Nghĩa** | `tien, so_lieu, giay_to, ban_do, xe, gio (gió/thoáng), dien_thoai, camera, xay_dung, chuong_cua, thang_may, dong_ho, kinh, xac_nhan, phep_mau, anh_sang, thong_bao, ban_phim, sai_lam` | âm đó TẢ vật/việc gì |
Kèm số đo **thật** từng file: `peak_t` = đỉnh ĐẦU TIÊN trong 1 dB của mức lớn nhất (khối 5 ms, |L|,|R| lớn nhất), `onset` (−30 dB so với đỉnh), `end_t` (−40 dB), `loud_end_t` (lần cuối ≥ −6 dB = hết vang to), `peak_dbfs`, `multi_hit` (sau đỉnh ≥ 0.2s có chỗ BẬT LẠI ≥ 6 dB trên chỗ lõm trước nó và tới trong 3 dB của đỉnh = nhiều cú chạm; cùng định nghĩa với "cú chạm thứ hai" của bộ chấm), `peak_spread` (vùng trong 1 dB của đỉnh kéo dài bao lâu trong 0.25s — > 0.025s = đỉnh mơ hồ, không làm âm dẫn), `crest_db` (hệ số đỉnh 0.2s đầu).
Nhãn suy từ thư mục + tên file + số đo, chưa nghe từng file → Dũng nghe chỉnh thì sửa tay và đặt `"sua_tay": true` (chạy lại không ghi đè).
Thêm file vào kho: chạy `build_catalog.py` (trong `HDRE AI\sfx-catalog`) rồi `python scripts/sfx_tag.py`.

## 2. Ý định lời thoại → loại SFX (bảng luật, `INTENT` trong `sfx_plan.py`)
Nhận ý định theo thứ tự: **chữ trên màn hình → câu đang nói → ngữ cảnh ±0.6s**. Nghĩa lấy từ chữ màn hình (không có thì từ câu nói).
| Ý định (L) | Tín hiệu (ví dụ) | Âm DẪN được phép | Sắc thái ưu tiên | CẤM | Lớp phụ T3 / T2 |
|---|---|---|---|---|---|
| L1 Hook (≤5s đầu, T3) | câu mở đầu | cham_manh | kịch tính, sang trọng | hài hước, sai | dâng + lấp lánh / dâng |
| L11 Nỗi đau / cảnh báo (≤5s đầu = T3) | tốn thêm, đừng, sai lầm, rủi ro | sai | hài hước, kịch tính | sang trọng, vui, ấm | dâng / — |
| L2 Giá | tỷ, triệu, giá, thương lượng | cham_manh, foley (nghĩa **tiền**) | sang trọng | hài hước, công nghệ, lướt; giá KHÔNG có con số ("Còn thương lượng") cấm thêm kịch tính | dâng + lấp lánh / lấp lánh |
| L7 Pháp lý | sổ hồng, hoàn công, công chứng | xac_nhan (chuông đúng) | tin cậy | hài hước, kịch tính, lướt | tiếng giấy / tiếng giấy |
| L12 Giải pháp / bất ngờ | giải pháp, không ngờ, hiếm | cham_manh, lap_lanh | sang trọng, kịch tính | hài hước | dâng + lấp lánh / lấp lánh |
| L5 Điểm mạnh nhà | tặng, nội thất, rộng, thoáng, không tốn | nhan_chu, lap_lanh, cham_manh | sang trọng, vui, ấm | hài hước, **công nghệ** | lấp lánh |
| L3 Số liệu | 50 m², 4 tầng, 4 phòng ngủ | danh_sach, nhan_chu (12 file `ket_cau` đều sắc thái công nghệ → không dùng) | tin cậy | hài hước, công nghệ | dâng / — |
| L4 Vị trí | đường, phường, hẻm, "cách 3 phút" (= gần, nghĩa **bản đồ**, không phải tiếng đồng hồ) | nhan_chu, danh_sach (nghĩa **bản đồ**) | tin cậy | hài hước, công nghệ | — |
| L6 Tiện ích | chợ, trường, siêu thị | danh_sach, nhan_chu (thang nốt) | vui, tin cậy | hài hước, công nghệ | — |
| L8 Chuyển ý | tên phòng (không gian, phòng khách, bếp…), hoặc không khớp gì | chuyen_canh | ấm, kịch tính | hài hước, công nghệ | — |
| L9 CTA | bình luận, liên hệ, gọi | giao_dien, xac_nhan, nhan_chu (nghĩa **thông báo/điện thoại**) | vui, tin cậy | hài hước | lấp lánh / — |
| L10 Tâm sự (style tam_su) | gia đình, tổ ấm, câu chuyện | lap_lanh, nhan_chu | ấm, sang trọng | **cham_manh**, công nghệ, kịch tính | — |
Luật nghĩa cụ thể: âm mang nghĩa `tien, dien_thoai, camera, thang_may, kinh, xe, ban_phim, sai_lam, chuong_cua, dong_ho, giay_to, gio, xac_nhan` CHỈ được dùng khi lời/ý định có đúng nghĩa đó — file mang nhiều nghĩa cụ thể thì MỌI nghĩa phải khớp (không "tiếng tiền" cho chữ "tặng nội thất").
Lời có nghĩa cụ thể (hoặc nghĩa ưu tiên của ý định, vd `so_lieu`, `phep_mau`) mà các lớp chưa mang → thêm **lớp nghĩa** (ưu tiên Foley; chọn trong mọi vai trừ vai/sắc thái cấm, đỉnh ≤ 1s) vào khi âm dẫn hết vang to (xem quy tắc 2), thấp hơn âm dẫn ≥ 9 dB. Pháp lý L7: tiếng giấy luôn vào TRƯỚC chuông 0.12s (kể cả khi bị hạ bậc hoặc lời không nói chữ "giấy/sổ").
Glitch chỉ dùng khi Dũng chọn style hype (`--style hype`). Tiếng "disappear" và âm đi xuống (ShieldDown, chimes down, bass drop/descend, *fall*) mang vai `bien_mat` — chỉ cho chữ đi ra. Chuông báo động/còi (*alarm, siren*) = cảnh báo (vai `sai`), không dùng cho CTA. Tiếng game (*game, arcade, 8bit, coin*) = sắc thái hài hước, không cho giá/BĐS.

## 3. Quy tắc nghề (áp dụng như editor chuyên nghiệp)
Nguồn: luật đã được Dũng duyệt trong `hoang-dung-bds-video-master` Bước 4.7–4.8 (16–17/10/2026) + thực hành sound design phổ biến cho video ngắn. Không có số liệu "video viral nào dùng" → [chưa xác minh], không trích.
1. **Âm là dấu câu của lời**: mỗi mốc chữ = 1 âm DẪN rõ + tối đa 1 lớp phụ nghe rõ (T3 được dâng + đuôi) + tối đa 1 lớp nghĩa/foley nhỏ; mọi lớp đều chịu luật sắc thái cấm và nghĩa cụ thể. Không chồng 3 âm cùng độ to. Âm dẫn phải có MỘT điểm chạm (`multi_hit` = false, đỉnh ≤ 0.6s, onset ≤ 0.3s); `crest_db` âm dẫn ≤ 15 (T1–T3), không đỉnh mơ hồ (`peak_spread` ≤ 0.025s) (âm quá nhọn không đạt độ to sát giọng dưới trần đỉnh).
2. **Canh theo điểm chạm, không theo đầu file**: va/chuông/pop → đỉnh = khung chữ chạm; riser → điểm kết (đỉnh) = khung chạm; lướt → đỉnh sớm 0.03s; âm dẫn Foley → bắt đầu đúng khung chạm; đuôi và lớp nghĩa → vào khi âm dẫn hết vang to: +max(0.08s, `loud_end_t − peak_t` + 0.02s), tối đa +0.4s; riêng tiếng giấy của pháp lý (lớp `foley` L7) bắt đầu TRƯỚC 0.12s (lật giấy rồi chuông xác nhận).
3. **Dự báo rồi mới nhấn**: T3 có riser kết thúc đúng khung chạm (chỉ khi phía trước trống ≥ 0.3s + độ dài riser). Riser phải MỘT cú (`multi_hit` = false — file chứa nhiều whoosh sẽ lọt tiếng lạc); `sfx_render.py` cắt riser 0.06s sau điểm neo đo được, fade 30 ms.
4. **SFX to rõ nhưng KHÔNG to hơn giọng** (luật của Dũng 2026-10-23; RMS cửa sổ −0.05…+0.15s quanh cú chạm, cả cụm, so với RMS giọng ±1s, chỉ lấy mẫu giọng > −40 dBFS): T3 −2 dB, T2 −3, T1 −4, T0 −6 — dải đạt −6…−1 dB; lớp phụ thấp hơn âm dẫn ≥ 9 dB; đỉnh stem ≤ −3 dBFS (render chừa −3.2).
4b. **Nhạc nền ĐỀU, chỉ hạ nhẹ ở mốc** (`sfx_mix.py --plan`; Dũng 2026-10-23: "đồng đều, chỉ giảm nhẹ lúc quan trọng rồi tăng lại"): nhạc lặp đủ thời lượng, giữ mức cũ (chuẩn −19 LUFS → sau khi hạ ≈ −20 LUFS, trong khung −18…−22 của audio-gate); KHÔNG né theo từng tiếng nói. Ở mốc có SFX hạ T3 −5, T2 −4, T1 −3 dB (hạ thêm vừa đủ để SFX nổi 8 dB, sâu nhất −6 dB): xuống 0.25s, giữ tới +0.6s, lên lại 0.8s (cosin); hai lần hạ cách < 2s thì giữ luôn. Ghi `bgm_dips.json`.
5. **Khoảng thở**: ≤ 2 mốc có âm trong 1 giây; âm rõ (T2–T3) cách nhau ≥ 3s, gần hơn thì hạ bậc ÂM (chữ giữ nguyên, vẫn có âm nhẹ); chừa 0.5s sau cú T3. Hai luật ≤ 2 mốc/1s và 0.5s sau T3 không sửa được bằng âm → kế hoạch in ⚠️ "Mật độ" để dời/gộp chữ ở giai đoạn 4.
6. **Không lặp**: mỗi file ≤ 2 lần/video; không 2 mốc liền cùng file; không 3 mốc liền cùng họ (thư mục, chặn cứng); âm dẫn mỗi họ ≤ round(30% số mốc) (tối thiểu 1); đuôi không cùng họ với âm dẫn, không 3 đuôi liền cùng họ của chính mốc đó và xoay họ đuôi; không vai nào > 50% âm dẫn (sfx_plan chặn khi chọn); không họ nào > 50% mọi lớp; `--seed` chỉ phá thế hòa điểm — KHÔNG bảo đảm hai video khác bộ âm (DU-AN-MAU và DU-AN-MAU trùng ~11/23 file); muốn khác thì đổi `sua_tay` hoặc chọn tay trong plan.
7. **Danh sách** (cùng `group`, hoặc tự động: các mốc vị trí/tiện ích L4/L6 liên tiếp cách nhau < 4s): cùng một file, cao độ tăng +2 nửa cung mỗi mục (thang nốt) — nghe như "lớn lên".
8. **Âm không tràn**: MỌI lớp của một mốc tắt trước mốc sau ≥ 0.15s (`sfx_plan.py` tự cắt `dur`); đuôi dài cắt + fade 0.12s.
8b. **Canh bằng mẫu thật**: `sfx_render.py` đo lại điểm neo trên chính đoạn đã cắt/đổi cao độ (đỉnh đầu tiên trong 1 dB trong cửa sổ ±0.25s, hoặc onset −30 dB) rồi đặt đúng giây kế hoạch — không tin số của catalog. Đổi cao độ dùng `asetrate`+`atempo` (giữ độ dài; `rubberband` trễ ~0.17s nên không dùng).
9. **Trung thực**: AI không nghe được — mọi kết luận "đúng lúc / đủ to" là số đo; Dũng nghe duyệt bằng tai nghe trước khi xuất.

## 4. Quy trình (giai đoạn 4 → 6 của /video)
1. Bảng mốc chữ (giai đoạn 4) → `moments.json`: `id, t` (giây chữ CHẠM = khung từ khóa bắt đầu được nói), `text`, `say` (câu đang nói), tùy chọn `L, tier, group`.
2. `python scripts/sfx_plan.py --moments moments.json --words words.json --out <dự án>/work/sfx --fps <fps> --duration <giây> --seed <tên video> [--style bds|hype|tam_su]`
   → `sfx_plan.json` + `sfx_plan.md` (mỗi lớp có lý do chọn). Đọc ⚠️ "thiếu tiếng thật" → báo Dũng nếu cần bổ sung kho.
3. `python scripts/sfx_render.py <sfx_plan.json> --out sfx.wav --duration <giây> --voice <giọng timeline 48k>`
4. `python scripts/sfx_audit.py <sfx_plan.json> --out sfx-scorecard.json --sfx sfx.wav --voice <giọng> --bgm bgm_ducked.wav` (sau bước 5) → phải **100/100**; thiếu điểm mục nào thì sửa đúng mục đó (đổi mốc t, hạ bậc, đổi file trong `sfx_plan.json`) rồi chạy lại 3–4. Tối đa 6 vòng; một mục 2 vòng liền không tăng → dừng, báo Dũng kèm số đo.
5. Trộn: `python scripts/sfx_mix.py --plan <sfx_plan.json> --voice <giọng> --sfx sfx.wav --bgm <nhạc> --duration <giây> --out <thư mục>` → `bgm_ducked.wav` + `mix.wav` + số đo ebur128 thật; rồi chạy lại bước 4 có thêm `--bgm bgm_ducked.wav`.
6. Gửi Dũng preview kèm `sfx_plan.md` + scorecard. Dũng chê/khen âm nào → sửa nhãn (`sua_tay`) hoặc luật ở đây.

## 5. Bảng chấm 100 (`sfx_audit.py`)
| Mục | Điểm | Đủ điểm khi |
|---|---|---|
| Đồng bộ | 20 | giây mốc trong plan (và `src.t`) phải khớp `moments.json` gốc ≤ 1 khung; chấm theo MỐC: kế hoạch (10) — mốc đạt khi mọi lớp lệch ≤ 1 khung so với vị trí chuẩn; stem thật (10) — đỉnh đầu tiên (trong 1 dB) của cụm âm mốc ≤ 1 khung so với khung chạm. Mốc thiếu âm dẫn = trượt |
| Phủ đủ | 10 | mọi mốc chữ có âm dẫn — đối chiếu lại `moments.json` gốc (plan lưu đường dẫn + sha256; file đổi/mất hoặc mốc bị xóa = trừ); không lớp mồ côi |
| Đúng nghĩa & cảm xúc | 25 | âm dẫn đúng vai (12), không dính cấm / nghĩa sai / hình âm sai (nhiều cú, đỉnh > 0.6s, onset > 0.3s, crest vượt mức) / riser nhiều cú / tiếng game ngoài style hype (8), lời có nghĩa cụ thể thì có lớp mang nghĩa đó (5); chia theo TỔNG mốc (mốc thiếu âm dẫn = 0). Bộ chấm NHẬN LẠI ý định/bậc/nghĩa từ chữ + lời (`src`, `ctx` trong plan) — nhãn bị sửa tay trong plan bị trừ; luôn chấm theo kho nhãn chính thức `library/sfx-tags.json` (plan trỏ kho khác = −5) |
| Đa dạng | 20 | ≤ 2 lần/file — một thang nốt (cùng `group`) tính 1 lần, đổi cao độ không có `group` vẫn tính (5); không 2 mốc liền cùng file trừ cùng thang nốt (5); không 3 mốc liền cùng họ, thang nốt hợp lệ (cùng file, +0/+2/+4…, chỉ L4/L6 hoặc group Dũng đặt), đuôi khác họ âm dẫn, họ âm dẫn ≤ 30% số mốc (5, mỗi lỗi −2.5); không vai > 50% âm dẫn khi ≥ 4 âm dẫn (2.5) + không họ > 50% mọi lớp khi ≥ 6 lớp (2.5) |
| Mật độ & khoảng thở | 15 | ≤ 2 mốc/1s (4), âm rõ cách ≥ 3s (4), 0.5s sau T3 (3), không lớp nào kêu qua mốc sau − 0.15s và riser tắt ≤ 0.1s sau khung chạm, đo trên vị trí đã trộn; stem không có âm ngoài các lớp kế hoạch (> −50 dBFS); mỗi lớp phụ có đỉnh riêng (render ghi) thấp hơn âm dẫn ≥ 9 dB; âm dẫn không tự bật lại ngang đỉnh (trong 3 dB) ở vùng chỉ có nó kêu; stem phải khớp từng mẫu với bản dựng lại từ plan (bắt âm chèn tay) (4, mỗi lỗi −1) |
| Độ to | 10 | vol đúng bậc (1), đỉnh stem ≤ −3 dBFS (2), cụm âm mốc thấp hơn giọng 1–6 dB (3), nổi ≥ 4.5 dB trên nhạc tại mốc — ngưỡng do Dũng nghe duyệt 23/10 (mốc yếu nhất 4.7 dB vẫn rõ), không tự nới thêm (2), nhạc đều: mức nhạc −19 ±1 LUFS (đo ebur128 `bgm_lev.wav`), hạ sâu nhất ≥ −6.5 dB, không hạ ngoài mốc (2) — thiếu stem/giọng/nhạc thật = 0 phần đo |
