# Template: luôn hỏi, không tự áp
Dũng chốt 01/11/2026, thay mọi quy tắc tự áp hoặc tự bỏ qua template trước đó.

## Hỏi ở bước 1
- Lệnh chưa có `tpl:` hoặc `mau:` → **luôn hỏi** Dũng dùng template nào; Dũng tự chọn (03/11/2026). Luôn gửi liên kết thư mục chứa template liên quan (`HDRE AI/asset/phong_cach/template/<TV-xx>-<ten>/`; chưa có mã phù hợp thì gửi thư mục `template/`) và gợi ý. Lựa chọn gồm: 2–3 mã khớp thể loại trong `asset/phong_cach/template/INDEX.md` (trạng thái Dùng được/Chuẩn, kèm link video mẫu đã học), mã đã chọn trong Studio nếu có `chon_cho_video_tiep.json`, bộ dựng `HDRE AI\Dong_goi\hd-video-studio\Videos\_TEMPLATE_BDS_Review_2phut` nếu là review BĐS, và "Không dùng template".
- Câu này gom cùng các câu hỏi khác của lần chạy. Trong lúc chờ vẫn làm tiếp phần không phụ thuộc template (đo footage, chép lời).
- Không có người trực để trả lời → không dùng template, ghi 1 dòng trong báo cáo. Không có "mặc định template được duyệt nhiều nhất".

## Dũng trả lời
- **Không dùng (Chế độ A):** AI tự phân loại thể loại, tự chọn công cụ, tự lập bố cục theo lời và nhịp nhạc (`references/presets.md`, `routing.md`). 3D do AI quyết theo nội dung.
- **Chọn mã hoặc có `tpl:` (Chế độ T — Dạng 1 `TV-xx` Giống mẫu 100%):** áp đúng mã đó qua `antigravity_build_from_template` (hoặc theo `template.json` đã đạt `100/100` theo `R-L033`). Mã không có trong INDEX → hỏi 1 câu kèm 2–3 mã gần nhất, không tự thay. Đồng thời hỏi Dũng chọn 1 trong 3 phương án màu (`color_choice=1` giữ màu gốc · `2` dùng `sample_look.cube` của mẫu · `3` chọn LUT trong `bang_lut.json`, phải truyền kèm đường dẫn file `.cube`).
- **Chọn Mẫu VFX/Effects Text + Icon động cài sẵn tùy chỉnh (Dạng 2 `TX-01..TX-08` hoặc `TX-<TV>-xx`, `R-L037`):** tra `HDRE AI/asset/phong_cach/bo_chu/INDEX.md` và `icons/INDEX.md` (`IC-01..IC-24`). Dũng có thể tùy chỉnh tự do 9 thông số (nội dung chữ, icon động `IC-xx` + vị trí `left|right|top|inline|none`, font chữ, màu `:root`, cỡ chữ + tọa độ X/Y, kiểu Mở đầu Entrance, lớp VFX đi kèm, kiểu Kết thúc Exit, SFX Pre-Roll/Peak/Tail) qua MCP Tool `antigravity_customize_text_vfx_template`.
- **Có `mau:`:** lập template của video mẫu bằng `hoang-dung-auto-style-learner` (`antigravity_learn_video` + `antigravity_reconstruct_and_score_template_100` đạt `100/100`) rồi dựng theo nó.
- **Chọn bộ dựng review BĐS:** `new_project.ps1 -Name …`, chỉ sửa `project.py`, đọc README + LOI_CAN_TRANH. `MASTER_LUT` để `None` trừ khi Dũng đã chọn LUT theo `references/chon-lut.md`.

## Khi áp template
- Áp nguyên khối (với Dạng 1 `TV-xx`): bố cục cảnh, chuyển cảnh, hiệu ứng, MG/animation + icon động `IC-xx`, chữ + SFX, nhịp dựng, nhịp nhạc, cơ chế giữ chân trên một dòng thời gian. Không lấy lẻ từ nhiều template `TV-xx`. (Riêng Dạng 2 `TX-xx` được phép gắn lẻ vào từng mốc từ khóa hoặc thay thế kiểu chữ theo ý Dũng).
- Mọi thành phần thuộc 7 nhóm "Hiệu ứng video" (`CH`, `CC`, `CM`, `MG/AN`, `VFX/LP`, `MA`, `SF`) phải tuân thủ đủ 3 pha **Mở đầu (Entrance) → Duy trì (Hold) → Kết thúc (Exit)**, SFX Pre-Roll sớm `2–4 frame` khớp đỉnh sóng tại `0f`, và gọi đúng `ten_pho_bien` (`R-L034`, `R-L035`, `R-L036`).
- Mọi agent đọc cùng `template.json`; `template.map` ghi đoạn template ↔ take của Dũng. Thời lượng khác mẫu → co giãn theo đoạn, giữ mật độ sự kiện/giây và vị trí trên phách. Chi tiết: `hoang-dung-auto-style-learner/references/template-video.md` mục 4 & mục 6.
- Mẫu thắng luật dựng chung (Dũng chốt 03/11/2026): AI không tự làm khác mẫu khi chưa có lệnh. Chỉ thay footage, nội dung chữ và lời bằng của Dũng; kêu gọi theo dõi chỉ khi Dũng nói. Mẫu làm khác luật chung (SFX phụ đề, camera giả, che mặt, nền hộp…) → lúc dựng hỏi Dũng từng trường hợp.
