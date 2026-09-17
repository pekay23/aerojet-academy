---
description: "Build and verify the docs HTML site from markdown sources. Use when the user asks to generate docs HTML, rebuild the docs site, fix docs links, or verify docs output."
mode: primary
---

# Docs HTML Builder

Builds the static HTML documentation site from `docs/` markdown sources using `scripts/build-docs-html.mjs`, verifies the output, and fixes navigation/link issues.

## Trigger

Use when the user:
- asks to build/generate/rebuild the docs HTML site
- mentions `bun run docs:html`
- reports broken links, missing pages, or styling issues in `docs/html/`
- wants to add new docs pages and ensure they appear in the HTML output
- asks about docs folder structure, navigation, or sorting

## Workflow

### 1. Run the build

```bash
bun run docs:html
```

This executes `scripts/build-docs-html.mjs` and outputs to `docs/html/`.

### 2. Verify generation

Check that all expected pages were generated:

```bash
# Count generated files
$html = Get-ChildItem -Recurse docs\html\ -Filter *.html
Write-Host "Total HTML files: $($html.Count)"

# Verify specific folders exist
Test-Path docs\html\index.html
Test-Path docs\html\audits\index.html
Test-Path docs\html\audits\portal-audits\index.html
```

### 3. Verify navigation links

For any page that had loading issues, extract and validate its nav links:

```powershell
Select-String -Path "docs\html\<path>\<page>.html" -Pattern '<a href=' | Select-Object Line
```

Check that:
- Top nav links point to existing files
- Breadcrumb links are correct
- Folder cards link to existing `index.html` files
- Table row links point to existing files
- CSS links (`design-tokens.css`, `docs.css`) are correct

### 4. Common issues and fixes

**Broken nav links in nested folders:**
- The build script uses `path.relative()` to compute links from each page's output path
- If links are broken, check `scripts/build-docs-html.mjs` for hardcoded `basePathToHtml` values
- All href computation should use `relativeHref(currentPath, targetPath)` based on actual file locations

**Missing pages in nested folders:**
- `walkMd()` must recurse into subdirectories, not skip them
- Output paths must preserve the relative directory structure from `docs/`

**Styling inconsistencies:**
- All pages must link to `../design-tokens.css` and `../docs.css` (or appropriate relative paths)
- All pages must use `he-shell`, `he-nav`, and `he-main` classes from the shared template
- Check that `docs/html/docs.css` contains the latest CSS rules

### 5. Rebuild after fixes

After any fix to `scripts/build-docs-html.mjs`:

```bash
bun run docs:html
```

Then re-verify the specific pages that were broken.

## Output

- Confirmation of successful build with file counts
- List of any broken links found
- List of missing pages if any
- Summary of fixes applied
