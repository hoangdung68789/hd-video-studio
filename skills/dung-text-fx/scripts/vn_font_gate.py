"""Cổng tiếng Việt cho font (dung-text-fx).

Dùng:
  python vn_font_gate.py <font> [<font> ...] [--text "câu chữ thật"] [--proof <thư mục ảnh>] [--size 96] [--json out.json]
  python vn_font_gate.py --scan <thư mục>            # quét nhanh cmap mọi font trong thư mục (không vẽ ảnh)

Kiểm 2 lớp:
  1. Máy: đọc bảng cmap, liệt kê ký tự trong 134 chữ có dấu (67 thường + 67 hoa) bị thiếu glyph,
     cộng thêm ký tự của --text. Thiếu glyph = trình duyệt sẽ rơi về font khác cho ký tự đó.
  2. Mắt: vẽ ảnh bằng CHÍNH font đó (PIL không có fallback → ký tự thiếu hiện ô vuông/khoảng trống),
     kèm khung "dấu" để thấy dấu bị cắt khỏi ô dòng (line-height 1.0).
Lỗi → in đúng mẫu cảnh báo Dũng yêu cầu, exit code 2.
"""
import argparse, json, os, sys, unicodedata
from fontTools.ttLib import TTFont, TTCollection

LOWER = ("àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ")
VN = LOWER + LOWER.upper()
assert len(VN) == 134, len(VN)
SAMPLE1 = "Ả Ằ Ẳ Ẵ Ấ Ầ Ẩ Ẫ Ậ Ế Ệ Ộ Ợ Ự Ữ Ỳ Ỹ ả ằ ẳ ẵ ấ ầ ẩ ẫ ậ ế ệ ộ ợ ự ữ"
SAMPLE2 = "MỖI NGÔI NHÀ MỘT CÂU CHUYỆN"


def load(path, index=0):
    if path.lower().endswith((".ttc", ".otc")):
        return TTCollection(path).fonts[index]
    return TTFont(path, lazy=True)


def info(path):
    f = load(path)
    cmap = f.getBestCmap() or {}
    name = f["name"]
    fam = name.getBestFamilyName() or os.path.basename(path)
    sub = name.getBestSubFamilyName() or ""
    return f, cmap, fam, sub


def check(path, text=""):
    f, cmap, fam, sub = info(path)
    need = sorted(set(VN + "".join(c for c in unicodedata.normalize("NFC", text) if not c.isspace())))
    missing = [c for c in need if ord(c) not in cmap]
    return {"file": path, "family": fam, "style": sub, "glyphs": len(cmap),
            "missing": missing, "vn_missing": [c for c in missing if c in VN]}


def proof(path, out_png, text="", size=96):
    from PIL import Image, ImageDraw, ImageFont
    lines = [SAMPLE1[:33], SAMPLE1[34:], SAMPLE2] + ([unicodedata.normalize("NFC", text)] if text else [])
    font = ImageFont.truetype(path, size)
    small = ImageFont.truetype(path, int(size * 0.55))
    W = 60 + max(int(font.getlength(l)) for l in lines)
    H = 60 + len(lines) * int(size * 1.6)
    img = Image.new("RGB", (min(W, 4000), H), (24, 24, 28))
    d = ImageDraw.Draw(img)
    y = 30
    for i, l in enumerate(lines):
        fnt = font
        # ô dòng line-height 1.0 (vạch đỏ) — dấu vượt khỏi ô = sẽ bị mask/overflow:hidden cắt nếu không có padding
        d.rectangle([20, y + int(size * 0.3), W - 20, y + int(size * 1.3)], outline=(170, 40, 40))
        d.text((30, y + int(size * 0.3)), l, font=fnt, fill=(255, 255, 255))
        y += int(size * 1.6)
    d.text((30, H - 26), os.path.basename(path), font=ImageFont.load_default(), fill=(140, 140, 140))
    os.makedirs(os.path.dirname(out_png) or ".", exist_ok=True)
    img.save(out_png)
    return out_png


def warn(r, png, alt="<font gần nhất đã đạt cổng>"):
    return (f"⚠️ Font {r['family']} {r['style']} lỗi tiếng Việt: thiếu glyph (trình duyệt sẽ lấy ký tự từ font khác) "
            f"ở ký tự {' '.join(r['missing'])}. Ảnh: {png}. Lựa chọn: (1) đổi sang {alt}, "
            f"(2) giữ font gốc cho chữ không dấu, font khác cho chữ có dấu [nếu khả thi], (3) giữ nguyên chấp nhận lỗi.")


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định GBK
    ap = argparse.ArgumentParser()
    ap.add_argument("fonts", nargs="*")
    ap.add_argument("--text", default="")
    ap.add_argument("--proof", default="")
    ap.add_argument("--size", type=int, default=96)
    ap.add_argument("--json", default="")
    ap.add_argument("--alt", default="<font gần nhất đã đạt cổng>")
    ap.add_argument("--scan", default="")
    a = ap.parse_args()
    if a.scan:
        rows = []
        for root, _, files in os.walk(a.scan):
            for fn in files:
                if fn.lower().endswith((".ttf", ".otf")):
                    p = os.path.join(root, fn)
                    try:
                        r = check(p)
                    except Exception as e:  # font hỏng/không đọc được
                        continue
                    rows.append({k: r[k] for k in ("file", "family", "style", "glyphs")} | {"vn_missing": len(r["vn_missing"])})
        print(json.dumps(rows, ensure_ascii=False))
        return
    results, bad = [], 0
    for p in a.fonts:
        r = check(p, a.text)
        png = ""
        if a.proof:
            png = proof(p, os.path.join(a.proof, os.path.splitext(os.path.basename(p))[0] + ".png"), a.text, a.size)
        r["proof"] = png
        r["status"] = "đạt" if not r["missing"] else "lỗi"
        results.append(r)
        if r["missing"]:
            bad += 1
            print(warn(r, png or "(chưa vẽ ảnh, thêm --proof)", a.alt))
        else:
            print(f"✅ {r['family']} {r['style']}: đủ 134/134 ký tự có dấu" + (" + câu chữ thật" if a.text else "") + (f". Ảnh: {png}" if png else ""))
    if a.json:
        json.dump(results, open(a.json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    sys.exit(2 if bad else 0)


if __name__ == "__main__":
    main()
