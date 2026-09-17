"""Read PDF text safely."""
import sys
import pdfplumber

path = sys.argv[1]
with pdfplumber.open(path) as pdf:
    for i, page in enumerate(pdf.pages[:2], 1):
        text = page.extract_text() or ""
        sys.stdout.reconfigure(encoding="utf-8")
        print(f"--- PAGE {i} ---")
        print(text[:1500])
        print()
