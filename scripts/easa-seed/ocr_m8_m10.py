"""OCR M8 and M10 Suntech PDFs into corpus."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

os.environ["PATH"] = r"C:\Program Files\Tesseract-OCR;" + os.environ.get("PATH", "")

from pdf2image import convert_from_path
import pytesseract

AEROJET_ROOT = Path(
    r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation"
)
MODULES = {
    "M8": AEROJET_ROOT / "Module 8 - Aerodynamics" / "suntech" / "EASA-Module-8-Aerodynamics.pdf",
    "M10": AEROJET_ROOT / "Module 10 - Aviation Legislation" / "suntech" / "EASA-Module-10-Aviation-Legislation.pdf",
}
OUT_DIR = Path(__file__).parent / "corpus"
DPI = 200
BATCH_SIZE = 10


def ocr_pdf(pdf_path: Path, out_path: Path, module: str) -> tuple[int, int]:
    pages = 0
    chars = 0
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
            print(f"  [{module}] pages {batch_start}-{batch_end}...", flush=True)
            try:
                images = convert_from_path(
                    str(pdf_path),
                    first_page=batch_start,
                    last_page=batch_end,
                    dpi=DPI,
                )
            except Exception as exc:
                print(f"  FAILED batch {batch_start}-{batch_end}: {exc}", file=sys.stderr)
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
                            {"module": module, "page": i, "source": pdf_path.name, "text": text},
                            ensure_ascii=False,
                        )
                        + "\n"
                    )
                    pages += 1
                    chars += len(text)

            print(f"  -> {pages} pages, {chars // 1024} KB", flush=True)

            if total_pages and batch_end >= total_pages:
                break
            batch_start = batch_end + 1

    return pages, chars


def main() -> int:
    only = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] and not sys.argv[1].startswith("--") else None
    for module, pdf_path in MODULES.items():
        if only and module != only:
            continue
        if not pdf_path.exists():
            print(f"MISSING: {pdf_path}", file=sys.stderr)
            continue
        print(f"[{module}] OCR'ing {pdf_path.name} ({pdf_path.stat().st_size // 1024} KB)...")
        out_path = OUT_DIR / f"{module}.jsonl"
        pages, chars = ocr_pdf(pdf_path, out_path, module)
        print(f"  -> {pages} pages, {chars // 1024} KB text -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
