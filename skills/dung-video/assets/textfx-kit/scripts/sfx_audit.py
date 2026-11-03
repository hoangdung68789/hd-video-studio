"""Chấm SFX 100 điểm (kế hoạch + bản trộn thật) → sfx-scorecard.json.

Dùng:
  python sfx_audit.py <sfx_plan.json> --out sfx-scorecard.json [--sfx sfx.wav] [--voice voice.wav] [--bgm bgm_ducked.wav]
                      [--touch touch.json]   # {"m1": giây_chữ_chạm_đo_từ_video, ...} (từ measure.py / bảng mốc)

Mục (ngưỡng cố định — KHÔNG nới để đạt 100):
  1 Đồng bộ 20     : kế hoạch 10 — mọi lớp có điểm neo ≤ 1 khung so với khung chữ chạm (+ lệch tính sẵn của lớp);
                     stem 10 — có --sfx thì đo đỉnh/onset thật của âm dẫn + dự báo, lệch ≤ 1 khung (không có --sfx: cả 20 chấm theo kế hoạch,
                     nhưng mục 6 mất điểm nên không thể 100).
  2 Phủ đủ 10      : mọi mốc chữ có ≥ 1 âm dẫn; không lớp nào mồ côi (không thuộc mốc).
  3 Đúng nghĩa 25  : âm dẫn có vai được phép của ý định (12); MỌI lớp không dính sắc thái cấm / nghĩa cụ thể lạc; âm dẫn
                     không dính vai cấm, không đỉnh mơ hồ (> 0.025s); số lớp phụ đúng luật 1; T3 có riser khi ý định cần và
                     trống ≥ 2s; ý định/bậc/nghĩa nhận lại từ src; hình âm sai
                     (nhiều cú, đỉnh > 0.6s, onset > 0.3s, crest > 15 dB (T1–T3)), riser nhiều cú (8); nghĩa khớp khi lời có
                     nghĩa mà kho có âm đó (5).
  4 Đa dạng 20     : mỗi file ≤ 2 lần, một thang nốt (cùng "group") tính 1 lần (5); không 2 mốc liền cùng file trừ cùng
                     thang nốt (5); không 3 mốc liền cùng họ (5); vai > 50% âm dẫn (khi ≥ 4 âm dẫn) và họ > 50% mọi lớp
                     (khi ≥ 6 lớp) (2.5 + 2.5).
  5 Mật độ 15      : ≤ 2 mốc có âm trong 1s (4); âm rõ T2–T3 cách nhau ≥ 3s (4); sau cú T3 chừa 0.5s (3);
                     không lớp nào kêu qua mốc sau (tắt trước mốc sau ≥ 0.15s), riser tắt ≤ 0.1s sau khung chạm (4).
  6 Độ to 10       : vol đúng bậc (1); đỉnh stem ≤ −3 dBFS (2); cụm âm mốc thấp hơn giọng 1–6 dB — to rõ nhưng KHÔNG to
                     hơn giọng (3); nổi trên nhạc ≥ 4.5 dB tại mốc — ngưỡng Dũng duyệt bằng tai (2); nhạc đều: mức nhạc
                     −19 ±1 LUFS, hạ sâu nhất ≥ −6.5 dB, không hạ ngoài mốc (2). Thiếu file đo → 0 phần đó.
"""
import argparse, json, os, sys
import numpy as np

NOI_NHAC_MIN = 4.5  # dB SFX nổi trên nhạc tại mốc — Dũng nghe duyệt 2026-10-23 (mốc yếu nhất 4.7 dB vẫn nghe rõ); KHÔNG tự nới thêm

sys.path.insert(0, os.path.dirname(__file__))
from sfx_plan import INTENT, VOL, SPECIFIC, CREST_MAX, sec_offset, intent, detect  # noqa: E402


def offset(e, tags, lead=None):
    """Lệch chuẩn của lớp so với khung chữ chạm (đúng luật canh trong sfx_plan.py)."""
    if e["layer"] in ("duoi", "nghia"):
        return sec_offset(tags[lead["path"]]) if lead else 0.08
    if e["layer"] == "foley":
        return -0.12
    if e["layer"] == "dan":
        v = set(tags[e["path"]]["vai"])
        return -0.03 if "chuyen_canh" in v and not v & {"cham_manh", "nhan_chu"} else 0.0
    return 0.0


