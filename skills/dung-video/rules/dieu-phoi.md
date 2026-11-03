# Quy trình Điều phối Công ty Sản xuất Nội dung MXH Chuyên nghiệp (`/dung-video`)
Cập nhật ngày **03/11/2026** (Thắng mọi quy tắc điều phối cũ): Vận hành theo mô hình **Social Media Post-Production Studio / Agency** — Chạy đồng thời 100%, Kiểm tra chéo & Sửa lỗi ngay tại chỗ, Kiểm nhanh tổng thể đạt `≥ 98/100` bàn giao ngay, Quản trị đội ngũ tới **50 Sub-Agents** (tạo vừa đủ, giữ nhân sự tốt, loại bỏ nhân sự hỏng việc `> 2 lần`).

---

## 1. Mô hình Tổ chức & Cấp phát Nhân sự Động (Dynamic Agency Roster — Tối đa 50 Sub-Agents)
Agent Tổng (`hoang-dung-agent-orchestrator`) đóng vai trò **Tổng Giám đốc Sản xuất (Executive Producer / Post-Production Director)**:
- **Quyền khởi tạo tối đa 50 Sub-Agents:** Khi dự án có nhiều phân cảnh, nhiều lớp đồ họa/VFX/bản đồ/SFX phức tạp, Agent Tổng được phép tạo tối đa **50 nhân viên Sub-Agents** và chủ động phân chia nhiệm vụ riêng biệt (1 Sub-Agent = 1 tác vụ hoặc 1 phân đoạn độc lập).
- **Nguyên tắc Vừa Đủ — Không Tạo Dư (Right-Sizing Rule):**
  - Trước mỗi dự án, Agent Tổng phân tích khối lượng thực tế (thời lượng, số cảnh, số mốc chữ/MG, độ phức tạp) để tạo **đúng và đủ số lượng Sub-Agents cần thiết**:
    - **Dự án Nhỏ (`S` — sửa 1 chỗ / clip ngắn đơn giản ≤15s):** 1–3 Sub-Agents (hoặc Agent Tổng sửa thẳng cục bộ + đo lại ngay).
    - **Dự án Vừa (`M` — vài cảnh / chỉnh sửa đa lớp):** 4–8 Sub-Agents chuyên trách chạy song song.
    - **Dự án Chuẩn (`L` — video đầy đủ 30–90s):** 6–15 Sub-Agents chia theo tổ chuyên môn và phân đoạn.
    - **Dự án Lớn / Đa Phân Cảnh Phức Tạp (`XL` — nhiều cảnh, template trọn bộ 8 thành phần, nhiều MG/VFX):** Mở rộng linh hoạt từ **15 đến tối đa 50 Sub-Agents** (chia nhỏ theo từng Shot/Segment `S1..Sn`, từng cụm `Text-FX/MG`, từng lớp `Audio/Blur/Color`).
  - **CẤM tạo dư Sub-Agents** không có việc thực tế hoặc trùng lặp nhiệm vụ gây lãng phí tài nguyên và thời gian điều phối.

## 2. Luồng Sản xuất Đồng thời & Sửa lỗi Ngay tại chỗ (Concurrent Zero-Defect Pipeline)
Khắc phục triệt để lỗi "làm xong mới rà soát rồi mới sửa":
1. **Pha 0 — Khung xương Timecode & Phân việc Đồng thời (Chạy ngay đầu dự án):**
   - Đo nhanh footage (`ffprobe`, `signalstats`), tạo `master-timeline` (chép lời có `word_id` + timecode từng từ và chia các phân đoạn `segment_id`) lưu vào `edit-state.json`.
   - Kiểm tra sổ nhân sự `agent-roster.json` để ưu tiên điều động các Sub-Agents đã có lịch sử hoàn thành tốt (`RETAINED`), và phân giao toàn bộ tác vụ chạy **ĐỒNG THỜI**.
2. **Pha 1 — Thực thi Đồng thời 100% & Tự sửa Ngay tại chỗ (In-line Fix):**
   - Tất cả các Tổ Sub-Agents (**Chép lời/Cắt dựng**, **Bảo mật Địa chỉ**, **Màu/LUT**, **Đồ họa Chữ/MG/Bản đồ**, **Âm thanh Giọng/BGM/SFX**) chạy **cùng một lúc** dựa trên neo `word_id` và `segment_id` trong `edit-state.json`.
   - **Luật Sửa Ngay (Fix-on-the-Spot):** Sub-Agent dựng xong mốc chữ nào, đoạn cắt nào, hoặc lớp âm thanh nào phải chạy kiểm tra tức thì trên chính mốc đó và **sửa ngay lập tức trong lúc làm**. Tuyệt đối không đẩy sản phẩm còn lỗi sang bước sau hoặc chờ cuối video mới rà.
