# Luật cứng của /dung-video (Chuẩn Công ty Sản xuất Nội dung MXH Chuyên nghiệp — Cập nhật 03/11/2026)

Nhãn: **[D]** luật Dũng chốt, luôn thắng tuyệt đối. **[N#]** có căn cứ ngoài (`resources/nguon-dan-chung.md`), vẫn bị [D] ghi đè. **[Thử]** ý kiến hoặc giả thuyết, KHÔNG phải luật; chỉ áp dụng khi chạy thử A/B trên kênh Dũng có số đo. **[Tính]** suy ra bằng tính toán.
AI và mọi Sub-Agent tuyệt đối không tự bịa con số, tên style, tên hiệu ứng, link; không tự đoán ý. Không có nguồn → ghi `missing` hoặc hỏi gọn.

## I. LUẬT CỨNG VỀ TỔ CHỨC ĐỘI NGŨ SUB-AGENTS, ĐỒNG THỜI & KIỂM TRA NHANH (Chốt 03/11/2026)

1. **[D] Tất cả tác vụ chạy ĐỒNG THỜI & Sửa lỗi NGAY TẠI CHỖ (Zero-Defect In-line Fix):**
   - CẤM làm xong toàn bộ video mới rà soát lỗi rồi quay lại sửa.
   - Ngay sau khi chốt khung xương Timecode/Transcript (`master-timeline` ở Pha 0), mọi công đoạn (Cắt dựng theo phân đoạn `segment_id`, Đo/Chỉnh màu, Che địa chỉ, Chữ Hook/Phụ đề/MG/Bản đồ neo theo `word_id`, Xử lý Giọng/Nhạc/SFX) phải chạy **đồng thời (100% Parallel Pipeline)** để tiết kiệm tối đa thời gian.
   - Mỗi Sub-Agent làm đến đoạn/mốc nào phải tự đo và **sửa lỗi ngay tức khắc tại đoạn/mốc đó** theo đúng chuẩn quy trình Editor chuyên nghiệp trước khi đóng gói đầu ra.

2. **[D] Quyền Kiểm tra Chéo Ngang hàng giữa các Sub-Agents (Peer Cross-Check & Upstream Gate):**
   - Mỗi Sub-Agent được phân công nhiệm vụ chuyên biệt riêng, nhưng **có toàn quyền và trách nhiệm kiểm tra lỗi của Sub-Agent đứng trước/liên đới** trước khi nhận bàn giao để thực hiện công việc của chính mình.
   - Khi Sub-Agent nhận đầu vào mà phát hiện lỗi từ Sub-Agent khác (lệch timecode, cắt phạm lời, chữ không nguồn, lộ số nhà, thiếu 3 pha hiệu ứng, sai mức âm...), Sub-Agent đó **bắt buộc yêu cầu Sub-Agent gây lỗi sửa ngay lập tức đoạn bị lỗi** trước khi mình làm tiếp. Tuyệt đối không nhận dữ liệu lỗi để làm sai dây chuyền, không bỏ qua dưới lý do "ngoài phạm vi".

3. **[D] Kiểm tra Nhanh Tổng thể bởi Agent Tổng — Ngưỡng bàn giao `≥ 98/100` & Vá lỗi Cục bộ (Surgical Patch):**
   - Agent Tổng (Giám đốc Sản xuất / Chief Orchestrator) thực hiện **kiểm tra nhanh tổng thể video** bằng số đo thật (`ffprobe`, `ebur128`, `sfx_audit`, `vn_font_gate`) kết hợp xem nhanh contact sheet toàn cảnh (bỏ quy trình rà 3 vòng lặp lại nặng nề).
   - **Ngưỡng bàn giao chuẩn: Đạt tối thiểu từ `98/100` trở lên (`≥ 98/100`)** (và đạt 100% các điều kiện chặn an toàn: 0 khung lộ địa chỉ, 0 chữ tự bịa, có nhạc nền bắt tai, đúng 1 file 9:16 H.265) → **Bàn giao ngay bản cuối cho Dũng** kèm **báo cáo giải trình chi tiết rõ ràng** (điểm từng hạng mục, nêu rõ chi tiết các điểm đạt và phần trừ nhỏ ≤2 điểm nếu có).
   - Nếu điểm `< 98/100` hoặc phát hiện đoạn có lỗi: **chỉ khoanh vùng sửa ngay đúng đoạn/khung có lỗi** để khớp lại toàn bộ video, tuyệt đối không làm lại từ đầu hay render lại phần không lỗi gây tốn thời gian.

4. **[D] Quy mô tối đa 50 Sub-Agents (Không tạo dư) & Đánh giá/Loại bỏ nhân sự (`> 2 lần hỏng việc`):**
   - Agent Tổng có quyền tạo ra **tối đa 50 nhân viên Sub-Agents** nếu dự án lớn cần thiết và chủ động phân chia nhiệm vụ riêng biệt cho từng Sub-Agent.
   - **Cấp phát vừa đủ (Right-Sizing):** Dựa theo quy mô thực tế của từng dự án, Agent Tổng chỉ tạo **đủ số lượng Sub-Agents cần thiết** cho dự án đó (**tuyệt đối không tạo dư số lượng**).
   - **Kỷ luật loại bỏ (`> 2 lần lỗi`):** Sub-Agent nào **làm hỏng việc trên 2 lần** (quá 2 lần lỗi/sửa không đạt trong nhiệm vụ được giao) sẽ bị Agent Tổng **loại bỏ ngay lập tức (Terminate)** và thay bằng Sub-Agent mới kế thừa công việc từ đúng chỗ dở.
   - **Đánh giá sau mỗi dự án:** Khi kết thúc dự án, Agent Tổng bắt buộc đánh giá hiệu suất từng Sub-Agent vào sổ nhân sự (`agent-roster.json` và báo cáo cuối): Sub-Agent nào hoàn thành tốt nhiệm vụ (`≤ 2 lần lỗi`, nhanh, chuẩn) sẽ được **giữ lại (Retained)** cho các dự án tiếp theo; Sub-Agent hỏng việc `> 2 lần` bị **loại bỏ vĩnh viễn (Terminated)**.

---

## II. LUẬT CỨNG VỀ NỘI DUNG, KỸ THUẬT & CHUẨN EDITOR CHUYÊN NGHIỆP (Chốt 02–03/11/2026)

5. **[D] Công cụ:** Ưu tiên bộ skill của Dũng (`hoang-dung-agent-orchestrator`, `hoang-dung-viral-style-scout`, `hoang-dung-auto-style-learner`). AI được tự chọn công cụ miễn phí phù hợp trên máy miễn tuân thủ tuyệt đối luật cứng. Không dùng công cụ tốn credit khi chưa hỏi Dũng. Skill được nhắc mà không có → bỏ qua, ghi `skipped_refs`.
6. **[D] Bảo mật địa chỉ:** Địa chỉ trên chữ/lời chỉ ở mức khu vực (đường lớn, phường/quận); cấm lộ số nhà, số hẻm, tên chủ, giấy tờ cá nhân. Tổ Bảo mật quét 0.5s/khung và che mờ bám chuyển động (`boxblur` tracking) ngay từ Pha 1. Nhãn bản đồ là chữ ngoại lệ duy nhất ngoài lời nói.
7. **[D] Ba vai chữ & Nguồn chữ:**
   - **Phụ đề (T0)** và **Nhãn (T1)**: KHÔNG hiệu ứng, KHÔNG SFX.
   - **Chữ hook (T2–T3)**: CÓ hiệu ứng + SFX, đỉnh chạm đúng từ nói `±2 khung`.
   - Không khung/hộp nền tối sau chữ; không lặp chữ; **cấm tự thêm chữ ngoài lời nói và thông tin Dũng cung cấp**. CTA chỉ thành chữ khi chính người dẫn nói câu đó.
8. **[D] Chuẩn 3 Pha Hiệu ứng Editor Chuyên nghiệp & Đặt tên Phổ biến (Chốt 03/11/2026):**
   - Mọi hiệu ứng thuộc 7 nhóm (Chữ `CH`, Chuyển cảnh `CC`, Chuyển động máy/thời gian `CM`, Đồ họa `MG/AN`, Kỹ xảo `VFX/LP`, Màu `MA`, Âm thanh `SF`) phải đủ **3 pha**:
     1. **Mở đầu (`Entrance` 0.18–0.45s):** Đường cong giảm tốc `Ease-Out` (hoặc `back.out(1.4)`), kết hợp ≥2 thuộc tính + `Stagger 40–70ms` + SFX `Riser/Whoosh` dẫn trước `0.08–0.20s` để đỉnh âm đập trùng khung mở hoàn tất.
     2. **Duy trì (`Hold` ≥ 1.5s):** Đứng yên đủ đọc (`≥ 1.5s` hoặc `số_ký_tự/12s`).
     3. **Kết thúc (`Exit` 0.15–0.30s):** Nhanh gọn bằng `60–70%` thời gian mở (`Ease-In`), hoặc ngắt khít trước vết cắt `1–2 frames`, hoặc cuốn theo chuyển cảnh, kèm đuôi âm `Reverb/Fade-out` tự nhiên.
   - **Gọi đúng tên phổ biến trong nghề:** Định dạng `Tên phổ biến quốc tế (Tên thông dụng tiếng Việt)` theo `tu_dien_hieu_ung.md` (cấm tự bịa tên mô tả code).
9. **[D] Camera giả (zoom, Ken Burns, punch-in, rung footage):** Mặc định TẮT. Mẫu có dùng thì ghi vào Thẻ phong cách là "cần hỏi Dũng". Muốn áp dụng: hỏi Dũng MỘT câu kèm mốc giây, lý do, mẫu nào dùng; ghi vào `asks` của `edit-state.json`. Không có trả lời → không áp dụng, nhấn bằng chữ động.
10. **[D] Màu/LUT luôn hỏi Dũng 3 lựa chọn:** (1) Giữ màu gốc (chỉ gợi ý cảnh lỗi có số đo), (2) Tạo theo video mẫu, (3) Dùng tài nguyên có sẵn và gợi ý (tối đa 3 LUT gốc đẹp nhất). Không tự ý áp LUT; chưa có trả lời → giữ màu gốc. Khi chỉnh màu hoặc áp LUT phải đi qua chuỗi 6 tầng bằng `color_engine.py` (`references/color-pipeline.md`): Creative LUT trộn mặc định 55%, trong khung 40–65%; LUT kỹ thuật D-Log áp 100%. Màu phải làm nhà trông đúng thực tế, da tự nhiên, đồng nhất giữa các cảnh [N5][N6].
11. **[D] Một bản cuối duy nhất:** Xuất đúng **MỘT file 9:16 H.265 60fps** dùng chung cho TikTok, Shorts, Reels; không logo/watermark nền tảng khác; vùng an toàn TikTok (`~230px` trên, `~480px` dưới, `~160px` phải) làm chuẩn chung.
12. **[D] Âm thanh, Nhạc nền & Hệ sinh thái Sound Design Chuyên nghiệp (Chống lạm dụng SFX):**
   - Không xuất video câm hoặc chỉ có SFX; chỉ xuất bản có nhạc nền bắt tai từ giây đầu, không át giọng (`giọng ≈ -14 LUFS`, `nhạc dưới giọng -18…-22 LUFS`, `true peak ≤ -1 dBTP`), cấm tổng hợp nhạc bằng code.
   - **Tuân thủ triệt để cẩm nang `references/sfx-sound-design-chuyen-sau.md`:** SFX là hệ thống điều hướng tiềm thức và đòn bẩy cảm xúc, CẤM dùng bừa bãi theo phản xạ cơ học "thấy hình gì gắn tiếng đó".
   - **Phối hợp 5 Nhóm chức năng:** Kết hợp cân bằng `Ambience` (-24dB..-32dB làm keo dán), `Foley` (-18dB..-24dB tạo xúc giác ASMR), `Transitions` (J-Cut Lead-in `-3f..-5f` cho chuyển cảnh lớn), `Impacts` (tối đa 2–3 cú impact lớn toàn video cho con số/giá bán sống còn), `Textures` (Drone/Ringing/Heartbeat thao túng tâm lý sâu).
   - **Quy tắc Khoảng thở Âm thanh (Audio Spacing):** Giữa 2 cú Accent Hits phải cách nhau tối thiểu `2.5s – 3.0s`. Tuyệt đối cấm spam SFX dồn dập gây mệt mỏi thính giác.
   - **Dải tần bảo mật Giọng nói (Mid-Range Cleansing):** Bắt buộc EQ Cut dải `800Hz – 3.5kHz` trên mọi track SFX phát ra khi có giọng nói; SFX chỉ chiếm dải Sub (<80Hz) hoặc Air (>5kHz) để không đè nát lời người dẫn.
   - **Khoảng lặng đắt giá (Negative Space):** Tại điểm cao trào / plot twist (45–55s), áp dụng công thức 3 bước: Riser dồn nén → Cắt sạch âm thanh (Dead Silence `0.3s–0.6s`) → Giáng Sub-drop + Shimmer bùng nổ khi sự thật hé lộ.
   - **SFX Blacklist:** CẤM TIỆT tiếng hoạt hình/meme rẻ tiền (Laser, Boing, Pop bong bóng thô sơ, Chuông keng keng nhà máy, còi xe giật mình, kính vỡ). Vi phạm = lỗi nghiêm trọng, trừ điểm Cổng G5.
13. **[D] Font chữ tiếng Việt:** Phụ đề và nhãn dùng `Be Vietnam Pro`; chữ hook dùng font display giống mẫu nhất hoặc theo `references/text-fx/06`. Mọi font phải qua `textfx-kit/scripts/vn_font_gate.py` và kiểm dấu ở khung nghỉ.
14. **[D] Cắt dựng chuẩn Editor Pro:** Cắt khoảng lặng thừa, ậm ừ, vấp/lặp, tiếng ho; giữ quãng ngừng có nghĩa hoặc nhấn ý [N4]; người dẫn phải nói hết câu mới chuyển cảnh (`≥ 0.1s` sau từ cuối).
15. **[D] Bảo vệ hệ thống:** Không tự ý xóa/ghi đè file gốc của Dũng, không sửa `plugins\cache`. Vòng tự học chỉ ghi vào thư viện học (`HDRE_Library/training`). HD Studio mặc định tắt từ 03/11/2026 trừ khi Dũng yêu cầu bật.
16. **[D] Không che mặt:** Chữ, MG, overlay không che mặt người dẫn; chữ được núp sau người nhưng không che mặt. Kiểm bằng `face_zones` trên khung thật.
17. **[D] MG/animation đúng lúc:** Chỉ hiện đúng câu thoại nói tới nó.
18. **[D] Mọi khối nằm trên timeline:** Mỗi chữ, MG, hiệu ứng, SFX là một clip riêng trên timeline, tween có giây cụ thể (mẫu `templates/khoi-timeline.html`).
19. **[D] Hai ngưỡng điểm tách biệt (Dũng chốt 03/11/2026):** Video giao cho Dũng đạt `≥ 98/100`. Template `TV-xx` vẫn phải đạt đúng `100/100` (`R-L033`), chưa 100 thì không dùng.
