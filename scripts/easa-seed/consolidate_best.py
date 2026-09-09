"""Consolidate best answers from all processing attempts."""
import csv
from pathlib import Path

ROOT = Path(__file__).parent
CSV_DIR = ROOT / "csvs"
OUT_DIR = ROOT / "csvs_answered"
OUT_DIR.mkdir(exist_ok=True)

MODULES = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M11A", "M13", "M17"]

for mod in MODULES:
    candidates = []
    if (CSV_DIR / f"{mod}.csv").exists():
        candidates.append(("original", CSV_DIR / f"{mod}.csv"))
    if mod == "M1" and (ROOT / "M1_final.csv").exists():
        candidates.append(("m1_final", ROOT / "M1_final.csv"))
    if (OUT_DIR / f"{mod}.csv").exists():
        candidates.append(("processed", OUT_DIR / f"{mod}.csv"))
    
    if not candidates:
        print(f"  SKIP {mod}: no CSV found")
        continue
    
    best_path = None
    best_count = -1
    for name, path in candidates:
        try:
            rows = list(csv.DictReader(open(path, "r", encoding="utf-8")))
            count = sum(1 for r in rows if r.get("correctAnswer", "").strip())
            if count > best_count:
                best_count = count
                best_path = path
        except Exception as e:
            print(f"  Error reading {path}: {e}")
    
    if best_path:
        dest = OUT_DIR / f"{mod}.csv"
        try:
            with open(best_path, "r", encoding="utf-8") as src:
                reader = csv.DictReader(src)
                rows = list(reader)
                fieldnames = list(rows[0].keys()) if rows else []
                with open(dest, "w", encoding="utf-8", newline="") as dst:
                    writer = csv.DictWriter(dst, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(rows)
            print(f"  {mod}: saved from {best_path.name} ({best_count} answers)")
        except Exception as e:
            print(f"  Error saving {mod}: {e}")

print("Done consolidating.")
