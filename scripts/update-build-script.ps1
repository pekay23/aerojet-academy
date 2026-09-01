# Update the build script to include the design section + design system
$file = "c:\Projects\aerojet-academy\scripts\build-docs-html.mjs"
$content = Get-Content $file -Raw -Encoding UTF8

# 1. Add "design" section to the SECTIONS array
$oldSections = "const SECTIONS = [\n  { dir: 'architecture', title: 'Architecture', blurb: 'System reference \u2014 API, database, security.' },\n  { dir: 'guides',       title: 'Guides',       blurb: 'Operational how-tos \u2014 setup, deployment, handover.' },\n  { dir: 'audits',       title: 'Audits',       blurb: 'Historical audit reports, newest first.' },\n  { dir: 'plans',        title: 'Plans',        blurb: 'RFCs and implementation roadmaps.' },\n]"

$newSections = "const SECTIONS = [\n  { dir: 'architecture', title: 'Architecture', blurb: 'System reference \u2014 API, database, security.' },\n  { dir: 'guides',       title: 'Guides',       blurb: 'Operational how-tos \u2014 setup, deployment, handover.' },\n  { dir: 'audits',       title: 'Audits',       blurb: 'Historical audit reports, newest first.' },\n  { dir: 'plans',        title: 'Plans',        blurb: 'RFCs and implementation roadmaps.' },\n  { dir: 'design',       title: 'Design',       blurb: 'Design system \u2014 tokens, typography, components.' },\n]"

$content = $content.Replace($oldSections, $newSections)

# 2. Add a Design nav link in the pageHtml function
$oldNav = '<a href="${basePathToHtml}plans/future-plans.html">Plans</a>\n  </div>\n</nav>'
$newNav = '<a href="${basePathToHtml}plans/future-plans.html">Plans</a>\n    <a href="${basePathToHtml}design-system.html">Design</a>\n  </div>\n</nav>'
$content = $content.Replace($oldNav, $newNav)

# 3. Add a special "design system" copy from /docs/html/design-system.html if it exists
# Also add an /html/design-system.html hand-authored preservation block
$oldMain = "  const tokens = await fs.readFile(TOKENS_SRC, 'utf8')\n  await fs.writeFile(path.join(OUT, 'design-tokens.css'), tokens, 'utf8')\n  await fs.writeFile(path.join(OUT, 'docs.css'), SITE_CSS, 'utf8')"
$newMain = "  // Copy Aerojet-specific design tokens (the actual app tokens) over the\n  // generic editorial tokens \u2014 this is what the public site + design system page use.\n  const aeroTokens = path.join(ROOT, 'docs', 'html', 'aerojet-design-tokens.css')\n  if (await fs.stat(aeroTokens).catch(() => null)) {\n    await fs.copyFile(aeroTokens, path.join(OUT, 'aerojet-design-tokens.css'))\n  }\n\n  const tokens = await fs.readFile(TOKENS_SRC, 'utf8')\n  await fs.writeFile(path.join(OUT, 'design-tokens.css'), tokens, 'utf8')\n  await fs.writeFile(path.join(OUT, 'docs.css'), SITE_CSS, 'utf8')"
$content = $content.Replace($oldMain, $newMain)

# 4. Update the deck text in the index
$oldDeck = "All project documentation, organised by purpose. Markdown sources live in <code>docs/architecture</code>, <code>docs/guides</code>, <code>docs/audits</code>, and <code>docs/plans</code>."
$newDeck = "All project documentation, organised by purpose. Markdown sources live in <code>docs/architecture</code>, <code>docs/guides</code>, <code>docs/audits</code>, <code>docs/plans</code>, and <code>docs/design</code>."
$content = $content.Replace($oldDeck, $newDeck)

# 5. In the standalone section, also list a "design system" link if the file exists
# This is already handled by the handAuthored scan, so the design-system.html at the
# root of /html/ will be picked up automatically.

Set-Content -Path $file -Value $content -Encoding UTF8
Remove-Item $PSCommandPath -Force
Write-Host "build-docs-html.mjs updated"
