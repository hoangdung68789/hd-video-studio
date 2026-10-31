# Chọn LUT tự động

### Chọn LUT tự động (giai đoạn 3)
0. Footage đã là bản CapCut Dũng chỉnh màu (Rec.709) → không LUT, chỉ chuyển khổ; cảnh lấy thêm từ clip gốc phẳng → `match_grade.py` học đường cong màu từ các cặp cùng cảnh rồi áp.
1. **Đo từng clip** (3 khung đầu/giữa/cuối): `ffprobe` color_transfer/primaries; `signalstats` YAVG, YMIN/YMAX, SATAVG, UAVG/VAVG (độ ám); mở ảnh khung để xem ngoài trời/trong nhà, nguồn sáng, giờ quay.
2. **Xếp môi trường** theo bảng ENV-01…06 của `hoang-dung-bds-color-master` (nắng gắt, hẻm tối, đèn vàng, cửa sổ chênh sáng, đêm, D-Log), cộng giờ vàng/hoàng hôn. Ghi lý do bằng số đo.
3. **Chọn LUT** theo môi trường + thể loại + camera: D-Log → LUT DJI V1.0 làm nền; nhóm freshluts: `01_BDS A` (tự nhiên, nội thất), `01_BDS B` (sáng ấm, ngoại thất), `04_VlogDuLich` (ngày / giờ vàng / đêm), `03_Cinematic` chỉ khi thể loại cần. Chỉ dùng LUT đúng gamma camera, không đặt LUT Sony/Canon/drone lên Pocket 4 D-Log. Thử 2–3 LUT ứng viên mỗi môi trường.
4. **Rà soát 3 vòng trước khi chấm đạt** (AI tự chấm, không giao skill khác chấm thay): V1 số đo (trắng trung tính, phơi sáng, da 45–65°, bão hòa, không ám vùng giữa); V2 đồng nhất giữa các clip cùng môi trường (chênh YAVG, UAVG/VAVG); V3 mở ảnh trước/sau bằng mắt. Mỗi tiêu chí kèm số đo + đường dẫn ảnh; thiếu dẫn chứng = 0 điểm. Chưa đạt → đổi LUT/cường độ, chấm lại đủ 3 vòng.
