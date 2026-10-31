"""Chấm 100 điểm: bản tái hiện so với mẫu gốc → scorecard-vNN.json.

Dùng:
  python score.py <đo-mẫu-dir> <đo-tái-hiện-dir> --out scorecard-v01.json
                  [--ref-font "Montserrat Black"] [--rep-font "Montserrat Black"] [--font-override "Dũng chọn ..."]
                  [--chars 12] [--font-px 96]

Mỗi mục chỉ đủ điểm khi đạt ngưỡng; đạt một phần thì tính tỉ lệ (số khung/mốc đạt ÷ tổng, hoặc giảm tuyến tính
từ ngưỡng tới 3× ngưỡng với số đo đơn). NGƯỠNG CỐ ĐỊNH TRONG FILE NÀY — không được nới để đạt 100.
Quỹ đạo, khung so sánh và SFX được canh theo in_start của mỗi clip, nên lệch thời gian chỉ trừ ở mục Thời điểm.
"""
import argparse, json, os, sys
import numpy as np
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
from colorlab import delta_e2000  # noqa: E402

TH = {"frame": 1, "pos": 0.005, "scale": 0.02, "opacity": 0.05, "angle_deg": 1.0, "sharp": 0.10,
      "size": 0.03, "track_em": 0.01, "font_iou": 0.90, "de": 3.0, "glow": 0.10, "glow_abs_px": 2,
      "iou": 0.90, "ssim": 0.95, "sfx_frame": 1, "sfx_dur": 0.10, "env_corr": 0.8, "lu": 2.0}


def lin(err, thr):
    """1 khi err ≤ thr, giảm tuyến tính về 0 ở 3×thr."""
    return 1.0 if err <= thr else max(0.0, 1 - (err - thr) / (2 * thr))


def img(path, gray=False):
    from PIL import Image
    im = Image.open(path)
    return np.asarray(im.convert("L" if gray else "RGB")).astype(np.float64)


