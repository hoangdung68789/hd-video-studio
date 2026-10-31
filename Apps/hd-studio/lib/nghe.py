# Chuyển tệp ghi âm thành chữ ngay trên máy, không gửi âm thanh đi đâu.
# Chạy: python nghe.py <tệp wav> [gợi ý từ vựng]
import os
import sys

# Thư viện CUDA đi kèm torch (nếu có), giúp Whisper chạy được trên GPU.
try:
    import importlib.util
    spec = importlib.util.find_spec("torch")
    if spec and spec.origin:
        lib = os.path.join(os.path.dirname(spec.origin), "lib")
        if os.path.isdir(lib):
            os.add_dll_directory(lib)
except Exception:
    pass

from faster_whisper import WhisperModel


def run(model, path, hint):
    segments, _ = model.transcribe(path, language="vi", vad_filter=True, initial_prompt=hint)
    return " ".join(s.text.strip() for s in segments).strip()


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    path = sys.argv[1]
    hint = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
    try:
        import ctranslate2
        if ctranslate2.get_cuda_device_count() > 0:
            print(run(WhisperModel("large-v3-turbo", device="cuda", compute_type="float16"), path, hint))
            return
    except Exception:
        pass  # GPU không chạy được thì dùng CPU
    # Không có GPU: ưu tiên mẫu chính xác hơn nếu máy đã có, chưa có thì dùng mẫu nhỏ.
    try:
        model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", local_files_only=True)
    except Exception:
        model = WhisperModel("small", device="cpu", compute_type="int8")
    print(run(model, path, hint))


main()
