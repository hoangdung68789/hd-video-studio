# Tải và cài các gói tài nguyên edit (SFX, font, LUT, mẫu) từ thư mục Google Drive.
# Chạy: .\tai-tai-nguyen.ps1   (lệnh hỏi mật khẩu rồi tự tải, không hiện link)
# Chỉ tải một vài gói: .\tai-tai-nguyen.ps1 -Goi SFX,Font
# Dùng thư mục Drive khác: .\tai-tai-nguyen.ps1 -Link "<link>"
# Thư mục Drive phải đang chia sẻ "Bất kỳ ai có đường liên kết". Tệp đã tải rồi thì không tải lại.
param(
  [string]$Link = "",
  [string]$MatKhau = "",
  [string[]]$Goi = @(),
  [string]$Dest = (Join-Path $HOME "HDRE AI"),
  [string]$ClaudeHome = (Join-Path $HOME ".claude"),
  [string]$NoiTai = (Join-Path $HOME "Downloads\HD-TaiNguyen"),
  [switch]$ChiTai
)
$ErrorActionPreference = "Stop"

# Link thư mục Drive mã hóa AES-256, giải bằng mật khẩu (không lưu trong repo).
$LinkMaHoa = "G6OnQlgD2p0v1x5fb/E3yY/yigtXhAHysmJVhYMzSgz55yU6JDcg+U3Jw9xnJw84VaTY+sW+3qE5w3EUJFhJefLH4+4/LsRr0MFf9orAX25LIl0dq3cjv6kHqI/AOzZ9"
function Giai-Link([string]$pw) {
  $b = [Convert]::FromBase64String($LinkMaHoa)
  $kdf = New-Object Security.Cryptography.Rfc2898DeriveBytes($pw, [byte[]]$b[0..15], 200000, [Security.Cryptography.HashAlgorithmName]::SHA256)
  $aes = [Security.Cryptography.Aes]::Create()
  $aes.Key = $kdf.GetBytes(32)
  $aes.IV = $kdf.GetBytes(16)
  try {
    $plain = $aes.CreateDecryptor().TransformFinalBlock($b, 16, $b.Length - 16)
    $t = [Text.Encoding]::UTF8.GetString($plain)
    if ($t.StartsWith("https://drive.google.com/")) { return $t }
  } catch { }
  throw "Sai mật khẩu."
}
if (-not $Link) {
  if (-not $MatKhau) {
    $s = Read-Host "Nhập mật khẩu tải tài nguyên" -AsSecureString
    $MatKhau = (New-Object Net.NetworkCredential("", $s)).Password
  }
  $Link = Giai-Link $MatKhau
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw "Cần cài Python 3: https://www.python.org" }
python -c "import importlib.util as u, sys; sys.exit(u.find_spec('gdown') is None)"
if ($LASTEXITCODE) {
  python -m pip install --quiet gdown
  if ($LASTEXITCODE) { throw "Không cài được gdown" }
}

New-Item -ItemType Directory -Force $NoiTai | Out-Null
$py = Join-Path $env:TEMP "hd-tai-$(Get-Random).py"
@'
import os, sys, gdown
link, out, wanted = os.environ.pop("HD_LINK"), sys.argv[1], [w.lower() for w in sys.argv[2:]]
try:
    items = gdown.download_folder(url=link, skip_download=True, quiet=True)
except Exception:
    items = None
if not items:
    sys.exit("Không đọc được thư mục Drive. Hãy kiểm tra link và chế độ chia sẻ Bất kỳ ai có đường liên kết.")
packs = [x for x in items if os.path.basename(x.path).startswith("TaiNguyen-") and x.path.endswith(".zip")]
if wanted:
    packs = [x for x in packs if os.path.basename(x.path)[10:-4].lower() in wanted]
if not packs:
    sys.exit("Không có gói TaiNguyen-*.zip phù hợp trong thư mục Drive.")
for x in packs:
    name = os.path.basename(x.path)
    to = os.path.join(out, name)
    if os.path.exists(to):
        print("Đã có", name)
        continue
    print("Đang tải", name, "(tệp lớn có thể mất nhiều phút)", flush=True)
    if not gdown.download(id=x.id, output=to + ".part", quiet=True):
        sys.exit("Tải lỗi: " + name + ". Tệp lớn có thể đang hết lượt tải của Google, hãy thử lại sau.")
    os.replace(to + ".part", to)
'@ | Set-Content -Path $py -Encoding UTF8

$env:PYTHONIOENCODING = "utf-8"
$env:HD_LINK = $Link
python $py $NoiTai @Goi
$code = $LASTEXITCODE
Remove-Item Env:HD_LINK
Remove-Item $py -Force
if ($code) { throw "Chưa tải xong tài nguyên." }
if ($ChiTai) { Write-Host "Đã tải vào $NoiTai"; return }

# Giải nén thẳng vào thư mục cài, phần Claude/ chép vào .claude.
$zips = @(Get-ChildItem $NoiTai -Filter TaiNguyen-*.zip)
if ($Goi.Count) { $zips = @($zips | Where-Object { $Goi -contains $_.BaseName.Substring(10) }) }
foreach ($z in $zips) {
  Write-Host "Đang giải nén $($z.Name)…"
  Expand-Archive $z.FullName $Dest -Force
}
$c = Join-Path $Dest "Claude"
if (Test-Path $c) {
  Copy-Item (Join-Path $c "*") $ClaudeHome -Recurse -Force
  Remove-Item $c -Recurse -Force
}
Write-Host "Đã cài tài nguyên vào $Dest"
