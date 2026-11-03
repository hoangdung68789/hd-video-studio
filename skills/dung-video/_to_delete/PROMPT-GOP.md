# Prompt gộp — dung-text-fx + SFX theo ý nghĩa + 19 repo cho dung-video
(Viết bằng /prompt-master ngày 2026-10-23. Đích: Claude Code trên Windows của Dũng. Dán nguyên khối dưới đây.)

```
<context>
## Mang theo (đã chốt, không đổi)
- Dũng dựng video BĐS dọc (TikTok/Reels) bằng skill router `dung-video` (~\.claude\skills\dung-video\, lệnh /video, 8 giai đoạn, cổng G1–G7). Chỉ sửa skill cục bộ trong ~\.claude\skills\ (bản trên tài khoản là bản đồng bộ chỉ đọc). Dự án: <HD_VIDEO_HOME>. Luôn trả lời Dũng bằng tiếng Việt.
- Luật chữ: chỉ lời thoại thật + thông tin Dũng đưa (giá, địa chỉ, diện tích, kết cấu, hotline); nhãn bản đồ là ngoại lệ duy nhất. Không khung/nền tối sau chữ, không lặp chữ, mọi chữ có SFX, chữ hero chạm đúng từ nói ±2 khung, vùng an toàn TikTok (~230px trên, ~480px dưới, ~160px phải), zoom/Ken Burns phải mượt, cấm rung footage/lắc khung hình, BGM bắt buộc, D-Log dùng LUT DJI trước, không preview, bản cuối H.264 60fps, sau render chỉ trả "Thư mục chứa kết quả: <đường dẫn>".
- Font: dùng font giống mẫu nhất, KHÔNG kiểm giấy phép (Dũng tự chịu). Chỉ loại font khi lỗi tiếng Việt → báo Dũng theo mẫu cảnh báo và chờ.
- Thư viện SFX: ~\Downloads\SOUNDEFFECT TAKING HEARD (863 file). Danh mục THẬT ở <HD_VIDEO_HOME>\sfx-catalog\ (catalog.json, roles.json, PLAYBOOK.md) — memory ghi sai đường dẫn Downloads\whisper-20250625\sfx-catalog. sfxlib.py ở các dự án Videos\<tên>\scripts\.
- Máy có: Python 3.12 (numpy, scipy, PIL, librosa, soundfile, fontTools; KHÔNG có opencv, skimage, brotli), ffmpeg/ffprobe 9.0.2, hyperframes 0.8.171, node 24, GSAP 3.14.2 cục bộ.
- Đã làm: khung dung-text-fx\ (scripts/vn_font_gate.py, measure.py, colorlab.py [ΔE2000 khớp chuẩn Sharma], score.py, build_recipe.py; recipes/r01; fonts/files 10 font + proof/). 9 font đạt Cổng tiếng Việt 134/134; VNF Chops thiếu "²"; font cố ý thiếu dấu bị cổng bắt đúng.

## Chẩn đoán SFX nhàm (đã đo)
1. Luật đa dạng + canh SFX (Bước 4.7, 4.8) nằm trong hoang-dung-bds-video-master, mà dung-video luật cứng 1 cấm gọi → luồng /video mất luật này.
2. audio-gate chỉ kiểm "có SFX", không kiểm đúng nghĩa/đúng cảm xúc/đa dạng loại.
3. roles.json: 23 vai theo kiểu hình (text_pop, slide_in…), ≤4 file/vai, không có nhãn cảm xúc hay nghĩa.
4. Kho lệch: whoosh 236 + glitch 111 (40%), riser 7, trailer 5, magic 3; thiếu tiếng đời sống (cửa, bước chân, nước, chim, xe).
5. File ít lặp (36/41 và 33/33 file khác nhau ở 2 dự án gần nhất) → cái "lặp" là lặp LOẠI âm (whoosh–pop ở mọi chỗ), không phải lặp file.
</context>

<task>
Hoàn tất trong một lượt, theo thứ tự:
A. Skill `dung-text-fx` (chữ hiệu ứng + SFX đi kèm chữ): SKILL.md ngắn + references 01–07 + scripts + recipes + fonts/MANIFEST.json + library/ theo đặc tả gốc (học mẫu Bước 0–10, chấm 100 điểm 6 mục, Cổng tiếng Việt, 5 vòng kiểm chứng mỗi FX, lưu memory chung text-fx-learned-library.md chỉ khi đạt 100).
B. Hệ SFX theo ý nghĩa (MỚI) trong dung-text-fx:
   1. references/08-sfx.md: phân loại 3 trục cho mọi SFX — Vai (chức năng trong khung), Cảm xúc (năng lượng × sắc thái), Nghĩa (vật/việc người dẫn đang mô tả). Bảng "ý định lời thoại → loại SFX được phép → loại cấm". Quy tắc editor chuyên nghiệp: âm là dấu câu, dự báo (riser kết thúc đúng điểm chạm), khoảng lặng trước cú nhấn, lớp (dẫn + thân + đuôi, tối đa 2 lớp nghe rõ), bảng màu âm 2–3 họ mỗi video, Foley đúng nghĩa khi người dẫn tả hành động, nốt tăng dần cho danh sách, pan theo hướng hình, SFX dưới giọng 8–12 dB, mỗi file ≤2 lần/video, không hai file giống liền nhau, mật độ ≤2 SFX/giây và âm rõ ≈1 lần/3–4 giây. Nguồn quy tắc nào không xác minh được thì ghi [chưa xác minh]; không bịa "video viral nào dùng".
   2. scripts/sfx_tag.py → library/sfx-tags.json: gán nhãn 3 trục cho cả 863 file từ catalog (nhóm, tên file, shape, bright, độ dài, đỉnh). Ghi nhóm còn thiếu.
   3. scripts/sfx_plan.py: transcript từng từ + bảng mốc chữ → nhận ý định từng mốc (từ khóa tiếng Việt + vị trí trong video + bậc T0–T3) → chọn SFX theo 3 trục, xoay vòng chống lặp, canh đỉnh/onset/điểm kết theo khung chữ chạm → sfx_plan.json + bảng md có lý do chọn.
   4. scripts/sfx_audit.py: chấm kế hoạch + bản render 100 điểm (đồng bộ, đúng nghĩa/cảm xúc, đa dạng, mật độ, độ to dưới giọng, phủ đủ chữ, khoảng thở) → sfx-scorecard.json. Ngưỡng cố định, không nới.
C. PHẦN B: dung-video\references\repos.md (19 repo, chỉ ghi điều xác minh được), thêm bảng "Thư viện hỗ trợ MG" vào routing.md, 2 dòng 3D/Lottie vào engines.md, 1 dòng trỏ repos.md trong SKILL.md. Repo/skill chưa có: ghi lệnh cài từ tài liệu chính thức, KHÔNG cài.
D. 5 vòng kiểm chứng xuất bản (A + B + C), ghi bằng chứng vào dung-text-fx\library\verification-log.md. Vòng 4 bắt buộc có thử lỗi cố ý cho SFX: lệch 3 khung, sai loại so với nghĩa, lặp file, quá mật độ → audit phải trừ đúng mục.
E. Gửi Dũng xem TRƯỚC: bản preview 720p trên clip BĐS thật (giọng + BGM + chữ + SFX theo kế hoạch) + bảng SFX theo mốc + scorecard. CHỈ nối vào dung-video sau khi Dũng duyệt.
F. Nối vào dung-video (sau khi Dũng duyệt): sao lưu SKILL.md, presets.md, audio-gate.md (<tên>.bak-<ngày>); giai đoạn 4–5 trỏ dung-text-fx; audio-gate thêm cổng "SFX đúng nghĩa + đa dạng" trỏ 08-sfx.md và sfx_audit.py; presets.md đổi luật font sang 06-font-chu.md; thêm dòng "Dũng gửi mẫu chữ/SFX → /text-fx hoc"; giữ nguyên luật cứng, G1–G7, luồng 8 giai đoạn.
</task>

<constraints>
- Chỉ tạo/sửa trong ~\.claude\skills\dung-text-fx\ và các file dung-video đã liệt kê; memory chỉ text-fx-learned-library.md + 1 dòng MEMORY.md khi một FX đạt 100. Không sửa skill khác, plugins\cache, sfx-catalog gốc.
- DỪNG và hỏi trước khi: cài package, clone repo, tải file/font, xóa file, ghi đè skill đã cài, gọi API tốn credit, render bản cuối, gửi/đăng.
- Không tuyên bố "100 điểm" khi chưa có scorecard do script sinh. Không nới ngưỡng. Mọi tuyên bố "đã kiểm" trích đầu ra công cụ vừa chạy.
- Không nghe được âm thanh trực tiếp → nói rõ đã kiểm bằng số đo và xin Dũng nghe duyệt bằng tai nghe.
- Một bước lỗi 2 lần liên tiếp → dừng, báo lỗi cụ thể. Subagent chỉ dùng cho vòng 5.
- Sau mỗi bước báo: ✅ [đã làm gì].
</constraints>

<output_format>
Tiếng Việt: (1) cây thư mục dung-text-fx + file sửa trong dung-video; (2) bảng 19 repo; (3) hồ sơ font + Cổng tiếng Việt; (4) bảng SFX 3 trục + chẩn đoán nghẽn; (5) bảng 5 vòng kiểm chứng + đường dẫn bằng chứng; (6) FX đã học; (7) font lỗi tiếng Việt; (8) điểm [chưa xác minh]; (9) việc Dũng cần quyết.
</output_format>
```

🎯 Target: Claude Code (Opus 5.5) — gộp 3 yêu cầu thành một đặc tả có chẩn đoán đã đo, thứ tự làm, điểm dừng hỏi và tiêu chí chấm, để không mất luật SFX ở luồng /video.
