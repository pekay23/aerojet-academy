# Append final sections to design-system.html and close it

$file = "c:\Projects\aerojet-academy\docs\html\design-system.html"

# Section F: Icons
$section6 = @'

<!-- =========================================================== -->
<section class="ad-section" id="icons">
  <span class="ad-section__num">07 · ICONS & IMAGERY</span>
  <h2 class="ad-section__title">Icons, illustrations, and imagery</h2>
  <p class="ad-section__deck">All icons are SVG via <code>lucide-react</code>. All marketing photography is <code>.webp</code>, optimised through <code>sharp</code>. <strong>No emoji as icons.</strong></p>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Icon library (Lucide)</h3>
  <div class="ad-icon-grid">
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      <span>ArrowRight</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      <span>Menu</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      <span>X (close)</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      <span>ChevronDown</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      <span>Check</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      <span>Plus</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      <span>AlertCircle</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      <span>Eye</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      <span>Copy</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <span>Search</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <span>Lock</span>
    </div>
    <div class="ad-icon-cell">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
      <span>Mail</span>
    </div>
  </div>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Default icon size</h3>
  <p class="ad-meta">The <code>Button</code> stylesheet sets <code>[&_svg]:size-4 [&_svg]:shrink-0</code>, so every icon inside a Button is <strong>16×16</strong>. To override per icon: <code>h-4 w-4</code> / <code>h-5 w-5</code> / <code>h-6 w-6</code> / <code>h-8 w-8</code>.</p>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Imagery set</h3>
  <p class="ad-meta">All marketing photography in <code>public/images/</code>. Paths are centralised in <code>app/design-lab/shared.tsx</code> so a designer can swap shots in one place.</p>
  <pre><code>/images/hero/hero-slide{1,2,3}.webp   students, aircraft, engineer
/images/hero/hanger.webp               interior hangar
/images/hero/lecture.webp              lecture theatre
/images/hero/lecturer2.webp            instructor portrait
/images/hero/students.webp             student cohort
/images/hero/undercarage.webp          undercarriage close-up
/images/hero/takeoff.webp              aircraft take-off
/images/hero/aircraft-full.webp        full aircraft on tarmac
/images/courses/aircraft-engine-crossection.webp
/images/careers/aircraftcareers.webp
/images/home/al4.webp                  (LCP, priority loaded)</code></pre>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Imagery rules</h3>
  <ul>
    <li>Format: <code>.webp</code> (Next/Image + Sharp pipeline).</li>
    <li>Quality: <code>quality=&#123;90&#125;</code> on the live homepage hero.</li>
    <li>Sizes hint: <code>sizes="(max-width: 1024px) 100vw, 50vw"</code>.</li>
    <li><code>priority</code> set on the LCP candidate (<code>/images/home/al4.webp</code>).</li>
    <li>Optional <code>sepia-[0.15]</code> filter on the editorial "Who We Are" portrait.</li>
    <li>All images optimised through <code>sharp</code> and resized via <code>convertImages.js</code>.</li>
  </ul>
</section>
'@

# Section G: Forbidden patterns + footer
$section7 = @'

<!-- =========================================================== -->
<section class="ad-section" id="rules">
  <span class="ad-section__num">08 · RULES</span>
  <h2 class="ad-section__title">Do & don't</h2>
  <p class="ad-section__deck">Hard rules from the codebase and the design gap audit. Violating these typically causes a code review rejection or a "design system debt" entry in <code>docs/audits/</code>.</p>

  <div class="ad-duo">
    <div class="ad-duo__pane ad-duo__pane--light">
      <div class="ad-duo__label">do</div>
      <ul>
        <li>Use <code>bg-aerojet-blue</code> on the public site, <code>bg-primary</code> inside the portal.</li>
        <li>Compose pages from <code>components/marketing/sections/*</code>.</li>
        <li>Reach for the <code>font-sans</code> / <code>font-serif</code> / <code>font-outfit</code> aliases, not raw family names.</li>
        <li>Use <code>focus-visible:ring-2 focus-visible:ring-ring</code> on every interactive element.</li>
        <li>Keep buttons at <strong>44×44 px</strong> minimum.</li>
        <li>Use Lucide <code>ArrowRight</code> for CTAs.</li>
        <li>Reach for the 4-pt spacing scale — <code>p-2</code> … <code>py-32</code>.</li>
      </ul>
    </div>
    <div class="ad-duo__pane ad-duo__pane--dark">
      <div class="ad-duo__label" style="color: rgba(255,255,255,0.5);">don't</div>
      <ul>
        <li>No emoji as icons. Always Lucide.</li>
        <li>No raw <code>bg-blue-500</code> / <code>bg-red-500</code> on the public site — use <code>--aero-*</code>.</li>
        <li>No <code>text-white</code> inside portal chrome — use <code>text-card-foreground</code>.</li>
        <li>No buttons smaller than 44×44 px (WCAG).</li>
        <li>No <code>transition-all</code> on heavy properties — <code>transition-colors</code> or <code>transition-transform</code>.</li>
        <li>No default <code>font-bold</code> on body — <code>font-medium</code> (500) is the heading cap.</li>
        <li>No emoji as bullet markers.</li>
      </ul>
    </div>
  </div>

  <div class="ad-callout ad-callout--success">
    <div class="ad-callout__title">When in doubt, read the live code</div>
    <p>Every value in this document is extracted from a specific file. When you change one, update the corresponding section. Files: <code>app/globals.css</code>, <code>tailwind.config.ts</code>, <code>app/layout.tsx</code>, <code>components/ui/*</code>, <code>components/shared/*</code>, <code>app/(public)/_components/*</code>, <code>app/design-lab/variants/*</code>.</p>
  </div>
</section>

</main>

<footer class="ad-foot">
  <strong>Aerojet Academy · Design System v1.0</strong> &middot;
  Generated from <code>app/globals.css</code> and <code>tailwind.config.ts</code> &middot;
  Markdown sources at <code>docs/design/</code> &middot;
  <a href="./index.html">← back to docs index</a>
</footer>

</div>
</body>
</html>
'@

Add-Content -Path $file -Value $section6 -Encoding UTF8
Add-Content -Path $file -Value $section7 -Encoding UTF8

Write-Host "Sections 6-7 appended. Current line count:"
(Get-Content $file | Measure-Object -Line).Lines
Write-Host "File complete!"
