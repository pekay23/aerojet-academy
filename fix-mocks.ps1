param()
Get-ChildItem -Path tests -Recurse -Filter "*.test.*" | ForEach-Object {
    $path = $_.FullName
    $content = Get-Content $path -Raw
    if ($content -match 'vi\.resetAllMocks\(\)') {
        $content = $content -replace 'vi\.resetAllMocks\(\)', 'vi.clearAllMocks()'
        Set-Content -Path $path -Value $content
        Write-Output ("Fixed: " + $path)
    }
}
