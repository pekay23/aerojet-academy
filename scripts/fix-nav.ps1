$file = "c:\Projects\aerojet-academy\scripts\build-docs-html.mjs"
$content = Get-Content $file -Raw -Encoding UTF8

# Find the nav links and add a Design link
$oldNav = '<a href="${basePathToHtml}plans/future-plans.html">Plans</a>' + "`r`n" +
          '  </div>' + "`r`n" +
          '</nav>'

$emdash = [char]0x2014
$newNav = '<a href="${basePathToHtml}plans/future-plans.html">Plans</a>' + "`r`n" +
          '    <a href="${basePathToHtml}design-system.html">Design</a>' + "`r`n" +
          '  </div>' + "`r`n" +
          '</nav>'

if ($content.Contains($oldNav)) {
    $content = $content.Replace($oldNav, $newNav)
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Nav updated with Design link"
} else {
    Write-Host "Nav anchor not found"
}

# Also copy the aerojet-design-tokens.css
$oldCopy = "  const tokens = await fs.readFile(TOKENS_SRC, 'utf8')" + "`r`n" +
           "  await fs.writeFile(path.join(OUT, 'design-tokens.css'), tokens, 'utf8')"

$newCopy = "  // Copy Aerojet-specific design tokens (used by design-system.html and design-system-preview.html)" + "`r`n" +
           "  const aeroTokens = path.join(ROOT, 'docs', 'html', 'aerojet-design-tokens.css')" + "`r`n" +
           "  if (await fs.stat(aeroTokens).catch(() => null)) {" + "`r`n" +
           "    await fs.copyFile(aeroTokens, path.join(OUT, 'aerojet-design-tokens.css'))" + "`r`n" +
           "  }" + "`r`n" + "`r`n" +
           "  const tokens = await fs.readFile(TOKENS_SRC, 'utf8')" + "`r`n" +
           "  await fs.writeFile(path.join(OUT, 'design-tokens.css'), tokens, 'utf8')"

if ($content.Contains($oldCopy)) {
    $content = $content.Replace($oldCopy, $newCopy)
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Token copy updated"
} else {
    Write-Host "Token copy anchor not found"
}

# Update the deck text on the index
$oldDeck = "All project documentation, organised by purpose. Markdown sources live in <code>docs/architecture</code>, <code>docs/guides</code>, <code>docs/audits</code>, and <code>docs/plans</code>."
$newDeck = "All project documentation, organised by purpose. Markdown sources live in <code>docs/architecture</code>, <code>docs/guides</code>, <code>docs/audits</code>, <code>docs/plans</code>, and <code>docs/design</code>."

if ($content.Contains($oldDeck)) {
    $content = $content.Replace($oldDeck, $newDeck)
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Deck text updated"
} else {
    Write-Host "Deck anchor not found"
}

Remove-Item $PSCommandPath -Force
