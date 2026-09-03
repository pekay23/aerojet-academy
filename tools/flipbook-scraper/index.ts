import * as fs from 'fs/promises'
import * as path from 'path'
import { FlipbookScraper, ScrapeProgress } from './scraper'
import { FlipbookConfig } from './config'

async function main() {
  const args = parseArgs()

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const config = await loadConfig(args)

  if (args.diagnose) {
    config.headless = false
  }

  console.log(`\n Flipbook Scraper`)
  console.log(`==================`)
  console.log(`Document: ${config.documentName}`)
  console.log(`Output:   ${config.outputDir}`)
  console.log(`URL:      ${config.moduleUrl}`)
  console.log(`Mode:     ${config.captureMethod}`)
  if (args.diagnose) {
    console.log(`Diagnose: ON (max 5 pages, headed, no PDF)\n`)
  } else {
    console.log('')
  }

  const scraper = new FlipbookScraper(config, (progress: ScrapeProgress) => {
    printProgress(progress)
  })

  try {
    await scraper.initialize()
    await scraper.login()
    await scraper.navigateToModule()

    if (args.inspectState) {
      const statePath = path.join(config.outputDir, 'flipbook-state.json')
      await scraper.inspectState(statePath)
      console.log(`\n  State dump written to: ${statePath}`)
      await scraper.cleanup()
      process.exit(0)
    }

    if (args.traceBook) {
      const tracePath = path.join(config.outputDir, 'flipbook-trace.json')
      await scraper.traceBook(tracePath)
      console.log(`\n  Trace written to: ${tracePath}`)
      await scraper.cleanup()
      process.exit(0)
    }

    let totalPages = args.pages ? parseInt(args.pages, 10) : 0
    if (totalPages > 0) {
      console.log(`\n  Using specified page count: ${totalPages}\n`)
    } else {
      totalPages = await scraper.detectTotalPages()
      console.log(`\n  Detected ${totalPages} pages\n`)
    }

    if (totalPages === 0) {
      console.error(' Could not detect total pages. Use --pages N to specify manually.')
      await scraper.cleanup()
      process.exit(1)
    }

    const effectivePages = args.diagnose ? Math.min(totalPages, 5) : totalPages
    const startPage = args.startPage ? parseInt(args.startPage, 10) : 1
    await scraper.captureAllPages(effectivePages, startPage)

    if (!args.imagesOnly && !args.diagnose) {
      const pdfPath = await scraper.saveAsPdf()
      console.log(`\n  PDF saved: ${pdfPath}`)
    }

    console.log(`\n  Done! ${scraper.getCapturedImages().length} pages saved.`)
  } catch (error) {
    console.error(`\n  Error: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  } finally {
    await scraper.cleanup()
  }
}

function parseArgs() {
  const args: Record<string, string | boolean> = {}
  const argv = process.argv.slice(2)

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        args[key] = next
        i++
      } else {
        args[key] = true
      }
    }
  }

  return {
    help: args.help || false,
    diagnose: args.diagnose || false,
    config: args.config as string | undefined,
    url: args.url as string | undefined,
    username: args.username as string | undefined,
    password: args.password as string | undefined,
    output: args.output as string | undefined,
    name: args.name as string | undefined,
    pages: args.pages as string | undefined,
    startPage: args['start-page'] as string | undefined,
    imagesOnly: args['images-only'] || false,
    headless: args.headless !== 'false',
    captureMethod: args['capture-method'] as 'interception' | 'screenshot' | undefined,
    inspectState: args['inspect-state'] || false,
    traceBook: args['trace-book'] || false,
  }
}

async function loadConfig(args: ReturnType<typeof parseArgs>): Promise<FlipbookConfig> {
  if (args.config) {
    const configPath = path.resolve(args.config)
    const content = await fs.readFile(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return parsed as FlipbookConfig
  }

  const presetPath = path.join(__dirname, 'presets', 'suntech.json')
  let preset: Partial<FlipbookConfig> = {}

  try {
    const content = await fs.readFile(presetPath, 'utf-8')
    preset = JSON.parse(content)
  } catch {
    // no preset found, use defaults
  }

  return {
    baseUrl: preset.baseUrl || 'https://courses.suntech-bc.com',
    loginUrl: preset.loginUrl || 'https://courses.suntech-bc.com/login',
    username: args.username || preset.username || '',
    password: args.password || preset.password || '',
    moduleUrl: args.url || preset.moduleUrl || '',
    outputDir: args.output || preset.outputDir || path.join(process.cwd(), 'flipbook-output'),
    documentName: args.name || preset.documentName || 'flipbook',
    loginSelectors: preset.loginSelectors || {
      usernameField: 'input[name="username"], input[type="email"], #username, #email',
      passwordField: 'input[name="password"], input[type="password"], #password',
      submitButton: 'button[type="submit"], input[type="submit"], .login-btn',
    },
    flipbookSelectors: preset.flipbookSelectors || {
      container: '.flipbook-container, .flipbook, #flipbook, .book-container, [class*="flipbook"]',
      pageImage: 'img.page-image, .flipbook img, .page img, canvas.page, .book-page img',
      nextButton: '.next-page, .flipbook-next, [class*="next"], button[aria-label="Next"]',
      prevButton: '.prev-page, .flipbook-prev, [class*="prev"], button[aria-label="Previous"]',
      pageIndicator: '.page-indicator, .page-count, [class*="page-info"]',
      totalPages: '.total-pages, [class*="total"]',
    },
    pageLoadDelay: preset.pageLoadDelay || 2000,
    headless: args.headless,
    imageFormat: preset.imageFormat || 'jpeg',
    captureMethod: args.captureMethod || preset.captureMethod || 'interception',
    pdfOptions: preset.pdfOptions || {
      pageSize: 'a4',
      margin: 0,
    },
  }
}

function printProgress(progress: ScrapeProgress) {
  const prefix = `[${progress.status.toUpperCase()}]`
  const pageInfo = progress.totalPages ? ` (${progress.currentPage}/${progress.totalPages})` : ''
  console.log(`  ${prefix}${pageInfo} ${progress.message}`)
}

function printHelp() {
  console.log(`
Flipbook Scraper - Download flipbook pages and convert to PDF

Usage:
  bun run tools/flipbook-scraper/index.ts [options]

 Options:
     --url <url>           Direct URL to the flipbook module
     --username <user>     Login username/email
     --password <pass>     Login password
     --name <name>         Document name (used for folder/filename)
     --output <dir>        Output directory (default: ./flipbook-output)
      --pages <number>      Manually specify total pages (overrides detection)
      --start-page <number> Start capturing from this page (for resuming)
      --config <path>       Path to full JSON config file
     --images-only         Skip PDF conversion, save images only
     --headless <bool>     Run browser headless (default: true)
     --capture-method <method> Capture method: interception or screenshot (default: interception)
      --diagnose            Run headed, max 5 pages, skip PDF, log interception details
      --inspect-state       Dump flipbook JS state to flipbook-state.json and exit
      --trace-book          Monkey-patch FLIPBOOK prototypes to trace page-to-image mappings

Examples:
  bun run tools/flipbook-scraper/index.ts \\
    --url "https://courses.suntech-bc.com/module/8" \\
    --username "user@example.com" \\
    --password "pass123" \\
    --name "EASA-Module-8-Basic-Aerodynamics"

  bun run tools/flipbook-scraper/index.ts --config my-config.json
`)
}

main()
