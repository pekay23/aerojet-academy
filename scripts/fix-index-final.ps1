# Fix the standalone section to add the design system card

$file = "c:\Projects\aerojet-academy\docs\html\index.html"
$content = Get-Content $file -Raw

# The standalone section currently has 4 cards. Add the design system one.
# Find the visual-plan card and insert before </div></section>
$oldPattern = '<div class="he-standalone-card">' + [Environment]::NewLine +
              '      <a href="./visual-plan.html">visual plan</a>' + [Environment]::NewLine +
              '      <p>' + [char]0x2192 + ' open report</p>' + [Environment]::NewLine +
              '    </div>' + [Environment]::NewLine +
              '  </div>' + [Environment]::NewLine +
              '</section>'

$newPattern = '<div class="he-standalone-card">' + [Environment]::NewLine +
              '      <a href="./visual-plan.html">visual plan</a>' + [Environment]::NewLine +
              '      <p>' + [char]0x2192 + ' open report</p>' + [Environment]::NewLine +
              '    </div>' + [Environment]::NewLine +
              '    <div class="he-standalone-card">' + [Environment]::NewLine +
              '      <a href="./design-system.html">design system</a>' + [Environment]::NewLine +
              '      <p>' + [char]0x2192 + ' color tokens, fonts, components</p>' + [Environment]::NewLine +
              '    </div>' + [Environment]::NewLine +
              '  </div>' + [Environment]::NewLine +
              '</section>'

if ($content -match [regex]::Escape($oldPattern)) {
    $content = $content.Replace($oldPattern, $newPattern)
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Standalone section updated successfully"
} else {
    Write-Host "Pattern not found, trying alternative..."
    # Try with raw em-dash instead
    $oldPattern2 = 'visual-plan.html">visual plan</a>' + [Environment]::NewLine +
                   '      <p>' + [char]0x2192 + ' open report</p>' + [Environment]::NewLine +
                   '    </div>'
    $newPattern2 = 'visual-plan.html">visual plan</a>' + [Environment]::NewLine +
                   '      <p>' + [char]0x2192 + ' open report</p>' + [Environment]::NewLine +
                   '    </div>' + [Environment]::NewLine +
                   '    <div class="he-standalone-card">' + [Environment]::NewLine +
                   '      <a href="./design-system.html">design system</a>' + [Environment]::NewLine +
                   '      <p>' + [char]0x2192 + ' color tokens, fonts, components</p>' + [Environment]::NewLine +
                   '    </div>'

    if ($content -match [regex]::Escape($oldPattern2)) {
        $content = $content.Replace($oldPattern2, $newPattern2)
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Standalone section updated with alternative pattern"
    } else {
        Write-Host "Neither pattern matched. Manual inspection needed."
    }
}

Write-Host "Current line count: $((Get-Content $file | Measure-Object -Line).Lines)"
