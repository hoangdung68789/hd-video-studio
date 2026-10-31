# Cài HD Video Studio. Trong thư mục repo:  .\install.ps1
# Một lệnh:  iex (irm https://raw.githubusercontent.com/hoangdung68789/hd-video-studio/main/install.ps1).TrimStart([char]0xFEFF)
# Kèm tài nguyên riêng:  .\install.ps1 -TaiNguyen "D:\tai-nguyen"   (thư mục chứa các gói .zip, hoặc một tệp .zip)
param(
  [string]$Dest = (Join-Path $HOME "HDRE AI"),
  [string]$ClaudeHome = (Join-Path $HOME ".claude"),
  [string]$Repo = "https://github.com/hoangdung68789/hd-video-studio.git",
  [string]$TaiNguyen = "",
  [switch]$SkipTools,
  [switch]$WhisperX
)
$ErrorActionPreference = "Stop"

$here = $PSScriptRoot
if (-not $here -or -not (Test-Path (Join-Path $here "skills"))) {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "Cần cài Git trước: https://git-scm.com" }
  $tmp = Join-Path $env:TEMP "hd-video-studio-$(Get-Random)"
  git clone --depth 1 $Repo $tmp
  & (Join-Path $tmp "install.ps1") -Dest $Dest -ClaudeHome $ClaudeHome -TaiNguyen $TaiNguyen -SkipTools:$SkipTools -WhisperX:$WhisperX
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  return
}

# Báo một lần mọi thứ còn thiếu.
$thieu = @()
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { $thieu += "Node.js 20 trở lên: https://nodejs.org" }
else {
  $v = (node -p "process.versions.node").Split(".")
  if ([int]$v[0] -lt 20 -or ([int]$v[0] -eq 20 -and [int]$v[1] -lt 11)) { $thieu += "Node.js cần từ 20.11, máy đang có $($v -join '.')" }
}
foreach ($t in "ffmpeg", "ffprobe") { if (-not (Get-Command $t -ErrorAction SilentlyContinue)) { $thieu += "$t : https://ffmpeg.org/download.html" } }
if ($thieu.Count) { throw ("Còn thiếu:" + [Environment]::NewLine + ($thieu -join [Environment]::NewLine)) }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { Write-Warning "Không thấy Python 3: các script của skill sẽ không chạy, Studio vẫn mở được." }
if (-not (Get-Command claude -ErrorAction SilentlyContinue) -and -not (Test-Path (Join-Path $env:LOCALAPPDATA "Claude-Data"))) { Write-Warning "Không thấy Claude Code: lệnh /video và thanh AI cần cài Claude Code." }
if (-not $SkipTools) { npm install -g hyperframes@0.8.171 }

# WhisperX, tùy chọn vì tải thêm vài GB. Lỗi thì chỉ báo, không dừng phần cài còn lại.
if ($WhisperX) {
  if (Get-Command python -ErrorAction SilentlyContinue) {
    # torchaudio phải cùng đời với torch, nếu không lệnh whisperx báo WinError 127 trên Windows.
    python -m pip install "git+https://github.com/m-bain/whisperX.git" "torchaudio~=2.8.0"
    if ($LASTEXITCODE) { Write-Warning "Chưa cài được WhisperX, xem https://github.com/m-bain/whisperX" }
  } else { Write-Warning "Cần Python 3.10–3.13 để cài WhisperX." }
}

# Skill và agent: có bản cũ thì sao lưu trước khi thay.
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
foreach ($kind in "skills", "agents") {
  $target = Join-Path $ClaudeHome $kind
  New-Item -ItemType Directory -Force $target | Out-Null
  foreach ($item in Get-ChildItem (Join-Path $here $kind)) {
    $to = Join-Path $target $item.Name
    if (Test-Path $to) {
      $bak = Join-Path $ClaudeHome ".sao_luu-$stamp\$kind"
      New-Item -ItemType Directory -Force $bak | Out-Null
      Move-Item $to (Join-Path $bak $item.Name)
    }
    Copy-Item $item.FullName $to -Recurse
  }
}

