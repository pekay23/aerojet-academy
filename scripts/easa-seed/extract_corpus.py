"""Extract paged text from Suntech-approved training PDFs.

Output: scripts/easa-seed/corpus/<module_code>.jsonl
Each line: {"module": "M1", "page": 1, "text": "..."}
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pdfplumber
import pypdf

from sources import SOURCES, ModuleSource, AEROJET_ROOT

CORPUS_DIR = Path(__file__).parent / "corpus"
APPEND = "--append" in sys.argv


def extract_pdf(pdf_path: Path, out_fp, module: str) -> tuple[int, int]:
    """Yields paged text. Uses pypdf for large files, pdfplumber for the rest."""
    size_mb = pdf_path.stat().st_size / (1024 * 1024)
    use_pypdf = size_mb > 60
    if use_pypdf:
        return _extract_pypdf(pdf_path, out_fp, module)
    return _extract_pdfplumber(pdf_path, out_fp, module)


def _extract_pypdf(pdf_path, out_fp, module):
    pages = 0
    chars = 0
    print(f"  [pypdf] {pdf_path.name} ({pdf_path.stat().st_size // 1024} KB)")
    reader = pypdf.PdfReader(str(pdf_path))
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            print(f"    page {i} error: {exc}", file=sys.stderr)
            continue
        text = text.strip()
        if not text:
            continue
        out_fp.write(
            json.dumps(
                {"module": module, "page": i, "source": pdf_path.name, "text": text},
                ensure_ascii=False,
            )
            + "\n"
        )
        pages += 1
        chars += len(text)
    return pages, chars


def _extract_pdfplumber(pdf_path, out_fp, module):
    pages = 0
    chars = 0
    print(f"  [pdfplumber] {pdf_path.name} ({pdf_path.stat().st_size // 1024} KB)")
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            try:
                text = page.extract_text() or ""
            except Exception as exc:
                print(f"    page {i} error: {exc}", file=sys.stderr)
                continue
            text = text.strip()
            if not text:
                continue
            out_fp.write(
                json.dumps(
                    {"module": module, "page": i, "source": pdf_path.name, "text": text},
                    ensure_ascii=False,
                )
                + "\n"
            )
            pages += 1
            chars += len(text)
    return pages, chars


def extract_one(src: ModuleSource) -> tuple[int, int]:
    """Returns (pages, chars)."""
    pages = 0
    chars = 0
    out_path = CORPUS_DIR / f"{src.module_code}.jsonl"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    mode = "a" if APPEND and out_path.exists() else "w"
    with out_path.open(mode, encoding="utf-8") as out:
        for pdf_path in src.textbook_pdfs:
            if not pdf_path.exists():
                print(f"  MISSING: {pdf_path}", file=sys.stderr)
                continue
            try:
                p, c = extract_pdf(pdf_path, out, src.module_code)
                pages += p
                chars += c
            except Exception as exc:
                print(f"  FAILED {pdf_path.name}: {exc}", file=sys.stderr)
    return pages, chars


def main() -> int:
    only = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None
    total_pages = 0
    total_chars = 0
    for src in SOURCES:
        if only and src.module_code != only:
            continue
        print(f"[{src.module_code}] extracting...")
        pages, chars = extract_one(src)
        print(f"  -> {pages} pages, {chars // 1024} KB text")
        total_pages += pages
        total_chars += chars
    print(f"\nDone. {total_pages} pages, {total_chars // 1024} KB total.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
