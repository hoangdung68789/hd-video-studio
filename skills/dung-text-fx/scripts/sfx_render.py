"""Trộn kế hoạch SFX thành một stem âm thanh (48 kHz stereo), canh đỉnh/onset đúng giây trong sfx_plan.json.

Dùng: python sfx_render.py <sfx_plan.json> --out sfx.wav --duration 56.33
Âm lượng: đỉnh MẪU THẬT của đoạn dùng chuẩn về −12 dBFS rồi nhân "vol" (sfxlib.py cũ chuẩn theo peak_db của catalog — sai tới ~12 dB). Cao độ "pitch" (nửa cung) bằng asetrate,
giữ độ dài bằng atempo. Đuôi dài cắt theo "dur" (hoặc onset+active) và fade-out 0.12s.
Giải mã TỪNG file bằng một lệnh ffmpeg riêng rồi cộng bằng numpy (một lệnh ffmpeg nhiều nguồn mp3/aac/wav từng bị treo
ở dự án DU-AN-MAU). Ghi kèm <out>.placed.json: giây bắt đầu thật của từng lớp (để sfx_audit đối chiếu).
"""
import argparse, json, os, subprocess, sys
import numpy as np

SFX_ROOT = "~/Downloads/SOUNDEFFECT TAKING HEARD"
SR = 48000


def decode(path, mstart, length, pitch_ratio, vol):
    """Giải mã đoạn cần dùng, chuẩn hoá ĐỈNH MẪU THẬT về −12 dBFS rồi nhân vol.
    (peak_db trong catalog.json là đỉnh đường bao, lệch đỉnh mẫu thật tới ~12 dB → không dùng để chuẩn hoá.)"""
    af = "aformat=sample_rates=48000:channel_layouts=stereo"
    if pitch_ratio != 1:
        af += f",asetrate={SR * pitch_ratio:.1f},aresample={SR},atempo={1 / pitch_ratio:.5f}"
    out_len = length  # asetrate × atempo(1/r) giữ nguyên độ dài và vị trí đỉnh
    af += f",afade=t=out:st={max(0, out_len - 0.12):.3f}:d=0.12"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{mstart:.4f}", "-t", f"{length:.4f}", "-i", path, "-af", af,
                          "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True, timeout=60).stdout
    y = np.frombuffer(raw, np.float32).reshape(-1, 2)
    pk = float(np.abs(y).max()) if y.size else 0.0
    return (y * (vol * 10 ** (-12 / 20) / pk)).astype(np.float32) if pk > 1e-6 else y


def voice_rms_db(v, t):
    """RMS giọng (chỉ mẫu có tiếng > −40 dBFS) trong ±1s quanh t; None nếu không có giọng."""
    if v is None:
        return None
    seg = v[max(0, int((t - 1) * SR)): int((t + 1) * SR)]
    seg = seg[np.abs(seg) > 10 ** (-40 / 20)]
    return None if seg.size < SR * 0.1 else 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)


