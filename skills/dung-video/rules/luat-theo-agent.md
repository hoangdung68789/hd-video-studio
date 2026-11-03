# Luật theo từng Phòng ban Sub-Agent (Chuẩn Công ty Sản xuất Nội dung MXH — Cập nhật 03/11/2026)

Dán phần của Sub-Agent đó vào brief (bản tiếng Anh: `resources/brief-agent-en.md`), kèm Luật cứng video.
- **Nguyên tắc cốt lõi:** Mỗi Sub-Agent đảm nhận **MỘT nhiệm vụ chuyên biệt**, làm **đồng thời (Parallel)**, **tự sửa lỗi ngay tại chỗ (In-line Fix)**, và **kiểm tra chéo đầu vào của Sub-Agent liên đới (Peer Cross-Check)** — thấy lỗi của Sub-Agent trước phải **yêu cầu sửa ngay** trước khi nhận việc của mình.
- **Kỷ luật:** Không tự bịa, không tự đoán. Làm hỏng việc **trên 2 lần (`> 2 lần lỗi`)** → Bị Agent Tổng **loại bỏ ngay lập tức (`TERMINATED`)**.

## 1. Tổ Chép lời & Cắt dựng (`dung-chep-loi`, `dung-cat-dung` + Sub-Agents phân đoạn)
- **Đồng thời & Sửa ngay:** Chép lời có `word_id` + timecode từng từ; cắt khoảng lặng thừa, ậm ừ, vấp/lặp ngay trên từng phân đoạn (`segment_id`), giữ quãng ngừng có nghĩa và đảm bảo người dẫn nói hết câu mới chuyển cảnh (`≥ 0.1s`).
- **Kiểm tra chéo:** Tổ Cắt dựng kiểm tra ngay bản transcript của Tổ Chép lời trước khi cắt; nếu thấy từ vựng BĐS/con số nghe sai hoặc cắt phạm chữ → yêu cầu sửa ngay tại chỗ.
- **Nộp:** `master-timeline` (`words.json` + danh sách cắt `timecode + lý do`). Không dùng camera giả (zoom/punch-in/rung) trừ khi Dũng duyệt.

## 2. Tổ Bảo mật Địa chỉ (`dung-che-dia-chi` + Sub-Agents quét khung)
- **Đồng thời & Sửa ngay:** Chạy song song ngay trên các clip được chọn; quét mỗi `0.5s` + điểm cắt, phát hiện số nhà/tên hẻm/giấy tờ → tạo vùng `boxblur` bám chuyển động (tracking) ngay tức khắc.
- **Kiểm tra chéo:** Kiểm tra danh sách clip từ Tổ Cắt dựng; nếu cảnh nào lộ địa chỉ ở mép cắt chuyển cảnh → yêu cầu hoặc tự khóa vùng che phủ kín hết frame cắt đó ngay lập tức.
- **Nộp:** Bảng vùng che + ảnh trước/sau (0 khung lộ).

## 3. Tổ Màu (`dung-mau` + Sub-Agents đo màu)
- **Đồng thời & Sửa ngay:** Đo tín hiệu bằng `color_engine.py probe` song song ngay ở đầu dự án để gộp câu hỏi 3 lựa chọn màu cho Dũng (giữ màu gốc / theo mẫu / gợi ý tối đa 3 LUT có sẵn).
- **Chuẩn 6 tầng bắt buộc:** Khi áp màu/LUT hoặc sửa cảnh lỗi, bắt buộc dùng `color_engine.py build-filter` theo chuỗi 6 tầng (Pre-LUT -> At-LUT tetrahedral mix 40-65% -> Post-LUT roll-off & limiter). CẤM dùng `eq=brightness` hoặc contrast thô bạo. Tự audit Cổng G3 đạt điểm `≥ 90/100` và clipping `< 0.3%`.
- **Kiểm tra chéo:** Kiểm tra độ đồng nhất ánh sáng/màu giữa các cảnh liền kề do Tổ Cắt dựng ghép; nếu cảnh kế bị chênh sáng/ám màu gắt hoặc bệch da nhân vật → cân chỉnh ngay tại chỗ.
- **Nộp:** Bảng số đo màu từng clip + ảnh đối chiếu Before/After + recipe filter an toàn (da tự nhiên, nhà đúng thực tế).