foreach ($d in "Apps", "asset", "Videos") {
  New-Item -ItemType Directory -Force (Join-Path $Dest $d) | Out-Null
  Copy-Item (Join-Path $here "$d\*") (Join-Path $Dest $d) -Recurse -Force
}

Copy-Item (Join-Path $here "tai-tai-nguyen.ps1") $Dest -Force

# Tài nguyên riêng, tùy chọn: các gói giải nén thẳng vào thư mục cài, phần Claude/ vào .claude.
if ($TaiNguyen) {
  if (-not (Test-Path $TaiNguyen)) { throw "Không thấy tài nguyên: $TaiNguyen" }
  $zips = if ($TaiNguyen -like "*.zip") { @(Get-Item $TaiNguyen) } else { @(Get-ChildItem $TaiNguyen -Filter TaiNguyen-*.zip) }
  if (-not $zips.Count) { throw "Không có tệp .zip trong $TaiNguyen" }
  foreach ($z in $zips) {
    Write-Host "Đang giải nén $($z.Name)…"
    Expand-Archive $z.FullName $Dest -Force
  }
  $c = Join-Path $Dest "Claude"
  if (Test-Path $c) {
    Copy-Item (Join-Path $c "*") $ClaudeHome -Recurse -Force
    Remove-Item $c -Recurse -Force
  }
}

# Cấu hình để Claude Code mở Studio khi dựng. Có sẵn thì giữ nguyên, chỉ báo.
$launch = Join-Path $Dest ".claude\launch.json"
if (Test-Path $launch) {
  if (-not (Select-String -Path $launch -Pattern '"hd-studio"' -Quiet)) { Write-Warning "Hãy thêm cấu hình hd-studio vào $launch, xem README." }
} else {
  New-Item -ItemType Directory -Force (Split-Path $launch) | Out-Null
  $cfg = '{ "version": "0.0.1", "configurations": [ { "name": "hd-studio", "runtimeExecutable": "node", "runtimeArgs": ["Apps/hd-studio/server.mjs", "--port=4700"], "port": 4700 } ] }'
  [IO.File]::WriteAllText($launch, $cfg)
}

# Hook tự nối phiên Claude với Studio. Có settings.json rồi thì không ghi đè, chỉ báo.
$settings = Join-Path $Dest ".claude\settings.json"
if (Test-Path $settings) {
  if (-not (Select-String -Path $settings -Pattern 'hook_studio' -Quiet)) { Write-Warning "Hãy thêm hook hook_studio.mjs vào $settings, xem README." }
} else {
  [IO.File]::WriteAllText($settings, '{ "hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/Apps/hd-studio/lib/hook_studio.mjs\"", "timeout": 5 } ] } ] } }')
}

# Thay đường dẫn mẫu bằng đường dẫn thật trên máy này.
$roots = (Join-Path $ClaudeHome "skills"), (Join-Path $ClaudeHome "agents"), (Join-Path $Dest "asset"), (Join-Path $Dest "Videos\_TEMPLATE_BDS_Review_2phut")
# Trong .json, .py, .sh dùng dấu / để không làm hỏng chuỗi có dấu \. Tệp .ps1 phải giữ BOM.
$destSlash = $Dest.Replace("\", "/")
foreach ($f in Get-ChildItem $roots -Recurse -File -Include *.md, *.py, *.json, *.ps1, *.sh) {
  $t = [IO.File]::ReadAllText($f.FullName)
  if ($t.Contains("<HD_VIDEO_HOME>")) {
    $by = if ($f.Extension -in ".md", ".ps1") { $Dest } else { $destSlash }
    [IO.File]::WriteAllText($f.FullName, $t.Replace("<HD_VIDEO_HOME>", $by), (New-Object Text.UTF8Encoding($f.Extension -eq ".ps1")))
  }
}

Write-Host "Đã cài xong vào $Dest"
Write-Host "Mở Studio: chạy $Dest\Apps\hd-studio\Mo Studio.bat rồi chọn dự án vi-du-mau"
Write-Host "Dựng video: mở Claude Code trong $Dest rồi gõ /video <đường dẫn footage>"
