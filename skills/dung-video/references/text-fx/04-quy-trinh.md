# Quy trình làm chữ hiệu ứng (giai đoạn 4 → 5 → 7)

## Bước 1 — Lập bảng mốc chữ (giai đoạn 4)
Đầu vào: transcript từng từ có timecode + thông tin Dũng cung cấp.
Với mỗi mốc ghi một dòng:
`thời điểm | từ khóa trong lời | nội dung chữ (nguồn) | loại L1–L10 | bậc T0–T3`
- Dòng nào "nội dung chữ" không có nguồn (lời thoại hoặc thông tin Dũng) → xóa.
- Kiểm hạn mức mật độ ở `03-thoi-diem-su-dung.md` mục 3. Quá mức → hạ bậc hoặc bỏ bớt mốc yếu nhất.
- Nộp bảng; cổng G4 yêu cầu bảng này có đủ nguồn.

## Bước 2 — Chọn hiệu ứng (đầu giai đoạn 5)
1. Chọn **tối đa 2 họ hiệu ứng** cho cả video (xem `05`), ghi vào `edit-state.json → stages.4`.
2. Với mỗi mốc, chọn hiệu ứng theo loại L và bậc T. Không dùng cùng hiệu ứng cho hai mốc liền kề.
3. Nếu Dũng đưa video mẫu: `hoang-dung-viral-style-scout` (Chế độ B) phân tích hiệu ứng/font/màu/nhịp của mẫu trước, rồi map sang hiệu ứng ở `05`. Không chép nguyên video mẫu.
4. Ghi vào bảng mốc thêm cột `hiệu ứng | SFX role | thời lượng vào/giữ/ra`.

## Bước 3 — Dựng (giai đoạn 5)
Công cụ theo engine (xem `05` mục 3):
- HyperFrames: `motion-graphics`, `hyperframes-animation` (rules/adapters), `hyperframes-keyframes`, `embedded-captions` cho chữ theo lời.
- Remotion: `remotion-best-practices` → `remotion-markup` (+ `@remotion/transitions`, `@remotion/effects`).
Quy tắc dựng:
- Mỗi mốc là một lớp riêng, có id rõ (`txt-hook`, `txt-price`…), canh theo timecode ở bước 1.
- Font Be Vietnam Pro, padding dấu theo quy tắc 6; kiểm bằng khung nghỉ.
- Không khung nền; bóng mềm + viền mảnh; kiểm tương phản trên khung thật tại thời điểm hiện.
- Gắn SFX ngay khi dựng từng mốc (không để dồn cuối): chọn bằng `sfxlib.py` theo role (hit/riser/whoosh/pop).

## Bước 4 — Tự kiểm trước khi trình (giai đoạn 5 → 7)
Với MỌI chữ T2–T3 trích 3 khung: **đang vào**, **đỉnh**, **nghỉ**; xem bằng mắt. Checklist:
- [ ] Nội dung chữ khớp lời/thông tin (đối chiếu bảng)
- [ ] Không lặp chữ; không hai điểm nhấn trong một khung
- [ ] Trong vùng an toàn; không che mặt/chi tiết nhà
- [ ] Dấu tiếng Việt đủ ở trạng thái nghỉ
- [ ] Chữ chạm đúng từ nói (±2 khung); SFX đỉnh trùng
- [ ] Thời gian giữ đủ đọc; có khoảng thở giữa các mốc
- [ ] Không quá 2 họ hiệu ứng; không hiệu ứng nặng lên số liệu đang chạy
Một ô lỗi → sửa đúng mốc đó, không dựng lại toàn bộ.

## Bước 5 — QA độc lập (giai đoạn 7)
`hoang-dung-agent-orchestrator` giao agent chưa làm công đoạn chữ: trích khung mỗi 1–2s + mọi lần chữ xuất hiện, xem bằng mắt, đối chiếu bảng mốc. 3–5 vòng. Còn 1 lỗi → trả về bước 3.

## Bước 6 — Sau khi Dũng duyệt
Ghi vào vòng tự học của `hoang-dung-auto-style-learner`: hiệu ứng nào Dũng khen/chê, tăng/giảm mật độ, họ hiệu ứng ưa thích. Lần sau áp dụng mặc định.

## Khi lỗi
- Hiệu ứng không thể render deterministic → đổi sang hiệu ứng tương đương đơn giản hơn, ghi `skipped_refs`.
- Một mốc lỗi 2 lần → bỏ hiệu ứng, dùng T1 (slide/fade) và báo Dũng.
