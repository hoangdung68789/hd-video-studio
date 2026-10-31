# Lỗi đã mắc và cách tránh (DU-AN-MAU 26/10 + DU-AN-MAU 29–30/10)

## Yêu cầu
1. Chỉ làm đúng việc Dũng yêu cầu; thấy lỗi khác báo 1 dòng. Không chắc → xem file/khung thật, rồi hỏi 1 câu.
2. Áp mẫu/hiệu ứng nào → mở lại video gốc (skill `watch`), so khác biệt (vị trí, màu đo pixel, kiểu vào/ra), áp đúng mẫu, tự rà lỗi chưa khớp rồi sửa ngay.

## Lời + cắt
3. Whisper nghe sai (cả hook) → hỏi Dũng 1 lần, sửa trong `.srt`; không tự đoán.
4. Hook và CTA: người dẫn hiện trên hình, nói trọn câu.
5. **Nói hết câu rồi mới chuyển cảnh** (469: "xe hơi vào…" bị cắt) — cổng trong `build.py`.
6. Cảnh nhà ~4,7–5s, 3 cảnh sau mỗi đoạn thoại; mỗi clip 1 lần, không trùng góc (469: V13/V14 cùng cầu thang). Hết cảnh → lấy clip gốc + `match_grade.py`.

## Chữ, màu, MG
7. Không che mặt người dẫn (`face_zones.py`); chữ cao vừa, trong vùng an toàn.
8. Không màu "cầu vồng" tự chọn — dùng bộ màu đo từ mẫu.
9. Phụ đề ≥0,7s, không tách cụm (`COMPOUNDS`), chữ nhấn không chồng nhau.
10. Sau cảnh bản đồ phải mờ chồng sang cảnh kế (469: hở đen 0,36s — đã sửa trong `build.py`); MG không hiện trước cảnh của nó.

## SFX
11. Không ép 1 vòng swish cho mọi chữ (469 bị chê spam). Chọn theo phân loại; chữ + số chạy có SFX, hình minh họa không.
12. Không dùng họ `Sine/`. Bộ chọn tự động có thể gán nghĩa sai (nhãn "Mặt tiền" → tiếng tiền) → soát danh sách SFX in ra.
13. Điểm `sfx_audit` phần độ to thấp vì nhạc theo luật Dũng (−28 LUFS lúc nói) — không nới luật để lấy điểm.

## Kỹ thuật
14. `blur_plates.py` từng ghi cứng 50fps → clip chậm 20%, lệch khẩu hình (đã sửa: lấy fps nguồn). Bảng vào từ mép khung → thêm `keys`.
15. Studio có thể ghi đè `hf/index.html` → trước render: `cmp hf/index.html work/index_built.html`.
16. Dừng render: `TaskStop` không tắt tiến trình node → kiểm `Get-CimInstance Win32_Process` để không chạy 2 render cùng lúc (469: 20 phút thay vì 11).
17. Render với `--gpu`; chỉ đổi tiếng thì ghép lại audio, không render lại.

## Bảng kiểm trước khi gửi
- [ ] Hook đủ chữ, người dẫn trên hình; nói hết câu trước mỗi cú chuyển.
- [ ] 3 cảnh nhà sau mỗi thoại, không trùng cảnh; không hở đen.
- [ ] Không chữ che mặt; 0 khung lộ số nhà.
- [ ] `hyperframes check` 0 lỗi; lời −14, nhạc −28 lúc nói / −11 đoạn nhạc lớn; có nhạc.
- [ ] Chỉ đổi đúng phần Dũng yêu cầu.
