---
name: docs-html-build
description: "Build, verify, and fix the static docs HTML site from markdown sources. Use when running `bun run docs:html`, checking docs output, debugging missing/broken docs pages, or updating the docs build script."
---

# Docs HTML Build

Builds the static HTML documentation site from `docs/` markdown sources, verifies the output, and fixes common generation/link issues.

## Trigger

Use when the user:
- runs `bun run docs:html`
- asks to rebuild the docs site
- reports missing pages, broken links, or styling issues in `docs/html/`
- adds new markdown docs and wants them included in the HTML output
- asks about docs folder structure, navigation, sorting, or breadcrumbs
- wants to update the docs build script behavior

## Prerequisites

- Bun runtime available
- Project root is the current working directory
- `docs/` contains markdown sources
- `scripts/build-docs-html.mjs` exists

## Workflow

### 1. Run the build

```bash
bun run docs:html
```

Expected success output:
```
[build-docs-html] generated <N> HTML pages + <M> folder indexes + index across 5 sections
```

### 2. Verify generation counts

```powershell
# Total HTML files
$html = Get-ChildItem -Recurse docs\html\ -Filter *.html
Write-Host "Total HTML files: $($html.Count)"

# Index pages
$idx = $html | Where-Object { $_.Name -eq 'index.html' }
Write-Host "Index pages: $($idx.Count)"
```

### 3. Verify specific expected outputs

Check that new or critical pages exist:

```powershell
$paths = @(
  "docs\html\index.html",
  "docs\html\audits\index.html",
  "docs\html\audits\portal-audits\index.html"
)
foreach ($p in $paths) {
  Write-Host "$(Test-Path $p)  $p"
}
```

### 4. Verify navigation links

For any page with loading issues, inspect its links:

```powershell
Select-String -Path "docs\html\<relative-path>\<page>.html" -Pattern '<a href=' | Select-Object LineNumber, Line
```

Validate:
- Top nav links resolve to existing files
- Breadcrumb links are correct relative to the current folder depth
- Folder cards link to existing `index.html` files
- Table/document links point to existing `.html` files
- CSS links (`design-tokens.css`, `docs.css`) are correct relative paths

### 5. Common fixes

**Broken links in nested folders:**
- Cause: hardcoded `../` prefixes or wrong output root in `path.relative()` calls
- Fix: ensure all hrefs use `relativeHref(currentPath, targetPath)` where `currentPath` is the actual output file path

**Missing nested pages:**
- Cause: `walkMd()` skipped subdirectories
- Fix: recurse into directories and preserve relative output structure

**Styling inconsistencies:**
- Cause: missing CSS classes or wrong stylesheet paths
- Fix: ensure `pageHtml()` template includes `he-shell`, `he-nav`, `he-main`, and correct `relativeHref()` calls for CSS files

### 6. Rebuild after fixes

```bash
bun run docs:html
```

Then re-verify the affected pages.

## Output

- Build success/failure status
- File counts: total pages, folder indexes, sections
- List of broken links if any
- List of missing pages if any
- Summary of fixes applied to `scripts/build-docs-html.mjs`
