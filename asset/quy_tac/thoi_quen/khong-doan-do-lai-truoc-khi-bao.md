---
name: khong-doan-do-lai-truoc-khi-bao
description: "Cập nhật 03/11/2026: Điều phối theo mô hình Công ty Sản xuất Nội dung MXH (tối đa 50 Sub-Agents vừa đủ, chạy đồng thời, kiểm chéo & sửa ngay tại chỗ, kiểm nhanh tổng thể ≥98/100 bàn giao ngay, loại bỏ Sub-Agent hỏng việc >2 lần)"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-11-03T12:25:00.000Z
---

> **Cập nhật 03/11/2026 (Dũng chốt — thắng mọi quy tắc điều phối cũ):**
> 1. **Làm đồng thời & Sửa ngay tại chỗ (In-line Fix):** Tất cả tác vụ chạy đồng thời. AI không tự bịa, không tự đoán, làm đúng chuẩn quy trình Editor chuyên nghiệp; phát hiện lỗi ở đâu là sửa ngay lập tức trong lúc làm, cấm đợi làm xong mới rà soát lỗi rồi mới sửa.
> 2. **Kiểm tra chéo giữa các Sub-Agents (Peer Cross-Check):** Các Sub-Agents được giao nhiệm vụ riêng có quyền kiểm tra lỗi của nhau và **yêu cầu sửa ngay trước khi đảm nhiệm công việc của chính Sub-Agent đó**.
> 3. **Kiểm tra nhanh tổng thể `≥ 98/100` & Vá cục bộ (Surgical Patch):** Agent Tổng kiểm tra nhanh tổng thể video và bàn giao ngay cho Dũng nếu đạt **tối thiểu từ `98/100` trở lên (`≥ 98/100`)**, nói rõ chi tiết cho Dũng. Nếu có lỗi, **chỉ sửa ngay đúng đoạn có lỗi** để khớp toàn bộ video mà không tốn thời gian làm lại từ đầu.
> 4. **Quản trị tới 50 Sub-Agents & Kỷ luật loại bỏ (`> 2 lần lỗi`):** Agent Tổng có thể tạo **tối đa 50 Sub-Agents** nếu cần thiết nhưng chỉ tạo **đủ số lượng cần cho dự án đó (không tạo dư)**. Sau mỗi dự án đánh giá giữ lại (`RETAINED`) Sub-Agents làm tốt vào `agent-roster.json`; Sub-Agent làm hỏng việc **trên 2 lần (`> 2 lần lỗi`)** bị **loại bỏ ngay (`TERMINATED`)**.

**Công cụ chuẩn đã kiểm chứng:**
- Rung/zoom: `ffmpeg` + phase correlation bằng numpy; `hyperframes snapshot --at` lấy PNG chưa nén.
- Lời: `faster-whisper large-v3` trong `HDRE AI\venv` + `voice_cleaner_pro.py` + `srt_helper.py`.
- Màu: Luôn hỏi Dũng 3 lựa chọn (giữ gốc / theo mẫu / ≤3 LUT từ kho `Downloads\freshluts-LUT-phan-loai_DAY-DU.zip`).
- Che địa chỉ: `boxblur` tracking bám chuyển động; bản đồ: `fetch_map.py` (OSM). SFX: `sfx_plan.py` + kho 863 file `Downloads\SOUNDEFFECT TAKING HEARD`.
- Âm lượng: `sfx_mix.py` + đo `ebur128` thật.
