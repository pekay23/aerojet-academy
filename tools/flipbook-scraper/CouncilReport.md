# LLM Council Report: Playwright Image Interception Failure in Flipbook Scraper

**Date:** 2026-09-03
**Subject:** `tools/flipbook-scraper/scraper.ts` — root cause for `interceptedImages` returning 0 usable matches, forcing screenshot fallback that then fails with "element is not visible"
**Goal:** Fix interception so it returns the correct full-resolution image per page. No more screenshot fallback as a workaround.

---

## Stage 1 — First Opinions

### Persona 1: Playwright Route Interception Specialist

**Most likely root causes:**

1. **Race condition from `clear()` then `waitForTimeout(1500)`.** The route handler is _event-driven_: it fires when the browser actually issues a request for an image. If the flipbook uses lazy / spread-pair loading (turn.js loads pages in pairs and preloads the _next_ spread while the current is visible), there is no guarantee that the URL of the currently visible page has been fetched during the 1500 ms window. We `clear()` the map, sleep 1.5 s, then ask "is the image here?" — the answer is "no" more often than we think.

2. **`route.fetch()` swallows real errors.** The handler is wrapped in `try { ... } catch { /* ignore fetch failures */ }`. We have no idea how many requests fired, how many failed, or what their status codes were. Every diagnostic signal is being thrown away.

3. **`context.route()` glob brace expansion has edge cases.** `'**/*.{jpg,jpeg,png,webp}'` is valid Playwright glob syntax, but CDN-signed URLs often end in `.webp` with `?token=…` or have a `.jpe` (no second `g`) extension; some PDFs flipbooks serve tiles as `.avif` or return HTTP 200 with `Content-Type: image/jpeg` and no extension in the path at all (PHP dynamic endpoints).

4. **No service-worker / request lifecycle hook.** We register a route handler but never use `page.on('request')` / `page.on('response')` to count or log traffic. There is no observable evidence the handler is being invoked at all.

5. **Race between DOM read and interception completion.** `page.evaluate(() => …)` reads `img.src` synchronously, but `route.fetch()` in the handler awaits the body — when the map is queried, the buffer may not yet be in the map for that URL even though the request fired.

**Concrete code issues I see:**

- `route.continue()` is called after `route.fetch()` — that's correct, but we lose the body when `continue()` is invoked because the response is "consumed" by `fetch()`. The browser still loads the image normally; we just have a copy in the map. OK, that's intended.
- The interception runs on `context`, so it lives across navigations. Good.
- The `.clear()` per iteration is correct in spirit but the timing is wrong.

**Concrete improvements:**

1. Replace the fixed `waitForTimeout(1500)` with `page.waitForResponse(resp => resp.url().match(/\.(jpg|jpeg|png|webp)(\?|$)/) !== null, { timeout: 10000 })` — wait for the actual response.
2. Log every intercepted URL with size and status in the handler — never silent-fail.
3. Also attach `page.on('request')` and `page.on('response')` for full traffic visibility while debugging.
4. Use `page.waitForLoadState('networkidle')` after each ArrowRight, falling back to a timeout if the keepalive timer never fires.
5. Keep the _last 3_ intercepted images in the map (a small ring buffer) instead of clearing — turn.js preloads the next spread, so the "currently visible" page image is the second-most-recent, not the most-recent.

---

### Persona 2: Flipbook DOM / Asset Pipeline Engineer

**Most likely root causes:**

1. **turn.js / Real3D Flipbook loads pages in pairs and preloads the next spread.** The library inserts `<img>` for the _current spread_ and the _next spread_ simultaneously. When you press ArrowRight, the _currently visible_ DOM `img.src` becomes the page we _just turned to_, but the image that was just intercepted may be for the _spread after that_. So the map has the right bytes, but `currentImgSrc` (from the DOM) doesn't match what was just intercepted — because what was just intercepted is the preloaded next page.

