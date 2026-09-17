"""OCR the M9 Suntech PDF (image-based scanned book) into corpus/M9.jsonl."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Ensure tesseract is on PATH
os.environ["PATH"] = r"C:\Program Files\Tesseract-OCR;" + os.environ.get("PATH", "")

from pdf2image import convert_from_path
import pytesseract

AEROJET_ROOT = Path(
    r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation"
)
PDF_PATH = (
    AEROJET_ROOT
    / "Module 9 - Human Factors"
    / "suntech"
    / "EASA-Module-9a-Human-Factors-Complete.pdf"
)
OUT_PATH = Path(__file__).parent / "corpus" / "M9.jsonl"
DPI = 200
BATCH_SIZE = 10  # pages per batch for progress


def ocr_pdf(pdf_path: Path, out_path: Path) -> tuple[int, int]:
    pages = 0
    chars = 0
    # Get total page count via pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(str(pdf_path))
        total_pages = len(reader.pages)
    except Exception:
        total_pages = None

    mode = "a" if "--append" in sys.argv and out_path.exists() else "w"
    with out_path.open(mode, encoding="utf-8") as out:
        batch_start = 1
        while True:
            batch_end = batch_start + BATCH_SIZE - 1
            if total_pages and batch_end > total_pages:
                batch_end = total_pages
            print(f"  Converting pages {batch_start}-{batch_end}...", flush=True)
            try:
                images = convert_from_path(
                    str(pdf_path),
                    first_page=batch_start,
                    last_page=batch_end,
                    dpi=DPI,
                )
            except Exception as exc:
                print(f"  Failed to convert batch {batch_start}-{batch_end}: {exc}", file=sys.stderr)
                break

            if not images:
                break

            for i, img in enumerate(images, start=batch_start):
                try:
                    text = pytesseract.image_to_string(img) or ""
                except Exception as exc:
                    print(f"  page {i} OCR error: {exc}", file=sys.stderr)
                    text = ""
                text = text.strip()
                if text:
                    out.write(
                        json.dumps(
                            {"module": "M9", "page": i, "source": pdf_path.name, "text": text},
                            ensure_ascii=False,
                        )
                        + "\n"
                    )
                    pages += 1
                    chars += len(text)

            print(f"  -> batch done: {pages} pages, {chars // 1024} KB text", flush=True)

            if total_pages and batch_end >= total_pages:
                break
            batch_start = batch_end + 1

    return pages, chars


def main() -> int:
    if not PDF_PATH.exists():
        print(f"MISSING: {PDF_PATH}", file=sys.stderr)
        return 1
    print(f"[M9] OCR'ing {PDF_PATH.name} ({PDF_PATH.stat().st_size // 1024} KB)...")
    pages, chars = ocr_pdf(PDF_PATH, OUT_PATH)
    print(f"  -> {pages} pages, {chars // 1024} KB text")
    print(f"\nWrote {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
