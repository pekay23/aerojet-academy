# Use IO.File to do raw byte-level replacement
$path = "c:\Projects\aerojet-academy\docs\html\index.html"
$bytes = [System.IO.File]::ReadAllBytes($path)

# The corruption is "ÃƒÂ¢Ã¢â€šÂ¬ÃƒÂ¯Ã†â€™Ã‚Â" which is the double-encoded UTF-8 of "→"
# Bytes are: 0xC3 0x83 0xC6 0x92 0xC3 0xA2 0xC3 0x82 0xC2 0xAC ...
# Let's find the line and replace it with ASCII
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# The corrupted text in the file is: "ÃƒÂ¢Ã¢â‚¬ Ã‹â€ Ã‚Â color tokens"
# Replace with ASCII: "-> color tokens"
$oldText = "color tokens, fonts, components"
$lines = $content -split "`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'color tokens') {
        # The line is corrupted. Replace the whole <p>...</p> on this line.
        $lines[$i] = '      <p>-- color tokens, fonts, components</p>'
    }
}

$newContent = $lines -join "`n"
[System.IO.File]::WriteAllText($path, $newContent, [System.Text.Encoding]::UTF8)

# Verify
$verify = (Get-Content $path)[343]
Write-Host "Line 344: $verify"
Remove-Item $PSCommandPath -Force
