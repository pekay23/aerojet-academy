# Build remaining sections of design-system.html
# This script appends in chunks to avoid truncation

$file = "c:\Projects\aerojet-academy\docs\html\design-system.html"

# Section A: Pills
$section1 = @'

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Pills</h3>
  <div class="ad-btn-row" style="margin: 8px 0 32px;">
    <span class="ad-pill ad-pill--brand">Aerojet blue</span>
    <span class="ad-pill ad-pill--sky">Sky</span>
    <span class="ad-pill ad-pill--ink">Ink</span>
    <span class="ad-pill ad-pill--muted">Muted</span>
    <span class="ad-pill ad-pill--success">Success</span>
    <span class="ad-pill ad-pill--warning">Warning</span>
    <span class="ad-pill ad-pill--danger">Danger</span>
    <span class="ad-pill ad-pill--info">Info</span>
    <span class="ad-pill ad-pill--outline">Outline</span>
  </div>
  <div class="ad-callout ad-callout--warning">
    <div class="ad-callout__title">Pill usage rule</div>
    <p>One pill per row, never a wall of badges. Pills are for <strong>status</strong>, not decoration.</p>
  </div>
</section>
'@

# Section B: Typography
$section2 = @'

<!-- =========================================================== -->
<section class="ad-section" id="type">
  <span class="ad-section__num">03 · TYPOGRAPHY</span>
  <h2 class="ad-section__title">Typography</h2>
  <p class="ad-section__deck">Three families loaded via <code>next/font/google</code> with <code>display: 'swap'</code>. Body uses Inter, editorial headings use Playfair Display, marketing display uses Outfit.</p>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Loaded families</h3>
  <table class="ad-table">
    <thead><tr><th>Family</th><th>CSS var</th><th>Weights</th><th>Used for</th></tr></thead>
    <tbody>
      <tr><td><strong>Inter</strong></td><td><code>--font-inter</code></td><td>400–700</td><td><code>font-sans</code> default — body, portal UI</td></tr>
      <tr><td><strong>Outfit</strong></td><td><code>--font-outfit</code></td><td>400–900</td><td>Design-lab variants, marketing headlines</td></tr>
      <tr><td><strong>Playfair Display</strong></td><td><code>--font-playfair</code></td><td>400–700</td><td>Live public-site editorial headings (<code>font-serif</code>)</td></tr>
    </tbody>
  </table>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Type specimens</h3>
  <div class="ad-type">
    <div class="ad-type__row">
      <div class="ad-type__meta">display 48 / 500<br>font-serif</div>
      <div class="ad-type__specimen ad-type__specimen--serif" style="font-size: 48px; line-height: 1.05;">Building the future of African aviation</div>
    </div>
    <div class="ad-type__row">
      <div class="ad-type__meta">h1 32 / 500<br>font-serif</div>
      <div class="ad-type__specimen ad-type__specimen--serif" style="font-size: 32px; line-height: 1.2;">Programmes of Study</div>
    </div>
    <div class="ad-type__row">
      <div class="ad-type__meta">h2 24 / 500<br>font-serif</div>
      <div class="ad-type__specimen ad-type__specimen--serif" style="font-size: 24px; line-height: 1.3;">A Career That Takes You Anywhere</div>
    </div>
    <div class="ad-type__row">
      <div class="ad-type__meta">eyebrow 11 / 700<br>tracking 0.3em uppercase</div>
      <div class="ad-type__specimen" style="font-size: 11px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase;">— Who We Are</div>
    </div>
    <div class="ad-type__row">
      <div class="ad-type__meta">body lead 18 / 400<br>leading-relaxed</div>
      <div class="ad-type__specimen" style="font-size: 18px; line-height: 1.625;">Aerojet Aviation Training Academy is Africa's foremost institution and leader in the field of Aviation Training and Engineering.</div>
    </div>
    <div class="ad-type__row">
      <div class="ad-type__meta">body 16 / 400</div>
      <div class="ad-type__specimen">Training engineers for one of the most demanding professions in the world.</div>
    </div>
    <div class="ad-type__row">
      <div class="ad-type__meta">nav cta 12 / 900<br>tracking 0.25em uppercase</div>
      <div class="ad-type__specimen" style="font-size: 12px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase;">Register now</div>
    </div>
    <div class="ad-type__row">
      <div class="ad-type__meta">outfit 32 / 600<br>marketing display</div>
      <div class="ad-type__specimen ad-type__specimen--outfit" style="font-size: 32px; font-weight: 600; letter-spacing: -0.02em;">CERTIFIED AIRCRAFT TECHNICIAN</div>
    </div>
    <div class="ad-type__row">
      <div class="ad-type__meta">mono 12 / 500<br>captions</div>
      <div class="ad-type__specimen" style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">SYS // EASA PART-66 · ACCRA, GHANA</div>
    </div>
  </div>

  <div class="ad-pull">"An EASA Part-66 license is a globally recognized qualification. Our graduates work across commercial airlines, MROs, manufacturers, and defence contractors."</div>
