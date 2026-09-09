"""Extract EASA Part-66 LO catalog from OCR'd Suntech training books."""
from __future__ import annotations

import json
import re
from pathlib import Path

CORPUS_DIR = Path(__file__).parent / "corpus"
OUT_PATH = Path(__file__).parent / "lo_catalog.json"

MODULES = ("M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11A", "M13", "M14", "M15", "M17")

# Pattern for TOC lines: optional "@", chapter.subchapter, optional letter, title, "- Level N" REQUIRED
RE_TOC = re.compile(
    r"^\s*(?:@\s+)?(\d+)[\.\,](\d+)(?:\(([a-z])\))?\s+(.+?)\s*[—\-]\s*Level\s*(\d+)\s*$",
    re.IGNORECASE,
)
RE_LEVEL = re.compile(r"Level\s*(\d+)", re.IGNORECASE)
RE_GARBAGE = re.compile(r"^\s*(?:@\s+)?\d+\s*$")  # bare numbers


def extract_toc_los(text: str, module: str) -> list[dict]:
    """Extract LOs from a block of TOC text."""
    los = []
    seen = set()
    lines = text.split("\n")
    current_lo = None

    module_num = module.lstrip("M").lstrip("0")  # e.g., "M8" -> "8", "M11A" -> "11A"

    for line in lines:
        line = line.strip()
        if not line:
            continue

        m = RE_TOC.match(line)
        if m:
            if current_lo:
                los.append(current_lo)

            raw_chapter, subchapter, letter, rest = m.group(1), m.group(2), m.group(3), m.group(4)
            level = m.group(5)
            if level:
                level = int(level)
            else:
                lvl_m = RE_LEVEL.search(rest)
                level = int(lvl_m.group(1)) if lvl_m else None

            title = re.sub(r"\s*[—\-]\s*Level\s*\d+\s*$", "", rest, flags=re.IGNORECASE).strip()
            title = re.sub(r"\s*\d+\s*$", "", title).strip()
            title = re.sub(r"\s{2,}", " ", title)

            if len(title) < 3 or len(title) > 200:
                current_lo = None
                continue
            if not re.search(r"[a-zA-Z]{3,}", title):
                current_lo = None
                continue

            # Normalize numbers
            chapter = raw_chapter.lstrip("0") or "0"
            subchapter = subchapter.lstrip("0") or "0"

            # If the chapter number equals the module number, the first group was a module prefix
            # e.g., "08.01" for M8 means chapter "01", not chapter "8"
            if chapter == module_num:
                chapter = subchapter
                subchapter = "1"  # first item of the chapter

            code = f"{module}.{chapter}"
            if letter:
                code += f"({letter})"

            if code in seen:
                current_lo = None
                continue
            seen.add(code)

            current_lo = {
                "module": module,
                "code": code,
                "title": title,
                "level": level,
            }
        elif current_lo:
            cont = line.strip()
            if cont and not RE_GARBAGE.match(cont) and len(cont) > 2:
                if not re.match(r"^\d+[\.\,]\d+", cont):
                    current_lo["title"] += " " + cont

    if current_lo:
        los.append(current_lo)

    return los


def extract_module(module: str) -> list[dict]:
    """Return a list of LO dicts for a given module code."""
    corpus_path = CORPUS_DIR / f"{module}.jsonl"
    if not corpus_path.exists():
        return []

    los: list[dict] = []
    seen_codes: set[str] = set()

    with corpus_path.open(encoding="utf-8") as f:
        for line in f:
            rec = json.loads(line)
            page = rec["page"]
            text = rec["text"]

            # Only scan TOC pages (typically pages 4-10)
            if page < 4 or page > 10:
                continue

            page_los = extract_toc_los(text, module)
            for lo in page_los:
                if lo["code"] not in seen_codes:
                    seen_codes.add(lo["code"])
                    los.append(lo)

    return los


def main() -> int:
    # Load existing catalog to preserve all current entries
    existing = {}
    if OUT_PATH.exists():
        with OUT_PATH.open(encoding="utf-8") as f:
            existing = json.load(f)

    catalog: dict[str, list[dict]] = dict(existing)  # copy everything

    # Only extract/update LOs for M8, M9, M10
    for module in ("M8", "M9", "M10"):
        los = extract_module(module)
        by_code: dict[str, dict] = {}
        for lo in los:
            if lo["code"] not in by_code:
                by_code[lo["code"]] = lo
        catalog[module] = sorted(by_code.values(), key=lambda x: x["code"])
        print(f"{module}: {len(catalog[module])} LOs")

    # Print summary for all modules
    for mod in MODULES:
        print(f"{mod}: {len(catalog.get(mod, []))} LOs")

    OUT_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
