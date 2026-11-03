"""Engine Chỉnh Màu & Kiểm Định Kỹ Thuật Video Chuyên Nghiệp (dung-mau / color_engine).
Thiết kế riêng cho hệ thống FFmpeg/Python theo chuẩn Hậu kỳ Điện ảnh & Social Media Studio.
Quy chuẩn: dung-video/references/color-pipeline.md (ngưỡng trong code phải khớp tài liệu đó).

Nguyên tắc:
  1. Làm việc trong RGB 16-bit (gbrp16le), xuất Rec.709 dải TV (16-235).
  2. Bắt buộc thứ tự 6 tầng: Pre-LUT (Sáng/S-Curve/Cân bằng) -> At-LUT (Tetrahedral + Mix 40-65%) -> Post-LUT (Roll-off + Limiter).
  3. Tuyệt đối không dùng phép cộng tuyến tính (eq=brightness) hay contrast thô bạo.
  4. Không tham số nào = không đổi màu. Vượt khung an toàn thì bị kẹp lại và báo trong `guardrail_warnings`.

Lệnh:
  python color_engine.py probe <clip> [--ss <giây>] [--json <out.json>]
  python color_engine.py build-filter [--lut <file.cube>] [--lut-mix 0.55] [--technical-lut] [--lift 0.0] [--gamma 1.0] [--gain 1.0] [--contrast 1.0] [--wb-temp 0.0] [--wb-tint 0.0] [--sat 1.0] [--input-range tv|pc] [--json <out.json>]
  python color_engine.py preview <clip> --ss <giây> (--filter "<ffmpeg_filter>" | --recipe <out.json>) --out <preview.png>
  python color_engine.py audit <clip_hoặc_frame> [--ss <giây>] [--samples 12] [--reference <clip_gốc>] [--json <out.json>]
"""

import argparse
from collections import Counter
import json
import math
import os
import re
import subprocess
import sys

# Khởi tạo UTF-8 trên Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Khung an toàn: color-pipeline.md mục III
LIMITS = {
    "lift": (-0.06, 0.06),
    "gamma": (0.88, 1.12),
    "gain": (0.92, 1.08),
    "contrast": (0.90, 1.12),
    "wb_temp": (-0.06, 0.06),
    "wb_tint": (-0.06, 0.06),
    "sat": (0.90, 1.20),
    "lut_mix": (0.40, 0.65),
}
CLIP_PCT_MAX = 0.3      # % điểm ảnh Y<5 hoặc Y>248 trên khung xấu nhất
AUDIT_WIDTH = 320       # thu nhỏ bằng neighbor nên giữ nguyên giá trị điểm ảnh
SKIN_LINE_DEG = 123.0   # đường Skin Tone trên Vectorscope
SKIN_SHIFT_WARN_DEG = 8.0  # [Thử] mức cảnh báo, chưa hiệu chỉnh trên footage thật

ROLLOFF_CUBE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "library", "color", "rolloff_rec709_33.cube",
)


def run_cmd(cmd_list, timeout=60):
    """Chạy command an toàn và bắt kết quả."""
    try:
        res = subprocess.run(
            cmd_list,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout
        )
        return res.returncode, res.stdout, res.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Timeout expired"
    except Exception as e:
        return -2, "", str(e)


def escape_ffmpeg_path(path):
    """Escape đường dẫn Windows cho filter FFmpeg (dấu hai chấm và gạch chéo)."""
    p = os.path.abspath(path).replace("\\", "/")
    # Escape colon (e.g. C: -> C\:)
    p = p.replace(":", "\\:")
    p = p.replace("'", "\\'")
    return p


def read_meta(clip_path):
    """Lấy metadata stream video + thời lượng từ ffprobe."""
    probe_cmd = [
        "ffprobe", "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,duration,pix_fmt,color_space,color_transfer,color_primaries,color_range:format=duration",
        "-of", "json",
        clip_path
    ]
    code, out, _ = run_cmd(probe_cmd)
    meta, duration = {}, 0.0
    if code == 0 and out.strip():
        try:
            data = json.loads(out)
            meta = data.get("streams", [{}])[0]
            duration = float(meta.get("duration") or data.get("format", {}).get("duration") or 0.0)
        except Exception:
            pass
    return meta, duration


def sample_times(duration, count):
    """Các mốc lấy mẫu đều trong clip; ảnh tĩnh hoặc clip rất ngắn lấy khung đầu."""
    if duration <= 0.2:
        return [0.0]
    count = max(1, count)
    return [round(duration * (i + 0.5) / count, 3) for i in range(count)]


