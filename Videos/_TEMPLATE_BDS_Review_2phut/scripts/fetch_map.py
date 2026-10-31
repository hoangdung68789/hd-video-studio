# Satellite hybrid mosaics (Esri World Imagery + Esri Vietnamese road labels) centred on the pin.
# z15 = wide opening shot, z16 = final framing. Writes hf/assets/map/z15.jpg, z16.jpg + map.json.
import json, math, io, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "hf" / "assets" / "map"; OUT.mkdir(parents=True, exist_ok=True)
CACHE = ROOT / "work" / "map" / "tiles"; CACHE.mkdir(parents=True, exist_ok=True)
import sys; sys.path.insert(0, str(ROOT))
import project as P
PIN = P.MAP_PIN  # Dũng's Google Maps link, not the house number
BASE = "https://server.arcgisonline.com/ArcGIS/rest/services/{}/MapServer/tile/{}/{}/{}"
LAYERS = {15: ["World_Imagery", "Reference/World_Transportation", "Reference/World_Boundaries_and_Places"],
          16: ["World_Imagery", "Reference/World_Transportation"]}
SIZE = {15: (2400, 4270), 16: (2200, 3900)}  # mosaic px


def world(lat, lon, z):
    n = 256 * 2 ** z
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n


def tile(layer, z, y, x):
    f = CACHE / f"{layer.replace('/', '_')}_{z}_{y}_{x}.png"
    if not f.exists():
        req = urllib.request.Request(BASE.format(layer, z, y, x), headers={"User-Agent": "HDRE-video-map/1.0"})
        f.write_bytes(urllib.request.urlopen(req, timeout=30).read())
    return Image.open(f).convert("RGBA")


meta = {"pin": PIN}
for z, (w, h) in SIZE.items():
    cx, cy = world(*PIN, z)
    x0, y0 = cx - w / 2, cy - h / 2
    tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int((x0 + w) // 256), int((y0 + h) // 256)
    jobs = [(L, z, ty, tx) for L in LAYERS[z] for ty in range(ty0, ty1 + 1) for tx in range(tx0, tx1 + 1)]
    with ThreadPoolExecutor(8) as ex:
        tiles = list(ex.map(lambda j: tile(*j), jobs))
    canvas = {L: Image.new("RGBA", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256)) for L in LAYERS[z]}
    for (L, _, ty, tx), im in zip(jobs, tiles):
        canvas[L].paste(im, ((tx - tx0) * 256, (ty - ty0) * 256))
    base = canvas["World_Imagery"].convert("RGB")
    base = ImageEnhance.Brightness(base).enhance(1.18)
    base = ImageEnhance.Contrast(base).enhance(1.06)
    base = ImageEnhance.Color(base).enhance(1.12).convert("RGBA")
    for L in LAYERS[z][1:]:
        base.alpha_composite(canvas[L])
    ox, oy = int(x0 - tx0 * 256), int(y0 - ty0 * 256)
    base.crop((ox, oy, ox + w, oy + h)).convert("RGB").save(OUT / f"z{z}.jpg", quality=90)
    mpp = 156543.03392 * math.cos(math.radians(PIN[0])) / 2 ** z
    meta[f"z{z}"] = {"w": w, "h": h, "x0": x0, "y0": y0, "mpp": mpp}
    print(z, len(jobs), "tiles", w, h, round(mpp, 3), "m/px")
json.dump(meta, open(OUT / "map.json", "w"), indent=1)
