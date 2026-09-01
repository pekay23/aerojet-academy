# Show the SECTIONS array as it currently is
$file = "c:\Projects\aerojet-academy\scripts\build-docs-html.mjs"
$lines = Get-Content $file -Encoding UTF8
Write-Host "Current SECTIONS lines:"
for ($i = 32; $i -le 39; $i++) {
    Write-Host "  $($i+1): $($lines[$i])"
}
