# Lọc mẫu MG từ thư viện Opus 5.5 theo mốc trong video. Chỉ đọc, không tải gì.
# Chạy: python chon_mau_mg.py <mốc> [--so 5] [--thu-vien <đường dẫn thu_vien.json>]
import argparse
import json
import os
import re
import sys
from pathlib import Path

# Nhãn `kieu` trong thư viện đoán theo từ khóa rộng ("text", "data", "map"), nên mỗi mốc có từ khóa hẹp riêng.
MOC = {
    "gia": ("Số liệu, biểu đồ", r"count(er|ing)?[- ]?up|counter|number|ticker|price|percent|\bstats?\b"),
    "dien_tich": ("Số liệu, biểu đồ", r"count(er|ing)?[- ]?up|counter|number|ticker|measure|dimension|floor ?plan|\bstats?\b"),
    "hook": ("Chữ động", r"kinetic|typograph|\bhook\b|title (card|reveal|sequence)|text (reveal|animation)"),
    "diem_manh": ("Chữ động", r"kinetic|typograph|text (reveal|animation)|word by word|keyword|highlight"),
    "vi_tri": ("Bản đồ, địa cầu", r"\bmaps?\b|\broute\b|\bpin\b|location|satellite|\bcity\b|street|navigation"),
    "chuyen_canh": ("Chuyển cảnh", r"transition|\bwipe\b|\bmorph|match cut|scene change"),
}
# Dễ đưa về timeline GSAP và tua đúng khung thì cộng điểm; phải viết lại nhiều thì trừ điểm.
DE_DUNG = {"gsap", "svg", "css"}
KHO_DUNG = {"canvas", "shader", "threejs", "webgl", "physics"}


def duong_dan_mac_dinh():
    goc = os.environ.get("HD_VIDEO_HOME") or str(Path.home() / "HDRE AI")
    return Path(goc) / "asset" / "mg_opus55" / "thu_vien.json"


def cham_diem(mau, tu_khoa):
    text = mau.get("prompt") or ""
    khop = {m.group(0).lower() for m in tu_khoa.finditer(text)}
    if not khop:
        return 0, []
    cn = set(mau.get("cong_nghe") or [])
    diem = len(khop) * 2 + len(cn & DE_DUNG) - len(cn & KHO_DUNG)
    if mau.get("loai") == "Motion graphics":
        diem += 2
    if re.search(r"9:16|vertical|portrait", text, re.I):
        diem += 1
    return diem, sorted(khop)


def loc(ds, moc, so):
    kieu, mau_regex = MOC[moc]
    tu_khoa = re.compile(mau_regex, re.I)
    ket_qua = []
    for m in ds:
        if m.get("prompt_thieu") or not (m.get("video") or m.get("video_lam_lai")):
            continue
        if m.get("loai") == "Tương tác / game" or "playable" in (m.get("cong_nghe") or []):
            continue
        if kieu not in (m.get("kieu") or []):
            continue
        diem, khop = cham_diem(m, tu_khoa)
        if khop:
            ket_qua.append((diem, m, khop))
    ket_qua.sort(key=lambda x: (-x[0], x[1]["ma"]))
    return ket_qua[:so], len(ket_qua)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser()
    p.add_argument("moc", choices=MOC)
    p.add_argument("--so", type=int, default=5)
    p.add_argument("--thu-vien", type=Path, default=duong_dan_mac_dinh())
    a = p.parse_args()
    ds = json.loads(a.thu_vien.read_text(encoding="utf-8"))
    chon, tong = loc(ds, a.moc, a.so)
    print(f"{a.moc}: {tong} mẫu khớp, hiện {len(chon)}")
    for diem, m, khop in chon:
        print(json.dumps({
            "ma": m["ma"], "diem": diem, "loai": m["loai"], "cong_nghe": m["cong_nghe"], "khop": khop,
            "video": m.get("video") or m.get("video_lam_lai"), "nguon": m["bai_goc"], "tac_gia": m["tac_gia"],
        }, ensure_ascii=False))


if __name__ == "__main__":
    main()
