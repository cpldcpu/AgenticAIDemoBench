# Play the brotli build of an intro. Chromium cannot unpack brotli from a local file, so this serves
# <introDir>/intro.html.br on http://localhost with "Content-Encoding: br" and opens the default browser.
#   powershell -ExecutionPolicy Bypass -File tools/serve_br.ps1 <introDir> [-Name intro_lean.html.br] [-Port 8125] [-NoBrowser]
# Ctrl+C stops it.
param([string]$Dir = '.', [string]$Name = 'intro.html.br', [int]$Port = 8125, [switch]$NoBrowser)
$file = Join-Path (Resolve-Path $Dir) $Name
$bytes = [IO.File]::ReadAllBytes($file)
$l = New-Object Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "serving $file ($($bytes.Length) bytes) on http://localhost:$Port/"
if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }
try {
  while ($l.IsListening) {
    $c = $l.GetContext()
    $r = $c.Response
    if ($c.Request.Url.AbsolutePath -eq '/') {
      $r.ContentType = 'text/html; charset=utf-8'
      $r.AddHeader('Content-Encoding', 'br')
      $r.ContentLength64 = $bytes.Length
      $r.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $r.StatusCode = 404 }
    $r.Close()
  }
} finally { $l.Stop() }
