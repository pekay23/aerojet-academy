$docs = @('architecture', 'guides')
foreach ($d in $docs) {
    Write-Host "=== $d ==="
    Get-ChildItem "c:\Projects\aerojet-academy\docs\$d" -File | ForEach-Object {
        $lines = (Get-Content $_.FullName).Count
        $chars = (Get-Content $_.FullName -Raw).Length
        $mtime = $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')
        Write-Host ("  {0,-45} {1,5} lines  {2,6} chars  {3}" -f $_.Name, $lines, $chars, $mtime)
    }
}