3. **Giao thức Kiểm tra Chéo Ngang hàng (Peer-to-Peer Cross-Check & Upstream Gate):**
   - Các Sub-Agents **được quyền và bắt buộc kiểm tra lỗi của nhau** ở các điểm giao cắt dữ liệu trước khi bắt đầu công việc của chính mình:
     - *Tổ Cắt dựng* kiểm tra đầu ra của *Tổ Chép lời* (từ nghe sai, mốc lặng sai) → yêu cầu sửa ngay.
     - *Tổ Đồ họa (Chữ/MG)* kiểm tra đầu ra của *Tổ Cắt dựng & Chép lời* (cắt phạm chữ, thiếu nguồn lời thoại) → yêu cầu sửa ngay trước khi render chữ.
     - *Tổ Âm thanh (SFX/BGM)* kiểm tra đầu ra của *Tổ Đồ họa* (`moments.json` lệch khung, lọt phụ đề T0/T1 vào SFX, thiếu 3 pha) → yêu cầu sửa ngay trước khi mix.
     - *Tổ Render/QA* kiểm tra đầu ra của *Tổ Bảo mật & Màu* (còn khung lộ số nhà, chênh màu) → yêu cầu vá ngay khung đó trước khi xuất.
   - Khi nhận **Yêu cầu Sửa Chéo (Peer Fix Request)**, Sub-Agent gây lỗi phải **sửa ngay đoạn lỗi đó lập tức**.

## 3. Kiểm tra Nhanh Tổng thể bởi Agent Tổng (`≥ 98/100`) & Vá Cục bộ (Surgical Patch)
- **Kiểm tra nhanh tổng thể (Quick Holistic Executive Audit):**
  - Ngay khi các luồng đồng thời khớp vào timeline, Agent Tổng thực hiện **1 lượt kiểm tra nhanh tổng thể** bằng bảng số đo thật (`ffprobe`, `ebur128`, `sfx_audit`, `vn_font_gate`) + contact sheet nhanh toàn video (bỏ cơ chế rà 3 vòng lặp đi lặp lại làm chậm tiến độ).
- **Ngưỡng bàn giao `≥ 98/100`:**
  - Nếu tổng điểm chất lượng video đạt **tối thiểu từ `98/100` trở lên (`≥ 98/100`)** (đồng thời thỏa mãn 100% điều kiện cứng: 0 lộ địa chỉ, 0 chữ tự bịa, có nhạc nền, 1 file H.265 9:16): **Bàn giao ngay bản cuối duy nhất cho Dũng**.
  - **Báo cáo chi tiết rõ ràng:** Nêu rõ cho Dũng tổng điểm (`XX/100`), bảng chi tiết từng hạng mục (Cắt dựng, Chữ/MG, Âm thanh/SFX, Màu, Bảo mật), giải trình rõ nếu có 1–2 điểm trừ nhỏ ở đâu, và gửi đường dẫn bản cuối dùng ngay.
- **Chỉ sửa ngay đoạn có lỗi (Surgical Patch):**
  - Nếu phát hiện lỗi hoặc điểm `< 98/100`: Agent Tổng khoanh vùng chính xác `segment_id` / `timecode` bị lỗi, giao Sub-Agent phụ trách **chỉ sửa ngay đúng đoạn có lỗi đó** và ghép khớp lại vào toàn bộ video. **CẤM làm lại hoặc render lại từ đầu những đoạn đã đạt.**

## 4. Đánh giá Nhân sự Sub-Agents & Luật Loại bỏ (`> 2 lần hỏng việc`)
- **Luật Loại bỏ Tức thời (`> 2 lần lỗi` = Sa thải):**
  - Trong quá trình làm việc, bất kỳ Sub-Agent nào **làm hỏng việc trên 2 lần** (sửa quá 2 lần vẫn lỗi, hoặc tái phạm lỗi quy tắc cứng/tự bịa/tự đoán quá 2 lần) → Agent Tổng **loại bỏ ngay lập tức (`TERMINATED`)**, thu hồi nhiệm vụ và giao cho Sub-Agent mới kế thừa trạng thái làm tiếp từ đúng chỗ dở.
- **Đánh giá Nhân sự Sau Mỗi Dự án (`agent-roster.json`):**
  - Kết thúc mỗi dự án, Agent Tổng bắt buộc lập **Bảng Đánh giá Nhân sự Sub-Agents** (lưu vào `<dự_án>/agent-roster.json` và đồng bộ về `<HD_VIDEO_HOME>\agent-roster.json`):
    - **Sub-Agents hoàn thành tốt (`0–2 lần lỗi`, đúng chuẩn Editor Pro, phối hợp kiểm chéo tốt):** Đánh giá **`GIỮ LẠI (RETAINED)`** để tái sử dụng làm nòng cốt cho dự án tiếp theo.
    - **Sub-Agents làm hỏng việc `> 2 lần`:** Đánh giá **`LOẠI BỎ (TERMINATED)`**, ghi rõ nguyên nhân hỏng việc để Sub-Agent thay thế không lặp lại.

## 5. Luật Không Đoán, Không Tự Bịa (Chuẩn Editor Chuyên nghiệp)
- Mọi quyết định dựng phải dựa trên **lời thoại thật, thông tin Dũng cung cấp, số đo thật và chuẩn SOP Editor chuyên nghiệp** (3 pha hiệu ứng `Entrance → Hold → Exit`, tên hiệu ứng phổ biến quốc tế + tiếng Việt).
- Không chắc thông tin gốc → hỏi gọn Dũng 1 lần ở đầu dự án (tối đa 3 câu có lựa chọn). Không tự ý xóa/ghi đè file gốc của Dũng.