def render(events, tags, duration, out, voice=None):
    """voice: mảng mono 48 kHz giọng trên timeline → âm dẫn đặt rel_voice_db dưới giọng (đo RMS cửa sổ −0.05…+0.15s quanh mốc)."""
    import soundfile as sf
    buf = np.zeros((int(duration * SR) + SR, 2), np.float32)
    placed, layers = [], []
    for i, e in enumerate(events):
        m = tags[e["path"]]
        r = 2 ** (e.get("pitch", 0) / 12)
        lead = m["peak_t"] if e["align"] == "peak" else m["onset"]
        start, mstart = e["t"] - lead, 0.0
        if start < 0:
            mstart, start = -start, 0.0
        length = e.get("dur") or min(m["dur"], max(0.25, m["onset"] + (m.get("active") or m["dur"])))
        length = min(length, m["dur"] - mstart)
        y = decode(os.path.join(SFX_ROOT, e["path"]), mstart, length, r, e["vol"])
        if y.size:
            b = int(SR * 0.005)
            env = np.abs(y).max(axis=1)
            env = np.array([env[i:i + b].max() for i in range(0, len(env) - b + 1, b)] or [0.0])
            if env.max() > 0:
                if e["align"] == "peak":
                    # cùng cửa sổ với sfx_audit: ±0.25s quanh đỉnh danh nghĩa, đỉnh đầu tiên trong 1 dB
                    c = int((m["peak_t"] - mstart) / 0.005)
                    for _ in range(3):  # lặp tới điểm cố định: cửa sổ ±0.25s đặt quanh chính điểm neo tìm được
                        lo, hi = max(0, c - 50), min(len(env), c + 51)
                        w = env[lo:hi] if hi > lo else env
                        k = (lo if hi > lo else 0) + int(np.argmax(w >= w.max() * 0.891))
                        if k == c:
                            break
                        c = k
                else:
                    k = int(np.argmax(env >= env.max() * 10 ** (-30 / 20)))
                start = max(0.0, e["t"] - k * b / SR)  # điểm neo đo trên mẫu thật rơi đúng e["t"]
        if e["layer"] == "du_bao" and y.size:
            # riser: điểm kết = khung chạm → cắt ngay sau điểm neo đo được, fade 30 ms
            keep = int((e["t"] + 0.06 - start) * SR)
            if 0 < keep < len(y):
                f = min(keep, int(0.03 * SR))
                y = y[:keep].copy()
                y[-f:] *= np.linspace(1, 0, f, dtype=np.float32)[:, None]
        layers.append((e, int(round(start * SR)), y))
        placed.append({"i": i, "moment": e["moment"], "layer": e["layer"], "path": e["path"], "start": round(start, 4),
                       "anchor_measured": True,
                       "anchor_t": e["t"], "align": e["align"], "len": round(len(y) / SR, 4), "pitch": e.get("pitch", 0)})
    # lớp phụ (đuôi, foley, dự báo) có đỉnh thấp hơn âm dẫn ≥ 9 dB — cộng lại vẫn không cướp điểm chạm
    leads = {e["moment"]: float(np.abs(y).max()) for e, _, y in layers if e["layer"] == "dan" and y.size}
    for k, (e, a0, y) in enumerate(layers):
        lp = leads.get(e["moment"])
        if e["layer"] != "dan" and lp and y.size and float(np.abs(y).max()) > lp * 0.35:
            layers[k] = (e, a0, (y * (lp * 0.35 / float(np.abs(y).max()))).astype(np.float32))
    # cả CỤM lớp của một mốc đặt rel_voice_db (của âm dẫn) dưới giọng, đo RMS cửa sổ −0.05…+0.15s quanh âm dẫn
    if voice is not None:
        for mid in dict.fromkeys(e["moment"] for e, _, _ in layers):
            grp = [(e, a0, y) for e, a0, y in layers if e["moment"] == mid]
            lead = next((e for e, _, _ in grp if e["layer"] == "dan"), None)
            vdb = voice_rms_db(voice, lead["t"]) if lead else None
            if vdb is None:
                continue
            w0, w1 = int((lead["t"] - 0.05) * SR), int((lead["t"] + 0.15) * SR)
            tmp = np.zeros((w1 - w0, 2), np.float32)
            for e, a0, y in grp:
                lo, hi = max(w0, a0), min(w1, a0 + len(y))
                if hi > lo:
                    tmp[lo - w0:hi - w0] += y[lo - a0:hi - a0]
            cur = 20 * np.log10(np.sqrt(np.mean(tmp.mean(axis=1) ** 2)) + 1e-12)
            g = 10 ** ((vdb + lead["rel_voice_db"] - cur) / 20)
            pk = max(float(np.abs(y).max()) for _, _, y in grp)
            g = min(g, 10 ** (-3.2 / 20) / (pk + 1e-9))  # trần đỉnh −3 dBFS (chừa 0.2 dB khi các mốc chồng nhau)
            for k, (e, a0, y) in enumerate(layers):
                if e["moment"] == mid:
                    layers[k] = (e, a0, (y * g).astype(np.float32))
    for (e, a0, y), p in zip(layers, placed):
        p["peak"] = round(float(np.abs(y).max()) if y.size else 0.0, 6)  # đỉnh lớp sau gain (audit đo cú chạm thứ hai)
    for e, a0, y in layers:
        a1 = min(len(buf), a0 + len(y))
        buf[a0:a1] += y[:a1 - a0]
    buf = buf[:int(duration * SR)]
    sf.write(out, buf, SR, subtype="PCM_24")
    json.dump(placed, open(out + ".placed.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return placed, float(np.abs(buf).max())


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("--out", required=True)
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--voice", help="wav giọng trên timeline (để đặt SFX dưới giọng đúng số dB)")
    a = ap.parse_args()
    plan = json.load(open(a.plan, encoding="utf-8"))
    tags = {f["path"]: f for f in json.load(open(plan["tags"], encoding="utf-8"))["files"]}
    voice = None
    if a.voice:
        import soundfile as sf
        v, vsr = sf.read(a.voice, always_2d=True)
        if vsr != SR:
            sys.exit(f"giọng phải 48 kHz (đang {vsr})")
        voice = v.mean(axis=1)  # trung bình kênh — cùng cách đo với sfx_audit (ffmpeg -ac 1 cao hơn ~2.8 dB)
    placed, peak = render(plan["events"], tags, a.duration, a.out, voice)
    print(f"✅ {len(placed)} lớp SFX → {a.out} (đỉnh {20 * np.log10(peak + 1e-12):.1f} dBFS)")


if __name__ == "__main__":
    main()
