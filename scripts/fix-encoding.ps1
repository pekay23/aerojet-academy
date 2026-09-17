# Use raw bytes approach to fix the encoding
$file = "c:\Projects\aerojet-academy\docs\html\index.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Use ASCII-safe replacement
$oldStr = [char]0xC3 + [char]0x83 + [char]0xC2 + [char]0xA2 + [char]0xC3 + [char]0x82 + [char]0xC2 + [char]0xAC + [char]0x20 + [char]0xC3 + [char]0x82 + [char]0xC2 + [char]0xAC + [char]0x22 + ' color tokens, fonts, components'
$newStr = [char]0xE2 + [char]0x86 + [char]0x92 + ' color tokens, fonts, components'

$content = $content.Replace($oldStr, $newStr)

Set-Content -Path $file -Value $content -Encoding UTF8
Remove-Item $PSCommandPath -Force

# Show result
$line = (Get-Content $file)[343]
Write-Host "Line 344 fixed: $line"
