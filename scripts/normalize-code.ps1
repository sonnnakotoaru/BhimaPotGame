$ErrorActionPreference = 'Stop'
$root = "d:\workspace\BhimaPotGame"
$enc = New-Object System.Text.UTF8Encoding($false)
$nl = [Environment]::NewLine

function Normalize-Text([string]$content){
  $c = $content
  # normalize line endings to CRLF or preserve? We'll normalize excessive blank lines and trailing spaces only.
  # remove trailing spaces
  $c = [Text.RegularExpressions.Regex]::Replace($c, '[ \t]+(\r?\n)', '$1')
  # collapse more than 2 consecutive blank lines to 2
  $c = [Text.RegularExpressions.Regex]::Replace($c, '(\r?\n){3,}', "$nl$nl")
  # remove leading blank lines at file start
  $c = [Text.RegularExpressions.Regex]::Replace($c, '^(\s*\r?\n)+', '', 'Singleline')
  # ensure file ends with a single newline
  $c = [Text.RegularExpressions.Regex]::Replace($c, '(\r?\n)*\z', "$nl")
  return $c
}

$targets = @()
$targets += Get-ChildItem -Path (Join-Path $root '') -Filter *.html
$targets += Get-ChildItem -Path (Join-Path $root 'css') -Filter *.css
$targets += Get-ChildItem -Path (Join-Path $root 'js') -Filter *.js

foreach($f in $targets){
  try{
    $p = $f.FullName
    $raw = [IO.File]::ReadAllText($p)
    $out = Normalize-Text $raw
    [IO.File]::WriteAllText($p, $out, $enc)
  }catch{ Write-Warning "Failed to normalize: $($f.FullName) :: $_" }
}

"NORMALIZED"