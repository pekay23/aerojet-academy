$file = "c:\Projects\aerojet-academy\scripts\build-docs-html.mjs"
$content = Get-Content $file -Raw -Encoding UTF8

# File uses LF line endings. Use [char]10 instead of [char]13+[char]10
$LF = [char]10

# 1. Add nav link
$oldNav = '<a href="${basePathToHtml}plans/future-plans.html">Plans</a>' + $LF +
          '  </div>' + $LF +
          '</nav>'

$newNav = '<a href="${basePathToHtml}plans/future-plans.html">Plans</a>' + $LF +
          '    <a href="${basePathToHtml}design-system.html">Design</a>' + $LF +
          '  </div>' + $LF +
          '</nav>'

if ($content.Contains($oldNav)) {
    $content = $content.Replace($oldNav, $newNav)
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Nav updated"
} else {
    Write-Host "Nav anchor not found"
}

# 2. Token copy
$content = Get-Content $file -Raw -Encoding UTF8
$oldCopy = "  const tokens = await fs.readFile(TOKENS_SRC, 'utf8')" + $LF +
           "  await fs.writeFile(path.join(OUT, 'design-tokens.css'), tokens, 'utf8')"

$newCopy = "  // Copy Aerojet-specific design tokens (used by design-system.html and preview)" + $LF +
           "  const aeroTokens = path.join(ROOT, 'docs', 'html', 'aerojet-design-tokens.css')" + $LF +
           "  if (await fs.stat(aeroTokens).catch(() => null)) {" + $LF +
           "    await fs.copyFile(aeroTokens, path.join(OUT, 'aerojet-design-tokens.css'))" + $LF +
           "  }" + $LF + $LF +
           "  const tokens = await fs.readFile(TOKENS_SRC, 'utf8')" + $LF +
           "  await fs.writeFile(path.join(OUT, 'design-tokens.css'), tokens, 'utf8')"

if ($content.Contains($oldCopy)) {
    $content = $content.Replace($oldCopy, $newCopy)
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Token copy updated"
} else {
    Write-Host "Token copy anchor not found"
}

# 3. Deck text
$content = Get-Content $file -Raw -Encoding UTF8
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
