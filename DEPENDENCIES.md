# Thành phần cần cài thêm

## Công cụ
Node.js 20+, FFmpeg/FFprobe, Git, Python 3, `hyperframes@0.8.171` (trình cài tự cài).

## Skill bên ngoài mà bộ này gọi tới (có thì dùng, không có thì skill tự bỏ qua và ghi vào `skipped_refs`)
- HyperFrames: hyperframes, hyperframes-animation, hyperframes-audio, hyperframes-keyframes, hyperframes-registry, media-use, motion-graphics, embedded-captions, talking-head-recut.
- Remotion: remotion-best-practices, remotion-captions, remotion-maps, remotion-markup, remotion-to-hyperframes, remotion-upgrade.
- GSAP: gsap-core, gsap-timeline, gsap-utils, gsap-performance.
- Khác: video-use, hyperframes-creative.

## Tư liệu tự chuẩn bị
- SFX, font, LUT, video mẫu: đặt trong thư mục `TaiNguyen` hoặc chỉ đường dẫn ở Công cụ → Thư mục tài nguyên.
- Danh mục CapCut: `asset\capcut`.
- Thiếu các mục này thì Studio vẫn chạy, chỉ trống phần tương ứng.

## WhisperX tùy chọn
Cài từ repo gốc [m-bain/whisperX](https://github.com/m-bain/whisperX), cần Python 3.10–3.13 và Git:

```powershell
python -m pip install "git+https://github.com/m-bain/whisperX.git" "torchaudio~=2.8.0"
```

Phải ghim `torchaudio~=2.8.0` cho cùng đời với `torch` 2.8, nếu không lệnh `whisperx` báo WinError 127 trên Windows. Không cài thì mọi phần khác vẫn chạy. Bản sao mã nguồn nằm ở `vendor/whisperX`.

## MCP tùy chọn
`antigravity-video-bridge`: nghe SFX, chép lời, dò vấp. Không có thì dùng số đo `ebur128` và WhisperX của skill `watch`.
