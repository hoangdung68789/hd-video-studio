# Tạo dự án mới từ template: .\new_project.ps1 -Name "123A-TenDuong"
# -> Videos\<Name> (bản sao template), đặt NAME trong project.py, thêm cấu hình Studio vào .claude\launch.json.
param([Parameter(Mandatory = $true)][string]$Name, [string]$LaunchJson = "<HD_VIDEO_HOME>\.claude\launch.json")
$ErrorActionPreference = "Stop"
$tpl = $PSScriptRoot
$dst = Join-Path (Split-Path $tpl -Parent) $Name
if (Test-Path $dst) { throw "Đã có thư mục $dst" }

Copy-Item $tpl $dst -Recurse
Remove-Item (Join-Path $dst "new_project.ps1")

$py = Join-Path $dst "project.py"
$txt = [IO.File]::ReadAllText($py, [Text.Encoding]::UTF8) -replace '(?m)^NAME = ".*?"', ('NAME = "' + $Name + '"')
[IO.File]::WriteAllText($py, $txt, (New-Object Text.UTF8Encoding $false))
$meta = '{"id":"hf","name":"' + $Name + '","createdAt":"' + (Get-Date -Format "yyyy-MM-ddTHH:mm:ss") + '"}'
[IO.File]::WriteAllText((Join-Path $dst "hf\meta.json"), $meta, (New-Object Text.UTF8Encoding $false))

$lj = $LaunchJson
$cfg = [IO.File]::ReadAllText($lj, [Text.Encoding]::UTF8) | ConvertFrom-Json
$port = [int]((($cfg.configurations | ForEach-Object { [int]$_.port }) | Measure-Object -Maximum).Maximum) + 2
$cfg.configurations += [pscustomobject]@{
    name              = "$Name-studio"
    runtimeExecutable = "npx"
    runtimeArgs       = @("--yes", "hyperframes@0.8.171", "preview", "--no-open", "--port=$port", (($dst -replace '\\', '/') + "/hf"))
    port              = $port
}
[IO.File]::WriteAllText($lj, ($cfg | ConvertTo-Json -Depth 6), (New-Object Text.UTF8Encoding $false))

Write-Output "Dự án: $dst"
Write-Output "Studio: $Name-studio (cổng $port)"
