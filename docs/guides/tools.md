# Tools

## Flipbook Scraper

### Purpose
Downloads HTML5 flipbook pages from courses.suntech-bc.com and converts them to PDF.

### Quick Start (CLI)
```bash
bun run tools/flipbook-scraper/index.ts \
  --url "https://courses.suntech-bc.com/module/8" \
  --username "user@example.com" \
  --password "password" \
  --name "EASA-Module-8" \
  --pages 110
```

### Inspect Mode
```bash
bun run tools/flipbook-scraper/inspect.ts \
  --url "https://courses.suntech-bc.com/module/8" \
  --username "user@example.com" \
  --password "password"
```

### Tauri Desktop App
```bash
cd tools/flipbook-app
bun tauri dev  # Development
bun tauri build  # Release
```

### WPF Desktop App
```bash
cd tools/flipbook-wpf-app
dotnet build -c Release
dotnet run  # Debug
```

### Presets
- `tools/flipbook-scraper/presets/suntech.json` — Suntech course selectors

### Output Location
PDFs are saved to OneDrive directories:
- Module 8: `OneDrive/Module 8 - Aerodynamics/suntech/`
- Module 9: `OneDrive/Module 9 - Human Factors/suntech/`
- Module 10: `OneDrive/Module 10 - Aviation Legislation/suntech/`

### CLI Options
| Flag | Description |
|------|-------------|
| `--url` | Flipbook module URL |
| `--username` | Login email |
| `--password` | Login password |
| `--name` | Document name (folder + filename) |
| `--pages` | Manual page count (overrides auto-detection) |
| `--start-page` | Resume from page N |
| `--output` | Output directory |
| `--images-only` | Skip PDF conversion |
| `--headless` | Run headless (true/false) |
| `--capture-method` | `interception` (image) or `screenshot` |

### Capture Methods
- **interception** (default): Captures actual flipbook images via Playwright route interception. Higher quality, smaller files. Requires CDN URL matching.
- **screenshot**: Screenshots the flipbook container element. Lower quality but more reliable across all platforms.

### Re-running Scrapers
```bash
# Module 8 - Basic Aerodynamics (~110 pages)
bun run tools/flipbook-scraper/index.ts \
  --url "https://courses.suntech-bc.com/module/8" \
  --username "" \
  --password "" \
  --name "EASA-Module-8-Basic-Aerodynamics" \
  --pages 110 \
  --output "./flipbook-output"

# Module 9a - Human Factors (~301 pages)
bun run tools/flipbook-scraper/index.ts \
  --url "https://courses.suntech-bc.com/module/9a" \
  --username "" \
  --password "" \
  --name "EASA-Module-9a-Human-Factors" \
  --pages 301 \
  --output "./flipbook-output"

# Module 10 - Aviation Legislation (~289 pages)
bun run tools/flipbook-scraper/index.ts \
  --url "https://courses.suntech-bc.com/module/10" \
  --username "" \
  --password "" \
  --name "EASA-Module-10-Aviation-Legislation" \
  --pages 289 \
  --output "./flipbook-output"
```

Then convert to PDF:
```bash
bun run scripts/images-to-pdf.ts ./flipbook-output/EASA-Module-8-Basic-Aerodynamics ./flipbook-output/EASA-Module-8-Basic-Aerodynamics.pdf
bun run scripts/images-to-pdf.ts ./flipbook-output/EASA-Module-9a-Human-Factors ./flipbook-output/EASA-Module-9a-Human-Factors.pdf
bun run scripts/images-to-pdf.ts ./flipbook-output/EASA-Module-10-Aviation-Legislation ./flipbook-output/EASA-Module-10-Aviation-Legislation.pdf
```

### Building Desktop Apps

#### Tauri EXE
```bash
cd tools/flipbook-app
bun install
bun tauri build
```
Output: `src-tauri/target/release/bundle/`

Prerequisites: Rust toolchain, WebView2 (Windows), Tauri CLI.

#### WPF EXE
```bash
cd tools/flipbook-wpf-app
dotnet build -c Release
```
Output: `bin/Release/net8.0-windows/FlipbookWpfApp.exe`

Prerequisites: .NET 8 SDK, Playwright browsers (`pwsh bin/Debug/net8.0-windows/playwright.ps1 install chromium`).
