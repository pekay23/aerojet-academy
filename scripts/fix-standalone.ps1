# Add design system to standalone section
$file = "c:\Projects\aerojet-academy\docs\html\index.html"
$content = Get-Content $file -Raw

# Add the design-system standalone card before admissions-pipeline
$oldText = '<div class="he-standalone-card">' + "`r`n" + '      <a href="./admissions-pipeline.html">admissions pipeline</a>'
$newText = '<div class="he-standalone-card">' + "`r`n" + '      <a href="./design-system.html">design system</a>' + "`r`n" + '      <p>color tokens, fonts, components</p>' + "`r`n" + '    </div>' + "`r`n" + '    <div class="he-standalone-card">' + "`r`n" + '      <a href="./admissions-pipeline.html">admissions pipeline</a>'

$content = $content.Replace($oldText, $newText)

# Update KPI: standalone reports from 4 to 5
$content = $content.Replace('<div class="he-kpi__value">4</div><div class="he-kpi__label">Standalone reports</div>', '<div class="he-kpi__value">5</div><div class="he-kpi__label">Standalone reports</div>')
# Update KPI: total from 31 (which was 30+1) to 32
$content = $content.Replace('<div class="he-kpi__value">31</div>', '<div class="he-kpi__value">32</div>')

Set-Content -Path $file -Value $content -Encoding UTF8
Write-Host "Standalone section updated. Lines:"
(Get-Content $file | Measure-Object -Line).Lines
