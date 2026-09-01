# Add Design System card to the existing docs/html/index.html

$file = "c:\Projects\aerojet-academy\docs\html\index.html"
$content = Get-Content $file -Raw

# Add a Design System card to the Architecture section
$newCard = @'
    <a class="he-card" href="./design-system.html">
      <div class="he-card__eyebrow">Design System</div>
      <h3>Aerojet Design System</h3>
      <p>Color tokens, fonts, sizes, spacing, components, motion — extracted from app/globals.css and tailwind.config.ts.</p>
      <div class="he-card__meta">
        <span>docs/html/design-system.html</span>
      </div>
    </a>
'@

# Add to the architecture section before its closing div
$content = $content -replace '(    </a>\s*</div>\s*</section>\s*<section class="he-index-section" id="guides")', "$newCard`r`n    </a>`r`n  </div>`r`n</section>`r`n<section class=`"he-index-section`" id=`"guides`""

# Add to the Standalone HTML section
$standaloneAddition = @'
    <div class="he-standalone-card">
      <a href="./design-system.html">design system</a>
      <p>↗ color tokens, fonts, components</p>
    </div>
'@

$content = $content -replace '(    <div class="he-standalone-card">\s*<a href="./admissions-pipeline.html">admissions pipeline</a>)', $standaloneAddition + "`r`n    `$1"

# Update KPI counts
$content = $content -replace '30', '31'

Set-Content -Path $file -Value $content -Encoding UTF8
Write-Host "Index updated. Lines:"
(Get-Content $file | Measure-Object -Line).Lines
