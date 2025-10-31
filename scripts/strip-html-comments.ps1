$ErrorActionPreference = 'Stop'
$root = "d:\workspace\BhimaPotGame"
$nl = [Environment]::NewLine
$enc = New-Object System.Text.UTF8Encoding($false)

function Strip-Html([string]$path) {
  try {
    $c = [IO.File]::ReadAllText($path)
    # Remove HTML comments <!-- ... --> (no conditional comments expected in this project)
    $c = [Text.RegularExpressions.Regex]::Replace($c, '<!--.*?-->', '', 'Singleline')
    # Collapse 3+ consecutive blank lines to 2
    $c = [Text.RegularExpressions.Regex]::Replace($c, '(\r?\n){3,}', $nl + $nl)
    [IO.File]::WriteAllText($path, $c, $enc)
  } catch { Write-Warning "Failed to strip HTML: $path :: $_" }
}

Get-ChildItem -Path $root -Filter *.html | ForEach-Object { Strip-Html $_.FullName }
"HTML_STRIPPED"