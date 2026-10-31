"""Trộn giọng + SFX + nhạc nền: nhạc ĐỀU một mức, chỉ hạ nhẹ ở mốc quan trọng rồi lên lại → bgm_ducked.wav + mix.wav.

Dùng:
  python sfx_mix.py --plan sfx_plan.json --voice voice.wav --sfx sfx.wav --bgm nhac.mp3 --duration 56.33 --out <thư mục> [--bgm-lufs -19]

Luật (references/08-sfx.md, mục Độ to):
  - Nhạc lặp cho đủ thời lượng (BGM bắt buộc toàn video), chuẩn về --bgm-lufs (mặc định −19 LUFS), fade vào 0.8s / ra 1.5s.
  - Nhạc GIỮ ĐỀU (Dũng 2026-10-23: không lớn nhỏ liên tục, không né theo từng tiếng nói).
  - Chỉ hạ nhẹ ở mốc có SFX (tối thiểu T3 −5, T2 −4, T1 −3 dB; hạ thêm vừa đủ để SFX nổi 8 dB, sâu nhất −6 dB):
    xuống trong 0.25s (chạm đáy 0.05s trước khung chạm), giữ tới +0.6s, lên lại trong 0.8s (đường cong cosin).
    Hai lần hạ cách nhau < 2s → giữ luôn, không nhấp nhô.
  - mix = giọng + SFX + nhạc đã né, alimiter 0.84 (true peak ≈ −1.5 dBTP). In số đo ebur128 của từng stem + mix.
"""
import argparse, json, os, subprocess, sys
import numpy as np

SR = 48000
HOP = int(SR * 0.01)  # khung gain 10 ms
DIP = {"T3": -5.0, "T2": -4.0, "T1": -3.0}  # mức hạ tối thiểu ở mốc có SFX (dB)
DIP_MAX = -6.0  # hạ nhẹ: không bao giờ sâu hơn 6 dB (Dũng: nhạc đều, chỉ giảm nhẹ)


def rms_db(x, win):
    """RMS (dB) theo khung HOP, cửa sổ win mẫu, trên tín hiệu mono."""
    c = np.concatenate([[0.0], np.cumsum(x.astype(np.float64) ** 2)])
    ctr = np.arange(len(x) // HOP) * HOP + HOP // 2
    lo, hi = np.clip(ctr - win // 2, 0, len(x)), np.clip(ctr + win // 2, 0, len(x))
    return 10 * np.log10((c[hi] - c[lo]) / np.maximum(1, hi - lo) + 1e-12)


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    import soundfile as sf
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True)
    ap.add_argument("--voice", required=True)
    ap.add_argument("--sfx", required=True)
    ap.add_argument("--bgm", required=True)
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--bgm-lufs", type=float, default=-19)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    lev = os.path.join(a.out, "bgm_lev.wav")
    d = a.duration
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-stream_loop", "-1", "-i", a.bgm, "-t", f"{d:.3f}", "-af",
                    f"loudnorm=I={a.bgm_lufs}:TP=-3:LRA=11,afade=t=in:d=0.8,afade=t=out:st={max(0, d - 1.5):.3f}:d=1.5",
                    "-ar", str(SR), "-ac", "2", lev], check=True)
    v, sv = sf.read(a.voice, always_2d=True)
    s, ss = sf.read(a.sfx, always_2d=True)
    b, sb = sf.read(lev, always_2d=True)
    if not sv == ss == sb == SR:
        sys.exit(f"cần 48 kHz (giọng {sv}, sfx {ss}, nhạc {sb})")
    n = int(d * SR)
    fit = lambda x: np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]
    v, s, b = fit(v), fit(s), fit(b)
    if v.shape[1] == 1:
        v = np.repeat(v, 2, axis=1)
    plan = json.load(open(a.plan, encoding="utf-8"))
    rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x.mean(1) ** 2)) + 1e-12)
    dips = []
    for m in plan["moments"]:
        if "events" not in m or m.get("tier_am") not in DIP:
            continue
        w0, w1 = int((m["t"] - 0.05) * SR), int((m["t"] + 0.15) * SR)
        need = (rms(s[w0:w1]) - 8) - rms(b[w0:w1])  # hạ vừa đủ để SFX nổi 8 dB, nhưng chỉ trong mức "nhẹ"
        dips.append((m["t"] - 0.05, m["t"] + 0.6, float(np.clip(min(DIP[m["tier_am"]], need), DIP_MAX, 0))))
    dips.sort()
    merged = []
    for a0, a1, dd in dips:
        if merged and a0 - merged[-1][1] < 2.0:
            merged[-1] = (merged[-1][0], max(merged[-1][1], a1), min(merged[-1][2], dd))
        else:
            merged.append((a0, a1, dd))
    tt = np.arange(n // HOP) * HOP / SR
    g = np.zeros_like(tt)
    ease = lambda u: 0.5 - 0.5 * np.cos(np.pi * np.clip(u, 0, 1))
    for a0, a1, dd in merged:
        w = np.where(tt < a0, ease((tt - (a0 - 0.25)) / 0.25), np.where(tt <= a1, 1.0, 1 - ease((tt - a1) / 0.8)))
        g = np.minimum(g, dd * w)
    gs = np.interp(np.arange(n), tt * SR, 10 ** (g / 20)).astype(np.float32)
    json.dump({"dips": merged, "bgm_lufs": a.bgm_lufs}, open(os.path.join(a.out, "bgm_dips.json"), "w"), indent=1)
    bduck = (b * gs[:, None]).astype(np.float32)
    duck = os.path.join(a.out, "bgm_ducked.wav")
    sf.write(duck, bduck, SR, subtype="PCM_24")
    raw = os.path.join(a.out, "mix_raw.wav")
    sf.write(raw, (v + s + bduck).astype(np.float32), SR, subtype="FLOAT")
    mix = os.path.join(a.out, "mix.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "alimiter=limit=0.84:level=false", "-ar", str(SR), mix], check=True)
    os.remove(raw)
    for f in (a.voice, duck, a.sfx, mix):
        r = subprocess.run(["ffmpeg", "-nostats", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
        lines = [x.strip() for x in r.stderr.splitlines() if x.strip().startswith(("I:", "Peak:"))]
        print(f"{os.path.basename(f)}: " + " · ".join(lines[-2:]))
    print(f"✅ {len(merged)} lần hạ nhạc, sâu nhất {g.min():.1f} dB → {duck} · {mix}")


if __name__ == "__main__":
    main()
