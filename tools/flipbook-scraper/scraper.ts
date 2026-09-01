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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      acceptDownloads: true,
    });

    this.page = await this.context.newPage();
    await this.setupImageInterception();
  }

  private async setupImageInterception() {
    if (!this.context) return;

    await this.context.route('**/*.{jpg,jpeg,png,webp,gif,bmp,tiff}', async (route: Route) => {
      try {
        const response = await route.fetch();
        const buffer = await response.body();
        const url = route.request().url();
        this.interceptedImages.set(url, Buffer.from(buffer));
      } catch {
        // ignore fetch failures
      }
      await route.continue();
    });
  }

  async login() {
    if (!this.page) throw new Error('Browser not initialized');

    this.report({ status: 'logging-in', message: 'Navigating to login page...' });

    await this.page.goto(this.config.loginUrl, { waitUntil: 'networkidle', timeout: 60000 });

    await this.page.fill(this.config.loginSelectors.usernameField, this.config.username);
    await this.page.fill(this.config.loginSelectors.passwordField, this.config.password);

    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}),
      this.page.click(this.config.loginSelectors.submitButton),
    ]);

    await this.page.waitForTimeout(2000);
    this.report({ status: 'logging-in', message: 'Login complete' });
  }

  async navigateToModule() {
    if (!this.page) throw new Error('Browser not initialized');

    this.report({ status: 'navigating', message: 'Navigating to module...' });
    await this.page.goto(this.config.moduleUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await this.page.waitForTimeout(this.config.pageLoadDelay);
  }

  async detectTotalPages(): Promise<number> {
    if (!this.page) throw new Error('Browser not initialized');

    this.report({ status: 'detecting-pages', message: 'Detecting total pages...' });

    if (this.config.flipbookSelectors.totalPages) {
      const totalText = await this.page.textContent(this.config.flipbookSelectors.totalPages).catch(() => null);
      if (totalText) {
        const match = totalText.match(/(\d+)/);
        if (match) return parseInt(match[1], 10);
      }
    }

    if (this.config.flipbookSelectors.pageIndicator) {
      const indicator = await this.page.textContent(this.config.flipbookSelectors.pageIndicator).catch(() => null);
      if (indicator) {
        const match = indicator.match(/of\s+(\d+)/i) || indicator.match(/\/\s*(\d+)/);
        if (match) return parseInt(match[1], 10);
      }
    }

    if (this.config.flipbookSelectors.nextButton) {
      return await this.countPagesByNavigation();
    }

    return 0;
  }

  private async countPagesByNavigation(): Promise<number> {
    if (!this.page) return 0;

    let count = 1;
    const maxPages = 500;

    while (count < maxPages) {
      const hasNext = await this.page.$(this.config.flipbookSelectors.nextButton!).then(el => !!el);
      if (!hasNext) break;

      const isEnabled = await this.page.isEnabled(this.config.flipbookSelectors.nextButton!).catch(() => false);
      if (!isEnabled) break;

      await this.page.click(this.config.flipbookSelectors.nextButton!);
      await this.page.waitForTimeout(500);
      count++;
    }

    for (let i = 0; i < count - 1; i++) {
      await this.page.click(this.config.flipbookSelectors.prevButton!).catch(() => {});
      await this.page.waitForTimeout(300);
    }

    return count;
  }

  async captureAllPages(totalPages: number) {
    if (!this.page) throw new Error('Browser not initialized');

    const outputFolder = path.join(this.config.outputDir, this.config.documentName);
    await fs.mkdir(outputFolder, { recursive: true });

    this.capturedImages = [];

    for (let i = 1; i <= totalPages; i++) {
      this.report({
        status: 'capturing',
        currentPage: i,
        totalPages,
        message: `Capturing page ${i} of ${totalPages}`,
      });

      await this.waitForPageReady(i);

      const imagePath = await this.capturePageImage(i, outputFolder);
      if (imagePath) {
        this.capturedImages.push(imagePath);
      }

      if (i < totalPages) {
        await this.goToNextPage();
      }
    }

    this.report({
      status: 'capturing',
      currentPage: totalPages,
      totalPages,
      message: `Captured ${this.capturedImages.length} pages`,
    });
  }

  private async waitForPageReady(pageNum: number) {
    if (!this.page) return;

    await this.page.waitForTimeout(this.config.pageLoadDelay);

    if (this.config.flipbookSelectors.pageImage) {
      await this.page.waitForSelector(this.config.flipbookSelectors.pageImage, {
        state: 'visible',
        timeout: 10000,
      }).catch(() => {});
    }
  }

  private async capturePageImage(pageNum: number, outputFolder: string): Promise<string | null> {
    if (!this.page) return null;

    const filename = `page_${String(pageNum).padStart(3, '0')}.${this.config.imageFormat}`;
    const filepath = path.join(outputFolder, filename);

    const imgElement = await this.page.$(this.config.flipbookSelectors.pageImage).catch(() => null);

    if (imgElement) {
      const src = await imgElement.getAttribute('src').catch(() => null);
      if (src && !src.startsWith('data:')) {
        const intercepted = this.findInterceptedImage(src);
        if (intercepted) {
          await fs.writeFile(filepath, intercepted);
          return filepath;
        }
      }

      await imgElement.screenshot({ path: filepath, type: this.config.imageFormat });
      return filepath;
    }

    const container = await this.page.$(this.config.flipbookSelectors.container).catch(() => null);
    if (container) {
      await container.screenshot({ path: filepath, type: this.config.imageFormat });
      return filepath;
    }

    return null;
  }

  private findInterceptedImage(src: string): Buffer | null {
    if (this.interceptedImages.has(src)) {
      return this.interceptedImages.get(src)!;
    }

    const urlPath = new URL(src, this.config.baseUrl).pathname;
    for (const [url, buffer] of this.interceptedImages) {
      if (url.includes(urlPath) || urlPath.includes(new URL(url, this.config.baseUrl).pathname)) {
        return buffer;
      }
    }

    return null;
  }

  private async goToNextPage() {
    if (!this.page) return;

    if (this.config.flipbookSelectors.nextButton) {
      const nextBtn = await this.page.$(this.config.flipbookSelectors.nextButton);
      if (nextBtn) {
        await nextBtn.click();
        return;
      }
    }

    await this.page.keyboard.press('ArrowRight');
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