def ssim(a, b):
    C1, C2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    f = lambda x: ndimage.gaussian_filter(x, 1.5)
    mu1, mu2 = f(a), f(b)
    s11, s22, s12 = f(a * a) - mu1 ** 2, f(b * b) - mu2 ** 2, f(a * b) - mu1 * mu2
    m = ((2 * mu1 * mu2 + C1) * (2 * s12 + C2)) / ((mu1 ** 2 + mu2 ** 2 + C1) * (s11 + s22 + C2))
    return float(m.mean())


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    ap = argparse.ArgumentParser()
    ap.add_argument("ref")
    ap.add_argument("rep")
    ap.add_argument("--out", required=True)
    ap.add_argument("--ref-font", default="")
    ap.add_argument("--rep-font", default="")
    ap.add_argument("--font-override", default="")
    ap.add_argument("--chars", type=int, default=0)
    ap.add_argument("--font-px", type=float, default=0)
    a = ap.parse_args()
    R = json.load(open(os.path.join(a.ref, "measure.json"), encoding="utf-8"))
    P = json.load(open(os.path.join(a.rep, "measure.json"), encoding="utf-8"))
    card = {"ref": a.ref, "rep": a.rep, "thresholds": TH, "items": {}, "notes": []}
    if (R["width"], R["height"]) != (P["width"], P["height"]) or abs(R["fps"] - P["fps"]) > 0.01:
        card["notes"].append(f"KHÁC định dạng: mẫu {R['width']}x{R['height']}@{R['fps']} vs {P['width']}x{P['height']}@{P['fps']}")
    H = R["height"]
    mr, mp = R["milestones"], P["milestones"]

    # 1. Thời điểm (20)
    rows = []
    for k in ("in_start", "touch", "out_start", "out_end"):
        rows.append((k, mr[k], mp[k], abs(mr[k] - mp[k])))
    rg, pg = R["groups"], P["groups"]
    if len(rg) == len(pg) and len(rg) > 1:
        for i in range(1, len(rg)):
            if rg[i]["appear"] is not None and pg[i]["appear"] is not None and rg[0]["appear"] is not None:
                dr = rg[i]["appear"] - rg[0]["appear"]
                dp = pg[i]["appear"] - pg[0]["appear"]
                rows.append((f"tre_cum_{i}", dr, dp, abs(dr - dp)))
    elif len(rg) != len(pg):
        rows.append(("so_cum", len(rg), len(pg), 99))
    ok = sum(1 for r in rows if r[3] <= TH["frame"])
    card["items"]["thoi_diem"] = {"max": 20, "score": round(20 * ok / len(rows), 2),
                                  "detail": [{"moc": r[0], "mau": r[1], "tai_hien": r[2], "lech_khung": r[3]} for r in rows]}

    # 2. Quỹ đạo + easing (20) — canh theo in_start
    fr = {d["f"] - mr["in_start"]: d for d in R["per_frame"]}
    fp = {d["f"] - mp["in_start"]: d for d in P["per_frame"]}
    keys = sorted(fr)
    good, worst = 0, {"pos": 0, "scale": 0, "opacity": 0, "angle": 0, "sharp": 0}
    for k in keys:
        r, p = fr[k], fp.get(k)
        if p is None or "cx" not in r or "cx" not in p:
            ok_ = p is not None and abs(r.get("opacity", 0) - p.get("opacity", 0)) <= TH["opacity"] and "cx" not in r and "cx" not in p
            good += ok_
            continue
        e = {"pos": max(abs(r["cx"] - p["cx"]), abs(r["cy"] - p["cy"])),
             "scale": max(abs(r["scale_h"] - p["scale_h"]), abs(r["scale_w"] - p["scale_w"])),
             "opacity": abs(r["opacity"] - p["opacity"]), "angle": abs(r["angle"] - p["angle"]),
             "sharp": abs(r["sharp"] - p["sharp"])}
        for kk in worst:
            worst[kk] = max(worst[kk], e[kk])
        good += (e["pos"] <= TH["pos"] and e["scale"] <= TH["scale"] and e["opacity"] <= TH["opacity"]
                 and e["angle"] <= TH["angle_deg"] and e["sharp"] <= TH["sharp"])
    card["items"]["quy_dao"] = {"max": 20, "score": round(20 * good / max(1, len(keys)), 2),
                                "detail": {"khung_dat": good, "tong_khung": len(keys),
                                           "sai_lon_nhat": {k: round(v, 4) for k, v in worst.items()}}}

    # 3. Hình chữ (15): font 5, cỡ 5, tracking 5
    mref = img(os.path.join(a.ref, "mask_rest.png"), True) > 127
    mrep = img(os.path.join(a.rep, "mask_rest.png"), True) > 127

    def norm(m):
        ys, xs = np.nonzero(m)
        c = m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        from PIL import Image
        return np.asarray(Image.fromarray((c * 255).astype(np.uint8)).resize((400, 100))) > 127
    shape_iou = float(np.logical_and(norm(mref), norm(mrep)).sum() / np.logical_or(norm(mref), norm(mrep)).sum())
    same_font = (a.ref_font.strip().lower() == a.rep_font.strip().lower()) if a.ref_font and a.rep_font else None
    font_ok = (same_font is not False) and shape_iou >= TH["font_iou"]
    rb, pb = R["rest_box"], P["rest_box"]
    size_err = abs(pb["h"] - rb["h"]) / rb["h"]
    track_em = None
    if a.chars > 1 and a.font_px:
        track_em = abs(pb["w"] - rb["w"]) / (a.chars - 1) / a.font_px
    s_font = 5.0 if font_ok else 5.0 * max(0.0, (shape_iou - 0.6) / 0.3) * (0 if same_font is False else 1)
    s_size = 5 * lin(size_err, TH["size"])
    s_track = 5 * (lin(track_em, TH["track_em"]) if track_em is not None else lin(abs(pb["w"] - rb["w"]) / rb["w"], TH["size"]))
    card["items"]["hinh_chu"] = {"max": 15, "score": round(s_font + s_size + s_track, 2),
                                 "detail": {"font_mau": a.ref_font, "font_tai_hien": a.rep_font, "iou_hinh_dang": round(shape_iou, 4),
                                            "sai_co": round(size_err, 4), "sai_tracking_em": None if track_em is None else round(track_em, 4),
                                            "font_doi_theo_Dung": a.font_override or None}}
    if a.font_override:
        card["notes"].append("Hình chữ chấm theo font Dũng chọn: " + a.font_override)

    # 4. Màu & ánh sáng (15): ΔE 10, glow 5
    des = {k: round(delta_e2000(R["color_lab"][k], P["color_lab"][k]), 3) for k in ("main", "top", "bottom")}
    de = max(des.values())
    gr, gp = R["glow_px"], P["glow_px"]
    gerr = abs(gr - gp)
    g_ok = gerr <= max(TH["glow_abs_px"], TH["glow"] * gr)
    s_glow = 5.0 if g_ok else 5 * lin(gerr / max(gr, 1), TH["glow"])
    card["items"]["mau_anh_sang"] = {"max": 15, "score": round(10 * lin(de, TH["de"]) + s_glow, 2),
                                     "detail": {"deltaE2000": des, "glow_px_mau": gr, "glow_px_tai_hien": gp}}

    # 5. Tương đồng khung (15): vào/đỉnh/nghỉ × (IoU 2.5 + SSIM 2.5)
    det, sc = {}, 0.0
    for k in ("in", "peak", "rest"):
        a_m = img(os.path.join(a.ref, f"mask_{k}.png"), True) > 127
        b_m = img(os.path.join(a.rep, f"mask_{k}.png"), True) > 127
        u = np.logical_or(a_m, b_m)
        iou_v = float(np.logical_and(a_m, b_m).sum() / u.sum()) if u.sum() else 1.0
        ys, xs = np.nonzero(ndimage.binary_dilation(u, iterations=20)) if u.any() else (np.array([0]), np.array([0]))
        sl = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
        s_v = ssim(img(os.path.join(a.ref, f"key_{k}.png"), True)[sl], img(os.path.join(a.rep, f"key_{k}.png"), True)[sl])
        det[k] = {"iou": round(iou_v, 4), "ssim": round(s_v, 4)}
        # đủ điểm ở ngưỡng; tỉ lệ tuyến tính về 0 tại IoU 0.60 / SSIM 0.80
        sc += 2.5 * min(1, max(0, (iou_v - 0.60) / (TH["iou"] - 0.60)))
        sc += 2.5 * min(1, max(0, (s_v - 0.80) / (TH["ssim"] - 0.80)))
    card["items"]["tuong_dong_khung"] = {"max": 15, "score": round(sc, 2), "detail": det}

    # 6. SFX (15): 5 tiêu chí × 3
    ra, pa = R["audio"], P["audio"]
    if not ra:
        s6 = 15.0 if not pa else 0.0
        d6 = {"ghi_chu": "mẫu không có SFX"}
    elif not pa:
        s6, d6 = 0.0, {"ghi_chu": "tái hiện thiếu SFX"}
    else:
        # ghép sự kiện theo thứ tự thời gian (tương đối in_start)
        pairs, used = [], set()
        for e in ra:
            t = e["onset"] - mr["in_start"]
            j = min((j for j in range(len(pa)) if j not in used), key=lambda j: abs(pa[j]["onset"] - mp["in_start"] - t), default=None)
            if j is not None:
                used.add(j)
                pairs.append((e, pa[j]))
        rows, tot = [], 0.0
        for e, f in pairs:
            d_on = abs((e["onset"] - mr["touch"]) - (f["onset"] - mp["touch"]))
            d_pk = abs((e["peak"] - mr["touch"]) - (f["peak"] - mp["touch"]))
            dur_err = abs(f["dur_s"] - e["dur_s"]) / max(e["dur_s"], 1e-3)
            n = min(len(e["envelope"]), len(f["envelope"]))
            x, y = np.array(e["envelope"][:n]), np.array(f["envelope"][:n])
            corr = float(np.corrcoef(x, y)[0, 1]) if n > 2 and x.std() > 0 and y.std() > 0 else (1.0 if n <= 2 else 0.0)
            lu = abs(f["rms_db"] - e["rms_db"])
            parts = [3.0 if d_on <= TH["sfx_frame"] else 3.0 * max(0, 1 - (d_on - 1) / 4),
                     3.0 * (e["kind"] == f["kind"]),
                     3 * lin(dur_err, TH["sfx_dur"]),
                     3.0 * min(1, max(0, corr) / TH["env_corr"]),
                     3 * lin(lu, TH["lu"])]
            tot += sum(parts)
            rows.append({"lech_onset_khung": d_on, "lech_dinh_khung": d_pk, "loai": [e["kind"], f["kind"]],
                         "sai_thoi_luong": round(dur_err, 4), "tuong_quan_bao": round(corr, 4), "lech_do_to_dB": round(lu, 2),
                         "diem": round(sum(parts), 2)})
        miss = len(ra) - len(pairs) + max(0, len(pa) - len(ra))
        s6 = tot / (len(ra) + max(0, len(pa) - len(ra)))
        d6 = {"cap": rows, "su_kien_mau": len(ra), "su_kien_tai_hien": len(pa), "thua_thieu": miss,
              "ghi_chu_do_to": "độ to so bằng RMS dB của đoạn SFX (xấp xỉ LU; ebur128 không đo được đoạn < 400ms)"}
    card["items"]["sfx"] = {"max": 15, "score": round(s6, 2), "detail": d6}

    total = round(sum(v["score"] for v in card["items"].values()), 2)
    card["total"] = total
    card["pass_100"] = all(v["score"] >= v["max"] - 1e-9 for v in card["items"].values())
    json.dump(card, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"TỔNG {total}/100 " + " | ".join(f"{k} {v['score']}/{v['max']}" for k, v in card["items"].items()))


if __name__ == "__main__":
    main()
