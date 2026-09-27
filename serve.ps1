# A tiny local web server for LittleJoy, so Google sign-in works while you test.
# Start it by double-clicking start-site.bat. Stop it by closing its window.
# It only serves files from this folder, and only to this computer (localhost).
param([switch]$NoBrowser)

$port = 5500
$root = [IO.Path]::GetFullPath($PSScriptRoot) + [IO.Path]::DirectorySeparatorChar
$types = @{
  ".html" = "text/html; charset=utf-8"; ".css" = "text/css; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json"; ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"; ".svg" = "image/svg+xml"; ".webp" = "image/webp"; ".ico" = "image/x-icon"
  ".woff2" = "font/woff2"; ".md" = "text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host ""
Write-Host "  LittleJoy is running at  http://localhost:$port" -ForegroundColor Green
Write-Host "  Keep this window open while you use the site. Close it to stop."
Write-Host ""
if (-not $NoBrowser) { Start-Process "http://localhost:$port/" }

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
    if ($path -eq "") { $path = "index.html" }
    $file = [IO.Path]::GetFullPath((Join-Path $root $path))
    # Only files inside this folder can be served.
    if ($file.StartsWith($root) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { "application/octet-stream" }
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
    }
  } catch {
    # A browser closing a connection early is harmless — keep serving.
  } finally {
    $res.Close()
  }
}