def load_wav(path, peak=False):
    """peak=True: |L|,|R| lớn nhất (cùng cách sfx_render tìm đỉnh); mặc định trung bình kênh (đo độ to)."""
    import soundfile as sf
    x, sr = sf.read(path, always_2d=True)
    return (np.abs(x).max(axis=1) if peak else x.mean(axis=1)), sr


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("--out", required=True)
    ap.add_argument("--sfx")
    ap.add_argument("--voice")
    ap.add_argument("--touch")
    ap.add_argument("--bgm", help="nhạc nền ĐÃ né (bgm_ducked.wav) để chấm SFX nổi trên nhạc")
    a = ap.parse_args()
    P = json.load(open(a.plan, encoding="utf-8"))
    fps = P["fps"]
    official = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "library", "sfx-tags.json"))
    tags = {f["path"]: f for f in json.load(open(official, encoding="utf-8"))["files"]}  # luôn chấm theo kho nhãn chính thức
    tags_lech = os.path.normcase(os.path.abspath(P["tags"])) != os.path.normcase(official)
    moments_all = [m for m in P["moments"] if "events" in m]
    moments = [m for m in moments_all if any(e["layer"] == "dan" for e in m["events"])]
    errs = {k: [] for k in ("dong_bo", "phu_du", "dung_nghia", "da_dang", "mat_do", "do_to")}
    if tags_lech:
        errs["dung_nghia"].append(f"plan trỏ kho nhãn khác ({P['tags']}) → chấm theo kho chính thức, trừ điểm")
    card = {"plan": os.path.abspath(a.plan), "items": {}}
    touch = json.load(open(a.touch, encoding="utf-8")) if a.touch else {}

    # 0 Nguồn: bảng mốc gốc phải đúng file đã lập plan, đủ mốc, đúng giây
    src = P.get("nguon") or {}
    import hashlib
    if not src.get("moments") or not os.path.exists(src["moments"]):
        errs["phu_du"].append("plan không trỏ tới moments.json gốc (hoặc file đã mất) → không kiểm được đủ mốc")
        goc = None
    else:
        raw = open(src["moments"], "rb").read()
        if hashlib.sha256(raw).hexdigest() != src.get("moments_sha256"):
            errs["phu_du"].append("moments.json đã đổi sau khi lập plan → lập plan lại")
        goc = {m["id"]: m for m in json.loads(raw.decode("utf-8"))}
    if src.get("words") and (not os.path.exists(src["words"])
                             or hashlib.sha256(open(src["words"], "rb").read()).hexdigest() != src.get("words_sha256")):
        errs["phu_du"].append("words.json đã đổi/mất sau khi lập plan → lập plan lại")

    # 1 Đồng bộ
    bad_plan = set()
    for m in moments_all:
        t_goc = goc[m["id"]]["t"] if goc and m["id"] in goc else m.get("src", {}).get("t", m["t"])
        if abs(m["t"] - t_goc) * fps > 1.0 + 1e-6 or ("src" in m and abs(m["src"]["t"] - t_goc) * fps > 1.0 + 1e-6):
            bad_plan.add(m["id"])
            errs["dong_bo"].append(f"{m['id']}: giây trong plan {m['t']:.3f}s / src {m.get('src', {}).get('t')} lệch bảng mốc gốc {t_goc:.3f}s")
        if False:
            bad_plan.add(m["id"])
            errs["dong_bo"].append(f"{m['id']}: mốc trong plan {m['t']:.3f}s lệch bảng mốc gốc {m['src']['t']:.3f}s "
                                   f"({abs(m['t'] - m['src']['t']) * fps:.1f} khung)")
        tt = touch.get(m["id"], m["t"])
        ld = next((x for x in m["events"] if x["layer"] == "dan"), None)
        for e in m["events"]:
            d = abs(e["t"] - (tt + offset(e, tags, ld))) * fps
            if d > 1.0 + 1e-6:
                bad_plan.add(m["id"])
                errs["dong_bo"].append(f"{m['id']}/{e['layer']}: lệch {d:.1f} khung so với chữ chạm")
    nm = max(1, len(P["moments"]))
    s1 = 20 * (len(moments_all) - len(bad_plan)) / nm
    meas = None
    if a.sfx and os.path.exists(a.sfx + ".placed.json"):
        x, sr = load_wav(a.sfx, peak=True)
        placed = json.load(open(a.sfx + ".placed.json", encoding="utf-8"))
        bad_stem = set()
        meas = []
        for p in placed:
            tg = tags[p["path"]]
            hop = int(sr / fps)
            if p["align"] == "peak":
                # đỉnh CỤM âm (mọi lớp cộng lại) trong ±0.25s quanh điểm neo phải rơi đúng điểm neo
                # cửa sổ ±0.25s, cắt bỏ phần chồng âm của mốc KHÁC (đo đúng cụm của mốc này)
                lo, hi = p["anchor_t"] - 0.25, p["anchor_t"] + 0.25
                for q in placed:
                    if q["moment"] == p["moment"]:
                        continue
                    if q["start"] < p["anchor_t"]:
                        lo = max(lo, min(p["anchor_t"] - 0.02, q["start"] + q["len"]))
                    else:
                        hi = min(hi, max(p["anchor_t"] + 0.02, q["start"]))
                a0, a1 = int(max(0, lo) * sr), int(hi * sr)
                seg = np.abs(x[a0:a1])
                if seg.size < hop:
                    continue
                b = int(sr * 0.005)  # khối 5 ms — cùng độ phân giải với peak_t trong sfx-tags.json
                env = np.array([seg[i:i + b].max() for i in range(0, len(seg) - b + 1, b)])
                t_meas = a0 / sr + int(np.argmax(env >= env.max() * 0.891)) * b / sr  # đỉnh đầu tiên trong 1 dB (cùng định nghĩa sfx_tag)
                t_exp = p["anchor_t"]
            elif p["layer"] in ("duoi", "foley", "nghia"):
                meas.append({"moment": p["moment"], "layer": p["layer"], "ghi_chu": "không chấm riêng: lớp chồng với âm dẫn, đo theo kế hoạch"})
                continue
            else:
                a0 = int(max(0, p["start"]) * sr)
                seg = np.abs(x[a0:a0 + int(0.6 * sr)])
                if seg.size < hop:
                    continue
                env = np.array([seg[i:i + hop].max() for i in range(0, len(seg) - hop + 1, hop // 4)])
                above = np.nonzero(env > env.max() * 10 ** (-30 / 20))[0]  # onset −30 dB (cùng sfx_tag/sfx_render)
                t_meas = p["start"] + (above[0] * (hop // 4) / sr if above.size else 0)
                t_exp = p["anchor_t"] if p.get("anchor_measured") else p["start"] + tg["onset"]
            d = abs(t_meas - t_exp) * fps
            meas.append({"moment": p["moment"], "layer": p["layer"], "do": round(t_meas, 4), "ke_hoach": round(t_exp, 4), "lech_khung": round(d, 2)})
            # đuôi/foley chồng lên âm khác trong cùng mốc → chỉ chấm lớp dẫn + dự báo
            if p["layer"] in ("dan", "du_bao"):
                if d > 1.0 + 1e-6:
                    bad_stem.add(p["moment"])
                    errs["dong_bo"].append(f"{p['moment']}/{p['layer']}: stem đo lệch {d:.1f} khung")
        s1 = 10 * (len(moments_all) - len(bad_plan)) / nm + 10 * (len(moments) - len(bad_stem)) / nm
    card["items"]["dong_bo"] = {"max": 20, "score": round(s1, 2), "do_stem": meas}

    # 2 Phủ đủ
    no_lead = [m["id"] for m in moments_all if not any(e["layer"] == "dan" for e in m["events"])]
    missing_rows = [m["id"] for m in P["moments"] if "events" not in m]
    if goc is not None:
        missing_rows += [i for i in goc if i not in {m["id"] for m in P["moments"]}]  # mốc gốc bị xóa khỏi plan
    orphan = [e for e in P["events"] if e["moment"] not in {m["id"] for m in moments_all}]
    tot = max(len(P["moments"]), len(goc) if goc else 0)
    s2 = 10 * (tot - len(no_lead) - len(missing_rows)) / max(1, tot) - (2 if orphan else 0) - (2 if any("moments.json" in x or "words.json" in x for x in errs["phu_du"]) else 0)
    errs["phu_du"] += [f"{i}: không có âm dẫn" for i in no_lead + missing_rows] + (["có lớp mồ côi"] if orphan else [])
    card["items"]["phu_du"] = {"max": 10, "score": round(max(0, s2), 2)}

    # 3 Đúng nghĩa
    a_ok = b_ok = c_ok = c_all = 0
    for m in moments:
        if "src" not in m:
            errs["dung_nghia"].append(f"{m['id']}: plan thiếu nguồn mốc (src) → không kiểm được ý định")
            m = dict(m, L="L8", nghia_loi=[])
        else:
            L2_, tier2, ng2 = detect(m["src"], m.get("ctx", ""), m["t"], P.get("duration"))
            if P.get("style") == "tam_su" and L2_ in ("L1", "L5", "L12"):
                L2_ = "L10"
            if (L2_, tier2, sorted(ng2)) != (m["L"], m["tier"], sorted(m["nghia_loi"])) or m["tier_am"] not in (tier2, "T1"):
                errs["dung_nghia"].append(f"{m['id']}: nhãn trong plan ({m['L']}/{m['tier']}/{m['tier_am']}/{m['nghia_loi']}) "
                                          f"≠ nhận lại từ chữ ({L2_}/{tier2}/{ng2}) → chấm theo nhận lại")
                m = dict(m, L=L2_, tier=tier2, nghia_loi=ng2, sai_nhan=True)
        need, pst, png, bst, bvai, _, _ = intent(m["L"], m.get("text", ""))
        lead = next(e for e in m["events"] if e["layer"] == "dan")
        f = tags[lead["path"]]
        ok_a = bool(set(f["vai"]) & set(need))
        spec = set(f["nghia"]) & SPECIFIC
        shape = []
        if f.get("multi_hit"):
            shape.append("nhiều cú chạm")
        if f.get("peak_spread", 0) > 0.025:
            shape.append(f"đỉnh mơ hồ (vùng trong 1 dB kéo dài {f['peak_spread']}s > 0.025s)")
        if f["peak_t"] > 0.6 or f["onset"] > 0.3:
            shape.append(f"chạm chậm (đỉnh {f['peak_t']}s, onset {f['onset']}s)")
        if f.get("crest_db", 0) > CREST_MAX.get(m["tier_am"], 99):
            shape.append(f"quá nhọn (crest {f['crest_db']} dB)")
        for r in (e for e in m["events"] if e["layer"] == "du_bao"):
            if tags[r["path"]].get("multi_hit"):
                shape.append(f"riser nhiều cú: {r['path']}")
        from collections import Counter as _C
        kinds = _C("nen" if e["layer"] in ("nghia", "foley") else e["layer"] for e in m["events"] if e["layer"] != "dan")
        cap = {"du_bao": 1, "duoi": 1, "nen": 1}
        if any(v > cap.get(k, 0) for k, v in kinds.items()) or (m["tier_am"] != "T3" and kinds["du_bao"] + kinds["duoi"] > 1):
            shape.append(f"thừa lớp phụ {dict(kinds)} (tối đa 1 lớp phụ nghe rõ; T3 được dâng + đuôi; + 1 lớp nghĩa/foley)")
        for e in m["events"]:
            if e["layer"] == "dan":
                continue
            g = tags[e["path"]]
            sp = set(g["nghia"]) & SPECIFIC
            if g["sac_thai"] in bst or (sp and not sp <= set(m["nghia_loi"] + png)):
                shape.append(f"lớp {e['layer']} dính cấm ({g['sac_thai']}, nghĩa {sorted(sp)}): {e['path']}")
        lay3 = INTENT[m["L"]][5] or ""
        prev = [x for x in moments_all if x["t"] < m["t"]]
        if "du_bao" in lay3 and m["tier_am"] == "T3" and (not prev or m["t"] - max(x["t"] for x in prev) >= 2.0) \
                and not kinds["du_bao"] and m["t"] >= 1.0:
            shape.append("T3 có chỗ trống ≥ 2s mà không có riser dự báo (luật 3)")
        game = [e["path"] for e in m["events"] if tags[e["path"]].get("game")]
        if game and P.get("style") != "hype":
            shape.append(f"tiếng game ngoài style hype: {game}")
        if m.get("sai_nhan"):
            shape.append("nhãn ý định/bậc/nghĩa bị sửa tay")
        if shape:
            errs["dung_nghia"].append(f"{m['id']}: hình âm sai — " + "; ".join(shape))
        ok_b = (f["sac_thai"] not in bst and not (set(f["vai"]) & set(bvai)) and (f["cat"] != "Glitch" or P.get("style") == "hype")
                and not (spec and not spec <= set(m["nghia_loi"] + png)) and not shape)
        a_ok += ok_a
        b_ok += ok_b
        if not ok_a:
            errs["dung_nghia"].append(f"{m['id']} ({m['L']}): âm dẫn vai {f['vai']} không thuộc {need}")
        if not ok_b:
            if not shape:
                errs["dung_nghia"].append(f"{m['id']} ({m['L']}): âm dẫn dính cấm ({f['sac_thai']}/{f['vai']}/{f['cat']})")
        wanted = [n for n in m["nghia_loi"] if any(n in t["nghia"] and t["sac_thai"] not in bst and t["cat"] != "Glitch"
                                                      and (not t.get("game") or P.get("style") == "hype")
                                                      and not set(t["vai"]) & set(bvai) for t in tags.values())]
        wanted = [n for n in wanted if n in png or n in ("tien", "giay_to", "dien_thoai", "camera", "thang_may", "dong_ho", "xe", "thong_bao", "ban_do")]
        if wanted:
            c_all += 1
            hit = any(n in tags[e["path"]]["nghia"] for e in m["events"] for n in wanted)
            c_ok += hit
            if not hit:
                errs["dung_nghia"].append(f"{m['id']}: lời có nghĩa {wanted} nhưng không lớp nào mang nghĩa đó")
    k = max(1, len(P["moments"]))
    s3 = 12 * a_ok / k + 8 * b_ok / k + 5 * (c_ok / c_all if c_all else 1) - (5 if tags_lech else 0)
    card["items"]["dung_nghia"] = {"max": 25, "score": round(max(0, s3), 2)}

    # 4 Đa dạng
    from collections import Counter
    leads = [(m, next(e for e in m["events"] if e["layer"] == "dan")) for m in moments]
    cnt = Counter()
    seen_grp = set()
    for e in P["events"]:
        if e.get("group"):
            if (e["group"], e["path"]) in seen_grp:
                continue  # thang nốt: cả nhóm tính 1 lần
            seen_grp.add((e["group"], e["path"]))
        cnt[e["path"]] += 1  # đổi cao độ KHÔNG có group vẫn tính là một lần dùng
    over = {p: c for p, c in cnt.items() if c > 2}
    s4a = 5 if not over else max(0, 5 - 2.5 * len(over))
    errs["da_dang"] += [f"file dùng {c} lần: {p}" for p, c in over.items()]
    same_grp = lambda a, b: bool(a.get("group")) and a.get("group") == b.get("group")
    cons = sum(1 for i in range(1, len(leads)) if leads[i][1]["path"] == leads[i - 1][1]["path"]
               and not same_grp(leads[i][1], leads[i - 1][1]))
    s4b = 5 if not cons else max(0, 5 - 2.5 * cons)
    if cons:
        errs["da_dang"].append(f"{cons} cặp mốc liền dùng cùng file")
    fam = [tags[e["path"]]["ho"] for i, (_, e) in enumerate(leads) if not (i and same_grp(e, leads[i - 1][1]))]
    tri = sum(1 for i in range(2, len(fam)) if fam[i] == fam[i - 1] == fam[i - 2])
    bad_c = tri
    if tri:
        errs["da_dang"].append(f"{tri} lần 3 mốc liền cùng họ âm")
    src_grp = {m["id"]: (m.get("src") or {}).get("group") for m in moments}
    for g in {e["group"] for _, e in leads if e.get("group")}:
        mem = [(m, e) for m, e in leads if e.get("group") == g]
        pit = [e.get("pitch", 0) for _, e in mem]
        okg = (len({e["path"] for _, e in mem}) == 1 and pit == [2 * i for i in range(len(mem))]
               and all(m["L"] in ("L4", "L6") or src_grp.get(m["id"]) == g for m, _ in mem))
        if not okg:
            bad_c += 1
            errs["da_dang"].append(f"thang nốt '{g}' không hợp lệ (cùng file, +2 nửa cung mỗi mục, chỉ L4/L6 hoặc group do Dũng đặt): {pit}")
    for m, e in leads:
        for x in m["events"]:
            if x["layer"] == "duoi" and tags[x["path"]]["ho"] == tags[e["path"]]["ho"]:
                bad_c += 1
                errs["da_dang"].append(f"{m['id']}: đuôi cùng họ với âm dẫn ({tags[e['path']]['ho']})")
    tails = [tags[x["path"]]["ho"] for m, _ in leads for x in m["events"] if x["layer"] == "duoi"]
    t3 = sum(1 for i in range(2, len(tails)) if tails[i] == tails[i - 1] == tails[i - 2])
    if t3:
        bad_c += 1
        errs["da_dang"].append(f"đuôi không xoay họ: {t3} lần 3 đuôi liền cùng họ")
    capf = max(1, round(0.3 * len(P["moments"])))
    fc = Counter(fam)
    for h, c in fc.items():
        if c > capf:
            bad_c += 1
            errs["da_dang"].append(f"họ âm dẫn '{h}' dùng {c} mốc (> {capf} = 30% số mốc)")
    s4c = max(0, 5 - 2.5 * bad_c)
    vc = Counter(next((v for v in tags[e["path"]]["vai"] if v in INTENT[m["L"]][0]), tags[e["path"]]["vai"][0]) for m, e in leads)
    top = vc.most_common(1)[0][1] / len(leads) if leads else 0
    hc = Counter(tags[e["path"]]["ho"] for e in P["events"] if not (e.get("group") and e.get("pitch")))
    topho = hc.most_common(1)[0][1] / max(1, sum(hc.values())) if hc else 0
    s4d = (2.5 if (len(leads) < 4 or top <= 0.5) else 0) + (2.5 if (sum(hc.values()) < 6 or topho <= 0.5) else 0)
    if len(leads) >= 4 and top > 0.5:
        errs["da_dang"].append(f"một vai chiếm {top:.0%} âm dẫn: {vc.most_common(1)}")
    if sum(hc.values()) >= 6 and topho > 0.5:
        errs["da_dang"].append(f"một họ âm chiếm {topho:.0%} mọi lớp: {hc.most_common(1)}")
    card["items"]["da_dang"] = {"max": 20, "score": round(s4a + s4b + s4c + s4d, 2),
                                "detail": {"file_khac_nhau": len(set(e["path"] for e in P["events"])), "tong_lop": len(P["events"])}}

    # 5 Mật độ
    ts = sorted(m["t"] for m in moments)
    win = max((sum(1 for u in ts if t <= u < t + 1.0) for t in ts), default=0)
    s5a = 4 if win <= 2 else 0
    if win > 2:
        errs["mat_do"].append(f"{win} mốc có âm trong 1 giây")
    clear = [m["t"] for m in moments if m["tier_am"] in ("T2", "T3")]
    close = sum(1 for i in range(1, len(clear)) if clear[i] - clear[i - 1] < 3.0 - 1e-6)
    s5b = 4 if not close else max(0, 4 - 2 * close)
    if close:
        errs["mat_do"].append(f"{close} cặp âm rõ cách nhau < 3s")
    t3 = [m["t"] for m in moments if m["tier_am"] == "T3"]
    crowd = sum(1 for t in t3 for u in ts if 0 < u - t < 0.5)
    s5c = 3 if not crowd else 0
    if crowd:
        errs["mat_do"].append(f"{crowd} mốc chen trong 0.5s sau cú T3")
    # tràn: lớp kêu qua mốc sau / riser kêu quá khung chạm (dùng vị trí đã trộn thật nếu có)
    order = sorted(moments_all, key=lambda m: m["t"])
    nxt_t = {m["id"]: (order[i + 1]["t"] if i + 1 < len(order) else 1e9) for i, m in enumerate(order)}
    pl = json.load(open(a.sfx + ".placed.json", encoding="utf-8")) if a.sfx and os.path.exists(a.sfx + ".placed.json") else None
    spans = []
    if pl:
        spans = [(p["moment"], p["layer"], p["start"], p["start"] + p["len"], p["anchor_t"]) for p in pl]
    else:
        for e in P["events"]:
            tg = tags[e["path"]]
            r = 2 ** (e.get("pitch", 0) / 12)
            anc = tg["peak_t"] if e["align"] == "peak" else tg["onset"]
            ln = min(e.get("dur") or tg["dur"], tg["dur"])
            spans.append((e["moment"], e["layer"], e["t"] - anc / r, e["t"] - anc / r + ln / r, e["t"]))
    over = []
    for mid, lay, st, en, anc in spans:
        if mid in nxt_t and en > nxt_t[mid] - 0.15 + 1 / fps:
            over.append(f"{mid}/{lay}: kêu tới {en:.2f}s, qua mốc sau ({nxt_t[mid]:.2f}s − 0.15)")
        if lay == "du_bao" and en > anc + 0.1 + 1 / fps:
            over.append(f"{mid}/du_bao: riser kêu tới {en:.2f}s, quá khung chạm {anc:.2f}s")
    if a.sfx and pl:
        xs2, sr2 = load_wav(a.sfx, peak=True)
        mask = np.zeros(len(xs2), bool)
        for p in pl:
            mask[max(0, int((p["start"] - 0.02) * sr2)): int((p["start"] + p["len"] + 0.02) * sr2)] = True
        stray = np.nonzero((~mask) & (xs2 > 10 ** (-50 / 20)))[0]
        if stray.size:
            over.append(f"có âm ngoài mọi lớp kế hoạch (từ {stray[0] / sr2:.2f}s, đỉnh {20 * np.log10(xs2[stray].max()):.1f} dBFS)")
        for m in moments_all:
            ld = next((p for p in pl if p["moment"] == m["id"] and p["layer"] == "dan"), None)
            if not ld:
                continue
            t0 = ld["anchor_t"]
            end = max(p["start"] + p["len"] for p in pl if p["moment"] == m["id"])
            hit = xs2[max(0, int((t0 - 0.05) * sr2)): int((t0 + 0.15) * sr2)]
            aft = xs2[int((t0 + 0.2) * sr2): int(end * sr2)]
            # cú chạm thứ hai = âm BẬT LẠI (≥ 6 dB trên chỗ lõm trước nó) tới ngang âm dẫn; âm ngân/dâng liền mạch không tính
            b10 = int(sr2 * 0.01)
            seg = xs2[int((t0 + 0.05) * sr2): int(end * sr2)]
            env = np.array([seg[i:i + b10].max() for i in range(0, len(seg) - b10 + 1, b10)]) if seg.size > b10 else np.zeros(0)
            k0 = 15  # bỏ 0.15s đầu (thân âm dẫn)
            ref = ld.get("peak") or (hit.max() if hit.size else 0)
            # lớp phụ: đỉnh riêng từng lớp (render ghi) thấp hơn âm dẫn ≥ 9 dB
            for p in pl:
                if p["moment"] == m["id"] and p["layer"] != "dan" and p.get("peak", 0) > ref * 10 ** (-9 / 20) * 1.012:
                    over.append(f"{m['id']}/{p['layer']}: lớp phụ chỉ thấp hơn âm dẫn {20 * np.log10(ref / p['peak']):.1f} dB (cần ≥ 9)")
            # âm dẫn tự bật lại ngang đỉnh (trong 3 dB) ở vùng chỉ có âm dẫn kêu
            phu = [(p["start"], p["start"] + p["len"]) for p in pl if p["moment"] == m["id"] and p["layer"] != "dan"]
            for i in range(k0, env.size):
                tau = t0 + 0.05 + i * 0.01
                if ref <= 0 or env[i] < env[:i].min() * 2 or any(a0 <= tau <= a1 for a0, a1 in phu):
                    continue
                if env[i] >= ref * 10 ** (-3 / 20):
                    over.append(f"{m['id']}: âm dẫn bật lại ở {tau:.2f}s ngang đỉnh (nhiều cú chạm)")
                    break
        # stem phải đúng là bản trộn của plan: dựng lại bằng sfx_render rồi so từng mẫu (bắt âm chèn tay vào stem)
        if a.voice and P.get("duration"):
            import tempfile, soundfile as _sf
            from sfx_render import render as _render, SR as _SR
            vv, vsr = _sf.read(a.voice, always_2d=True)
            tmpd = tempfile.mkdtemp()
            _render(P["events"], tags, P["duration"], os.path.join(tmpd, "re.wav"), vv.mean(axis=1) if vsr == _SR else None)
            y, _ = _sf.read(os.path.join(tmpd, "re.wav"), always_2d=True)
            x0, _ = _sf.read(a.sfx, always_2d=True)
            n0 = min(len(y), len(x0))
            dif = np.abs(x0[:n0] - y[:n0]).max(axis=1) if n0 else np.zeros(1)
            if len(y) != len(x0) or dif.max() > 10 ** (-60 / 20):
                k = int(np.argmax(dif))
                over.append(f"stem SFX khác bản dựng lại từ plan (lệch {20 * np.log10(dif.max() + 1e-12):.1f} dBFS tại {k / _SR:.2f}s) → stem bị sửa tay hoặc plan đổi sau khi trộn")
    s5d = max(0, 4 - 1 * len(over))
    errs["mat_do"] += over
    card["items"]["mat_do"] = {"max": 15, "score": s5a + s5b + s5c + s5d}

    # 6 Độ to
    vol_ok = sum(1 for m in moments for e in m["events"]
                 if abs(e["vol"] - (VOL[m["tier_am"]] if e["layer"] == "dan" else VOL["pre"] if e["layer"] == "du_bao" else VOL["tail"])) < 1e-6)
    s6a = 1 * vol_ok / max(1, sum(len(m["events"]) for m in moments))
    if a.sfx:
        xs, _ = load_wav(a.sfx, peak=True)
        pk_db = 20 * np.log10(float(np.abs(xs).max()) + 1e-12)
        s6a += 2 if pk_db <= -3.0 else 0
        if pk_db > -3.0:
            errs["do_to"].append(f"đỉnh stem SFX {pk_db:.1f} dBFS (cần ≤ −3)")
    s6b, rel = 0.0, []
    if a.sfx and a.voice:
        x, sr = load_wav(a.sfx)
        v, sv = load_wav(a.voice)
        rms = lambda s: 20 * np.log10(np.sqrt(np.mean(s ** 2)) + 1e-12)
        ok = 0
        for m, e in leads:
            c = int(e["t"] * sr)
            s = x[max(0, c - int(0.05 * sr)): c + int(0.15 * sr)]
            cv = int(e["t"] * sv)
            vv = v[max(0, cv - int(1.0 * sv)): cv + int(1.0 * sv)]
            vv = vv[np.abs(vv) > 10 ** (-40 / 20)] if vv.size else vv
            if s.size == 0 or vv.size < sv * 0.1:
                rel.append({"moment": m["id"], "ghi_chu": "không có giọng quanh mốc"})
                ok += 1
                continue
            d = rms(s) - rms(vv)
            rel.append({"moment": m["id"], "sfx_tru_giong_dB": round(d, 2)})
            good = -6 <= d <= -1
            ok += good
            if not good:
                errs["do_to"].append(f"{m['id']}: SFX − giọng = {d:.1f} dB (cần −6…−1: to rõ, không to hơn giọng)")
        s6b = 3 * ok / max(1, len(leads))
        if a.bgm:
            b, sb = load_wav(a.bgm)
            okb = 0
            for m, e in leads:
                c, cb = int(e["t"] * sr), int(e["t"] * sb)
                s_ = x[max(0, c - int(0.05 * sr)): c + int(0.15 * sr)]
                bb = b[max(0, cb - int(0.05 * sb)): cb + int(0.15 * sb)]
                d2 = rms(s_) - rms(bb) if bb.size else 99
                rel_m = next(r for r in rel if r["moment"] == m["id"])
                rel_m["sfx_tru_nhac_dB"] = round(d2, 2)
                okb += d2 >= NOI_NHAC_MIN
                if d2 < NOI_NHAC_MIN:
                    errs["do_to"].append(f"{m['id']}: SFX chỉ nổi {d2:.1f} dB trên nhạc nền (cần ≥ {NOI_NHAC_MIN})")
            s6b += 2 * okb / max(1, len(leads))
            lev = os.path.join(os.path.dirname(os.path.abspath(a.bgm)), "bgm_lev.wav")
            if os.path.exists(lev):
                L0, _ = load_wav(lev)
                n2 = min(len(L0), len(b))
                hop = int(sb * 0.1)
                gdb = np.array([rms(b[i:i + hop]) - rms(L0[i:i + hop]) for i in range(0, n2 - hop, hop) if rms(L0[i:i + hop]) > -60])
                tt = np.array([i / sb for i in range(0, n2 - hop, hop) if rms(L0[i:i + hop]) > -60])
                low = tt[gdb < -1.0]
                far = [x for x in low if not any(-2.6 <= x - m["t"] <= 3.0 for m in moments_all)]
                deep = float(gdb.min()) if gdb.size else 0.0
                r_ = __import__("subprocess").run(["ffmpeg", "-nostats", "-i", lev, "-af", "ebur128", "-f", "null", "-"],
                                                  capture_output=True, text=True, encoding="utf-8", errors="replace")
                Il = [float(x.split()[1]) for x in r_.stderr.splitlines() if x.strip().startswith("I:") and "LUFS" in x]
                lufs = Il[-1] if Il else -99.0
                rel.append({"nhac_lufs_truoc_ha": lufs})
                # Dũng chốt 01/11/2026: mức nhạc theo đoạn không tính điểm, chỉ báo số đo (kiểm bằng ebur128 ở cổng G5)
                rel.append({"nhac_ha_sau_nhat_dB": round(deep, 2), "giay_nhac_ha_ngoai_moc": len(far) * 0.1})
                s6b += 2
                print(f"  [mức nhạc, không tính điểm] {lufs:.1f} LUFS, hạ sâu nhất {deep:.1f} dB, {len(far) * 0.1:.1f}s hạ ngoài mốc")
            else:
                errs["do_to"].append("thiếu bgm_lev.wav cạnh nhạc đã né → không kiểm được nhạc đều (0 điểm phần này)")
        else:
            errs["do_to"].append("chưa có --bgm (nhạc đã né) → phần nổi trên nhạc = 0")
    else:
        errs["do_to"].append("chưa có stem SFX + giọng thật → phần đo độ to = 0")
    card["items"]["do_to"] = {"max": 10, "score": round(s6a + s6b, 2), "do": rel}

    card["loi"] = {k: v for k, v in errs.items() if v}
    card["total"] = round(sum(v["score"] for v in card["items"].values()), 2)
    card["pass_100"] = all(v["score"] >= v["max"] - 1e-9 for v in card["items"].values())
    json.dump(card, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"TỔNG {card['total']}/100 " + " | ".join(f"{k} {v['score']}/{v['max']}" for k, v in card["items"].items()))
    for k, v in card["loi"].items():
        for x in v[:6]:
            print(f"  ✗ [{k}] {x}")


if __name__ == "__main__":
    main()
