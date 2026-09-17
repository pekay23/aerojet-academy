import json
import re

RE_PART = re.compile(r"^\s*(\d+)\.(\d+)(?:\(([a-z])\))?\s+(.+)$", re.IGNORECASE | re.MULTILINE)

# M1 TOC
with open(r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i > 8:
            break
        rec = json.loads(line)
        print(f"=== p{rec['page']} ===")
        matches = RE_PART.findall(rec["text"])
        for m in matches[:5]:
            print("  match:", m)
        if not matches:
            print("  (no matches)")
        print()
