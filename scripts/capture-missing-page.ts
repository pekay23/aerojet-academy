import { chromium, type Route } from '@playwright/test';
import * as fs from 'fs/promises';

async function captureMissingPage() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    acceptDownloads: true,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();
  const interceptedImages: Map<string, Buffer> = new Map();

  // Intercept all image requests
  await context.route('**/*.{jpg,jpeg,png,webp}', async (route: Route) => {
    try {
      const response = await route.fetch();
      const buffer = await response.body();
      const url = route.request().url();
      if (!url.includes('spinner') && !url.includes('logo')) {
        interceptedImages.set(url, Buffer.from(buffer));
        console.log(`Intercepted: ${url.substring(0, 80)}... (${buffer.length} bytes)`);
      }
    } catch {
      // ignore
    }
    await route.continue();
  });

  // Login
  console.log('Logging in...');
  await page.goto('https://courses.suntech-bc.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector("input[name='log']", { state: 'visible', timeout: 15000 });
  await page.fill("input[name='log']", 'admin@aerojet-aviation.com');
  await page.fill("input[name='pwd']", 'Aerojet1');
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Navigate to Module 9a
  console.log('Navigating to Module 9a...');
  await page.goto('https://courses.suntech-bc.com/courses/part-66-module-9a/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(45000); // Wait for flipbook to load

  // Navigate to page 234 by pressing ArrowRight 233 times
  console.log('Navigating to page 234...');
  for (let i = 0; i < 233; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(2000);

  // Get the current page image URL
  const currentImg = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.book img, .flipbook-main-wrapper img'));
    const visible = imgs.find((img: unknown) => {
      const rect = (img as HTMLImageElement).getBoundingClientRect();
      return rect.width > 100 && rect.height > 100 && !(img as HTMLImageElement).src.includes('spinner');
    });
    return visible?.src || null;
  });

  console.log(`Current image URL: ${currentImg}`);

  // Find the intercepted image
  let imageBuffer: Buffer | null = null;
  if (currentImg) {
    if (interceptedImages.has(currentImg)) {
      imageBuffer = interceptedImages.get(currentImg)!;
    } else {
      // Try to find by filename
      for (const [url, buffer] of interceptedImages) {
        if (url === currentImg || url.endsWith(currentImg.split('/').pop() || '')) {
          imageBuffer = buffer;
          break;
        }
      }
    }
  }

  // If not found in interception, try fetching directly
  if (!imageBuffer && currentImg) {
    console.log('Fetching image directly...');
    try {
      const response = await page.request.get(currentImg);
      imageBuffer = Buffer.from(await response.body());
    } catch (e) {
      console.log('Direct fetch failed:', e);
    }
  }

  if (imageBuffer) {
    const outputPath = 'flipbook-output/EASA-Module-9a-Human-Factors-Complete/page_0302.jpeg';
    await fs.mkdir('flipbook-output/EASA-Module-9a-Human-Factors-Complete', { recursive: true });
    await fs.writeFile(outputPath, imageBuffer);
    console.log(`Saved page 234 to ${outputPath} (${imageBuffer.length} bytes)`);
  } else {
    console.log('Failed to capture image, falling back to screenshot');
    const outputPath = 'flipbook-output/EASA-Module-9a-Human-Factors-Complete/page_0302.jpeg';
    await fs.mkdir('flipbook-output/EASA-Module-9a-Human-Factors-Complete', { recursive: true });
    const flipbookEl = await page.$('.flipbook-main-wrapper, .book, .flipbook-container');
    if (flipbookEl) {
      await flipbookEl.screenshot({ path: outputPath, type: 'jpeg', quality: 95 });
    } else {
      await page.screenshot({ path: outputPath, type: 'jpeg', quality: 95 });
    }
    console.log(`Saved screenshot to ${outputPath}`);
  }

  await browser.close();
}

captureMissingPage().catch(console.error);