2. **Image elements may not exist in the DOM at the moment of evaluation.** turn.js keeps only two `<img>` per spread. On ArrowRight, the old spread's imgs get removed before the new spread's imgs are inserted. There's a micro-window during the flip animation where the DOM contains _neither_ the old nor the new src. `querySelectorAll('.book img, ...)` returns an empty array during this window, `currentImgSrc` is `null`, and we fall through to "largest intercepted image" — which after `.clear()` is empty.

3. **The flipbook may render to canvas, not `<img>`.** Real3D Flipbook has a render mode where it draws each page to a `<canvas>` (especially when WebGL or "page curl" is enabled). When that's the case, the `<img>` in the DOM is a _thumbnail / cover preview_ — small, possibly 200×300 — not the full-resolution page. Our `> 100×100` size filter passes, but the bytes are wrong. This is the most insidious failure: we intercept successfully, we "find" an image, but it's the wrong image (preview, not full page).

4. **Background-image pages.** Some flipbook configurations put the page image as `background-image: url(...)` on a div. `document.querySelectorAll('img')` finds nothing. We must also scan `getComputedStyle(el).backgroundImage` for `url("...")`.

5. **`img.src` is normalized differently than the request URL.** `img.src` returns the _resolved_ absolute URL; `route.request().url()` is also absolute. But `img.src` may include a different query string (`?v=1234`) than the request URL (which Playwright sees before the browser normalizes). The four-tier matcher in `findInterceptedImage` (exact / pathname / basename) tries to handle this, but if the request fires with one variant and the DOM is read with another, no tier matches.

6. **CSS transforms hide elements during the flip.** During an ArrowRight animation, the visible spread has `transform: rotateY(90deg)` and `opacity: 0`. Our `getBoundingClientRect().width > 100` check still passes (the rect is computed from layout, not visual opacity), but the _opposite_ page's img is what becomes visible — and that's the one with the new src.

**Concrete code issues I see:**

- Selector `.book img, .flipbook-main-wrapper img, .flipbook-container img` is incomplete. Need `.turn-page img`, `.page-wrapper img`, and the canvas fallback.
- The size threshold `10000` bytes is too low for full-res JPEG pages. Compressed page JPEGs from Real3D are usually 30–200 KB. A 10 KB threshold might be filtering out valid pages under aggressive compression.
- `!img.src.includes('spinner')` is fine, but `logo` substring matching is brittle (a logo could legitimately appear on a page).

**Concrete improvements:**

1. **Don't rely on `<img>` alone.** Add a `getCurrentPageImageUrls()` that returns both `<img>` srcs AND `background-image: url(...)` AND `data-src` attributes (lazy-loading pattern).
2. **Scan canvas too.** If a canvas exists with `width > 1000`, capture it via `canvas.toDataURL('image/jpeg', 0.9)` — this is a guaranteed pixel-perfect capture of what's rendered.
3. **Trigger the flip, then wait for `page.waitForFunction(() => …)` that watches for the new spread's src to appear in the DOM AND for any matching in-flight request to resolve.**
4. **Drop the `.clear()` entirely** for the first attempt. Let the map accumulate. Track which image was "current at time of capture" via a separate set.
5. **Use the Real3D JS API.** `window.FLIPBOOK.<id>` (already partially read by `detectTotalPages`) often exposes `currentPage` and the source URL of the page. Use that as ground truth — it is exactly what Real3D thinks is currently displayed.

---

### Persona 3: Diagnostics / Instrumentation Engineer

**Most likely root causes:**

1. **We have _zero_ observability into what's failing.** The route handler swallows errors with `catch { /* ignore fetch failures */ }`. We don't log URLs, response statuses, body sizes, or which URL the DOM query returned. We can't tell if:
   - The route handler is being invoked at all
   - It's being invoked but the response is failing (e.g. CORS, 403, signed-URL expiry)
   - It's being invoked successfully but `findInterceptedImage` can't match because of URL normalization
   - The map is populated but `> 10000` byte filter rejects everything
   - The DOM query is returning a URL that's never been requested

2. **The "screenshot fallback" error log reveals _another_ problem.** The error trace shows `waiting for fonts to load` — meaning Playwright is trying to take a screenshot of an element that requires the page to be in a specific state. The element is "not visible" because `.flipbook-main-wrapper` has zero size in the viewport (likely because the flipbook auto-fits and the container's dimensions depend on the active spread's dimensions, which are mid-animation). This is a _secondary_ symptom: the fallback was never going to work even if interception returned empty.

3. **No reproducibility harness.** We can't reliably reproduce the issue because:
   - The flipbook requires auth
   - The flipbook may serve different image URLs based on session state
   - Headless vs headed render differently for canvas-heavy pages
   - Timing depends on network latency to the CDN

4. **`waitForTimeout(1500)` is a magic number with no basis.** It assumes "the image will be intercepted within 1.5 s of pressing ArrowRight." That's empirical. We never measured. Real3D may use progressive JPEG loading where the full image arrives over 3–5 s.

5. **No assertion-based test that interception works.** The code path `if (imageBuffer) { fs.writeFile }` is the success path — but we never verify _that the buffer is a valid JPEG_. A captured buffer could be a 1×1 transparent pixel or an HTML error page, and `fs.writeFile` would happily save it as `page_0001.jpeg`.

**Concrete improvements:**

1. **Add a `--diagnose` mode** to `index.ts` that:
   - Logs every intercepted URL with `length` and `Content-Type` at handler entry
   - Logs the result of `findInterceptedImage` for each page (match type: exact/pathname/basename/miss)
   - Logs the DOM image inventory at capture time
   - Saves the first 3 intercepted images to `/tmp/interception-diagnostic/` for manual inspection
   - Exits after 5 pages

2. **Add page-side instrumentation** to the route handler:
   - Counter `interceptorRequests`, `interceptorErrors`, `interceptorBytes`
   - On error, log `error.message` (don't swallow it)

3. **Add a captured-buffer validator:**
   - First 4 bytes must be `FF D8 FF` (JPEG) or `89 50 4E 47` (PNG) or `52 49 46 46` (WEBP)
   - If invalid, log the first 200 bytes and discard

4. **Use Playwright tracing:** `await context.tracing.start({ screenshots: true, snapshots: true })` and save trace on every capture iteration. Replay in `trace.playwright.dev` to see exactly what the browser was doing at the moment interception failed.

5. **Add an `--inspect-only` flag that runs the first 3 pages of capture in headed mode and pauses** for manual DOM inspection at each step.

6. **Make `waitForTimeout` configurable** and print the actual ms waited plus the actual `interceptorBytes` delta — so we can empirically find the right delay.

---

## Stage 2 — Peer Review

**Playwright Specialist → Flipbook Engineer:**
"You keep saying the route handler fires for the right URL. But what if those URLs are _preloaded tile thumbnails_, not full pages? Real3D can serve 12 small pre-thumbnailized images per spread plus the 2 full pages. My route handler is intercepting _all_ of them. If my matcher then keys off the first `<img>` in the DOM (the preview), I'd save a thumbnail and call it a day. Are you certain the selector `img[src*='page']` or class-based discrimination would even separate them?"

**Flipbook Engineer → Playwright Specialist:**
"You're right that the route fires for every image request. But more importantly: my bigger concern is that the route fires for _canvas-painted_ pages where there's _no_ `<img>` and _no_ `route.fetch()` call at all — because the canvas reads from a blob URL or a `createImageBitmap` source, neither of which go through normal HTTP. Your interception-by-URL strategy cannot see those. The fallback must be canvas-toDataURL or screenshot of the canvas element itself, not screenshot of the wrapper div."

**Flipbook Engineer → Diagnostics Engineer:**
"You want us to log everything. Fine. But the _real_ question is: are we even looking at the right DOM? If the flipbook uses a Web Worker to render to OffscreenCanvas, then `document.querySelectorAll('img')` will return zero, and every page log will say 'no imgs found' — and we'll conclude interception is broken when it's actually that there's nothing to intercept because the asset pipeline doesn't use HTTP for the final render. We need to instrument the canvas path too."

**Diagnostics Engineer → Playwright Specialist:**
"You proposed `page.waitForResponse(...)` as the synchronization point. Good. But you're still assuming the URL pattern is the right discriminator. If the flipbook serves pages via `/api/v1/page/123?token=…` with no extension, your glob `'**/*.{jpg,jpeg,png,webp}'` won't match it at all — zero interceptions, zero log lines, and we'll be debugging in the dark. The diagnostic must include a count of _all_ requests, not just the ones we expect to match."

**Diagnostics Engineer → Flipbook Engineer:**
"You want us to call `canvas.toDataURL()` as a fallback. Two problems: (1) `toDataURL` on a tainted canvas (cross-origin image) throws SecurityError — so we need to capture via the route handler _first_ to avoid tainting, then call `toDataURL` only on same-origin canvases. (2) Calling `toDataURL` is synchronous and can stall for 100s of ms on a 4K canvas — we need to wrap it in a `page.evaluate` with a timeout and a fallback strategy."

**Consensus after cross-examination:**

1. The interception strategy by URL pattern is **necessary but not sufficient**. We must add canvas + background-image detection for render modes that bypass `<img>`.
2. The synchronization between page navigation and interception must be **event-driven**, not time-based. `page.waitForResponse` (filtered by a known pattern) or `page.waitForFunction(() => img.complete && img.naturalWidth > 100)` is the correct primitive.
3. The diagnostics must log _all_ request counts — not just the ones we expected to match — so we can detect "zero interceptions because the glob doesn't match" vs "interceptions fired but matcher failed."
4. The screenshot fallback should never silently try to screenshot an element that may be invisible. It must _check_ visibility and refuse to fall back silently.

---

## Stage 3 — Chairman's Synthesis & Prioritized Action Plan

### Most Likely Root Causes (Ranked)

| #     | Root cause                                                                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **1** | **Race condition between `clear()` and fixed 1500 ms timeout.** The map is cleared, then we wait 1.5 s, then we query the map — but the image request for the newly visible page may not have completed in that window. turn.js preloads pairs of pages, so the _currently visible_ page's request may have already fired (and been intercepted) _before_ the clear, then the clear wipes it. | Fixed-timeout sync, `.clear()` per iteration                                                                |
| **2** | **DOM `img.src` does not match the intercepted URL.** turn.js may keep the old spread's `<img>` in the DOM during the flip animation; the new spread's image is in flight but `currentImgSrc` still returns the old URL (or null). The four-tier matcher in `findInterceptedImage` then misses.                                                                                               | "no images found in DOM" during transitions; URL normalization gap                                          |
| **3** | **Render mode is canvas, not `<img>`.** Real3D Flipbook's desktop / curl mode paints pages to `<canvas>`. There are no `<img>` elements with full-resolution src — only small preview thumbnails. The interception grabs previews, which are below the byte threshold or wrong content.                                                                                                       | `canvas` element in DOM (per `inspect.ts`); screenshot shows correct page but interception saves wrong size |
| **4** | **Route glob misses the actual asset URLs.** The CDN may serve pages as `/api/v1/page/123?token=…` with no `.jpg` extension, or as `.avif`, or as PHP endpoints. `'**/*.{jpg,jpeg,png,webp}'` matches none of them — zero interceptions, but the code silently continues.                                                                                                                     | "no log lines" if glob mismatch                                                                             |
| **5** | **Screenshot fallback element is mid-animation.** `.flipbook-main-wrapper` is `transform: rotateY(90deg)` / `opacity: 0` during the flip; Playwright treats it as "not visible" and the 30 s timeout expires. This is the error message in M9a.                                                                                                                                               | Stack trace: "element is not visible"                                                                       |
| **6** | **No diagnostics — silent failure everywhere.** We cannot distinguish root causes 1–4 because the route handler swallows errors and the capture loop logs only success.                                                                                                                                                                                                                       | `catch { /* ignore */ }`, no counters                                                                       |

---

### Concrete Code Changes

**Change 1 — Replace `clear()` + fixed timeout with event-driven sync.**

In `setupImageInterception`, add counters and stop swallowing errors:

```ts
private interceptedRequests = 0;
private interceptedErrors = 0;
private interceptedBytes = 0;

