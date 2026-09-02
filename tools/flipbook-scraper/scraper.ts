import { chromium, type Browser, type BrowserContext, type Page, type Route } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FlipbookConfig } from './config';

export interface ScrapeProgress {
  totalPages: number | null;
  currentPage: number;
  status: 'logging-in' | 'navigating' | 'detecting-pages' | 'capturing' | 'saving-pdf' | 'done' | 'error';
  message: string;
}

export type ProgressCallback = (progress: ScrapeProgress) => void;

export class FlipbookScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private capturedImages: string[] = [];
  private interceptedImages: Map<string, Buffer> = new Map();

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
      });
    }
  }

  async initialize() {
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      acceptDownloads: true,
      ignoreHTTPSErrors: true,
    });

    this.page = await this.context.newPage();
    await this.setupImageInterception();
  }

  private async setupImageInterception() {
    if (!this.context) return;

    await this.context.route('**/*.{jpg,jpeg,png,webp}', async (route: Route) => {
      try {
        const response = await route.fetch();
        const buffer = await response.body();
        const url = route.request().url();
        if (!url.includes('spinner') && !url.includes('logo')) {
          this.interceptedImages.set(url, Buffer.from(buffer));
        }
      } catch {
        // ignore fetch failures
      }
      await route.continue();
    });
  }

  async login() {
    if (!this.page) throw new Error('Browser not initialized');

    this.report({ status: 'logging-in', message: 'Navigating to login page...' });

    await this.page.goto(this.config.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for login fields to be visible
    await this.page.waitForSelector(this.config.loginSelectors.usernameField, { state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(1000);

    await this.page.fill(this.config.loginSelectors.usernameField, this.config.username);
    await this.page.fill(this.config.loginSelectors.passwordField, this.config.password);

    await this.page.waitForTimeout(500);

    // Use Enter key to submit (works with Accessally forms)
    await this.page.keyboard.press('Enter');

    await this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await this.page.waitForTimeout(2000);

    this.report({ status: 'logging-in', message: `Login complete - now at ${this.page.url()}` });
  }

  async navigateToModule() {
    if (!this.page) throw new Error('Browser not initialized');

    this.report({ status: 'navigating', message: 'Navigating to module...' });
    await this.page.goto(this.config.moduleUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for Real3D Flipbook to initialize
    this.report({ status: 'navigating', message: 'Waiting for flipbook to load (this can take 45s)...' });
    await this.page.waitForTimeout(45000);
  }

  async detectTotalPages(): Promise<number> {
    if (!this.page) throw new Error('Browser not initialized');

    this.report({ status: 'detecting-pages', message: 'Detecting total pages...' });

    // Try to get page count from window.FLIPBOOK
    const jsCount = await this.page.evaluate(() => {
      const w = window as any;
      if (w.FLIPBOOK) {
        const keys = Object.keys(w.FLIPBOOK);
        for (const key of keys) {
          const fb = w.FLIPBOOK[key];
          if (fb?.options?.pages?.length) return fb.options.pages.length;
          if (fb?.totalPages) return fb.totalPages;
          if (fb?.pages?.length) return fb.pages.length;
        }
      }
      return 0;
    });

    if (jsCount > 0) return jsCount;

    // Try to find "X / Y" pattern - look for ALL matches and pick the largest Y
    const bodyText = await this.page.evaluate(() => document.body?.innerText || '');
    const matches = bodyText.match(/(\d+)\s*\/\s*(\d+)/g);
    if (matches) {
      let maxTotal = 0;
      for (const match of matches) {
        const parts = match.match(/(\d+)\s*\/\s*(\d+)/);
        if (parts) {
          const total = parseInt(parts[2], 10);
          if (total > maxTotal && total < 10000) {
            maxTotal = total;
          }
        }
      }
      if (maxTotal > 10) return maxTotal;
    }

    // Try to find page count from flipbook navigation elements
    const navCount = await this.page.evaluate(() => {
      const w = window as any;
      if (w.totalPages) return w.totalPages;
      if (w.flipbookData?.pages) return w.flipbookData.pages.length;
      if (w.flipbookOptions?.pages) return w.flipbookOptions.pages.length;

      // Try to find from DOM elements with page indicators
      const pageElements = document.querySelectorAll('[class*="page"], [class*="count"]');
      const nums = new Set<number>();
      pageElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) {
          const num = parseInt(text, 10);
          if (num > 10 && num < 10000) nums.add(num);
        }
      });
      if (nums.size > 0) {
        return Math.max(...nums);
      }
      return 0;
    });

    if (navCount > 0) return navCount;

    // Fallback: navigate to end by pressing ArrowRight many times
    this.report({ status: 'detecting-pages', message: 'Using navigation fallback to count pages...' });
    for (let i = 0; i < 500; i++) {
      await this.page.keyboard.press('ArrowRight');
      await this.page.waitForTimeout(100);
    }
    await this.page.waitForTimeout(1000);

    // Now check the page indicator
    const finalText = await this.page.evaluate(() => document.body?.innerText || '');
    const finalMatch = finalText.match(/(\d+)\s*\/\s*(\d+)/);
    if (finalMatch) {
      const total = parseInt(finalMatch[2], 10);
      if (total > 10 && total < 10000) return total;
    }

    return 0;
  }

  async captureAllPages(totalPages: number, startPage: number = 1) {
    if (!this.page) throw new Error('Browser not initialized');

    const outputFolder = path.join(this.config.outputDir, this.config.documentName);
    await fs.mkdir(outputFolder, { recursive: true });

    this.capturedImages = [];

    // First navigate back to page 1 by pressing ArrowLeft many times
    for (let i = 0; i < totalPages + 10; i++) {
      await this.page.keyboard.press('ArrowLeft');
      await this.page.waitForTimeout(50);
    }
    await this.page.waitForTimeout(1000);

    // Navigate to start page if not starting from page 1
    if (startPage > 1) {
      for (let i = 0; i < startPage - 1; i++) {
        await this.page.keyboard.press('ArrowRight');
        await this.page.waitForTimeout(50);
      }
      await this.page.waitForTimeout(1000);
    }

    for (let i = startPage; i <= totalPages; i++) {
      this.report({
        status: 'capturing',
        currentPage: i,
        totalPages,
        message: `Capturing page ${i} of ${totalPages}`,
      });

      // Wait for the current page to render
      await this.page.waitForTimeout(800);

      // Take screenshot of the flipbook area
      const filename = `page_${String(i).padStart(4, '0')}.${this.config.imageFormat}`;
      const filepath = path.join(outputFolder, filename);

      // Try to find the flipbook element and screenshot it
      const flipbookEl = await this.page.$('.flipbook-main-wrapper, .book, .flipbook-container');
      if (flipbookEl) {
        await flipbookEl.screenshot({ path: filepath, type: 'jpeg', quality: 90 });
      } else {
        // Fallback to full page screenshot
        await this.page.screenshot({ path: filepath, type: 'jpeg', quality: 90 });
      }

      this.capturedImages.push(filepath);

      // Navigate to next page
      if (i < totalPages) {
        await this.page.keyboard.press('ArrowRight');
        await this.page.waitForTimeout(400);
      }
    }

    this.report({
      status: 'capturing',
      currentPage: totalPages,
      totalPages,
      message: `Captured ${this.capturedImages.length} of ${totalPages} pages`,
    });
  }

  private findInterceptedImage(src: string): Buffer | null {
    if (this.interceptedImages.has(src)) {
      return this.interceptedImages.get(src)!;
    }

    for (const [url, buffer] of this.interceptedImages) {
      if (url === src || url.endsWith(src.split('/').pop() || '')) {
        return buffer;
      }
    }

    return null;
  }

  async saveAsPdf() {
    this.report({ status: 'saving-pdf', message: 'Converting images to PDF...' });

    const { PDFConverter } = await import('./pdf-converter');
    const converter = new PDFConverter(this.config);
    const outputPath = path.join(this.config.outputDir, `${this.config.documentName}.pdf`);

    await converter.imagesToPdf(this.capturedImages, outputPath);

    this.report({ status: 'saving-pdf', message: `PDF saved: ${outputPath}` });
    return outputPath;
  }

  async cleanup() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    this.interceptedImages.clear();
  }

  getCapturedImages(): string[] {
    return [...this.capturedImages];
  }
}
