import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Route,
} from '@playwright/test'
import * as fs from 'fs/promises'
import * as path from 'path'
import { FlipbookConfig } from './config'

export interface ScrapeProgress {
  totalPages: number | null
  currentPage: number
  status:
    'logging-in' | 'navigating' | 'detecting-pages' | 'capturing' | 'saving-pdf' | 'done' | 'error'
  message: string
}

export type ProgressCallback = (progress: ScrapeProgress) => void

interface DomImageInspection {
  src: string | null
  tag: string | null
  rect: { w: number; h: number } | null
  totalCandidates: number
  allCandidates: Array<{ src: string; tag: string; w: number; h: number }>
  pageText: string
  flipbookPage: unknown
}

type JsonObject = Record<string, unknown>

export class FlipbookScraper {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private capturedImages: string[] = []
  private interceptedImages: Map<string, Buffer> = new Map()
  private interceptedRequests = 0
  private interceptedErrors = 0
  private interceptedBytes = 0
  private pageImageCandidates: Buffer[] = []
  private pageImageIndex = 0

  constructor(
    private config: FlipbookConfig,
    private onProgress?: ProgressCallback
  ) {}

  private report(progress: Partial<ScrapeProgress>) {
    if (this.onProgress) {
      this.onProgress({
        totalPages: null,
        currentPage: 0,
        status: 'capturing',
        message: '',
        ...progress,
      })
    }
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    })

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      acceptDownloads: true,
      ignoreHTTPSErrors: true,
    })

    this.page = await this.context.newPage()
    await this.setupImageInterception()
    await this.patchFlipbookPrototypes()
  }

  private async patchFlipbookPrototypes() {
    if (!this.page) return

    await this.page.evaluate(() => {
      type FlipbookCall = {
        method: string
        args?: string[]
        returned?: unknown
      }
      type FlipbookInstance = {
        book?: unknown
      }
      type FlipbookMethod = (this: FlipbookInstance, ...args: unknown[]) => unknown
      type FlipbookPrototype = Record<string, FlipbookMethod | undefined>
      type FlipbookGlobal = {
        Main?: { prototype?: FlipbookPrototype }
        Book?: { prototype?: FlipbookPrototype }
      } & Record<string, unknown>

      const stringifyArg = (arg: unknown) =>
        (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).slice(0, 200)
      const w = window as Window & {
        FLIPBOOK?: FlipbookGlobal
        __flipbookBookInstance?: unknown
        __flipbookTraceCalls?: FlipbookCall[]
      }
      if (!w.FLIPBOOK) return

      const originalCreateBook = w.FLIPBOOK.Main?.prototype?.createBook
      const originalFetchAndCacheImage = w.FLIPBOOK.Main?.prototype?.fetchAndCacheImage
      const originalGetCurrentPageNumber = w.FLIPBOOK.Book?.prototype?.getCurrentPageNumber
      const originalLoadPage = w.FLIPBOOK.Main?.prototype?.loadPage
      const originalUpdateCurrentPage = w.FLIPBOOK.Main?.prototype?.updateCurrentPage
      const originalGoToPage = w.FLIPBOOK.Main?.prototype?.goToPage

      const calls: FlipbookCall[] = []

      if (originalCreateBook) {
        w.FLIPBOOK.Main!.prototype!.createBook = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'createBook', args: args.map(stringifyArg) })
          const ret = originalCreateBook.apply(this, args)
          if (this.book) {
            w.__flipbookBookInstance = this.book
          }
          return ret
        }
      }

      if (originalFetchAndCacheImage) {
        w.FLIPBOOK.Main!.prototype!.fetchAndCacheImage = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'fetchAndCacheImage', args: args.map(stringifyArg) })
          return originalFetchAndCacheImage.apply(this, args)
        }
      }

      if (originalGetCurrentPageNumber) {
        w.FLIPBOOK.Book!.prototype!.getCurrentPageNumber = function (this: FlipbookInstance, ...args: unknown[]) {
          const pageNum = originalGetCurrentPageNumber.apply(this, args)
          calls.push({ method: 'getCurrentPageNumber', returned: pageNum })
          return pageNum
        }
      }

      if (originalLoadPage) {
        w.FLIPBOOK.Main!.prototype!.loadPage = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'loadPage', args: args.map(stringifyArg) })
          return originalLoadPage.apply(this, args)
        }
      }

      if (originalUpdateCurrentPage) {
        w.FLIPBOOK.Main!.prototype!.updateCurrentPage = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'updateCurrentPage', args: args.map(stringifyArg) })
          return originalUpdateCurrentPage.apply(this, args)
        }
      }

      if (originalGoToPage) {
        w.FLIPBOOK.Main!.prototype!.goToPage = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'goToPage', args: args.map(stringifyArg) })
          return originalGoToPage.apply(this, args)
        }
      }

      w.__flipbookTraceCalls = calls
    })
  }

  private async setupImageInterception() {
    if (!this.context) return

    await this.context.route(/.*\.(jpe?g|png|webp|avif)(\?.*)?$/i, async (route: Route) => {
      this.interceptedRequests++
      try {
        const response = await route.fetch()
        const buffer = await response.body()
        const url = route.request().url()
        const ct = response.headers()['content-type'] ?? ''
        this.interceptedBytes += buffer.length

        if (!url.includes('spinner') && !url.includes('logo') && buffer.length > 5000) {
          this.interceptedImages.set(url, Buffer.from(buffer))
          this.report({
            status: 'capturing',
            message: `[intercept] ${url.slice(-60)} → ${buffer.length}B (${ct})`,
          })
        }
        await route.continue()
      } catch (err) {
        this.interceptedErrors++
        this.report({
          status: 'capturing',
          message: `[intercept:error] ${route.request().url()} — ${(err as Error).message}`,
        })
        await route.continue().catch(() => {})
      }
    })
  }

  async login() {
    if (!this.page) throw new Error('Browser not initialized')

    this.report({ status: 'logging-in', message: 'Navigating to login page...' })

    await this.page.goto(this.config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

    // Wait for login fields to be visible
    await this.page.waitForSelector(this.config.loginSelectors.usernameField, {
      state: 'visible',
      timeout: 15000,
    })
    await this.page.waitForTimeout(1000)

    await this.page.fill(this.config.loginSelectors.usernameField, this.config.username)
    await this.page.fill(this.config.loginSelectors.passwordField, this.config.password)

    await this.page.waitForTimeout(500)

    // Use Enter key to submit (works with Accessally forms)
    await this.page.keyboard.press('Enter')

    await this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {})
    await this.page.waitForTimeout(2000)

    this.report({ status: 'logging-in', message: `Login complete - now at ${this.page.url()}` })
  }

  async navigateToModule() {
    if (!this.page) throw new Error('Browser not initialized')

    this.report({ status: 'navigating', message: 'Navigating to module...' })
    await this.page.goto(this.config.moduleUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })

    this.report({
      status: 'navigating',
      message: 'Waiting for flipbook library to load...',
    })

    await this.page.waitForFunction(() => 'FLIPBOOK' in window, { timeout: 60000 }).catch(() => {})

    this.report({
      status: 'navigating',
      message: 'FLIPBOOK loaded. Applying prototype patches...',
    })
    await this.patchFlipbookPrototypes()

    this.report({
      status: 'navigating',
      message: 'Waiting for flipbook to initialize (this can take 45s)...',
    })
    await this.page.waitForTimeout(45000)
  }

  async detectTotalPages(): Promise<number> {
    if (!this.page) throw new Error('Browser not initialized')

    this.report({ status: 'detecting-pages', message: 'Detecting total pages...' })

    // Try to get page count from window.FLIPBOOK
    const jsCount = await this.page.evaluate(() => {
      const w = window as Window & { FLIPBOOK?: Record<string, unknown> }
      if (w.FLIPBOOK) {
        const keys = Object.keys(w.FLIPBOOK)
        for (const key of keys) {
          const fb = w.FLIPBOOK[key]
          if (!fb || typeof fb !== 'object') continue
          const record = fb as Record<string, unknown>
          const options = record.options
          if (options && typeof options === 'object' && Array.isArray((options as Record<string, unknown>).pages)) {
            return (options as { pages: unknown[] }).pages.length
          }
          if (typeof record.totalPages === 'number') return record.totalPages
          if (Array.isArray(record.pages)) return record.pages.length
        }
      }
      return 0
    })

    if (jsCount > 0) return jsCount

    // Try to find "X / Y" pattern - look for ALL matches and pick the largest Y
    const bodyText = await this.page.evaluate(() => document.body?.innerText || '')
    const matches = bodyText.match(/(\d+)\s*\/\s*(\d+)/g)
    if (matches) {
      let maxTotal = 0
      for (const match of matches) {
        const parts = match.match(/(\d+)\s*\/\s*(\d+)/)
        if (parts) {
          const total = parseInt(parts[2], 10)
          if (total > maxTotal && total < 10000) {
            maxTotal = total
          }
        }
      }
      if (maxTotal > 10) return maxTotal
    }

    // Try to find page count from flipbook navigation elements
    const navCount = await this.page.evaluate(() => {
      const hasPages = (value: unknown): value is { pages: unknown[] } =>
        value !== null &&
        typeof value === 'object' &&
        Array.isArray((value as Record<string, unknown>).pages)
      const w = window as Window & {
        totalPages?: unknown
        flipbookData?: unknown
        flipbookOptions?: unknown
      }
      if (typeof w.totalPages === 'number') return w.totalPages
      if (hasPages(w.flipbookData)) return w.flipbookData.pages.length
      if (hasPages(w.flipbookOptions)) return w.flipbookOptions.pages.length

      // Try to find from DOM elements with page indicators
      const pageElements = document.querySelectorAll('[class*="page"], [class*="count"]')
      const nums = new Set<number>()
      pageElements.forEach((el) => {
        const text = el.textContent?.trim()
        if (text) {
          const num = parseInt(text, 10)
          if (num > 10 && num < 10000) nums.add(num)
        }
      })
      if (nums.size > 0) {
        return Math.max(...nums)
      }
      return 0
    })

    if (navCount > 0) return navCount

    // Fallback: navigate to end by pressing ArrowRight many times
    this.report({
      status: 'detecting-pages',
      message: 'Using navigation fallback to count pages...',
    })
    for (let i = 0; i < 500; i++) {
      await this.page.keyboard.press('ArrowRight')
      await this.page.waitForTimeout(100)
    }
    await this.page.waitForTimeout(1000)

    // Now check the page indicator
    const finalText = await this.page.evaluate(() => document.body?.innerText || '')
    const finalMatch = finalText.match(/(\d+)\s*\/\s*(\d+)/)
    if (finalMatch) {
      const total = parseInt(finalMatch[2], 10)
      if (total > 10 && total < 10000) return total
    }

    return 0
  }

  async captureAllPages(totalPages: number, startPage: number = 1) {
    if (!this.page) throw new Error('Browser not initialized')

    const outputFolder = path.join(this.config.outputDir, this.config.documentName)
    await fs.mkdir(outputFolder, { recursive: true })

    this.capturedImages = []

    const useScreenshot = this.config.captureMethod === 'screenshot'

    // First navigate back to page 1 by pressing ArrowLeft many times
    for (let i = 0; i < totalPages + 10; i++) {
      await this.page.keyboard.press('ArrowLeft')
      await this.page.waitForTimeout(50)
    }
    await this.page.waitForTimeout(1000)

    // Navigate to start page if not starting from page 1
    if (startPage > 1) {
      for (let i = 0; i < startPage - 1; i++) {
        await this.page.keyboard.press('ArrowRight')
        await this.page.waitForTimeout(50)
      }
      await this.page.waitForTimeout(1000)
    }

    for (let i = startPage; i <= totalPages; i++) {
      this.report({
        status: 'capturing',
        currentPage: i,
        totalPages,
        message: `Capturing page ${i} of ${totalPages}`,
      })

      if (!useScreenshot) {
        const response = await this.page
          .waitForResponse((resp) => /.*\.(jpe?g|png|webp|avif)(\?|$)/i.test(resp.url()), {
            timeout: 8000,
          })
          .catch(() => null)

        if (!response) {
          this.report({
            status: 'capturing',
            message: `[wait] no image response within 8s on page ${i}`,
          })
        }
      }

      let imageBuffer: Buffer | null = null

      // Get the current visible image URL from the DOM
      const currentImgSrc = await this.page.evaluate<DomImageInspection>(() => {
        const candidates: { src: string; rect: DOMRect; tag: string }[] = []

        // 1. All <img> elements
        document.querySelectorAll('img').forEach((img) => {
          const src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src
          if (!src || src.includes('spinner')) return
          const rect = img.getBoundingClientRect()
          candidates.push({ src, rect, tag: 'img' })
        })

        // 2. All elements with background-image
        document.querySelectorAll('*').forEach((el) => {
          const bg = getComputedStyle(el).backgroundImage
          const m = bg.match(/url\(["']?([^"')]+)["']?\)/)
          if (m) {
            const rect = el.getBoundingClientRect()
            if (rect.width > 50 && rect.height > 50) {
              candidates.push({ src: m[1], rect, tag: el.tagName.toLowerCase() })
            }
          }
        })

        // 3. Lazy-loaded attributes
        document.querySelectorAll('[data-src], [data-lazy], [data-original]').forEach((el) => {
          const src =
            (el as HTMLImageElement).dataset.src ||
            (el as HTMLImageElement).dataset.lazy ||
            (el as HTMLImageElement).dataset.original
          if (src) {
            const rect = el.getBoundingClientRect()
            candidates.push({ src, rect, tag: el.tagName.toLowerCase() })
          }
        })

        // 4. Page indicator text
        const pageText =
          Array.from(document.querySelectorAll('*'))
            .map((el) => el.textContent?.trim() || '')
            .find((t) => /^\d+\s*\/\s*\d+$/.test(t)) || ''

        // 5. FLIPBOOK current page
        const flipbook = (window as Window & { FLIPBOOK?: Record<string, unknown> }).FLIPBOOK
        const flipbookPage = flipbook
          ? (Object.values(flipbook).find((fb) => (
              fb !== null &&
              typeof fb === 'object' &&
              'currentPage' in fb &&
              (fb as { currentPage?: unknown }).currentPage != null
            )) as { currentPage?: unknown } | undefined)?.currentPage
          : null

        const best = candidates
          .filter((c) => c.rect.width > 200 && c.rect.height > 200)
          .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height)[0]

        return {
          src: best?.src ?? null,
          tag: best?.tag ?? null,
          rect: best?.rect
            ? { w: Math.round(best.rect.width), h: Math.round(best.rect.height) }
            : null,
          totalCandidates: candidates.length,
          allCandidates: candidates
            .slice(0, 20)
            .map((c) => ({
              src: c.src.slice(-60),
              tag: c.tag,
              w: Math.round(c.rect.width),
              h: Math.round(c.rect.height),
            })),
          pageText,
          flipbookPage,
        }
      })

      if (currentImgSrc) {
        this.report({
          status: 'capturing',
            message: `[dom] page ${i}: candidates=${currentImgSrc.totalCandidates}, best=${currentImgSrc.tag}@${currentImgSrc.rect?.w}x${currentImgSrc.rect?.h}, src=${currentImgSrc.src?.slice(-50) ?? 'null'}, pageText=${currentImgSrc.pageText ?? 'none'}, fbPage=${String(currentImgSrc.flipbookPage ?? 'none')}`,
          })
        const domSrc = currentImgSrc.src
        if (domSrc) {
          imageBuffer = this.findInterceptedImage(domSrc)
        }
      } else {
        this.report({
          status: 'capturing',
          message: `[dom] page ${i}: no image candidates found`,
        })
      }

      this.report({
        status: 'capturing',
        message: `[map] interceptedImages size=${this.interceptedImages.size}, bytes=${this.interceptedBytes}`,
      })

      // Fallback: use the largest intercepted image
      if (!imageBuffer && !useScreenshot) {
        let bestSize = 0
        for (const [_url, buffer] of this.interceptedImages) {
          if (buffer.length > bestSize && buffer.length > 10000) {
            bestSize = buffer.length
            imageBuffer = buffer
          }
        }
      }

      // Canvas fallback for canvas-rendered flipbooks
      if (!imageBuffer && !useScreenshot) {
        const canvasDataUrl = await this.page.evaluate(() => {
          const canvases = Array.from(document.querySelectorAll('canvas'))
          const big = canvases.find((c) => c.width > 1000 && c.height > 1000)
          if (!big) return null
          try {
            return big.toDataURL('image/jpeg', 0.9)
          } catch {
            return null
          }
        })

        if (canvasDataUrl) {
          const base64 = canvasDataUrl.replace(/^data:image\/\w+;base64,/, '')
          imageBuffer = Buffer.from(base64, 'base64')
          this.report({
            status: 'capturing',
            message: `[canvas] captured canvas on page ${i} → ${imageBuffer.length}B`,
          })
        }
      }

      const filename = `page_${String(i).padStart(4, '0')}.${this.config.imageFormat}`
      const filepath = path.join(outputFolder, filename)

      if (imageBuffer && isValidImage(imageBuffer)) {
        await fs.writeFile(filepath, imageBuffer)
        this.capturedImages.push(filepath)
      } else {
        const flipbookEl = await this.page.$('.flipbook-main-wrapper, .book, .flipbook-container')
        let usedFallback = false
        if (flipbookEl) {
          const box = await flipbookEl.boundingBox()
          if (box && box.width > 100 && box.height > 100) {
            await flipbookEl.screenshot({ path: filepath, type: 'jpeg', quality: 90 })
            usedFallback = true
          }
        }
        if (!usedFallback) {
          await this.page.screenshot({
            path: filepath,
            type: 'jpeg',
            quality: 90,
            clip: { x: 0, y: 0, width: 1920, height: 1080 },
          })
        }
        this.capturedImages.push(filepath)
      }

      // Navigate to next page
      if (i < totalPages) {
        await this.page.keyboard.press('ArrowRight')
        await this.page.waitForTimeout(600)
      }
    }

    this.report({
      status: 'capturing',
      currentPage: totalPages,
      totalPages,
      message: `Captured ${this.capturedImages.length} of ${totalPages} pages`,
    })
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname
    } catch {
      return url.split('?')[0]
    }
  }

  private findInterceptedImage(src: string): Buffer | null {
    if (!src) return null

    const normalizedSrc = this.normalizeUrl(src)
    const srcFilename = path.basename(normalizedSrc)

    if (this.interceptedImages.has(src)) {
      return this.interceptedImages.get(src)!
    }

    for (const [url, buffer] of this.interceptedImages) {
      const normalizedUrl = this.normalizeUrl(url)

      if (url === src) return buffer
      if (normalizedUrl === normalizedSrc) return buffer
      if (url.endsWith(srcFilename)) return buffer
      if (normalizedUrl.endsWith('/' + srcFilename)) return buffer
    }

    return null
  }

  async saveAsPdf() {
    this.report({ status: 'saving-pdf', message: 'Converting images to PDF...' })

    const { PDFConverter } = await import('./pdf-converter')
    const converter = new PDFConverter(this.config)
    const outputPath = path.join(this.config.outputDir, `${this.config.documentName}.pdf`)

    await converter.imagesToPdf(this.capturedImages, outputPath)

    this.report({ status: 'saving-pdf', message: `PDF saved: ${outputPath}` })
    return outputPath
  }

  async cleanup() {
    if (this.context) await this.context.close()
    if (this.browser) await this.browser.close()
    this.interceptedImages.clear()
  }

  getCapturedImages(): string[] {
    return [...this.capturedImages]
  }

  async inspectState(outputPath: string) {
    if (!this.page) throw new Error('Browser not initialized')

    const state = await this.page.evaluate(() => {
      const w = window as unknown as Window & JsonObject
      const getRecord = (value: unknown): JsonObject | null =>
        value !== null && typeof value === 'object' ? (value as JsonObject) : null
      const getConstructorName = (value: unknown) =>
        getRecord(value)?.constructor instanceof Function ? getRecord(value)?.constructor?.name : undefined
      const result: JsonObject = {
        url: location.href,
        timestamp: new Date().toISOString(),
        globals: {},
        flipbook: null,
        dom: {
          images: [],
          backgroundImages: [],
          canvases: [],
          pageIndicators: [],
          containers: [],
        },
        interceptedUrls: [],
      }

      const knownGlobals = [
        'FLIPBOOK', 'flipbook', 'Flipbook', 'turnjs', 'turn', 'real3d', 'Real3D',
        'flipbookData', 'flipbookOptions', 'totalPages', 'currentPage',
      ]

      for (const key of knownGlobals) {
        if (w[key] !== undefined) {
          try {
            ;(result.globals as JsonObject)[key] = JSON.parse(JSON.stringify(w[key], (_k, v: unknown) => {
              if (typeof v === 'function') return '[function]'
              if (v instanceof HTMLElement) return '[HTMLElement]'
              if (v instanceof HTMLImageElement) return '[HTMLImageElement]'
              if (v instanceof HTMLCanvasElement) return '[HTMLCanvasElement]'
              return v
            }))
          } catch {
            ;(result.globals as JsonObject)[key] = '[unserializable]'
          }
        }
      }

      const flipbook = getRecord(w.FLIPBOOK)
      if (flipbook) {
        try {
          result.flipbook = JSON.parse(JSON.stringify(flipbook, (_k, v: unknown) => {
            if (typeof v === 'function') return '[function]'
            if (v instanceof HTMLElement) return '[HTMLElement]'
            if (v instanceof HTMLImageElement) return '[HTMLImageElement]'
            if (v instanceof HTMLCanvasElement) return '[HTMLCanvasElement]'
            const constructorName = getConstructorName(v)
            if (constructorName) {
              return { __type: constructorName, keys: Object.keys(v as object) }
            }
            return v
          }))
        } catch {
          result.flipbook = '[serialization-failed]'
          result.flipbookKeys = Object.keys(flipbook).map((k: string) => {
            const fb = getRecord(flipbook[k])
            return {
              key: k,
              type: typeof fb,
              constructor: getConstructorName(fb),
              keys: fb ? Object.keys(fb).slice(0, 50) : [],
              hasOptions: !!fb?.options,
              hasPages: !!fb?.pages,
              hasTotalPages: fb?.totalPages != null,
              hasCurrentPage: fb?.currentPage != null,
              hasImages: !!fb?.images,
              hasCache: !!fb?.cache,
              hasSources: !!fb?.sources,
            }
          })
        }

        const main = getRecord(flipbook.Main)
        const book = getRecord(flipbook.Book)
        const mainPrototype = getRecord(main?.prototype)
        const bookPrototype = getRecord(book?.prototype)
        result.flipbookPrototypes = {
          Main: mainPrototype ? Object.keys(mainPrototype) : [],
          Book: bookPrototype ? Object.keys(bookPrototype) : [],
        }

        result.flipbookStaticKeys = {
          Main: main ? Object.keys(main).slice(0, 50) : [],
          Book: book ? Object.keys(book).slice(0, 50) : [],
        }
      }

      const allGlobals = Object.keys(w).filter(k => !['document', 'navigator', 'location', 'history', 'screen', 'performance', 'localStorage', 'sessionStorage', 'crypto', 'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'webkitStorageInfo', 'chrome', 'opera', 'safari', 'phantom', '_phantom', 'callPhantom', '__phantomas', 'domAutomation', 'domAutomationController'].includes(k))
      result.allGlobalKeys = allGlobals.slice(0, 200)

      const webglContexts: JsonObject[] = []
      document.querySelectorAll('canvas').forEach((canvas) => {
        const ctx = canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl')
        if (ctx) {
          const gl = ctx as WebGLRenderingContext | WebGL2RenderingContext
          webglContexts.push({
            id: canvas.id,
            className: canvas.className,
            width: canvas.width,
            height: canvas.height,
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            version: gl.getParameter(gl.VERSION),
            textures: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          })
        }
      })
      result.webglContexts = webglContexts

      result.dataAttributes = Array.from(document.querySelectorAll<HTMLElement>('[data-src], [data-lazy], [data-original], [data-page], [data-flipbook], [data-book]')).map((el) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        dataSrc: el.dataset.src || null,
        dataLazy: el.dataset.lazy || null,
        dataOriginal: el.dataset.original || null,
        dataPage: el.dataset.page || null,
        dataFlipbook: el.dataset.flipbook || null,
        dataBook: el.dataset.book || null,
      })).slice(0, 50)

      const flipbookInstances: Array<{ type: string; path: string; keys: string[] }> = []
      const seen = new WeakSet<object>()

      function scanObject(obj: unknown, path: string, depth: number) {
        if (!obj || typeof obj !== 'object' || depth > 5 || seen.has(obj)) return
        seen.add(obj)

        if (obj instanceof HTMLElement) {
          const elementRecord = obj as HTMLElement & JsonObject
          for (const key of Object.keys(obj)) {
            try {
              const val = getRecord(elementRecord[key])
              const name = getConstructorName(val)
              if (val && name === 'Main') {
                flipbookInstances.push({ type: 'Main', path: `${path}.${key}`, keys: Object.keys(val).slice(0, 30) })
              }
              if (val && name === 'Book') {
                flipbookInstances.push({ type: 'Book', path: `${path}.${key}`, keys: Object.keys(val).slice(0, 30) })
              }
            } catch {}
          }
          return
        }

        const record = obj as JsonObject
        const keys = Object.keys(record).slice(0, 30)
        for (const key of keys) {
          try {
            const val = record[key]
            if (val && typeof val === 'object') {
              const name = getConstructorName(val)
              if (name === 'Main' || name === 'Book') {
                flipbookInstances.push({ type: name, path: `${path}.${key}`, keys: Object.keys(val).slice(0, 30) })
              }
              scanObject(val, `${path}.${key}`, depth + 1)
            }
          } catch {}
        }
      }

      scanObject(window, 'window', 0)
      result.flipbookInstances = flipbookInstances.slice(0, 20)

      return result
    })

    await fs.writeFile(outputPath, JSON.stringify(state, null, 2), 'utf-8')
    return state
  }

  async traceBook(outputPath: string) {
    if (!this.page) throw new Error('Browser not initialized')

    const trace = await this.page.evaluate(() => {
      type FlipbookCall = {
        method: string
        args?: string[]
        returned?: unknown
      }
      type FlipbookInstance = {
        book?: { constructor?: { name?: string } } & Record<string, unknown>
      }
      type FlipbookMethod = (this: FlipbookInstance, ...args: unknown[]) => unknown
      type FlipbookPrototype = Record<string, FlipbookMethod | undefined>
      type FlipbookGlobal = {
        Main?: { prototype?: FlipbookPrototype }
        Book?: { prototype?: FlipbookPrototype }
      }
      type TraceResult = {
        url: string
        timestamp: string
        prototypes: { Main?: string[]; Book?: string[] }
        monkeyPatches: string[]
        calls: FlipbookCall[]
        bookInstance: { constructor?: string; keys: string[] } | null
        error?: string
      }
      const stringifyArg = (arg: unknown) =>
        (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).slice(0, 200)
      const w = window as Window & { FLIPBOOK?: FlipbookGlobal }
      const result: TraceResult = {
        url: location.href,
        timestamp: new Date().toISOString(),
        prototypes: {},
        monkeyPatches: [],
        calls: [],
        bookInstance: null,
      }

      if (!w.FLIPBOOK) {
        return { error: 'FLIPBOOK not found on window' }
      }

      result.prototypes.Main = w.FLIPBOOK.Main?.prototype ? Object.keys(w.FLIPBOOK.Main.prototype) : []
      result.prototypes.Book = w.FLIPBOOK.Book?.prototype ? Object.keys(w.FLIPBOOK.Book.prototype) : []

      const originalCreateBook = w.FLIPBOOK.Main?.prototype?.createBook
      const originalFetchAndCacheImage = w.FLIPBOOK.Main?.prototype?.fetchAndCacheImage
      const originalGetCurrentPageNumber = w.FLIPBOOK.Book?.prototype?.getCurrentPageNumber
      const originalLoadPage = w.FLIPBOOK.Main?.prototype?.loadPage
      const originalUpdateCurrentPage = w.FLIPBOOK.Main?.prototype?.updateCurrentPage
      const originalGoToPage = w.FLIPBOOK.Main?.prototype?.goToPage
      const originalInitJpg = w.FLIPBOOK.Main?.prototype?.initJpg
      const originalInitPdf = w.FLIPBOOK.Main?.prototype?.initPdf
      const originalInitPageHTML = w.FLIPBOOK.Main?.prototype?.initPageHTML
      const originalStart = w.FLIPBOOK.Main?.prototype?.start
      const originalOnBookCreated = w.FLIPBOOK.Main?.prototype?.onBookCreated

      const calls: FlipbookCall[] = []

      if (originalStart) {
        w.FLIPBOOK.Main!.prototype!.start = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'start', args: args.map(stringifyArg) })
          return originalStart.apply(this, args)
        }
        result.monkeyPatches.push('start')
      }

      if (originalCreateBook) {
        w.FLIPBOOK.Main!.prototype!.createBook = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'createBook', args: args.map(stringifyArg) })
          const ret = originalCreateBook.apply(this, args)
          if (this.book) {
            result.bookInstance = {
              constructor: this.book.constructor?.name,
              keys: Object.keys(this.book).slice(0, 50),
            }
          }
          return ret
        }
        result.monkeyPatches.push('createBook')
      }

      if (originalOnBookCreated) {
        w.FLIPBOOK.Main!.prototype!.onBookCreated = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'onBookCreated', args: args.map(stringifyArg) })
          return originalOnBookCreated.apply(this, args)
        }
        result.monkeyPatches.push('onBookCreated')
      }

      if (originalInitJpg) {
        w.FLIPBOOK.Main!.prototype!.initJpg = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'initJpg', args: args.map(stringifyArg) })
          return originalInitJpg.apply(this, args)
        }
        result.monkeyPatches.push('initJpg')
      }

      if (originalInitPdf) {
        w.FLIPBOOK.Main!.prototype!.initPdf = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'initPdf', args: args.map(stringifyArg) })
          return originalInitPdf.apply(this, args)
        }
        result.monkeyPatches.push('initPdf')
      }

      if (originalInitPageHTML) {
        w.FLIPBOOK.Main!.prototype!.initPageHTML = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'initPageHTML', args: args.map(stringifyArg) })
          return originalInitPageHTML.apply(this, args)
        }
        result.monkeyPatches.push('initPageHTML')
      }

      if (originalFetchAndCacheImage) {
        w.FLIPBOOK.Main!.prototype!.fetchAndCacheImage = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'fetchAndCacheImage', args: args.map(stringifyArg) })
          return originalFetchAndCacheImage.apply(this, args)
        }
        result.monkeyPatches.push('fetchAndCacheImage')
      }

      if (originalLoadPage) {
        w.FLIPBOOK.Main!.prototype!.loadPage = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'loadPage', args: args.map(stringifyArg) })
          return originalLoadPage.apply(this, args)
        }
        result.monkeyPatches.push('loadPage')
      }

      if (originalUpdateCurrentPage) {
        w.FLIPBOOK.Main!.prototype!.updateCurrentPage = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'updateCurrentPage', args: args.map(stringifyArg) })
          return originalUpdateCurrentPage.apply(this, args)
        }
        result.monkeyPatches.push('updateCurrentPage')
      }

      if (originalGetCurrentPageNumber) {
        w.FLIPBOOK.Book!.prototype!.getCurrentPageNumber = function (this: FlipbookInstance, ...args: unknown[]) {
          const pageNum = originalGetCurrentPageNumber.apply(this, args)
          calls.push({ method: 'getCurrentPageNumber', returned: pageNum })
          return pageNum
        }
        result.monkeyPatches.push('getCurrentPageNumber')
      }

      if (originalGoToPage) {
        w.FLIPBOOK.Main!.prototype!.goToPage = function (this: FlipbookInstance, ...args: unknown[]) {
          calls.push({ method: 'goToPage', args: args.map(stringifyArg) })
          return originalGoToPage.apply(this, args)
        }
        result.monkeyPatches.push('goToPage')
      }

      result.calls = calls.slice(0, 200)

      return result
    })

    await fs.writeFile(outputPath, JSON.stringify(trace, null, 2), 'utf-8')
    return trace
  }
}

function isValidImage(buf: Buffer): boolean {
  if (buf.length < 1000) return false
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true
  return false
}
