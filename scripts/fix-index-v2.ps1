$file = "c:\Projects\aerojet-academy\docs\html\index.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Count existing standalone-card occurrences
$count = ([regex]::Matches($content, 'standalone-card')).Count
Write-Host "Current standalone-card count: $count"

# Find a unique anchor that we can match - use the line with "visual-plan"
# and add a new design-system card right after it
$anchor = '<a href="./visual-plan.html">visual plan</a>'
$replacement = $anchor + "`r`n" +
               '      <p>â†— open report</p>' + "`r`n" +
               '    </div>' + "`r`n" +
               '    <div class="he-standalone-card">' + "`r`n" +
               '      <a href="./design-system.html">design system</a>' + "`r`n" +
               '      <p>â†— color tokens, fonts, components</p>'

# Look for the actual byte sequence in the file
$lines = Get-Content $file -Encoding UTF8
$found = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -like '*visual-plan.html">visual plan</a>') {
        Write-Host "Found at line $($i+1)"
        # Insert the new card after the </div> that closes this card
        # The next lines should be <p> and </div>
        $newCardLines = @(
            '    <div class="he-standalone-card">'
            '      <a href="./design-system.html">design system</a>'
            '      <p>â†— color tokens, fonts, components</p>'
            '    </div>'
        )
        # Insert after 2 more lines (the <p> and </div>)
        $lines = $lines[0..($i+2)] + $newCardLines + $lines[($i+3)..($lines.Count-1)]
        $found = $true
        break
    }
}

if ($found) {
    Set-Content -Path $file -Value $lines -Encoding UTF8
    Write-Host "Inserted design-system standalone card"
    Write-Host "New line count: $((Get-Content $file | Measure-Object -Line).Lines)"
    Write-Host "New standalone-card count: $((Get-Content $file -Raw | Select-String -Pattern 'standalone-card' -AllMatches).Matches.Count)"
} else {
    Write-Host "Anchor not found"
}
