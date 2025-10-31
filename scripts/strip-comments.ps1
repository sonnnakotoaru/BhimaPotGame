$ErrorActionPreference = 'Stop'
$root = "d:\workspace\BhimaPotGame"
$nl = [Environment]::NewLine
$enc = New-Object System.Text.UTF8Encoding($false)

function Strip-Js([string]$path) {
  try {
    $c = [IO.File]::ReadAllText($path)
    $c = [Text.RegularExpressions.Regex]::Replace($c, '/\*.*?\*/', '', 'Singleline')
    $c = [Text.RegularExpressions.Regex]::Replace($c, '^\s*//.*$', '', 'Multiline')
    $c = [Text.RegularExpressions.Regex]::Replace($c, '(\r?\n){3,}', $nl + $nl)
    [IO.File]::WriteAllText($path, $c, $enc)
  } catch { Write-Warning "Failed to strip JS: $path :: $_" }
}

function Strip-Css([string]$path) {
  try {
    $c = [IO.File]::ReadAllText($path)
    $c = [Text.RegularExpressions.Regex]::Replace($c, '/\*.*?\*/', '', 'Singleline')
    $c = [Text.RegularExpressions.Regex]::Replace($c, '(\r?\n){3,}', $nl + $nl)
    [IO.File]::WriteAllText($path, $c, $enc)
  } catch { Write-Warning "Failed to strip CSS: $path :: $_" }
}

Get-ChildItem -Path (Join-Path $root 'js') -Filter *.js | ForEach-Object { Strip-Js $_.FullName }
Get-ChildItem -Path (Join-Path $root 'css') -Filter *.css | ForEach-Object { Strip-Css $_.FullName }

"STRIPPED"
