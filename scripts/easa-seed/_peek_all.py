"""Read PDF all pages."""
import sys
import pdfplumber

path = sys.argv[1]
with pdfplumber.open(path) as pdf:
    n = len(pdf.pages)
    print(f"TOTAL PAGES: {n}", file=sys.stderr)
    for i, page in enumerate(pdf.pages, 1):
        text = page.extract_text() or ""
        sys.stdout.reconfigure(encoding="utf-8")
        print(f"--- PAGE {i} ---")
        print(text)
        print()
