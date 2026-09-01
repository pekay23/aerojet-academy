# Flipbook Scraper

Downloads page images from HTML5 flipbooks and converts them to PDF.

## Quick Start

```bash
# Basic usage with CLI args
bun run tools/flipbook-scraper/index.ts \
  --url "https://courses.suntech-bc.com/module/8" \
  --username "your@email.com" \
  --password "yourpassword" \
  --name "EASA-Module-8-Basic-Aerodynamics"

# Using a config file
bun run tools/flipbook-scraper/index.ts --config my-config.json

# Images only (no PDF)
bun run tools/flipbook-scraper/index.ts \
  --url "..." --username "..." --password "..." \
  --name "Module-8" --images-only

# Visible browser (for debugging)
bun run tools/flipbook-scraper/index.ts \
  --url "..." --username "..." --password "..." \
  --name "Module-8" --headless false
```

## Config File Format

```json
{
  "baseUrl": "https://courses.suntech-bc.com",
  "loginUrl": "https://courses.suntech-bc.com/login",
  "username": "your@email.com",
  "password": "yourpassword",
  "moduleUrl": "https://courses.suntech-bc.com/module/8",
  "outputDir": "./flipbook-output",
  "documentName": "EASA-Module-8-Basic-Aerodynamics",
  "loginSelectors": {
    "usernameField": "input[name='username']",
    "passwordField": "input[name='password']",
    "submitButton": "button[type='submit']"
  },
  "flipbookSelectors": {
    "container": ".flipbook-container",
    "pageImage": ".flipbook img",
    "nextButton": ".next-page",
    "prevButton": ".prev-page",
    "pageIndicator": ".page-count",
    "totalPages": ".total-pages"
  },
  "pageLoadDelay": 2000,
  "headless": true,
  "imageFormat": "jpeg",
  "pdfOptions": {
    "pageSize": "a4",
    "margin": 0
  }
}
```

## How It Works

1. **Login** — Fills credentials and submits the login form
2. **Navigate** — Goes to the module URL and waits for the flipbook to load
3. **Detect pages** — Reads total page count from the UI or clicks through to count
4. **Capture** — For each page:
   - Waits for the page image to load
   - Tries to grab the original image from network interception
   - Falls back to screenshotting the `<img>` element
   - Falls back to screenshotting the whole flipbook container
5. **Save** — Images saved as `page_001.jpg`, `page_002.jpg`, etc.
6. **Convert** — All images combined into a single PDF

## Output Structure

```
flipbook-output/
└── EASA-Module-8-Basic-Aerodynamics/
    ├── page_001.jpg
    ├── page_002.jpg
    ├── page_003.jpg
    └── ...
└── EASA-Module-8-Basic-Aerodynamics.pdf
```

## Finding Selectors for a New Site

1. Open the flipbook in Chrome
2. Right-click the page image → Inspect
3. Look for the `class` or `id` on:
   - The image element itself
   - The container holding the flipbook
   - Next/previous buttons
   - Page counter ("Page 1 of 45")
4. Update the selectors in your config or preset

Use the `--headless false` flag to watch the browser as it works — helpful for debugging selector issues.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Could not detect total pages" | Add explicit `totalPages` or `pageIndicator` selector |
| Pages are blank/black | Increase `pageLoadDelay` (flipbooks load lazily) |
| Wrong images captured | Tighten the `pageImage` selector to target only the active page |
| Login fails | Check `loginSelectors` match the actual form fields |
| PDF is huge | Use `imageFormat: "jpeg"` and reduce source image quality |