# ==============================================================================
# 1. PROBE / ĐO LƯỜNG TÍN HIỆU (SIGNALSTATS + METADATA)
# ==============================================================================
def signalstats_at(clip_path, ss_sec):
    """Đo signalstats của 1 khung tại ss_sec, quy về thang 8-bit."""
    stat_cmd = [
        "ffmpeg", "-hide_banner",
        "-ss", str(ss_sec),
        "-i", clip_path,
        "-frames:v", "1",
        "-vf", "format=yuv420p,signalstats,metadata=print:file=-",
        "-f", "null", "-"
    ]
    _, out, err = run_cmd(stat_cmd)
    stats = {}
    pattern = re.compile(r"lavfi\.signalstats\.([A-Z0-9]+)=([0-9\.\-]+)")
    for line in (err + "\n" + out).splitlines():
        m = pattern.search(line)
        if m:
            stats[m.group(1)] = float(m.group(2))
    return stats


def probe_clip(clip_path, ss_sec=None):
    """Đo thông số kỹ thuật của clip hoặc frame bằng ffprobe & signalstats (đầu, giữa, cuối)."""
    if not os.path.exists(clip_path):
        return {"error": f"Không tìm thấy file: {clip_path}"}

    meta, duration = read_meta(clip_path)
    times = [ss_sec] if ss_sec is not None else sample_times(duration, 3)
    frames = [s for s in (signalstats_at(clip_path, t) for t in times) if s]
    if not frames:
        return {"error": f"Không đo được khung nào của: {clip_path}"}

    def mean(key, default):
        return sum(f.get(key, default) for f in frames) / len(frames)

    # Đọc các chỉ số cốt lõi: min/max lấy khung xấu nhất, còn lại lấy trung bình
    ymin = min(f.get("YMIN", 0.0) for f in frames)
    ymax = max(f.get("YMAX", 255.0) for f in frames)
    yavg = mean("YAVG", 128.0)
    satavg = mean("SATAVG", 0.0)
    satmax = max(f.get("SATMAX", 0.0) for f in frames)
    uavg = mean("UAVG", 128.0)
    vavg = mean("VAVG", 128.0)

    # Đánh giá trạng thái tín hiệu
    is_log = (satavg < 4.0 and ymin > 15.0 and ymax < 240.0) or ("log" in str(meta.get("color_transfer", "")).lower())

    issues = []
    if yavg < 50.0:
        issues.append(f"Quá tối (YAVG={yavg:.1f} < 50)")
    elif yavg > 195.0:
        issues.append(f"Quá sáng (YAVG={yavg:.1f} > 195)")

    if ymin < 8.0:
        issues.append(f"Nguy cơ bệt màu đen (YMIN={ymin:.1f} < 8)")
    if ymax > 245.0:
        issues.append(f"Nguy cơ cháy sáng (YMAX={ymax:.1f} > 245)")

    u_drift = uavg - 128.0
    v_drift = vavg - 128.0
    if abs(u_drift) >= 8.0 or abs(v_drift) >= 8.0:
        tint_desc = []
        if u_drift >= 8.0: tint_desc.append("ám Xanh Dương (Cool/Blue)")
        elif u_drift <= -8.0: tint_desc.append("ám Vàng (Warm/Yellow)")
        if v_drift >= 8.0: tint_desc.append("ám Hồng Tím (Magenta)")
        elif v_drift <= -8.0: tint_desc.append("ám Xanh Lá (Green)")
        issues.append(f"Lệch cân bằng trắng: {', '.join(tint_desc)} (U={uavg:.1f}, V={vavg:.1f})")

    if "bt2020" in str(meta.get("color_primaries", "")):
        issues.append("Clip gắn nhãn BT.2020: engine làm việc Rec.709, cần hỏi trước khi chỉnh")

    pix_fmt = str(meta.get("pix_fmt", "unknown"))
    color_range = meta.get("color_range") or "unknown"
    if pix_fmt.startswith("yuvj"):
        color_range = "pc"

    result = {
        "clip": clip_path,
        "sample_sec": times,
        "resolution": f"{meta.get('width', 0)}x{meta.get('height', 0)}",
        "pix_fmt": pix_fmt,
        "color_range": color_range,
        "color_transfer": meta.get("color_transfer", "unknown"),
        "is_log_or_flat": is_log,
        "luma": {
            "min": ymin,
            "avg": round(yavg, 2),
            "max": ymax,
            "ire_min_est": round(ymin / 2.55, 1),
            "ire_max_est": round(ymax / 2.55, 1),
        },
        "chroma": {
            "sat_avg": round(satavg, 2),
            "sat_max": satmax,
            "u_avg": round(uavg, 2),
            "v_avg": round(vavg, 2),
        },
        "issues_detected": issues,
        "recommended_action": "Cần chỉnh Pre-LUT (Exposure/WB)" if issues else "Tín hiệu chuẩn, có thể giữ gốc hoặc áp LUT nhẹ"
    }
    return result


