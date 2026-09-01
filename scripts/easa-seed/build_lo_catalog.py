"""Extract EASA Part-66 LO catalog from Suntech training book TOC pages.

For each module corpus, scan early pages (TOC) and pull out
'Chapter Mx.y Level N' entries with their full descriptions.

Output: scripts/easa-seed/lo_catalog.json
"""
from __future__ import annotations

import json
import re
from pathlib import Path

CORPUS_DIR = Path(__file__).parent / "corpus"
OUT_PATH = Path(__file__).parent / "lo_catalog.json"

# Per the Suntech format, the TOC and the per-chapter headers look like:
#   "1.1 Arithmetic — Level 2"
#   "1.2 Algebra"
#   "1.2(a) Evaluating — Level 2"
#   "1.3 Geometry"
#   "1.3(a) Simple ... — Level 1"
# We accept any of the digit-based codes.

# Module codes (matches sources.py order)
MODULES = ("M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M14", "M15", "M17")

# Pattern for header lines
RE_LO = re.compile(
    r"^\s*(\d+)\.(\d+)(?:\(([a-z])\))?\s+(.+?)\s*[—\-]?\s*Level\s*(\d+)?",
    re.IGNORECASE,
)
RE_CHAPTER = re.compile(r"^\s*(\d+)\.\s*(\d+)\s+([A-Z][^\n]{3,80})\s*$")
RE_PART = re.compile(r"^\s*(\d+)\.(\d+)(?:\(([a-z])\))?\s+(.+)$", re.IGNORECASE | re.MULTILINE)


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
            text = rec["text"]
            if rec["page"] > 15 and not los:
                continue
            for m in RE_PART.finditer(text):
                lo_num, sub, letter, desc = m.group(1), m.group(2), m.group(3), m.group(4)
                if letter and len(letter) != 1:
                    continue
                lvl_m = re.search(r"Level\s*(\d+)", desc, re.IGNORECASE)
                level = int(lvl_m.group(1)) if lvl_m else None
                desc = re.sub(r"\s*[—\-]\s*Level\s*\d+\s*$", "", desc, flags=re.IGNORECASE).strip()
                desc = re.sub(r"\s{2,}", " ", desc)
                code = f"{module}.{lo_num}.{sub}"
                if letter:
                    code += f"({letter})"
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                if len(desc) < 3 or len(desc) > 200:
                    continue
                # Reject junk: sub-section must be 1-9 (single digit)
                if not sub.isdigit() or int(sub) > 9:
                    continue
                # Chapter must be 1-99
                if not lo_num.isdigit() or int(lo_num) > 99:
                    continue
                # Description must start with a letter (skip "0.125" / "= 2.0 x10-3")
                if not desc[0].isalpha():
                    continue
                los.append(
                    {
                        "module": module,
                        "code": code,
                        "title": desc,
                        "level": level,
                        "page": rec["page"],
                    }
                )
    return los


def main() -> int:
    catalog: dict[str, list[dict]] = {}
    for module in MODULES:
        los = extract_module(module)
        # Dedupe by code (keep first)
        by_code: dict[str, dict] = {}
        for lo in los:
            if lo["code"] not in by_code:
                by_code[lo["code"]] = lo
        catalog[module] = sorted(by_code.values(), key=lambda x: x["code"])
        print(f"{module}: {len(catalog[module])} LOs")
    OUT_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {OUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
