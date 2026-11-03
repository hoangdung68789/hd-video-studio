# Pha 0 (Giai đoạn 0, 1, 1b) — Khởi động, Brief, Cấp phát Sub-Agents & Chọn Phong cách

Đọc khi bắt đầu `/video`. Phụ trách: **Agent Tổng (`hoang-dung-agent-orchestrator`)**.

## 0. Khởi động & Cấp phát Đội ngũ Nhân sự Động (Tối đa 50 Sub-Agents — Không Tạo Dư)
1. Đọc sổ tự học `HDRE_Library/training/rules.md` (mục video) và sổ nhân sự `agent-roster.json` (nếu đã có, ưu tiên gọi lại các Sub-Agents đạt `RETAINED` từ dự án trước).
2. Tạo thư mục dự án `<footage>_dung-video\` và `edit-state.json` (mẫu bên dưới).
3. **Tính toán khối lượng & Lập sơ đồ phân công Sub-Agents chạy ĐỒNG THỜI:**
   - Agent Tổng được tạo **tối đa 50 nhân viên Sub-Agents** nếu dự án lớn cần thiết, nhưng bắt buộc tính toán để tạo **đúng và đủ số lượng Sub-Agents cần thiết cho dự án đó (tuyệt đối không tạo dư số lượng)**.
   - Mỗi Sub-Agent nhận **1 nhiệm vụ chuyên biệt riêng** và có quyền **kiểm tra chéo lỗi của Sub-Agent liên đới (Peer Cross-Check)** để yêu cầu sửa ngay trước khi nhận bàn giao.
   - Bảng phân công ghi vào `edit-state.json`: `| Sub-Agent ID | Nhiệm vụ riêng | Đầu vào kiểm chéo → Đầu ra | Chạy đồng thời | Số lần lỗi (≤2) |`.
4. **Studio:** Lưu ý HD Studio mặc định **TẮT** từ 03/11/2026 (chỉ bật khi Dũng yêu cầu rõ hoặc gõ `/dung-studio`). Với dự án thường, dùng HyperFrames Studio / Remotion Studio hoặc kiểm trực tiếp bằng snapshot khung thật.

## 1. Brief & Khung xương `master-timeline` (Chạy trong 30s đầu để mở luồng đồng thời)
- `ffprobe` & `signalstats`: đo nhanh độ phân giải, fps, D-Log hay đã có màu.
- Phân loại tư liệu: lời nói (A-roll) / B-roll / ngoại thất / từng phòng / chi tiết / flycam / ảnh listing / giọng đọc / nhạc [N5].
- Tạo ngay khung xương timecode (`words.json` có `word_id` + chia các phân đoạn `segment_id`) để **toàn bộ Sub-Agents (Cắt dựng, Màu, Che địa chỉ, Chữ/MG, Âm thanh/SFX) bắt đầu làm việc ĐỒNG THỜI ngay lập tức**.
- Chọn preset (`references/presets.md`) và engine (`references/engines.md`). Có video mẫu → `hoang-dung-viral-style-scout` Chế độ B.

## 1b. Chọn Phong cách & Màu (Gộp hỏi 1 lần duy nhất)
Chi tiết đầy đủ: `templates/che-do-va-template.md`, `references/chon-phong-cach.md`. Tóm tắt:
- **Template luôn hỏi:** lệnh chưa có `tpl:`/`mau:` → hỏi Dũng dùng template nào, gửi liên kết thư mục template và gợi ý mã trạng thái Dùng được/Chuẩn (đạt `100/100`). Không có người trả lời → không dùng template, ghi 1 dòng trong báo cáo.
- Có mẫu hoặc `tpl:` → dùng luôn, khớp chuẩn 8 thành phần. Có `style:` → xác nhận 1 dòng kèm link.
- Chưa có → hỏi MỘT câu gọn (2–3 style có link mẫu đã kiểm + "Theo sở thích của Dũng"). Không trả lời → dựng theo sở thích đã lưu.
- Mẫu có zoom/punch-in/rung → ghi "cần hỏi Dũng" (luật 9).
- **Màu/LUT:** Luôn hỏi 3 lựa chọn (giữ màu gốc / theo video mẫu / tài nguyên có sẵn + gợi ý tối đa 3 LUT), gộp chung vào câu hỏi đầu dự án — `workflow/03-mau.md`.

## Cấu trúc `edit-state.json` (Tích hợp Quản trị Sub-Agents & Kiểm chéo)
```json
{
  "footage": "",
  "preset": "",
  "style": {"name": "", "source": "dung_chon|so_thich|video_mau", "ref_videos": []},
  "engine": "hyperframes",
  "template": {"id": "", "path": "", "map": []},
  "segments": [{"segment_id": "S1", "tu": 0, "den": 0, "segment_lock": false}],
  "stages": {},
  "agent_roster": {
    "allocated_count": 0,
    "max_allowed": 50,
    "agents": {}
  },
  "peer_checks": [],
  "holistic_score": {"total": 0, "threshold": 98, "details": {}},
  "missing": [],
  "skipped_refs": [],
  "asks": [],
  "lufs": {},
  "final": ""
}
```
Xong mỗi mốc hoặc phân đoạn, Sub-Agent cập nhật ngay vào `edit-state.json`. Cổng: G0 (`rules/cong-chat-luong.md`).