# ==============================================================================
# 2. BUILD-FILTER: DỰNG FILTERGRAPH 6 TẦNG CHUYÊN NGHIỆP
# ==============================================================================
def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3.0 - 2.0 * t)


def ensure_rolloff_cube():
    """Sinh (một lần) file LUT roll-off: giữ nguyên độ sáng, rút bão hòa về 0 ở hai đầu cực."""
    if os.path.exists(ROLLOFF_CUBE):
        return ROLLOFF_CUBE
    os.makedirs(os.path.dirname(ROLLOFF_CUBE), exist_ok=True)
    n = 33
    lines = [f"LUT_3D_SIZE {n}"]
    for bi in range(n):
        for gi in range(n):
            for ri in range(n):
                r, g, b = ri / (n - 1), gi / (n - 1), bi / (n - 1)
                y = 0.2126 * r + 0.7152 * g + 0.0722 * b
                keep = smoothstep(0.0, 0.05, y) * (1.0 - smoothstep(0.95, 1.0, y))
                lines.append(f"{y + (r - y) * keep:.6f} {y + (g - y) * keep:.6f} {y + (b - y) * keep:.6f}")
    with open(ROLLOFF_CUBE, "w", encoding="ascii", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    return ROLLOFF_CUBE


def curve_points(fn, xs):
    return " ".join(f"{x:.3f}/{max(0.0, min(1.0, fn(x))):.4f}" for x in xs)


def build_color_filter(
    lut_path=None,
    lut_mix=0.55,
    technical_lut=False,
    lift=0.0,       # âm: hạ điểm đen, dương: nâng điểm đen
    gamma=1.0,      # >1: sáng trung gian lên, <1: tối đi
    gain=1.0,       # <1: hạ điểm trắng, >1: nâng điểm trắng
    contrast=1.0,   # S-Curve quanh tâm 0.5
    wb_temp=0.0,    # âm: Cool, dương: Warm
    wb_tint=0.0,    # âm: Green, dương: Magenta
    sat=1.0,        # 1.0: giữ nguyên
    input_range="tv"
):
    """
    Tự động xây dựng chuỗi Filtergraph FFmpeg chuẩn 6 tầng:
    Tầng 1: Input Normalization (Rec.709, RGB 16-bit)
    Tầng 2: Pre-LUT Exposure & Contrast (Lift, Gain, Gamma, S-Curve)
    Tầng 3: Pre-LUT White Balance & Saturation
    Tầng 4: AT-LUT (Tetrahedral + Opacity/Mix)
    Tầng 5: Post-LUT Luma vs Sat Roll-off (Làm sạch đen/trắng)
    Tầng 6: Broadcast Limiter (16-235) & Output
    """
    warnings = []

    def clamp(name, value):
        lo, hi = LIMITS[name]
        kept = max(lo, min(hi, value))
        if kept != value:
            warnings.append(f"{name}={value} vượt khung [{lo}, {hi}], đã kẹp về {kept}")
        return kept

    # Khóa ngưỡng an toàn (Hard Guardrails)
    lift = clamp("lift", lift)
    gamma = clamp("gamma", gamma)
    gain = clamp("gain", gain)
    contrast = clamp("contrast", contrast)
    wb_temp = clamp("wb_temp", wb_temp)
    wb_tint = clamp("wb_tint", wb_tint)
    sat = clamp("sat", sat)
    if lut_path and not os.path.exists(lut_path):
        raise ValueError(f"Không tìm thấy LUT: {lut_path}")
    if lut_path:
        if technical_lut:
            if lut_mix != 1.0 and lut_mix != 0.55:
                warnings.append(f"LUT kỹ thuật luôn áp 100%, bỏ qua lut_mix={lut_mix}")
            lut_mix = 1.0
        else:
            lut_mix = clamp("lut_mix", lut_mix)

    stages_desc = []

    # --- TẦNG 1: CHUẨN HÓA ĐẦU VÀO VÀ KHÔNG GIAN LÀM VIỆC ---
    # setparams đặt đúng hệ số trước khi đổi sang RGB, tránh lệch BT.601
    chain = [
        f"setparams=range={input_range}:color_primaries=bt709:color_trc=bt709:colorspace=bt709",
        "scale=flags=accurate_rnd+full_chroma_int",
        "format=gbrp16le",
    ]
    stages_desc.append(f"Tầng 1: Chuẩn hóa Rec.709 dải {input_range.upper()}, RGB 16-bit")

    # --- TẦNG 2: PRE-LUT EXPOSURE & CONTRAST (LIFT / GAIN / GAMMA / S-CURVE) ---
    # 2a. Điểm đen và điểm trắng: nâng/hạ bằng đầu ra, hạ đen/nâng trắng bằng đầu vào
    if lift != 0.0 or gain != 1.0:
        imin = max(0.0, -lift)
        omin = max(0.0, lift)
        imax = 1.0 / gain if gain > 1.0 else 1.0
        omax = gain if gain < 1.0 else 1.0
        chain.append(
            "colorlevels="
            + ":".join(f"{c}imin={imin:.4f}:{c}imax={imax:.4f}:{c}omin={omin:.4f}:{c}omax={omax:.4f}" for c in "rgb")
        )
        stages_desc.append(f"Tầng 2a: Lift={lift:+.3f}, Gain={gain:.3f} (colorlevels)")

    # 2b. Gamma (Midtone), giữ nguyên hai đầu 0 và 1
    if gamma != 1.0:
        xs = [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 1]
        chain.append(f"curves=m='{curve_points(lambda x: x ** (1.0 / gamma), xs)}'")
        stages_desc.append(f"Tầng 2b: Gamma={gamma:.3f} (Midtone Pivot)")

    # 2c. S-Curve Contrast (Đường cong tương phản mềm)
    if contrast != 1.0:
        diff = (contrast - 1.0) * 0.15
        chain.append(f"curves=m='0/0 0.25/{0.25 - diff:.4f} 0.5/0.5 0.75/{0.75 + diff:.4f} 1/1'")
        stages_desc.append(f"Tầng 2c: S-Curve Contrast={contrast:.2f}")

    # --- TẦNG 3: PRE-LUT WHITE BALANCE & SATURATION ---
    if wb_temp != 0.0 or wb_tint != 0.0:
        # wb_temp > 0 (Warm): tăng Red, giảm Blue
        # wb_tint > 0 (Magenta): giảm Green, tăng Red/Blue
        rm = wb_temp * 0.5 + wb_tint * 0.25
        gm = -wb_tint * 0.5
        bm = -wb_temp * 0.5 + wb_tint * 0.25
        chain.append(f"colorbalance=rm={rm:.3f}:gm={gm:.3f}:bm={bm:.3f}:rs={rm*0.4:.3f}:bs={bm*0.4:.3f}:rh={rm*0.4:.3f}:bh={bm*0.4:.3f}")
        stages_desc.append(f"Tầng 3a: White Balance (Temp={wb_temp:+.2f}, Tint={wb_tint:+.2f})")

    if sat != 1.0:
        # Ma trận bão hòa theo hệ số độ sáng Rec.709, chạy được ở 16-bit
        kr, kg, kb = 0.2126, 0.7152, 0.0722
        chain.append(
            "colorchannelmixer="
            f"rr={kr + (1 - kr) * sat:.5f}:rg={kg * (1 - sat):.5f}:rb={kb * (1 - sat):.5f}:"
            f"gr={kr * (1 - sat):.5f}:gg={kg + (1 - kg) * sat:.5f}:gb={kb * (1 - sat):.5f}:"
            f"br={kr * (1 - sat):.5f}:bg={kg * (1 - sat):.5f}:bb={kb + (1 - kb) * sat:.5f}"
        )
        stages_desc.append(f"Tầng 3b: Saturation={sat:.2f}")

    pre_chain = ",".join(chain)

    # --- TẦNG 4: AT-LUT (NỘI SUY TETRAHEDRAL & MIX) ---
    # --- TẦNG 5-6: POST-LUT ROLL-OFF & BROADCAST LIMITER ---
    rolloff = f"lut3d=file='{escape_ffmpeg_path(ensure_rolloff_cube())}':interp=tetrahedral"
    post_cleanup = (
        f"{rolloff},"
        "scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int,"
        "format=yuv420p,"
        "limiter=min=16:max=235:planes=1,limiter=min=16:max=240:planes=6,"
        "setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709"
    )

    if lut_path and lut_mix >= 0.99:
        lut = f"lut3d=file='{escape_ffmpeg_path(lut_path)}':interp=tetrahedral"
        filtergraph = f"{pre_chain},{lut},{post_cleanup}"
        stages_desc.append("Tầng 4: LUT kỹ thuật (100%, tetrahedral)")
    elif lut_path:
        lut = f"lut3d=file='{escape_ffmpeg_path(lut_path)}':interp=tetrahedral"
        # Nhánh LUT là lớp trên: all_opacity đúng bằng tỷ lệ mix
        filtergraph = (
            f"{pre_chain},split=2[pre_base][pre_lut];"
            f"[pre_lut]{lut}[lut_applied];"
            f"[lut_applied][pre_base]blend=all_mode=normal:all_opacity={lut_mix:.2f}[blended];"
            f"[blended]{post_cleanup}"
        )
        stages_desc.append(f"Tầng 4: 3D LUT (Mix={int(round(lut_mix * 100))}%, tetrahedral)")
    else:
        filtergraph = f"{pre_chain},{post_cleanup}"
        stages_desc.append("Tầng 4: Bỏ qua LUT (Chế độ Grade Thuần Kỹ Thuật)")

    stages_desc.append("Tầng 5: Roll-off bão hòa ở hai đầu cực")
    stages_desc.append("Tầng 6: Broadcast Limiter (Y 16-235, C 16-240)")

    return {
        "filtergraph": filtergraph,
        "stages": stages_desc,
        "guardrails": {
            "lift": lift, "gamma": gamma, "gain": gain, "contrast": contrast,
            "wb_temp": wb_temp, "wb_tint": wb_tint, "sat": sat, "lut_mix": lut_mix if lut_path else None,
            "technical_lut": bool(lut_path and technical_lut)
        },
        "guardrail_warnings": warnings
    }


# ==============================================================================
# 3. PREVIEW: XUẤT ẢNH SO SÁNH BEFORE / AFTER CẠNH NHAU
# ==============================================================================
def make_preview_contact_sheet(clip_path, ss_sec, filtergraph, out_png):
    """Trích xuất 1 frame Before và 1 frame After, ghép cạnh nhau có nhãn."""
    if not os.path.exists(clip_path):
        return False, f"Không tìm thấy clip: {clip_path}"

    os.makedirs(os.path.dirname(os.path.abspath(out_png)), exist_ok=True)

    # Ghép Before và After thành 1 khung hình đôi (hstack)
    # [0:v] split [orig][to_grade]; [to_grade] <filtergraph> [graded]; [orig][graded] hstack [out]
    complex_vf = (
        f"split=2[orig][to_grade];"
        f"[to_grade]{filtergraph}[graded];"
        f"[orig]format=yuv420p,drawtext=text='BEFORE (GOC)':x=20:y=20:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6[orig_txt];"
        f"[graded]drawtext=text='AFTER (DA CHINH)':x=20:y=20:fontsize=36:fontcolor=yellow:box=1:boxcolor=black@0.6[grad_txt];"
        f"[orig_txt][grad_txt]hstack=inputs=2"
    )

    cmd = [
        "ffmpeg", "-hide_banner", "-y",
        "-ss", str(ss_sec),
        "-i", clip_path,
        "-frames:v", "1",
        "-vf", complex_vf,
        out_png
    ]
    code, out, err = run_cmd(cmd, timeout=60)
    if code == 0 and os.path.exists(out_png):
        return True, out_png
    else:
        # Dự phòng: nếu drawtext lỗi font thì hstack thông thường
        fallback_vf = f"split=2[orig][to_grade];[orig]format=yuv420p[orig2];[to_grade]{filtergraph}[graded];[orig2][graded]hstack=inputs=2"
        cmd_fallback = [
            "ffmpeg", "-hide_banner", "-y",
            "-ss", str(ss_sec),
            "-i", clip_path,
            "-frames:v", "1",
            "-vf", fallback_vf,
            out_png
        ]
        c2, o2, e2 = run_cmd(cmd_fallback, timeout=60)
        if c2 == 0 and os.path.exists(out_png):
            return True, out_png
        return False, f"Lỗi render preview: {err}\n{e2}"


# ==============================================================================
# 4. AUDIT: KIỂM ĐỊNH CHẤT LƯỢNG MÀU SẮC ĐẦU RA (CỔNG G3)
# ==============================================================================
def read_frame_planes(target_path, ss_sec):
    """Đọc 1 khung thành 3 mặt Y, U, V (8-bit, cùng kích thước)."""
    cmd = [
        "ffmpeg", "-hide_banner", "-v", "error",
        "-ss", str(ss_sec),
        "-i", target_path,
        "-frames:v", "1",
        "-vf", f"scale={AUDIT_WIDTH}:-2:flags=neighbor,format=yuv444p",
        "-f", "rawvideo", "-"
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    except Exception:
        return None
    data = res.stdout
    if res.returncode != 0 or not data or len(data) % 3 != 0:
        return None
    n = len(data) // 3
    return data[:n], data[n:2 * n], data[2 * n:]


def frame_stats(planes):
    """Số đo 1 khung: clipping thật theo % điểm ảnh, độ sáng, bão hòa, cân bằng màu."""
    y, u, v = planes
    n = len(y)
    hist = Counter(y)
    sat_total = 0.0
    u_total = 0
    v_total = 0
    for cb, cr in zip(u, v):
        sat_total += math.hypot(cb - 128, cr - 128)
        u_total += cb
        v_total += cr
    return {
        "ymin": min(hist),
        "ymax": max(hist),
        "yavg": sum(k * c for k, c in hist.items()) / n,
        "pct_den_sau": 100.0 * sum(c for k, c in hist.items() if k < 5) / n,
        "pct_chay_sang": 100.0 * sum(c for k, c in hist.items() if k > 248) / n,
        "satavg": sat_total / n,
        "uavg": u_total / n,
        "vavg": v_total / n,
    }


def skin_hue(planes):
    """Góc màu trung bình của vùng có sắc da. Chỉ theo dải màu: gỗ, tường ấm cũng lọt vào."""
    y, u, v = planes
    x_sum = y_sum = 0.0
    count = 0
    for luma, cb, cr in zip(y, u, v):
        a, b = cb - 128, cr - 128
        if not 60 <= luma <= 200 or a * a + b * b < 64:
            continue
        angle = math.degrees(math.atan2(b, a))
        if 100.0 <= angle <= 150.0:
            x_sum += math.cos(math.radians(angle))
            y_sum += math.sin(math.radians(angle))
            count += 1
    if not count:
        return None, 0.0
    return math.degrees(math.atan2(y_sum, x_sum)), 100.0 * count / len(y)


def audit_color(target_path, ss_sec=None, samples=12, reference=None):
    """Kiểm tra video hoặc frame đầu ra xem có đạt chuẩn phát sóng và cổng G3 không."""
    if not os.path.exists(target_path):
        return {"pass": False, "score": 0, "reasons": [f"Không tìm thấy file: {target_path}"]}

    _, duration = read_meta(target_path)
    times = [ss_sec] if ss_sec is not None else sample_times(duration, samples)
    planes_by_time = [(t, read_frame_planes(target_path, t)) for t in times]
    planes_by_time = [(t, p) for t, p in planes_by_time if p]
    if not planes_by_time:
        return {"pass": False, "score": 0, "reasons": [f"Không đọc được khung nào của: {target_path}"]}
    frames = [(t, frame_stats(p)) for t, p in planes_by_time]

    worst_low_t, worst_low = max(frames, key=lambda f: f[1]["pct_den_sau"])
    worst_high_t, worst_high = max(frames, key=lambda f: f[1]["pct_chay_sang"])
    ymin = min(f["ymin"] for _, f in frames)
    ymax = max(f["ymax"] for _, f in frames)
    yavg = sum(f["yavg"] for _, f in frames) / len(frames)
    satavg = sum(f["satavg"] for _, f in frames) / len(frames)
    uavg = sum(f["uavg"] for _, f in frames) / len(frames)
    vavg = sum(f["vavg"] for _, f in frames) / len(frames)
    pct_low = worst_low["pct_den_sau"]
    pct_high = worst_high["pct_chay_sang"]

    score = 100
    deductions = []

    # 1. Kiểm tra Clipping Luma theo % điểm ảnh
    clip_fail = False
    if pct_low >= CLIP_PCT_MAX:
        clip_fail = True
        score -= 10
        deductions.append(f"Vùng tối bị bệt: {pct_low:.2f}% điểm ảnh Y<5 tại giây {worst_low_t} (ngưỡng <{CLIP_PCT_MAX}%)")
    if pct_high >= CLIP_PCT_MAX:
        clip_fail = True
        score -= 15
        deductions.append(f"Vùng sáng bị cháy: {pct_high:.2f}% điểm ảnh Y>248 tại giây {worst_high_t} (ngưỡng <{CLIP_PCT_MAX}%)")

    # 2. Kiểm tra Độ sáng trung bình (Exposure)
    if yavg < 45.0:
        score -= 10
        deductions.append(f"Hình tổng thể quá tối (YAVG={yavg:.1f} < 45)")
    elif yavg > 200.0:
        score -= 10
        deductions.append(f"Hình tổng thể quá chói (YAVG={yavg:.1f} > 200)")

    # 3. Kiểm tra Độ bão hòa & Bệt màu (Oversaturation)
    if satavg > 30.0:
        score -= 15
        deductions.append(f"Màu bị rực quá mức / nguy cơ bệt màu (SATAVG={satavg:.1f} > 30)")
    elif satavg < 3.0:
        score -= 8
        deductions.append(f"Hình bị nhạt / phẳng như Log chưa áp màu (SATAVG={satavg:.1f} < 3)")

    # 4. Kiểm tra Lệch Cân bằng trắng cực đoan
    if abs(uavg - 128.0) > 16.0 or abs(vavg - 128.0) > 16.0:
        score -= 12
        deductions.append(f"Ám màu nặng bất thường (U={uavg:.1f}, V={vavg:.1f})")

    score = max(0, score)
    passed = (score >= 90) and not clip_fail

    # 5. Da: chỉ cảnh báo để xem bằng mắt, không tính điểm vì lọc theo dải màu
    angles = [skin_hue(p) for _, p in planes_by_time]
    valid = [a for a, pct in angles if a is not None and pct >= 1.0]
    skin = {
        "goc_trung_binh": round(sum(valid) / len(valid), 1) if valid else None,
        "duong_da": SKIN_LINE_DEG,
        "so_khung_co_vung_da": len(valid),
        "ghi_chu": "Lọc theo dải màu, gỗ và tường ấm cũng lọt vào; luôn xem ảnh Before/After.",
    }
    review = []
    if reference:
        _, ref_duration = read_meta(reference)
        ref_times = [ss_sec] if ss_sec is not None else sample_times(ref_duration, samples)
        ref_planes = [read_frame_planes(reference, t) for t in ref_times]
        ref_angles = [skin_hue(p) for p in ref_planes if p]
        ref_valid = [a for a, pct in ref_angles if a is not None and pct >= 1.0]
        if valid and ref_valid:
            shift = sum(valid) / len(valid) - sum(ref_valid) / len(ref_valid)
            skin["lech_so_voi_goc_do"] = round(shift, 1)
            if abs(shift) >= SKIN_SHIFT_WARN_DEG:
                review.append(f"Sắc da lệch {shift:+.1f}° so với gốc: xem bằng mắt, cân nhắc hạ lut_mix hoặc từ chối LUT")

    return {
        "pass": passed,
        "score": score,
        "samples": len(frames),
        "luma": {"min": ymin, "avg": round(yavg, 2), "max": ymax},
        "chroma": {"sat_avg": round(satavg, 2), "u_avg": round(uavg, 2), "v_avg": round(vavg, 2)},
        "clipping_pct": {"den_sau_y_duoi_5": round(pct_low, 3), "chay_sang_y_tren_248": round(pct_high, 3)},
        "skin": skin,
        "can_xem_bang_mat": review,
        "deductions": deductions,
        "verdict": "ĐẠT CHUẨN PHÁT SÓNG (G3 PASS)" if passed else "CHƯA ĐẠT / CẦN VÁ LỖI CỤC BỘ"
    }


# ==============================================================================
# CLI DISPATCHER
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="Bộ Vi Xử Lý Màu Sắc Video Chuyên Nghiệp (dung-mau)")
    subparsers = parser.add_subparsers(dest="action", help="Lệnh thực thi")

    # PROBE
    p_probe = subparsers.add_parser("probe", help="Đo thông số kỹ thuật clip")
    p_probe.add_argument("clip", help="Đường dẫn file video hoặc ảnh")
    p_probe.add_argument("--ss", type=float, default=None, help="Mốc giây cần đo (mặc định đo đầu, giữa, cuối)")
    p_probe.add_argument("--json", help="Đường dẫn file xuất JSON")

    # BUILD-FILTER
    p_build = subparsers.add_parser("build-filter", help="Tạo chuỗi filtergraph FFmpeg 6 tầng")
    p_build.add_argument("--lut", help="Đường dẫn file 3D LUT (.cube)")
    p_build.add_argument("--lut-mix", type=float, default=0.55, help="Cường độ Creative LUT (0.40 đến 0.65, mặc định 0.55)")
    p_build.add_argument("--technical-lut", action="store_true", help="LUT chuyển đổi camera (D-Log to Rec.709): áp 100%%")
    p_build.add_argument("--lift", type=float, default=0.0, help="Điểm đen: âm là hạ, dương là nâng (-0.06 đến +0.06)")
    p_build.add_argument("--gamma", type=float, default=1.0, help="Độ sáng trung gian: >1 sáng lên (0.88 đến 1.12)")
    p_build.add_argument("--gain", type=float, default=1.0, help="Điểm trắng: <1 hạ, >1 nâng (0.92 đến 1.08)")
    p_build.add_argument("--contrast", type=float, default=1.0, help="Độ tương phản S-Curve (0.90 đến 1.12)")
    p_build.add_argument("--wb-temp", type=float, default=0.0, help="Nhiệt độ màu: âm là Cool/Lam, dương là Warm/Cam (-0.06 đến +0.06)")
    p_build.add_argument("--wb-tint", type=float, default=0.0, help="Sắc thái: âm là Green, dương là Magenta (-0.06 đến +0.06)")
    p_build.add_argument("--sat", type=float, default=1.0, help="Độ bão hòa, 1.0 là giữ nguyên (0.90 đến 1.20)")
    p_build.add_argument("--input-range", choices=["tv", "pc"], default="tv", help="Dải màu clip gốc, lấy từ color_range của probe")
    p_build.add_argument("--json", help="Đường dẫn file xuất JSON")

    # PREVIEW
    p_prev = subparsers.add_parser("preview", help="Render ảnh so sánh Before vs After")
    p_prev.add_argument("clip", help="Đường dẫn clip")
    p_prev.add_argument("--ss", type=float, default=1.0, help="Mốc giây lấy mẫu")
    p_prev.add_argument("--filter", help="Chuỗi filtergraph cần áp")
    p_prev.add_argument("--recipe", help="File JSON do build-filter xuất ra")
    p_prev.add_argument("--out", required=True, help="File ảnh PNG đầu ra")

    # AUDIT
    p_audit = subparsers.add_parser("audit", help="Kiểm định chất lượng màu sắc đầu ra")
    p_audit.add_argument("target", help="File video hoặc frame cần kiểm định")
    p_audit.add_argument("--ss", type=float, default=None, help="Chỉ kiểm 1 mốc giây (mặc định lấy mẫu đều cả clip)")
    p_audit.add_argument("--samples", type=int, default=12, help="Số khung lấy mẫu đều trong clip")
    p_audit.add_argument("--reference", help="Clip gốc để so sắc da trước/sau")
    p_audit.add_argument("--json", help="File xuất kết quả JSON")

    args = parser.parse_args()

    if args.action == "probe":
        res = probe_clip(args.clip, args.ss)
        if args.json:
            with open(args.json, "w", encoding="utf-8") as f:
                json.dump(res, f, ensure_ascii=False, indent=2)
        print(json.dumps(res, ensure_ascii=False, indent=2))

    elif args.action == "build-filter":
        try:
            res = build_color_filter(
                lut_path=args.lut,
                lut_mix=args.lut_mix,
                technical_lut=args.technical_lut,
                lift=args.lift,
                gamma=args.gamma,
                gain=args.gain,
                contrast=args.contrast,
                wb_temp=args.wb_temp,
                wb_tint=args.wb_tint,
                sat=args.sat,
                input_range=args.input_range
            )
        except ValueError as e:
            print(f"❌ {e}")
            sys.exit(1)
        if args.json:
            with open(args.json, "w", encoding="utf-8") as f:
                json.dump(res, f, ensure_ascii=False, indent=2)
        print("\n=== CHUỖI FILTERGRAPH FFMPEG 6 TẦNG ===")
        print(res["filtergraph"])
        print("\n=== CÁC TẦNG ĐÃ KÍCH HOẠT ===")
        for s in res["stages"]:
            print(f"- {s}")
        for w in res["guardrail_warnings"]:
            print(f"⚠️ {w}")

    elif args.action == "preview":
        filtergraph = args.filter
        if args.recipe:
            with open(args.recipe, encoding="utf-8") as f:
                filtergraph = json.load(f)["filtergraph"]
        if not filtergraph:
            print("❌ Cần --filter hoặc --recipe")
            sys.exit(1)
        ok, msg = make_preview_contact_sheet(args.clip, args.ss, filtergraph, args.out)
        if ok:
            print(f"✅ Đã tạo ảnh so sánh Before/After: {msg}")
        else:
            print(f"❌ Lỗi: {msg}")
            sys.exit(1)

    elif args.action == "audit":
        res = audit_color(args.target, args.ss, args.samples, args.reference)
        if args.json:
            with open(args.json, "w", encoding="utf-8") as f:
                json.dump(res, f, ensure_ascii=False, indent=2)
        print(json.dumps(res, ensure_ascii=False, indent=2))
        sys.exit(0 if res.get("pass") else 2)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
