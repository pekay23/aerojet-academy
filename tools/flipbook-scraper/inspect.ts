import { chromium, type Browser, type Page } from '@playwright/test';

interface DetectedSelectors {
  images: string[];
  nextButtons: string[];
  prevButtons: string[];
  pageIndicators: string[];
  containers: string[];
  potentialFlipbookLibraries: string[];
}

export async function inspectPage(url: string, username: string, password: string): Promise<DetectedSelectors> {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const detected: DetectedSelectors = {
    images: [],
    nextButtons: [],
    prevButtons: [],
    pageIndicators: [],
    containers: [],
    potentialFlipbookLibraries: [],
  };

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Detect flipbook libraries
    detected.potentialFlipbookLibraries = await page.evaluate(() => {
      const libs: string[] = [];
      if ((window as any).flipbook) libs.push('window.flipbook');
      if ((window as any).Flipbook) libs.push('window.Flipbook');
      if ((window as any).turnjs) libs.push('turnjs');
      if (document.querySelector('.turnjs')) libs.push('turnjs (DOM)');
      if (document.querySelector('[class*="flipbook"]')) libs.push('flipbook CSS class');
      if (document.querySelector('[class*="book"]')) libs.push('book CSS class');
      if (document.querySelector('canvas')) libs.push('canvas element');
      return libs;
    });

    // Find all visible images in the content area
    detected.images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => {
          const rect = img.getBoundingClientRect();
          return rect.width > 200 && rect.height > 200 && rect.top > 100;
        })
        .map(img => {
          const cls = img.className ? `.${img.className.split(' ').join('.')}` : '';
          const id = img.id ? `#${img.id}` : '';
          return img.tagName.toLowerCase() + id + cls;
        })
        .slice(0, 10);
    });

    // Find potential next/prev buttons
    detected.nextButtons = await page.evaluate(() => {
      const candidates: string[] = [];
      const allElements = document.querySelectorAll('button, a, [role="button"], [class*="next"], [class*="arrow"], [class*="right"], svg');
      allElements.forEach(el => {
        const text = el.textContent?.trim().toLowerCase() || '';
        const cls = el.className || '';
        const aria = el.getAttribute('aria-label') || '';
        if (
          text.includes('next') ||
          text.includes('›') ||
          text.includes('»') ||
          cls.toString().includes('next') ||
          cls.toString().includes('right') ||
          aria.toLowerCase().includes('next')
        ) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : '';
          const clsStr = typeof cls === 'string' && cls ? `.${cls.split(' ').filter(Boolean).join('.')}` : '';
          candidates.push(tag + id + clsStr);
        }
      });
      return candidates.slice(0, 5);
    });

    detected.prevButtons = await page.evaluate(() => {
      const candidates: string[] = [];
      const allElements = document.querySelectorAll('button, a, [role="button"]');
      allElements.forEach(el => {
        const text = el.textContent?.trim().toLowerCase() || '';
        const cls = el.className || '';
        const aria = el.getAttribute('aria-label') || '';
        if (
          text.includes('prev') ||
          text.includes('‹') ||
          text.includes('«') ||
          cls.toString().includes('prev') ||
          cls.toString().includes('left') ||
          aria.toLowerCase().includes('previous')
        ) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : '';
          const clsStr = typeof cls === 'string' && cls ? `.${cls.split(' ').filter(Boolean).join('.')}` : '';
          candidates.push(tag + id + clsStr);
        }
      });
      return candidates.slice(0, 5);
    });

    // Find page indicators
    detected.pageIndicators = await page.evaluate(() => {
      const candidates: string[] = [];
      const allElements = document.querySelectorAll('span, div, p');
      allElements.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (text.match(/\d+\s*\/\s*\d+/) || text.match(/page\s*\d+/i) || text.match(/\d+\s*of\s*\d+/i)) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : '';
          const cls = el.className ? `.${el.className.split(' ').filter(Boolean).join('.')}` : '';
          candidates.push(tag + id + cls + ` "${text.slice(0, 40)}"`);
        }
      });
      return candidates.slice(0, 5);
    });

    // Find potential containers
    detected.containers = await page.evaluate(() => {
      const candidates: string[] = [];
      const allDivs = document.querySelectorAll('div, section, main');
      allDivs.forEach(el => {
        const rect = el.getBoundingClientRect();
        const cls = el.className?.toString() || '';
        if (
          rect.width > 600 &&
          rect.height > 400 &&
          (cls.includes('book') ||
            cls.includes('flip') ||
            cls.includes('page') ||
            cls.includes('viewer') ||
            cls.includes('module') ||
            cls.includes('content'))
        ) {
          const id = el.id ? `#${el.id}` : '';
          const clsStr = cls ? `.${cls.split(' ').filter(Boolean).join('.')}` : '';
          candidates.push('div' + id + clsStr + ` (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        }
      });
      return candidates.slice(0, 5);
    });
  } finally {
    // Keep browser open for manual inspection
    console.log('\n  Browser stays open for manual inspection. Close it when done.\n');
  }

  return detected;
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);
  const urlArg = args.findIndex(a => a === '--url');
  const userArg = args.findIndex(a => a === '--username');
  const passArg = args.findIndex(a => a === '--password');

  if (urlArg === -1 || userArg === -1 || passArg === -1) {
    console.log(`
Usage:
  bun run tools/flipbook-scraper/inspect.ts --url <url> --username <user> --password <pass>

This opens a browser so you can inspect the flipbook structure.
It auto-detects common patterns and prints suggested selectors.
`);
    process.exit(1);
  }

  const url = args[urlArg + 1];
  const username = args[userArg + 1];
  const password = args[passArg + 1];

  console.log('\n  Inspecting flipbook page...\n');
  const detected = await inspectPage(url, username, password);

  console.log('\n  Detected flipbook libraries:', detected.potentialFlipbookLibraries || 'none');
  console.log('  Potential page images:', detected.images || 'none');
  console.log('  Next buttons:', detected.nextButtons || 'none');
  console.log('  Prev buttons:', detected.prevButtons || 'none');
  console.log('  Page indicators:', detected.pageIndicators || 'none');
  console.log('  Containers:', detected.containers || 'none');
}

main();
