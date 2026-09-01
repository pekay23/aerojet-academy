# Append remaining sections to design-system.html

$file = "c:\Projects\aerojet-academy\docs\html\design-system.html"

# Section D: Components
$section4 = @'

<!-- =========================================================== -->
<section class="ad-section" id="components">
  <span class="ad-section__num">05 · COMPONENTS</span>
  <h2 class="ad-section__title">Component library</h2>
  <p class="ad-section__deck">Three tiers — <code>components/ui/*</code> (shadcn primitives, 29 files), <code>components/shared/*</code> (composites), and <code>app/(public)/_components/*</code> (marketing sections).</p>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Buttons</h3>
  <div class="ad-btn-row">
    <button class="ad-btn ad-btn--aero">Apply now</button>
    <button class="ad-btn ad-btn--sky">Register</button>
    <button class="ad-btn ad-btn--primary">Save changes</button>
    <button class="ad-btn ad-btn--secondary">Cancel</button>
    <button class="ad-btn ad-btn--outline">Browse courses</button>
    <button class="ad-btn ad-btn--ghost">Learn more</button>
    <button class="ad-btn ad-btn--destructive">Delete</button>
  </div>
  <div class="ad-btn-row" style="margin-top: 8px;">
    <button class="ad-btn ad-btn--aero ad-btn--sm">Small (36 px)</button>
    <button class="ad-btn ad-btn--aero">Default (44 px)</button>
    <button class="ad-btn ad-btn--aero ad-btn--lg">Large (48 px)</button>
    <button class="ad-btn ad-btn--aero ad-btn--icon" aria-label="icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button>
  </div>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Form fields</h3>
  <div class="ad-field">
    <label class="ad-label" for="email">Email address</label>
    <input class="ad-input" id="email" type="email" placeholder="you@example.com" />
  </div>
  <div class="ad-field">
    <label class="ad-label" for="pwd">Password</label>
    <input class="ad-input" id="pwd" type="password" placeholder="Enter a strong password" />
  </div>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Card</h3>
  <div class="ad-card" style="max-width: 420px;">
    <h3>Category B1 — Mechanical</h3>
    <p>Issue certifications of release to service following maintenance on aircraft structure, power plants, and mechanical / electrical systems.</p>
    <div style="display: flex; gap: 8px; margin-top: 12px;">
      <button class="ad-btn ad-btn--aero ad-btn--sm">Learn more</button>
      <button class="ad-btn ad-btn--outline ad-btn--sm">View modules</button>
    </div>
  </div>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Hero preview (Variant C — live)</h3>
  <div class="ad-hero">
    <div class="ad-hero__eyebrow">EASA Part-66 · Accra, Ghana</div>
    <h2 class="ad-hero__title">Your Journey to Becoming a Certified Aircraft Technician Starts Here.</h2>
    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <button class="ad-btn ad-btn--sky">Apply now</button>
      <button class="ad-btn ad-btn--outline" style="color: white; border-color: rgba(255,255,255,0.4);">Browse courses</button>
    </div>
  </div>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Callouts</h3>
  <div class="ad-callout ad-callout--info">
    <div class="ad-callout__title">Info callout</div>
    <p>Used for technical notes, link-outs, and inline documentation.</p>
  </div>
  <div class="ad-callout ad-callout--success">
    <div class="ad-callout__title">Success callout</div>
    <p>Used for confirmations, completed steps, and positive changes.</p>
  </div>
  <div class="ad-callout ad-callout--warning">
    <div class="ad-callout__title">Warning callout</div>
    <p>Used for deprecations, missing fields, and "this is a stub" notes.</p>
  </div>
  <div class="ad-callout ad-callout--danger">
    <div class="ad-callout__title">Danger callout</div>
    <p>Used for destructive actions, breaking changes, and security flags.</p>
  </div>
</section>
'@

# Section E: Motion
$section5 = @'

<!-- =========================================================== -->
<section class="ad-section" id="motion">
  <span class="ad-section__num">06 · MOTION</span>
  <h2 class="ad-section__title">Motion & interaction</h2>
  <p class="ad-section__deck">The portal keeps motion <strong>short, restrained, and purposeful</strong> — no parallax, no scroll-jacking, no long reveals. All durations and easings below are pulled from the live code.</p>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Core durations</h3>
  <table class="ad-table">
    <thead><tr><th>Duration</th><th>Used for</th></tr></thead>
    <tbody>
      <tr><td>120 ms</td><td>Tiny colour swaps (link underline, icon recolour)</td></tr>
      <tr><td>150 ms</td><td>Sidebar items, shadcn <code>transition-colors</code> default</td></tr>
      <tr><td>160 ms</td><td><code>he-card</code> lift on hover</td></tr>
      <tr><td>200 ms</td><td>Most interactive bits; Accordion content</td></tr>
      <tr><td>250 ms</td><td>Sheet, Dialog, Tabs content fade</td></tr>
      <tr><td>300 ms</td><td>Public nav scroll state transition</td></tr>
      <tr><td>500 ms</td><td>Pool progress bar fill, currency display</td></tr>
    </tbody>
  </table>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Easing</h3>
  <table class="ad-table">
    <thead><tr><th>Curve</th><th>Used in</th></tr></thead>
    <tbody>
      <tr><td><code>ease-out</code></td><td>Accordion open/close (200 ms)</td></tr>
      <tr><td><code>ease-in-out</code></td><td>shadcn Sheet (300 ms in, 500 ms out)</td></tr>
      <tr><td><code>cubic-bezier</code> (Framer)</td><td><code>SectionReveal</code> scroll-in fade</td></tr>
      <tr><td>spring (Framer)</td><td><code>MotionTabs</code> underline <code>layoutId</code></td></tr>
    </tbody>
  </table>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Hover patterns</h3>
  <table class="ad-table">
    <thead><tr><th>Pattern</th><th>Used in</th></tr></thead>
    <tbody>
      <tr><td><code>hover:translate-x-1</code> on arrow</td><td>Programme rows</td></tr>
      <tr><td><code>hover:border-aerojet-sky</code> + colour swap</td><td>Editorial links</td></tr>
      <tr><td><code>hover:scale-105</code></td><td>Calendar event chips, marketing CTAs</td></tr>
      <tr><td><code>hover:bg-[#efe8dc]</code></td><td>Programme row hover fill</td></tr>
      <tr><td><code>active:scale-95</code></td><td>Sidebar menu, copy button</td></tr>
      <tr><td><code>group-hover:translate-x-1</code></td><td>Editorial CTAs with arrow</td></tr>
    </tbody>
  </table>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Focus & accessibility</h3>
  <div class="ad-callout ad-callout--info">
    <div class="ad-callout__title">A11y motion rules</div>
    <p>All interactive elements get a visible focus ring (2 px, 2 px offset) using <code>focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2</code>. The skip-link at the top of every page is <code>sr-only focus:not-sr-only</code> and lands at <code>inset-4 z-50 rounded-lg bg-white px-4 py-2 font-bold shadow-lg</code>. <code>body.exam-lockdown</code> is a hard mode used during exams that strips the sidebar, sticky elements, breadcrumb, and registration banners.</p>
  </div>
</section>
'@

Add-Content -Path $file -Value $section4 -Encoding UTF8
Add-Content -Path $file -Value $section5 -Encoding UTF8

Write-Host "Sections 4-5 appended. Current line count:"
(Get-Content $file | Measure-Object -Line).Lines
