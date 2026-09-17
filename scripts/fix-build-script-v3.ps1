$file = "c:\Projects\aerojet-academy\scripts\build-docs-html.mjs"
$content = Get-Content $file -Raw -Encoding UTF8

# Use a unique anchor that doesn't have unicode issues
$oldStr = "{ dir: 'plans',        title: 'Plans',        blurb: 'RFCs and implementation roadmaps.' },"
$newStr = $oldStr + "`r`n  { dir: 'design',       title: 'Design',       blurb: 'Design system \u2014 tokens, typography, components.' },"

# The actual em-dash is the U+2014 character. We need to write it as the actual character.
# Using [char]0x2014
$emdash = [char]0x2014
$newStr = "{ dir: 'plans',        title: 'Plans',        blurb: 'RFCs and implementation roadmaps.' }," + "`r`n" +
          "  { dir: 'design',       title: 'Design',       blurb: 'Design system " + $emdash + " tokens, typography, components.' },"

if ($content.Contains($oldStr)) {
    $content = $content.Replace($oldStr, $newStr)
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "SECTIONS array updated"
} else {
    Write-Host "Anchor not found - SECTIONS not updated"
}

# Verify
$lines = Get-Content $file -Encoding UTF8
Write-Host "Updated SECTIONS lines:"
for ($i = 32; $i -le 41; $i++) {
    if ($i -lt $lines.Count) {
        Write-Host "  $($i+1): $($lines[$i])"
    }
}

Remove-Item $PSCommandPath -Force
