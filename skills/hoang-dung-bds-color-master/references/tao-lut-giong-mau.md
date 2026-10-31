# hoang-dung-bds-color-master — §5 Tạo LUT .cube giống video mẫu (script lut_match.py)

_Dời nguyên văn từ SKILL.md ngày 29/10/2026._

## 5. Tạo LUT `.cube` giống video mẫu

### 5.1 Năm bước
1. **Đo màu video mẫu:** phân bố độ sáng (điểm đen, điểm trắng, vùng giữa) và màu trung bình / độ rộng màu (Lab), lấy từ 12 khung rải đều.
2. **Đo video gốc của Dũng** cùng cách, sau khi đã chuyển D-Log sang Rec.709 bằng LUT DJI.
3. **Tạo LUT 33³:**
   - khớp đường sáng theo phân vị;
   - khớp sắc độ, có giới hạn để không bệt màu;
   - bảo vệ tông da;
   - nén vùng sáng chống cháy cửa sổ.

   File `.cube` dùng được trên CapCut máy tính, DaVinci, Premiere và FFmpeg `lut3d`. Kèm bảng thanh chỉnh tay nếu Dũng muốn tinh chỉnh trên điện thoại.
4. **Ảnh so sánh 3 ô** (Gốc | Đã áp LUT | Video mẫu) và **ΔE màu trung bình** trước / sau so với video mẫu.
5. **Bàn giao** sau khi Dũng duyệt: `HoangDung_BDS_<TenMau>.cube` lưu vào `HDRE_Library/luts/`, ghi thông số vào hồ sơ thói quen.

### 5.2 Script (đã chạy thử 16/10/2026)
Kết quả thử: ΔE màu trung bình so với video mẫu giảm từ 7,2 xuống 2,9.
```python
# Tạo 3D LUT .cube (33³) làm video gốc giống màu video mẫu + ảnh so sánh 3 ô (Gốc | Đã áp LUT | Mẫu)
# python3 lut_match.py goc.mp4 mau.mp4 HoangDung_BDS_<ten>.cube [cuong_do=1.0]
# Nguồn D-Log: chuyển Rec.709 bằng LUT chính thức của DJI TRƯỚC, rồi mới chạy script này.
import sys, subprocess, numpy as np, cv2, os, tempfile
src, ref, out = sys.argv[1], sys.argv[2], sys.argv[3]
k = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
def frames(v, n=12):                                   # trích n khung rải đều, thu nhỏ để đo
    d = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',v]))
    fs = []
    for i in range(n):
        p = tempfile.mktemp(suffix='.png')
        subprocess.run(['ffmpeg','-v','error','-y','-ss',str(d*(i+.5)/n),'-i',v,'-frames:v','1','-vf','scale=320:-2',p], check=True)
        fs.append(cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2RGB).astype(np.float32)/255); os.remove(p)
    return fs
lab = lambda rgb: cv2.cvtColor(rgb.reshape(-1,1,3).astype(np.float32), cv2.COLOR_RGB2LAB).reshape(-1,3)
S = np.concatenate([lab(f) for f in frames(src)]); R = np.concatenate([lab(f) for f in frames(ref)])
q = np.linspace(0.5, 99.5, 100); sq, rq = np.percentile(S[:,0], q), np.percentile(R[:,0], q)   # đường cong sáng theo phân vị
ms, ss, mr, sr = S[:,1:].mean(0), S[:,1:].std(0)+1e-6, R[:,1:].mean(0), R[:,1:].std(0)+1e-6
g = np.linspace(0, 1, 33); bb, gg, rr = np.meshgrid(g, g, g, indexing='ij')                 # thứ tự .cube: R chạy nhanh nhất
grid = np.stack([rr, gg, bb], -1).reshape(-1, 3); L = lab(grid)
Ln = np.interp(L[:,0], sq, rq)                                                             # khớp độ sáng
ab = (L[:,1:] - ms) * np.clip(sr/ss, .7, 1.4) + mr                                         # khớp sắc độ (giới hạn để không bệt màu)
hue = np.degrees(np.arctan2(L[:,2], L[:,1])); chroma = np.hypot(L[:,1], L[:,2])
skin = ((hue > 20) & (hue < 70) & (chroma > 8) & (chroma < 55) & (L[:,0] > 25) & (L[:,0] < 85))[:,None]
ab = np.where(skin, L[:,1:] + (ab - L[:,1:]) * .5, ab)                                     # bảo vệ tông da: chỉ dịch 50%
new = np.concatenate([Ln[:,None], ab], 1)
rgb = cv2.cvtColor(new.reshape(-1,1,3).astype(np.float32), cv2.COLOR_LAB2RGB).reshape(-1,3)
rgb = np.where(rgb > .85, .85 + (rgb-.85) * .6, rgb)                                       # nén vùng sáng chống cháy cửa sổ
rgb = np.clip(grid + (rgb - grid) * k, 0, 1)                                               # cường độ
with open(out, 'w') as f:
    f.write(f'TITLE "{os.path.basename(out)}"\nLUT_3D_SIZE 33\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\n')
    f.writelines(f'{a:.6f} {b:.6f} {c:.6f}\n' for a, b, c in rgb)
# ảnh so sánh 3 ô tại khung giữa video + ΔE trung bình trước/sau so với mẫu
d = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src]))
dr = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',ref]))
lbl = lambda t: f"drawtext=text='{t}':x=20:y=20:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.6"
subprocess.run(['ffmpeg','-v','error','-y','-ss',str(d/2),'-i',src,'-ss',str(dr/2),'-i',ref,'-filter_complex',
  f"[0:v]scale=540:960,setsar=1,split[a][b];[b]lut3d='{out}'[b2];[1:v]scale=540:960,setsar=1[c];"
  f"[a]{lbl('1 GOC (BEFORE)')}[a1];[b2]{lbl('2 DA AP LUT (AFTER)')}[b3];[c]{lbl('3 VIDEO MAU')}[c1];[a1][b3][c1]hstack=inputs=3",
  '-frames:v','1', out.replace('.cube','_SoSanh.png')], check=True)
lut = lambda x: x  # đo ΔE trung bình (khối màu tổng) của khung giữa
def mean_lab(png): return lab(cv2.cvtColor(cv2.imread(png), cv2.COLOR_BGR2RGB).astype(np.float32)/255).mean(0)
tmp = tempfile.mkdtemp()
subprocess.run(['ffmpeg','-v','error','-y','-ss',str(d/2),'-i',src,'-frames:v','1',f'{tmp}/a.png'], check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',f'{tmp}/a.png','-vf',f"lut3d='{out}'",f'{tmp}/b.png'], check=True)
mR = R.mean(0); de = lambda m: float(np.linalg.norm(m - mR))
print(f'ΔE (màu trung bình so với mẫu): trước {de(mean_lab(f"{tmp}/a.png")):.1f} → sau {de(mean_lab(f"{tmp}/b.png")):.1f}')
```
**Giới hạn trung thực:**
- LUT chỉ khớp màu tổng thể (tone, sắc độ trung bình), không chỉnh riêng từng vùng như mặt nạ cửa sổ.
- Hai video quay khác ánh sáng quá xa thì không thể giống hoàn toàn. Báo bằng số ΔE, không nói "giống 100%".
- Chỉ học màu từ video mẫu; không dùng lại footage của video mẫu.

