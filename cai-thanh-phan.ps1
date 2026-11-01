# Cài các thành phần từ repo gốc đã tích hợp. Thành phần nào lỗi thì báo, các phần còn lại vẫn cài tiếp.
# Xem danh sách:  .\cai-thanh-phan.ps1 -DanhSach
# Cài tất cả:     .\cai-thanh-phan.ps1 -TatCa
# Cài vài phần:   .\cai-thanh-phan.ps1 -ThanhPhan remotion,hyperframes-skills
# Chọn từ menu:   .\cai-thanh-phan.ps1
param(
  [string[]]$ThanhPhan = @(),
  [switch]$TatCa,
  [switch]$DanhSach,
  [switch]$ThuKhong,
  [string]$Dest = $(if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot "Apps\hd-studio"))) { $PSScriptRoot } else { Join-Path $HOME "HDRE AI" })
)
$ErrorActionPreference = "Stop"

$HF_VER = "0.8.171"
$vendor = Join-Path $Dest "vendor"
$goc = @(
  @{ Ten = "hyperframes"; MoTa = "Lệnh hyperframes, HD Studio cần để xem trước và xuất"; Nguon = "heygen-com/hyperframes"; Can = "npm"
     Lenh = { npm install -g "hyperframes@$HF_VER" } }
  @{ Ten = "hyperframes-skills"; MoTa = "Skill HyperFrames cho Claude Code"; Nguon = "heygen-com/hyperframes"; Can = "npx"
     Lenh = { npx --yes skills add heygen-com/hyperframes -g -a claude-code -s "*" -y --copy } }
  @{ Ten = "hyperframes-nguon"; MoTa = "Mã nguồn HyperFrames vào vendor\hyperframes"; Nguon = "heygen-com/hyperframes"; Can = "git"
     Lenh = { git -c core.longpaths=true clone --depth 1 https://github.com/heygen-com/hyperframes.git (Join-Path $vendor "hyperframes") }
     Xong = { Test-Path (Join-Path $vendor "hyperframes\.git") } }
  @{ Ten = "remotion"; MoTa = "Dự án Remotion mẫu tại remotion-mau"; Nguon = "remotion-dev/remotion"; Can = "npx"
     Lenh = { Push-Location $Dest; try { npx --yes create-video@latest --yes --blank --no-tailwind remotion-mau } finally { Pop-Location } }
     Xong = { Test-Path (Join-Path $Dest "remotion-mau\package.json") } }
  @{ Ten = "remotion-skills"; MoTa = "Skill Remotion cho Claude Code"; Nguon = "remotion-dev/skills"; Can = "npx"
     Lenh = { npx --yes skills add remotion-dev/skills -g -a claude-code -s "*" -y --copy } }
  @{ Ten = "remotion-nguon"; MoTa = "Mã nguồn Remotion vào vendor\remotion"; Nguon = "remotion-dev/remotion"; Can = "git"
     Lenh = { git -c core.longpaths=true clone --depth 1 https://github.com/remotion-dev/remotion.git (Join-Path $vendor "remotion") }
     Xong = { Test-Path (Join-Path $vendor "remotion\.git") } }
  @{ Ten = "whisperx"; MoTa = "WhisperX chép lời từng từ, tải thêm vài GB"; Nguon = "m-bain/whisperX"; Can = "python"
     # torchaudio phải cùng đời với torch, nếu không lệnh whisperx báo WinError 127 trên Windows.
     Lenh = { python -m pip install "git+https://github.com/m-bain/whisperX.git" "torchaudio~=2.8.0" } }
)

if ($DanhSach) {
  $goc | ForEach-Object { "{0,-20} {1}  (github.com/{2})" -f $_.Ten, $_.MoTa, $_.Nguon }
  return
}

$tenHopLe = $goc | ForEach-Object { $_.Ten }
if ($TatCa) { $chon = $tenHopLe }
elseif ($ThanhPhan.Count) { $chon = $ThanhPhan | ForEach-Object { $_ -split "," } | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ } }
else {
  for ($i = 0; $i -lt $goc.Count; $i++) { "{0}. {1,-20} {2}" -f ($i + 1), $goc[$i].Ten, $goc[$i].MoTa }
  $tl = Read-Host "Nhập số cách nhau bởi dấu phẩy, hoặc 'all' để cài tất cả, Enter để bỏ qua"
  if (-not $tl) { return }
  if ($tl.Trim().ToLower() -eq "all") { $chon = $tenHopLe }
  else {
    $chon = foreach ($s in $tl -split ",") {
      $n = 0
      if (-not [int]::TryParse($s.Trim(), [ref]$n) -or $n -lt 1 -or $n -gt $goc.Count) { throw "Số không hợp lệ: $s" }
      $goc[$n - 1].Ten
    }
  }
}

$sai = @($chon | Where-Object { $_ -notin $tenHopLe })
if ($sai.Count) { throw "Không có thành phần: $($sai -join ', '). Có: $($tenHopLe -join ', ')" }

New-Item -ItemType Directory -Force $Dest, $vendor | Out-Null
$ketQua = foreach ($c in $goc | Where-Object { $_.Ten -in $chon }) {
  if ($ThuKhong) { [pscustomobject]@{ ThanhPhan = $c.Ten; KetQua = "Sẽ cài từ github.com/$($c.Nguon)" }; continue }
  Write-Host "=== $($c.Ten): $($c.MoTa)"
  if (-not (Get-Command $c.Can -ErrorAction SilentlyContinue)) { [pscustomobject]@{ ThanhPhan = $c.Ten; KetQua = "Lỗi: thiếu $($c.Can)" }; continue }
  if ($c.Xong -and (& $c.Xong)) { [pscustomobject]@{ ThanhPhan = $c.Ten; KetQua = "Đã có sẵn, bỏ qua" }; continue }
  try {
    $global:LASTEXITCODE = 0
    & $c.Lenh | Out-Host
    $kq = if ($LASTEXITCODE) { "Lỗi: mã thoát $LASTEXITCODE" } else { "Đã cài" }
  } catch { $kq = "Lỗi: $($_.Exception.Message)" }
  [pscustomobject]@{ ThanhPhan = $c.Ten; KetQua = $kq }
}
$ketQua | Format-Table -AutoSize | Out-Host
if ($ketQua | Where-Object { $_.KetQua -like "Lỗi*" }) { $global:LASTEXITCODE = 1; Write-Warning "Có thành phần chưa cài được, xem bảng trên rồi chạy lại đúng phần đó." }
if ("remotion" -in $chon -or "remotion-nguon" -in $chon) { Write-Host "Remotion có giấy phép riêng: công ty trên 3 người cần mua giấy phép, xem https://www.remotion.dev/license" }