private async setupImageInterception() {
  if (!this.context) return;

  await this.context.route(
    /.*\.(jpe?g|png|webp|avif)(\?.*)?$/i,   // regex — handles query strings
    async (route: Route) => {
      this.interceptedRequests++;
      try {
        const response = await route.fetch();
        const buffer = await response.body();
        const url = route.request().url();
        const ct = response.headers()['content-type'] ?? '';
        this.interceptedBytes += buffer.length;

        if (!url.includes('spinner') && !url.includes('logo') && buffer.length > 5000) {
          this.interceptedImages.set(url, Buffer.from(buffer));
          this.report({
            status: 'capturing',
            message: `[intercept] ${url.slice(-60)} → ${buffer.length}B (${ct})`,
          });
        }
        await route.continue();
      } catch (err) {
        this.interceptedErrors++;
        this.report({
          status: 'capturing',
          message: `[intercept:error] ${route.request().url()} — ${(err as Error).message}`,
        });
        await route.continue().catch(() => {});
      }
    }
  );
}
```

**Change 2 — Drop `.clear()`. Track per-page image set by URL timestamp.**

```ts
// In capture loop, REPLACE:
//   this.interceptedImages.clear();
//   await this.page.waitForTimeout(1500);
// WITH:

// Mark a "page boundary" timestamp; images intercepted after this timestamp belong to the new page.
const pageBoundaryAt = Date.now()
await this.page.keyboard.press('ArrowRight')

