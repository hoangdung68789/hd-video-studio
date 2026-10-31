# Luật cứng của /video
Cộng thêm Luật cứng video của `hoang-dung-agent-orchestrator`. Đọc trước khi dựng.

## Luật cứng số 0, không được bỏ qua (Dũng chốt 31/10/2026)
**Việc đầu tiên của mọi lần chạy /video: tạo dự án và tự động mở Studio, trước khi đo footage, chép lời hay chỉnh màu.** Tạo `Videos\<tên>\hf\`, ghi ngay `hf\index.html` khung (Studio chỉ thấy dự án khi có file này) cùng `hf\meta.json`, gọi `preview_start {name: "hd-studio"}`, rồi `navigate` tới `http://localhost:<cổng preview_start trả về>/?du-an=<tên>`. Kiểm Studio đã hiện đúng dự án rồi mới làm bước tiếp theo.

## Luật cứng riêng của /video (cộng thêm Luật cứng video của orchestrator)
1. Skill Hoàng Dũng dùng được: orchestrator, `hoang-dung-viral-style-scout`, `hoang-dung-auto-style-learner`. Skill khác được nhắc mà không có → bỏ qua, ghi `skipped_refs`.
2. Địa chỉ chỉ ở mức khu vực (đường lớn, phường/quận); không số nhà, số hẻm, tên chủ. Nhãn bản đồ là chữ ngoại lệ duy nhất.
3. Chữ: không khung/nền tối sau chữ; không lặp chữ; MỌI chữ có SFX; chữ hero chạm đúng từ ±2 khung; vùng an toàn TikTok (~230px trên, ~480px dưới, ~160px phải).
4. Zoom, Ken Burns, punch-in, rung footage: AI tự quyết theo nội dung (Dũng bỏ luật cấm 31/10/2026). Dũng yêu cầu cụ thể thì làm theo.
5. Không xuất video câm hoặc chỉ có SFX; không tổng hợp nhạc nền bằng code.
6. Không nói "100 điểm" khi chưa có scorecard do script sinh; không nới ngưỡng. AI không nghe được: kết luận âm thanh là số đo.
7. Font giống mẫu nhất (từ phiếu font); lỗi tiếng Việt → chạy `assets/textfx-kit/scripts/vn_font_gate.py`, báo đúng mẫu cảnh báo, dùng font thay thế.
8. Tên style/hiệu ứng chỉ dùng tên có nguồn hoặc Dũng xác nhận; link mẫu chỉ dùng link thật đã mở và đo, kèm mốc giây.
9. Không sửa memory, không sửa `plugins\cache`, không sửa file skill khi chưa hỏi.
10. **Không che mặt người dẫn** (Dũng 29/10): dò vùng đầu theo thời gian (`face_zones.py` của template BĐS, tách người tại máy) → chữ/MG tự dời lên trên đầu, cạnh người hoặc thu nhỏ; không bỏ ý chính, không cắt cảnh để né. Chữ theo lời đặt cao vừa (phụ đề đáy ~600/1920, chữ nhấn ~540), vẫn trong vùng an toàn.
11. **Nói hết câu rồi mới chuyển cảnh**: cảnh sau chỉ bắt đầu mờ vào sau từ cuối ≥0,1s; thiếu chỗ → thêm phách hoặc cắt thẳng đúng phách (`hard_out`), không cắt mất lời.
12. **SFX theo phân loại** (Dũng 29/10, thay mọi luật cấm âm cũ): đánh giá điểm quan trọng từng câu (ý định L + bậc T, `sfx_plan.py`), chọn âm đúng vai, không spam 1 file/1 họ. Chữ hiệu ứng (kể cả nhãn phòng) + số chạy có SFX; animation hình minh họa (mặt bằng, thước, bản đồ) KHÔNG SFX trừ khi Dũng yêu cầu. Không dùng họ `Sine/` trừ khi Dũng yêu cầu. Dũng chê 1 âm → `SFX_OVERRIDE`, chỉ trộn lại tiếng.
13. **So mẫu trước khi áp** (R-L025): dùng template/hiệu ứng/mẫu chữ nào → mở lại video gốc (skill `watch`), so khác biệt (vị trí %, màu đo pixel, kiểu vào/ra, nhịp, SFX), áp đúng mẫu, tự rà lỗi chưa khớp và sửa ngay. Màu chữ từ `asset/phong_cach/mau_chu/bang_mau.json`, khai báo biến CSS `:root` để Dũng đổi trong Studio; không tự chọn màu "cầu vồng".
14. **Review nhà**: sau mỗi cảnh thoại là 3 cảnh nhà ~4,7–5s; mỗi clip 1 lần, không trùng góc (hết cảnh → lấy clip gốc + `match_grade.py`); clip lẫn giọng người khác → tắt tiếng, bỏ chữ theo giọng đó. Chữ + MG + b-roll minh họa đúng câu nói (tra Bảng kết hợp của learner).

15. **Mọi hiệu ứng và các khối edit khác đều phải xuất hiện trên timeline HD Studio** (Dũng chốt lại 31/10/2026): chữ, phụ đề, video, ảnh, hình, nhãn dán, MG, hiệu ứng, chuyển cảnh, lớp màu, lời thoại, SFX, nhạc. Không có khối nào chỉ nằm trong script mà không chỉnh được trên timeline.
16. Ngoài các luật ở đây, AI được tự do chọn cách làm; Dũng sẽ yêu cầu sửa khi có lỗi hoặc nói rõ đoạn mong muốn.