## 4. Tổ Đồ họa — Chữ Hook, Phụ đề, MG & Bản đồ (`dung-chu-mg` + Sub-Agents theo cụm hiệu ứng)
- **Kiểm tra chéo đầu vào (Upstream Gate):** Trước khi đặt chữ/MG, kiểm tra ngay `words.json` và điểm cắt của Tổ Cắt dựng. Nếu thấy câu thoại bị cắt cụt chữ hoặc timecode lệch → **yêu cầu Tổ Chép lời/Cắt dựng sửa ngay lập tức** trước khi lên chữ.
- **Đồng thời & Sửa ngay:**
  - Nộp bảng `chữ ↔ nguồn` (dòng không nguồn → xóa ngay).
  - Phụ đề (T0) và nhãn (T1): phẳng, `Be Vietnam Pro`, trắng + viền đen 3–4px, **TUYỆT ĐỐI KHÔNG hiệu ứng, KHÔNG SFX**.
  - Chữ hook (T2–T3): neo theo `word_id`, đủ **3 pha chuẩn Editor Pro** (`Entrance Ease-Out 0.18–0.45s` → `Hold ≥ 1.5s` → `Exit Ease-In/Cut-out 0.15–0.30s`), gọi đúng **tên hiệu ứng phổ biến**, tối đa 2 họ hiệu ứng & 2 font, qua cổng `vn_font_gate.py`, đo tương phản trên khung thật và sửa ngay nếu khó đọc hoặc che mặt.
  - **Quy tắc chặn Spam SFX từ nguồn:** Tổ Đồ họa CHỈ xuất mốc sự kiện vào `moments.json` cho Chữ Hook Hero (T2–T3) mang tính bước ngoặt nhận thức (Cognitive Anchor) hoặc chuyển cảnh lớn. TUYỆT ĐỐI KHÔNG gán mốc cho icon nhỏ, nhãn định vị hay chuyển động vụn vặt; khoảng cách giữa 2 mốc phải đảm bảo `≥ 2.5s` (Quy tắc khoảng thở âm thanh `references/sfx-sound-design-chuyen-sau.md`).
  - Bản đồ MG: dữ liệu OSM thật, pin lệch 80–150m, ghi `© OpenStreetMap`.

## 5. Tổ Âm thanh — Giọng, BGM & SFX (`dung-am-thanh` + Sub-Agents Sound Design)
- **Đọc cẩm nang chuyên sâu bắt buộc:** `references/sfx-sound-design-chuyen-sau.md` (chuẩn Sound Design đa tầng & tâm lý học âm thanh).
- **Kiểm tra chéo đầu vào & Lọc rác (Upstream Gate):** Kiểm tra ngay bảng mốc chữ hook (`moments.json`) từ Tổ Đồ họa. 
  - Nếu thấy mốc chữ hook thiếu pha mở đầu, hoặc mật độ dày `< 2.5s` (vi phạm khoảng thở âm thanh), hoặc lọt phụ đề/nhãn/tiểu tiết vào `moments.json` → **yêu cầu Tổ Đồ họa sửa ngay hoặc chủ động lược bỏ mốc thừa**.
  - CẤM TIỆT các âm thanh hoạt hình/meme rẻ tiền (Laser, Boing, Pop bong bóng thô, Chuông keng keng nhà máy, còi xe, tiếng thét la, kính vỡ).
- **Thực thi Hệ sinh thái Âm thanh Đa tầng & Sửa ngay tại chỗ:**
  - Xử lý giọng rõ sạch (`≈ -14 LUFS`), đặt nhạc nền bắt tai từ giây đầu, ducking mượt (`-18…-22 LUFS`), không át giọng, `true peak ≤ -1 dBTP`.
  - Phối hợp 5 nhóm: `Ambience` (-24dB..-32dB làm keo dán), `Foley` (-18dB..-24dB tạo xúc giác thực tế), `Transitions` (J-Cut Lead-in `-3f..-5f` vào sớm `0.08–0.15s`), `Impacts` (tối đa 2–3 cú Sub-drop lớn toàn video cho mốc then chốt), `Textures` (Drone trầm/Nhịp tim dẫn dắt tâm lý).
  - **Dải tần bảo mật Giọng nói (Mid-Range Cleansing):** Bắt buộc EQ Cut dải `800Hz – 3.5kHz` trên track SFX để không đè nát giọng người dẫn.
  - **Khoảng lặng đắt giá (Negative Space):** Tại mốc cao trào/plot twist (45–55s), bắt buộc cắt sạch âm thanh (Dead Silence `0.3s–0.6s`) trước khi bung Sub-drop giải tỏa cảm xúc.
  - Chạy `sfx_audit` và `ebur128` ngay khi trộn; lệch mốc nào sửa ngay mốc đó tại chỗ.

## 6. Agent Tổng (Chief Orchestrator / Giám đốc Sản xuất) & Tổ Kiểm nhanh/Render (`dung-qa`, `dung-render`)
- **Điều phối Nhân sự Động (Tối đa 50 Sub-Agents, Không tạo dư):** Tính toán khối lượng dự án để tạo **vừa đủ số lượng Sub-Agents cần thiết** (`1..50`), phân chia nhiệm vụ riêng chạy đồng thời.
- **Kiểm tra Nhanh Tổng thể (`≥ 98/100`) & Vá lỗi Cục bộ:**
  - Kiểm tra nhanh tổng thể toàn bộ video (số đo thật + contact sheet nhanh, có tiếng & tắt tiếng).
  - **Đạt tối thiểu từ `98/100` trở lên (`≥ 98/100`)** (và 0 lỗi cấm) → Xuất **1 bản cuối duy nhất** (9:16 H.265 60fps) và **bàn giao ngay cho Dũng kèm giải trình chi tiết rõ ràng**.
  - **Dưới `98/100` hoặc có đoạn lỗi:** Chỉ khoanh vùng và yêu cầu Sub-Agent phụ trách **sửa ngay đúng đoạn/khung lỗi đó** để khớp toàn bộ video, không làm lại từ đầu.
- **Đánh giá & Sàng lọc Sub-Agents sau mỗi dự án:** Đánh giá giữ lại (`RETAINED`) các Sub-Agents hoàn thành tốt; **loại bỏ ngay (`TERMINATED`)** các Sub-Agents làm hỏng việc **trên 2 lần (`> 2 lần lỗi`)**.
