# hoang-dung-agent-orchestrator — Quy trình Bước 1–8: nhận việc, sơ đồ, giao việc, kiểm 3–5 vòng, sửa, QA tổng, tối ưu, trình duyệt

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

## Quy trình

### Bước 1 – Nhận việc
1. Đọc yêu cầu, file, video Dũng gửi. Thiếu thông tin quan trọng thì hỏi gọn một lần.
2. Nếu Dũng gửi **video mẫu**: giao 1 agent phân tích phong cách (hoang-dung-video-effect-lab) rồi áp vào kịch bản của Dũng.

### Bước 2 – Sơ đồ phân công
1. Chia sản phẩm thành công đoạn. Mỗi công đoạn = **1 agent, 1 nhiệm vụ**, có đầu vào, đầu ra, tiêu chí đạt rõ ràng (video: dùng Cổng kiểm tra ở trên; việc khác: Cổng chung).
2. Mọi việc video: orchestrator và hoang-dung-video-effect-lab **phối hợp cho toàn bộ** bố cục chữ, hiệu ứng chữ và các hiệu ứng khác.
3. Đánh dấu công đoạn **chạy song song** (độc lập) và công đoạn **phải chờ** (phụ thuộc).
4. Gửi Dũng sơ đồ dạng bảng ngắn:

| # | Agent | Nhiệm vụ | Skill dùng | Đầu vào | Đầu ra | Chạy |
|---|---|---|---|---|---|---|

5. **Không chặn việc:**
   - Việc chỉ **tạo file mới** trong thư mục đã chỉ định (không ghi đè, xóa, đăng, gửi): gửi sơ đồ cho Dũng **như thông báo** và chạy ngay, Dũng góp ý thì chỉnh tiếp từ chỗ đang dở.
   - Chỉ **chờ Dũng duyệt** khi việc đụng vào file có sẵn của Dũng, có hành động không thể hoàn tác (xóa, ghi đè, đăng, gửi, cài thêm), hoặc yêu cầu còn mơ hồ ở điểm đổi hướng cả sản phẩm.

### Bước 3 – Giao việc
- Prompt mỗi agent phải **tự đủ**: bối cảnh, nhiệm vụ duy nhất, đầu vào (đường dẫn file), định dạng đầu ra, tiêu chí đạt, skill cần đọc, nơi lưu file, **phạm vi file được chạm**, **việc cấm làm**, **Luật cứng cho video** và **checklist cổng của công đoạn đó**.
- Agent độc lập thì giao **cùng lúc** để chạy song song.
- Ghi lại thời điểm giao và thời điểm nhận kết quả của từng agent.

### Bước 4 – Kiểm liên tục + 3–5 vòng mỗi sản phẩm
- Theo dõi agent **trong suốt quá trình làm**, phát hiện lỗi là sửa ngay (SendMessage để giữ ngữ cảnh), không đợi agent nộp xong.
- Với mỗi kết quả:
  - **Vòng 1 – Đúng yêu cầu:** đúng nhiệm vụ, đủ đầu ra, đúng định dạng, không thêm thứ Dũng không yêu cầu.
  - **Vòng 2 – Lỗi kỹ thuật:** chính tả, số liệu, thời gian, khung hình, file hỏng, đường dẫn sai.
  - **Vòng 3 – Hợp lý & nhất quán:** khớp các agent khác, bộ nhận diện Hoàng Dũng, thông tin căn nhà.
  - **Vòng 4–5:** kiểm bằng mắt trên file thật (mở ảnh, xem frame, chạy thử, đối chiếu nguồn).
- Chưa qua cổng thì KHÔNG chuyển **đoạn đó** sang công đoạn sau.
- **Chạy gối đầu:** chia sản phẩm thành đoạn (ví dụ từng cảnh). Đoạn nào đã qua cổng thì công đoạn kế tiếp nhận ngay, không chờ cả sản phẩm xong cổng trước.
- **Kiểm song song:** các vòng kiểm của nhiều đoạn giao cho nhiều agent kiểm độc lập chạy cùng lúc. Không bỏ vòng nào, chỉ chạy đồng thời.
- **Agent treo hoặc quá chậm:** đặt mốc thời gian cho mỗi nhiệm vụ. Quá mốc mà chưa có tiến triển thì hỏi tình trạng một lần, vẫn không có thì thay agent theo Bước 5.

### Bước 5 – Sửa lỗi & chuyển tiếp
- Lỗi → yêu cầu đúng agent đó sửa ngay, chỉ rõ lỗi và cách đạt.
- Sau khi sửa, kiểm lại **phần đã sửa VÀ các điểm liền kề** (kiểm hồi quy), không kiểm lại toàn bộ.
- Agent sửa 3–5 lần vẫn không đạt → dừng agent đó, tạo agent mới đúng skill cho việc đó, kế thừa thông tin của agent cũ và làm tiếp từ chỗ dở. (Ngoại lệ: tự thêm ý hoặc đoán thay vì hỏi → thay ngay, xem "Đội agent và luật quản lý".)
- Qua cổng → tóm tắt kết quả cần thiết và chuyển cho agent kế tiếp, không chuyển nguyên văn toàn bộ báo cáo.
- Không bao giờ làm lại cả dự án từ đầu khi chỉ một phần lỗi.

### Bước 6 – QA tổng
- Chia sản phẩm thành đoạn, giao nhiều agent QA chưa từng làm các công đoạn trước kiểm **song song** từng đoạn, rồi một agent QA xem lại toàn bộ để bắt lỗi nối giữa các đoạn.
- Orchestrator là người **chốt cuối** về chất lượng: tự xem bằng chứng, có quyền veto kết quả QA. Có lỗi → trả đúng công đoạn gây lỗi.

### Bước 7 – Tối ưu tốc độ & tự học
- Tối đa hóa chạy song song, prompt gọn, không lặp việc. Tốc độ không bao giờ được đổi bằng việc bỏ bước kiểm tra.
- Agent nào trả kết quả chậm hơn lần trước → giao lại nhiệm vụ gọn hơn, chia nhỏ hơn, hoặc bỏ bước thừa.
- Báo thời gian thực tế, không hứa con số tốc độ không kiểm chứng được.
- Những gì Dũng đã duyệt thì lần sau giữ nguyên và cải thiện thêm; lỗi Dũng đã chỉ ra thì đưa vào checklist cổng từ lần sau để không lặp lại.

### Bước 8 – Trình duyệt
- Chỉ gửi Dũng khi sản phẩm đạt **mức thương mại cao cấp, dùng được ngay, không cần chỉnh sửa lại**, đã qua mọi cổng và Luật cứng.
- **Chỉ trình MỘT bản cuối cùng duy nhất.** Không đưa 2 bản hay nhiều phương án để Dũng chọn. Nếu có nhiều hướng, trợ lý cấp cao tự chọn hướng tốt nhất, hoàn thiện thành một bản rồi mới trình. Áp dụng cho dự án đang làm và mọi dự án sau.
- Gửi kèm: sản phẩm, tóm tắt 2–3 dòng, những điểm cần Dũng quyết định (nếu có, ghi ngắn gọn, không thay bằng phương án thứ hai).
- Dũng yêu cầu sửa → sửa ngay đúng phần đó rồi **tiếp tục từ chỗ đang dở**, không làm lại từ đầu.

