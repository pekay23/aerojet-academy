"""Read PDF last pages."""
import sys
import pdfplumber

path = sys.argv[1]
with pdfplumber.open(path) as pdf:
    n = len(pdf.pages)
    for i in range(max(0, n - 2), n):
        text = pdf.pages[i].extract_text() or ""
        sys.stdout.reconfigure(encoding="utf-8")
        print(f"--- PAGE {i + 1} ---")
        print(text[:2500])
        print()
