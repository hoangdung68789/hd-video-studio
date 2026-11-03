# Thời điểm sử dụng chữ hook

Giá trị bên dưới là **mặc định đề xuất** (60fps). Dũng chấm lại thì ghi đè bằng vòng tự học của `hoang-dung-auto-style-learner`.
Áp dụng cho chữ hook (T2–T3). Phụ đề và nhãn không hiệu ứng, không SFX; chỉ cần đúng chữ, đúng lúc, đọc được.

## 1. Đồng bộ với lời nói (quan trọng nhất)
- Lấy mốc từ **transcript có timecode từng từ** (giai đoạn 2). Không canh bằng mắt.
- Chữ "chạm" (đạt trạng thái đọc được) đúng khung hình bắt đầu từ khóa được nói, sai số ≤ 2 khung (≈ 33ms).
- Hiệu ứng vào bắt đầu **trước** từ nói một khoảng bằng thời lượng vào (ví dụ vào 0.3s → bắt đầu 0.3s trước từ khóa), để đỉnh trùng từ.
- SFX của chữ hook: đỉnh biên độ trùng khung chữ chạm. Whoosh/riser đi **trước** đỉnh, hit **ngay** đỉnh.
- Chữ T2 "sáng lên" theo từ: envelope tăng nhanh → giữ trong lúc từ được nói → giảm về mức nghỉ nhẹ (kiểu `asr-keyword-glow`).

## 2. Thời lượng một lần hiện chữ hook
| Thành phần | Mặc định |
|---|---|
| Vào (T2) | 0.25–0.40s |
| Vào (T3) | 0.35–0.60s (có thể gồm build nhiều nhịp) |
| Giữ đọc | ≥ 0.6s + 0.3s/từ (tiếng Việt ngắn gọn); số giá/diện tích giữ ≥ 1.4s ở trạng thái nghỉ |
| Ra | 0.15–0.30s, nhanh hơn vào; có thể ra bằng cách mờ/trượt nhẹ |
| Khoảng thở giữa hai chữ hook | ≥ 0.4s |
| Nhãn (T1) và phụ đề (T0) | hiện thẳng hoặc fade ≤ 0.15s; giữ đủ đọc theo cùng công thức |

Easing: vào dùng ease-out/spring; ra dùng ease-in. Không dùng linear cho chuyển động nhìn thấy, trừ envelope điều khiển hiệu ứng ngầm.

## 3. Mật độ trong video
- T3: tối đa 3–4 lần, cách nhau ≥ 8s, phân bố: hook (0–5s) → giá/diện tích (giữa) → CTA (cuối, nếu người dẫn nói).
- T2: 3–6 lần. T1 (nhãn): 4–8 lần, không tính vào mật độ hiệu ứng/SFX.
- Chữ hook (T2 + T3): không quá ~1 mốc / 4–6 giây. Giữa các mốc phải có "khoảng thở" 2–3s không có chữ hook.
- Hook (0–5s): bắt buộc có đúng 1 chữ T3 (L1), trừ khi Dũng chỉ định khác.
- Phần cuối: pháp lý (L7) và CTA (L9) — không dồn T3 liền nhau.

## 4. Thời điểm KHÔNG đặt chữ hook
- Lúc người dẫn đang nhấn từ quan trọng mà chữ lại là câu khác → gây lệch. Chữ phải nói cùng nội dung đang nghe.
- Ngay khi cắt cảnh: chờ 3–6 khung sau điểm cắt rồi mới vào, hoặc vào đúng điểm cắt có chủ ý (match cut), đừng vào lưng chừng.
- Trong 0.3s đầu và cuối video.
- Khi chữ đè lên vật thể quan trọng của khung (cửa chính, phòng khách, mặt người).

## 5. Nhịp theo nhạc nền
- Nếu nhạc có beat rõ: ưu tiên canh T3 vào beat gần nhất (≤ 1/4 beat lệch) **miễn là không lệch từ nói quá 2 khung**. Từ nói luôn thắng beat.
- Đổi cường độ nhạc (hook → thân → cao trào → CTA) trùng với mốc đổi bậc chữ.
