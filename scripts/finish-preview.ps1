$file = "c:\Projects\aerojet-academy\docs\html\design-system-preview.html"
$content = Get-Content $file -Raw -Encoding UTF8

# The file got truncated. Add the proper closing.
$oldEnd = '<footer class="ad-foot">' + "`r`n" +
          '  <strong>Aerojet Academy · Design tokens quick reference</strong> · one-pager · see <a href="./design-system.html">full design system</a> for the'
$newEnd = '<footer class="ad-foot">' + "`r`n" +
          '  <strong>Aerojet Academy · Design tokens quick reference</strong> · one-pager · see <a href="./design-system.html">full design system</a> for the rest.</footer>' + "`r`n" +
          '</div>' + "`r`n" +
          '</body>' + "`r`n" +
          '</html>' + "`r`n"

$content = $content.Replace($oldEnd, $newEnd)

Set-Content -Path $file -Value $content -Encoding UTF8
Remove-Item $PSCommandPath -Force
Write-Host "File complete. Lines: $((Get-Content $file).Count)"
