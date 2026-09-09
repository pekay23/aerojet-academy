import csv, shutil
from pathlib import Path

ROOT = Path(__file__).parent
OUT_DIR = ROOT / "csvs_answered"
OUT_DIR.mkdir(exist_ok=True)

# Best sources per module
best = {
    "M1": ROOT / "csvs" / "M1_final.csv",
    "M2": OUT_DIR / "M2.csv",
    "M3": ROOT / "csvs" / "M3.csv",
    "M4": ROOT / "csvs" / "M4.csv",
    "M5": ROOT / "csvs" / "M5.csv",
    "M6": ROOT / "csvs" / "M6.csv",
    "M7": ROOT / "csvs" / "M7.csv",
    "M11A": ROOT / "csvs" / "M11A.csv",
    "M13": ROOT / "csvs" / "M13.csv",
    "M17": ROOT / "csvs" / "M17.csv",
}

for mod, src in best.items():
    if not src.exists():
        print(f"SKIP {mod}: {src} not found")
        continue
    rows = list(csv.DictReader(open(src, "r", encoding="utf-8")))
    count = sum(1 for r in rows if r.get("correctAnswer", "").strip())
    dest = OUT_DIR / f"{mod}.csv"
    with open(dest, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"{mod}: {count}/{len(rows)} answers from {src.name}")

print("Done.")
