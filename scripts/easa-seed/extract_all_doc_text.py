"""Extract text from all OneDrive AerojetAviation source documents.

Output: scripts/easa-seed/doc-text/<module>/<source_stem>.txt
"""
from __future__ import annotations

import re
from pathlib import Path
import json

import pdfplumber
from docx import Document
from bs4 import BeautifulSoup
import openpyxl

AEROJET_ROOT = Path(
    r"C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation"
)
OUT_DIR = Path(__file__).parent / "doc-text"
MODULES = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]


def module_from_path(path: Path) -> str | None:
    name = path.name
    for m in MODULES:
        if name.startswith(m + " ") or name.startswith(m + "_") or name.startswith(m + "-") or name == m:
            return m
    # Try parent folder
    for part in path.parts:
        for m in MODULES:
            if part.startswith(m + " ") or part.startswith(m + "_") or part.startswith(m + "-"):
                return m
    return None


def read_pdf(path: Path) -> str:
    pages = []
    try:
        with pdfplumber.open(str(path)) as pdf:
            for i, page in enumerate(pdf.pages):
                try:
                    text = page.extract_text()
                    if text:
                        pages.append(f"--- Page {i+1} ---\n{text}")
                except Exception:
                    pass
    except Exception as e:
        return f"[PDF ERROR: {e}]"
    return "\n\n".join(pages)


def read_docx(path: Path) -> str:
    try:
        doc = Document(str(path))
        lines = [p.text for p in doc.paragraphs if p.text.strip()]
        # Also extract tables
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(c.text.strip() for c in row.cells if c.text.strip())
                if row_text:
                    lines.append(f"[TABLE] {row_text}")
        return "\n".join(lines)
    except Exception as e:
        return f"[DOCX ERROR: {e}]"


def read_doc(path: Path) -> str:
    """Read old .doc files - try as text first, otherwise skip."""
    try:
        text = path.read_bytes().decode("utf-8", errors="ignore")
        # Filter to printable ASCII
        cleaned = "".join(c for c in text if 32 <= ord(c) < 127 or c in "\n\r\t")
        if len(cleaned) > 200:
            return cleaned
    except Exception:
        pass
    return "[BINARY .doc - needs conversion]"


def read_html(path: Path) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "lxml")
        return soup.get_text(separator="\n", strip=True)
    except Exception as e:
        return f"[HTML ERROR: {e}]"


def read_xlsx(path: Path) -> str:
    try:
        wb = openpyxl.load_workbook(str(path), read_only=True, data_only=True)
        lines = []
        for sheet in wb.worksheets:
            lines.append(f"=== Sheet: {sheet.title} ===")
            for row in sheet.iter_rows(values_only=True):
                row_text = " | ".join(str(c) for c in row if c is not None)
                if row_text.strip():
                    lines.append(row_text)
        return "\n".join(lines)
    except Exception as e:
        return f"[XLSX ERROR: {e}]"


def extract_all():
    for module in MODULES:
        out_module = OUT_DIR / module
        out_module.mkdir(parents=True, exist_ok=True)

    module_folders = {
        "M1": "Module 1 - Mathematics",
        "M2": "Module 2 - Physics",
        "M3": "Module 3 - Electrical Fundamentals",
        "M4": "Module 4 - Electronic Fundamentals",
        "M5": "Module 5 - Digital Techniques (Electronic Instrument Systems)",
        "M6": "Module 6 - Materials and Hardware",
        "M7": "Module 7 - Maintenance Practices",
        "M11A": "Module 11A - Turbine Aeroplane Aerodynamics",
        "M13": "Module 13 - Aircraft Aerodynamics, Structures & Systems",
        "M17": "Module 17 - Propellers",
    }

    total = 0
    for module, folder_name in module_folders.items():
        folder = AEROJET_ROOT / folder_name
        if not folder.exists():
            print(f"  SKIP {module}: folder not found")
            continue

        for path in folder.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in {".pdf", ".docx", ".doc", ".html", ".xlsx"}:
                continue
            # Skip support files like images, videos, etc.
            if path.suffix.lower() in {".pdf", ".docx", ".doc", ".html", ".xlsx"}:
                pass

            stem = path.stem
            out_path = OUT_DIR / module / f"{stem}.txt"

            if out_path.exists():
                continue

            print(f"  Extracting {module}: {path.name}")
            if path.suffix.lower() == ".pdf":
                text = read_pdf(path)
            elif path.suffix.lower() == ".docx":
                text = read_docx(path)
            elif path.suffix.lower() == ".doc":
                text = read_doc(path)
            elif path.suffix.lower() == ".html":
                text = read_html(path)
            elif path.suffix.lower() == ".xlsx":
                text = read_xlsx(path)
            else:
                continue

            out_path.write_text(text, encoding="utf-8")
            total += 1

    print(f"\nDone. Extracted {total} documents to {OUT_DIR}")


if __name__ == "__main__":
    extract_all()