</section>
'@

# Section C: Sizing
$section3 = @'

<!-- =========================================================== -->
<section class="ad-section" id="sizing">
  <span class="ad-section__num">04 · SIZING & SPACING</span>
  <h2 class="ad-section__title">Sizing, spacing & layout</h2>
  <p class="ad-section__deck">Border radius, component sizes, and the 4-pt spacing scale. Touch targets are enforced at 44×44 px (WCAG 2.5.5) on every interactive component.</p>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Border radius</h3>
  <div class="ad-swatch-row">
    <div class="ad-square ad-radius-4"></div>
    <div class="ad-square ad-radius-8"></div>
    <div class="ad-square ad-radius-12"></div>
    <div class="ad-square ad-radius-16"></div>
    <div class="ad-square ad-radius-24"></div>
    <div class="ad-square ad-radius-4" style="border-radius: 9999px;"></div>
  </div>
  <p class="ad-meta" style="margin-top: 8px;">4 px · 8 px (<code>--radius</code>) · 12 px · 16 px · 24 px · pill (9999 px)</p>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Spacing rhythm</h3>
  <table class="ad-table">
    <thead><tr><th>Tailwind</th><th>px</th><th>Used for</th></tr></thead>
    <tbody>
      <tr><td><code>p-2</code></td><td>8</td><td>Component inner padding, icon gaps</td></tr>
      <tr><td><code>p-3</code></td><td>12</td><td>Card padding (compact)</td></tr>
      <tr><td><code>p-4</code></td><td>16</td><td>Card padding (default), section gap</td></tr>
      <tr><td><code>p-5</code></td><td>20</td><td>Section outer padding</td></tr>
      <tr><td><code>p-6</code></td><td>24</td><td>shadcn Card body, section gutters</td></tr>
      <tr><td><code>p-8</code></td><td>32</td><td>Marketing tile padding</td></tr>
      <tr><td><code>py-12</code></td><td>48</td><td>Default section padding</td></tr>
      <tr><td><code>py-20</code></td><td>80</td><td>Section padding (xl)</td></tr>
      <tr><td><code>py-24</code></td><td>96</td><td>Section padding (2xl, marketing)</td></tr>
      <tr><td><code>py-32</code></td><td>128</td><td>Section padding (3xl, marketing)</td></tr>
    </tbody>
  </table>

  <h3 style="font-size: 18px; font-weight: 500; margin: 24px 0 12px;">Component sizes (shadcn)</h3>
  <table class="ad-table">
    <thead><tr><th>Component</th><th>Size</th><th>Class</th><th>Touch target</th></tr></thead>
    <tbody>
      <tr><td>Button</td><td>default</td><td><code>h-11 px-4 py-2</code></td><td><strong>44×44 px</strong> ✅ WCAG</td></tr>
      <tr><td>Button</td><td>sm</td><td><code>h-9 px-3</code></td><td>36×32 px</td></tr>
      <tr><td>Button</td><td>lg</td><td><code>h-12 px-10</code></td><td>48×≥40 px</td></tr>
      <tr><td>Button</td><td>icon</td><td><code>h-11 w-11</code></td><td>44×44 px ✅</td></tr>
      <tr><td>Input</td><td>default</td><td><code>h-11</code></td><td>44 px</td></tr>
      <tr><td>Dialog</td><td>default</td><td><code>max-w-lg</code></td><td>512 px</td></tr>
      <tr><td>Sheet</td><td>default</td><td><code>max-w-sm</code></td><td>384 px</td></tr>
    </tbody>
  </table>
</section>
'@

# Append all sections
Add-Content -Path $file -Value $section1 -Encoding UTF8
Add-Content -Path $file -Value $section2 -Encoding UTF8
Add-Content -Path $file -Value $section3 -Encoding UTF8


