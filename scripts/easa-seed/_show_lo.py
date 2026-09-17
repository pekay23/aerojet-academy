import json
with open(r"C:\Projects\aerojet-academy\scripts\easa-seed\lo_catalog.json", encoding="utf-8") as f:
    cat = json.load(f)
for m, los in cat.items():
    print(f"== {m} == ({len(los)} LOs)")
    for lo in los[:8]:
        lvl = lo["level"] if lo["level"] is not None else "-"
        print(f"  {lo['code']:14} L{lvl} | {lo['title'][:60]}")
    if len(los) > 8:
        print(f"  ... +{len(los) - 8} more")
