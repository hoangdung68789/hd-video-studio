# Nghe âm thanh, công cụ, thư viện

### Nghe âm thanh
AI không tự nghe được → dùng số đo: `ebur128`, và MCP `antigravity-video-bridge` (`antigravity_listen_video_sfx` nghe SFX/nhịp nhạc, `antigravity_create_srt` chép lời faster-whisper + từ vựng BĐS, `antigravity_clean_voice_stumbles` dò vấp). File đưa vào phải có luồng âm thanh (`ffprobe -select_streams a`). Chép lời dự phòng: WhisperX của skill `watch` (`setup.py --install-whisperx`). MCP lỗi → báo đúng lỗi, không đoán.

Chi tiết công cụ/dự phòng: `references/routing.md`; repo công nghệ: `references/repos.md`. Thư viện SFX: `~\Downloads\SOUNDEFFECT TAKING HEARD` (danh mục đã đo `assets/textfx-kit/library/sfx-tags.json`); font đã qua cổng `assets/textfx-kit/fonts/files/`; GSAP cục bộ `assets/textfx-kit/vendor/gsap.min.js`.