// Wait for an image response matching our pattern (with a generous timeout).
const response = await this.page
  .waitForResponse((resp) => /\.(jpe?g|png|webp|avif)(\?|$)/i.test(resp.url()), { timeout: 8000 })
  .catch(() => null)

if (!response) {
  this.report({
    status: 'capturing',
    message: `[wait] no image response within 8s on page ${i}`,
  })
}
```

**Change 3 — Read all image sources from the DOM, including background-image and data-src.**

```ts
const currentImgSrc = await this.page.evaluate(() => {
  const candidates: { src: string; rect: DOMRect }[] = []

  // 1. Real <img> elements
  document.querySelectorAll('img').forEach((img) => {
    const src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src
    if (!src || src.includes('spinner')) return
    const rect = img.getBoundingClientRect()
    candidates.push({ src, rect })
  })

  // 2. Elements with background-image
  document.querySelectorAll('div, section').forEach((el) => {
    const bg = getComputedStyle(el).backgroundImage
    const m = bg.match(/url\(["']?([^"')]+)["']?\)/)
    if (m) {
      const rect = el.getBoundingClientRect()
      if (rect.width > 200 && rect.height > 200) {
        candidates.push({ src: m[1], rect })
      }
    }
  })

  // 3. Lazy-loaded data-src
  document.querySelectorAll('img[data-src]').forEach((img) => {
    const src = (img as HTMLImageElement).dataset.src!
    const rect = img.getBoundingClientRect()
    candidates.push({ src, rect })
  })

  // Pick the largest visible candidate
  return (
    candidates
      .filter((c) => c.rect.width > 200 && c.rect.height > 200)
      .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height)[0]?.src ?? null
  )
})
```

**Change 4 — Add canvas-render-mode detection and capture.**

```ts
const canvasDataUrl = await this.page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll('canvas'))
  const big = canvases.find((c) => c.width > 1000 && c.height > 1000)
  if (!big) return null
  try {
    return big.toDataURL('image/jpeg', 0.9)
  } catch {
    return null // tainted
  }
})

