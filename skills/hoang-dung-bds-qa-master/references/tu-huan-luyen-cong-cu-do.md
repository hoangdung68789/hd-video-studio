# hoang-dung-bds-qa-master — §7–8 Tự huấn luyện, công cụ đo (script)

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

## 7. Tự huấn luyện (dùng chung kho với video-master Phần VI)

**Nơi lưu:** `HDRE_Library/training/`.
- `rules.md`: luật mã **R-Q…**, ghi "Phạm vi: qa-master".
- `feedback_log.md`: mỗi quyết định của Dũng.
- `qa_log.csv`: video, phiên bản, số lỗi theo nhãn, lỗi do skill nào gây ra.

**Điểm tin cậy** như effect-lab Bước 8.3:
- luật AI rút ra: 40 điểm;
- luật Dũng dạy ("Dạy AI: …"): 85 điểm;
- được xác nhận đúng: +15; bị sửa ngược: −25;
- từ 70 điểm trở lên: áp dụng mặc định.

**Khung báo cáo** `[BÀI HỌC TỰ HUẤN LUYỆN & NÂNG CẤP QA MASTER]`. Chỉ xuất khi có lỗi mới hoặc quyết định mới của Dũng; mỗi mục 1-3 dòng:
1. Nguyên nhân gốc rễ: lỗi xuất hiện ở đầu vào hay đầu ra, do skill nào.
2. Quyết định thực tế của Dũng: dùng làm khuôn mẫu.
3. Quy tắc mới: thêm vào bộ lọc QA.

**"Truyền sang các skill khác"** nghĩa là ghi luật vào kho chung, vì mọi skill đều nạp `rules.md` trước khi làm. Luật chỉ được đưa vào SKILL.md của bất kỳ skill nào khi Dũng duyệt.

**Thước đo tiến bộ:** số lỗi mỗi Preview, số vòng sửa đến khi duyệt, tỷ lệ lỗi bắt được ở Chặng 1 so với lỗi chỉ lộ ra ở Chặng 2.

Không kết nối được máy thì cuối phản hồi thêm khối `📌 BÀI HỌC CẦN LƯU`.

## 8. Công cụ đo (đã chạy thử 16/10/2026)

Chạy thử trên video mẫu bản đồ 3D (Điểm A → AEON MALL Tân Phú), hai công cụ bắt được 9 lỗi thật:
- thanh dẫn đường nằm trong vùng cấm trên;
- chip "5 phút" và dòng ghi nguồn nằm trong vùng cấm dưới;
- tiêu đề kết rộng hơn vùng an toàn;
- nhãn chồng nhau khi kéo ra toàn cảnh.

**Công cụ A – ảnh tổng hợp có khung an toàn** (soát bằng mắt, dùng cho mọi video, kể cả bản dựng ngoài):
```python
# python3 safezone_sheet.py video.mp4 out.jpg 0.5,3,8,12,...
import sys, subprocess, json, os
from PIL import Image, ImageDraw
src, out, times = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3].split(',')]
s = json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',src]))['streams'][0]
W, H = s['width'], s['height']; k = W/1080; X0, X1, Y0, Y1 = 70*k, 910*k, 220*k, 1480*k
tiles = []
for t in times:
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',src,'-frames:v','1','_f.png'], check=True)
    im = Image.open('_f.png').convert('RGBA'); ov = Image.new('RGBA', im.size); d = ImageDraw.Draw(ov)
    for b in [(0,0,W,Y0),(0,Y1,W,H),(0,Y0,X0,Y1),(X1,Y0,W,Y1)]: d.rectangle(b, fill=(255,0,0,70))
    d.rectangle((X0,Y0,X1,Y1), outline=(0,255,0,255), width=max(2,int(3*k))); d.text((8,8), f'{t:.1f}s', fill=(255,255,0,255))
    tiles.append(Image.alpha_composite(im, ov).convert('RGB').resize((W//2, H//2)))
os.remove('_f.png'); c = min(6, len(tiles)); r = (len(tiles)+c-1)//c
sheet = Image.new('RGB', (c*W//2, r*H//2), 'white')
for i, im in enumerate(tiles): sheet.paste(im, ((i%c)*W//2, (i//c)*H//2))
sheet.save(out, quality=88)
```

