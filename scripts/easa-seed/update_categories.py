"""Update EASA seed CSVs with category applicability and knowledge levels."""
from __future__ import annotations

import csv
import json
from pathlib import Path

CSV_DIR = Path(__file__).parent / "csvs"

# EASA module applicability per category
# Based on Commission Implementing Regulation (EU) 2023/989, Appendix I § 2
MODULE_CATEGORY_APPLICABILITY = {
    "M1": ["A", "B1", "B2", "B3"],
    "M2": ["A", "B1", "B2", "B3"],
    "M3": ["A", "B1", "B2", "B3"],
    "M4": ["B1", "B2", "B3"],  # Not for plain Category A
    "M5": ["A", "B1", "B2", "B3"],
    "M6": ["A", "B1", "B2", "B3"],
    "M7": ["A", "B1", "B2", "B3"],
    "M8": ["A", "B1", "B2", "B3"],
    "M9": ["A", "B1", "B2", "B3"],
    "M10": ["A", "B1", "B2", "B3"],
    "M11A": ["A", "B1", "B3"],  # Turbine aeroplane
    "M12": ["B1"],  # Helicopter
    "M13": ["B2"],  # Aircraft systems (B2)
    "M14": ["B2"],  # Propulsion (B2)
    "M15": ["A", "B1"],  # Gas turbine
    "M16": ["A", "B1", "B3"],  # Piston engine
    "M17": ["A", "B1", "B3"],  # Propeller
}

# Knowledge levels per module/category
# Level 1 = familiarisation, Level 2 = general, Level 3 = detailed
MODULE_KNOWLEDGE_LEVELS = {
    "M1": {"A": 1, "B1": 2, "B2": 2, "B3": 2},
    "M2": {"A": 1, "B1": 2, "B2": 2, "B3": 1},
    "M3": {"A": 1, "B1": 2, "B2": 2, "B3": 1},
    "M4": {"B1": 2, "B2": 2, "B3": 1},
    "M5": {"A": 1, "B1": 2, "B2": 3, "B3": 1},
    "M6": {"A": 1, "B1": 2, "B2": 2, "B3": 2},
    "M7": {"A": 2, "B1": 2, "B2": 2, "B3": 2},
    "M8": {"A": 1, "B1": 1, "B2": 1, "B3": 1},
    "M9": {"A": 1, "B1": 1, "B2": 1, "B3": 1},
    "M10": {"A": 1, "B1": 2, "B2": 2, "B3": 1},
    "M11A": {"A": 2, "B1": 3, "B3": 2},
    "M12": {"B1": 3},
    "M13": {"B2": 3},
    "M14": {"B2": 2},
    "M15": {"A": 2, "B1": 3},
    "M16": {"A": 2, "B1": 3, "B3": 3},
    "M17": {"A": 1, "B1": 2, "B3": 2},
}


def update_module(csv_path: Path) -> tuple[int, int]:
    """Update a module CSV with categoryCode and knowledgeLevel."""
    with csv_path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return 0, 0
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    # Add missing columns
    added_cols = []
    if "categoryCode" not in fieldnames:
        fieldnames.insert(fieldnames.index("subTopic") + 1, "categoryCode")
        added_cols.append("categoryCode")
    if "knowledgeLevel" not in fieldnames:
        fieldnames.insert(fieldnames.index("subTopic") + 2, "knowledgeLevel")
        added_cols.append("knowledgeLevel")

    module_code = csv_path.stem
    categories = MODULE_CATEGORY_APPLICABILITY.get(module_code, ["A", "B1", "B2", "B3"])
    knowledge_levels = MODULE_KNOWLEDGE_LEVELS.get(module_code, {})

    # Set default categoryCode to the broadest category
    default_category = "B1" if "B1" in categories else (categories[0] if categories else "A")
    default_level = knowledge_levels.get(default_category, 2)

    updated = 0
    for row in rows:
        changed = False
        if "categoryCode" in added_cols or not row.get("categoryCode"):
            row["categoryCode"] = default_category
            changed = True
        if "knowledgeLevel" in added_cols or not row.get("knowledgeLevel"):
            row["knowledgeLevel"] = str(default_level)
            changed = True
        if changed:
            updated += 1

    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return len(rows), updated


def main() -> int:
    csvs = sorted(CSV_DIR.glob("*.csv"))
    # Skip working/backup files
    csvs = [p for p in csvs if not any(s in p.stem for s in ["_answered", "_final", "_backup"])]

    print(f"=== Updating {len(csvs)} module CSVs with category/level data ===\n")

    total_rows = 0
    total_updated = 0

    for csv_path in csvs:
        rows, updated = update_module(csv_path)
        total_rows += rows
        total_updated += updated
        print(f"  {csv_path.name}: {rows} rows, {updated} updated")

    print(f"\nDone. Updated {total_updated}/{total_rows} rows across {len(csvs)} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