if (canvasDataUrl) {
  const base64 = canvasDataUrl.replace(/^data:image\/\w+;base64,/, '')
  imageBuffer = Buffer.from(base64, 'base64')
}
```

**Change 5 — Validate captured buffer before saving.**

```ts
function isValidImage(buf: Buffer): boolean {
  if (buf.length < 1000) return false
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  // WEBP: RIFF....WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true
  return false
}

// before fs.writeFile:
if (imageBuffer && !isValidImage(imageBuffer)) {
  this.report({
    status: 'capturing',
    message: `[validate] buffer failed magic-byte check on page ${i}`,
  })
  imageBuffer = null
}
```

**Change 6 — Make screenshot fallback defensive (still keep it, but only after visibility check).**

```ts
} else {
  // Screenshot fallback — check visibility first
  const flipbookEl = await this.page.$('.flipbook-main-wrapper, .book, .flipbook-container');
  let usedFallback = false;
  if (flipbookEl) {
    const box = await flipbookEl.boundingBox();
    if (box && box.width > 100 && box.height > 100) {
      await flipbookEl.screenshot({ path: filepath, type: 'jpeg', quality: 90 });
      usedFallback = true;
    }
  }
  if (!usedFallback) {
    // Last resort: full-viewport screenshot, clipped to known area
    await this.page.screenshot({
      path: filepath,
      type: 'jpeg',
      quality: 90,
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
  }
}
```

**Change 7 — Add `--diagnose` CLI flag.**

In `index.ts`, parse `--diagnose` and, when set:

- Skip PDF generation
- Stop after page 5
- Write `interception-diagnostic.json` with: per-URL status, bytes, content-type; per-page match result; canvas/img counts
- Run headed (`--headless false`) by default for visibility

---

### Diagnostic Mode / Logging Strategy

After deploying Changes 1–5, run with:

```bash
bun run tools/flipbook-scraper/index.ts \
  --config tools/flipbook-scraper/presets/suntech.json \
  --diagnose --pages 10
```

Expected log lines per page:

```
[CAPTURING] (1/10) [intercept] .../page_0001.jpg?v=42 → 184320B (image/jpeg)
[CAPTURING] (1/10) [intercept] .../thumb_0001.webp?v=42 → 4823B (image/webp)
[CAPTURING] (1/10) [wait] response=200 url=.../page_0001.jpg?v=42
[CAPTURING] (1/10) [match] pathname: .../page_0001.jpg → 184320B
[CAPTURING] (2/10) [wait] no image response within 8s on page 2
[CAPTURING] (2/10) [validate] buffer failed magic-byte check on page 2
```

These logs immediately distinguish:

- **Glob mismatch** (no `[intercept]` lines at all) → fix route regex
- **CORS / fetch failure** (`[intercept:error]` lines with status) → fix route handler
- **Race condition** (`[wait] no image response within 8s`) → bump timeout or wait on a different event
- **URL normalization gap** (`[match:miss] all four tiers`) → fix `findInterceptedImage`
- **Wrong content** (`[validate] magic-byte check failed`) → render mode is canvas; activate Change 4
- **Canvas mode** (no `[intercept]` lines but `[canvas]` capture succeeds) → screenshot-from-canvas is the right path

---

### What to Test Next

1. **Run `--diagnose` on a 10-page slice** of the suntech preset. Read `interception-diagnostic.json`. Identify which root cause is dominant.
2. **Verify canvas detection** by checking `inspect.ts` output for `canvas` and `<canvas width="..." height="...">` — if any canvas is >1000px wide, Real3D is rendering to canvas; `findInterceptedImage` will never return the right buffer regardless of fixes 1–3.
3. **In headed mode** (`--headless false`), open DevTools → Network during a manual scrape. Confirm:
   - Are page images actually fetched over HTTP, or are they `blob:` / `data:` URLs?
   - Do they have `.jpg` extensions or no extension at all?
   - Is the URL the same as what `img.src` shows in the DOM?
4. **If canvas is the renderer:** scrap the screenshot-of-wrapper fallback entirely. Use `page.locator('canvas').screenshot({ omitBackground: false })` after waiting for `canvas.toDataURL()` to succeed — this is the only way to get pixel-perfect canvas content.
5. **If HTTP is the renderer but URLs are extension-less:** widen the route regex to `/.*page.*(\?|$)/i` or use a `request.resourceType() === 'image'` filter instead of URL glob.
6. **If race condition dominates:** keep the time-based fallback (longer — 3 s) but treat `waitForResponse` as the primary signal.
7. **After all fixes pass on a 10-page slice**, run the full 302-page scrape. Expect: zero `[validate]` errors, zero screenshot fallbacks, ~302 image files written, captured-files-count === 302.

---

## Summary

**The interception is "failing" not because of one bug but because of three layered issues:**

1. **Timing:** `.clear()` + fixed 1.5 s timeout races against turn.js preload behavior.
2. **Coverage:** the route regex misses extension-less and AVIF URLs; canvas-rendered pages are entirely invisible to the interceptor.
3. **Visibility of failure:** every error is swallowed, so we can't tell which of the above is happening.

**The fix is to add observability first** (Changes 1, 5, 7), diagnose against the suntech preset, then apply targeted fixes (Changes 2, 3, 4, 6) based on what the diagnostic reveals. Do not assume a single fix will resolve all variants — Real3D Flipbook has at least three render modes that each need a different capture strategy.