**Công cụ B – đo tự động hộp bao từng lớp chữ/MG** (trang HTML có hàm `setTime(t)`, như bộ MG của lab; với Remotion thì mở composition trong Player và tua theo frame, đo cùng cách):
```python
# python3 mg_bbox_check.py trang.html 720 1280 <tổng giây> [bước 0.1] [selector]
import sys, pathlib
from playwright.sync_api import sync_playwright
html, W, H, T = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4])
step = float(sys.argv[5]) if len(sys.argv) > 5 else 0.1
sel = sys.argv[6] if len(sys.argv) > 6 else '[data-mg]'   # gắn data-mg="tên lớp" cho mọi lớp chữ/MG
k = W/1080; SZ = (70*k, 220*k, 910*k, 1480*k)
JS = r"""([sel]) => [...document.querySelectorAll(sel)].map(e => {
  const cs = getComputedStyle(e), boxy = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0;
  let r = e.getBoundingClientRect();
  if (!boxy) { let u = null; const add = q => { if (q.width < 1 || q.height < 1) return; u = u ? {left: Math.min(u.left, q.left), top: Math.min(u.top, q.top), right: Math.max(u.right, q.right), bottom: Math.max(u.bottom, q.bottom)} : {left: q.left, top: q.top, right: q.right, bottom: q.bottom}; };
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (n.textContent.trim()) { const g = document.createRange(); g.selectNodeContents(n); add(g.getBoundingClientRect()); }
    e.querySelectorAll('svg, img, canvas').forEach(c => add(c.getBoundingClientRect())); if (u) r = u; }
  let op = 1, p = e; while (p && p.nodeType === 1) { op *= parseFloat(getComputedStyle(p).opacity); p = p.parentElement; }
  return {id: e.dataset.mg || e.id || (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 22), x0: r.left, y0: r.top, x1: r.right, y1: r.bottom,
          vis: op > 0.05 && cs.display !== 'none' && cs.visibility !== 'hidden' && r.right - r.left > 1 && r.bottom - r.top > 1}; })"""
iss = {}
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': W, 'height': H})
    pg.goto(pathlib.Path(html).resolve().as_uri()); pg.wait_for_function('window.ready ? window.ready() : true'); pg.evaluate('document.fonts.ready')
    t = 0.0
    while t <= T + 1e-6:
        pg.evaluate(f'setTime({t + 1e-4})')
        bx = [x for x in pg.evaluate(JS, [sel]) if x['vis'] and x['x1'] > 0 and x['x0'] < W and x['y1'] > 0 and x['y0'] < H]
        for x in bx:
            d = {'trái': SZ[0]-x['x0'], 'trên': SZ[1]-x['y0'], 'phải': x['x1']-SZ[2], 'dưới': x['y1']-SZ[3]}
            for side, v in d.items():
                if v > 1: e = iss.setdefault(('Ngoài vùng an toàn', x['id']), {'t': [], 'd': {}}); e['t'].append(round(t, 1)); e['d'][side] = max(e['d'].get(side, 0), int(v))
        for i in range(len(bx)):
            for j in range(i + 1, len(bx)):
                a, c = bx[i], bx[j]; ix = min(a['x1'], c['x1']) - max(a['x0'], c['x0']); iy = min(a['y1'], c['y1']) - max(a['y0'], c['y0'])
                if ix > 2 and iy > 2: e = iss.setdefault(('Chồng nhau', f"{a['id']} × {c['id']}"), {'t': [], 'd': {}}); e['t'].append(round(t, 1)); e['d']['vùng px²'] = max(e['d'].get('vùng px²', 0), int(ix*iy))
        t += step
    b.close()
for (kind, who), e in sorted(iss.items(), key=lambda kv: kv[1]['t'][0]):
    print(f"- [{kind}] {who}: {e['d']} · {e['t'][0]}-{e['t'][-1]}s")
print('Tổng lỗi:', len(iss))
```
Đọc kết quả: một nhãn neo theo bản đồ chỉ ra khỏi vùng an toàn trong lúc máy đang di chuyển là nhãn đang trôi theo máy (mục 2.4, cách hiểu 2), không phải lỗi.

