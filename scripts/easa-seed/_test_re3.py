import re
import json
RE_PART = re.compile(r"^\s*(\d+)\.(\d+)(?:\(([a-z])\))?\s+(.+)$", re.IGNORECASE | re.MULTILINE)
with open(r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i > 6:
            break
        rec = json.loads(line)
        matches = list(RE_PART.finditer(rec["text"]))
        print(f"p{rec['page']}: {len(matches)} matches")
        for m in matches[:2]:
            print(f"  {m.group(1)}.{m.group(2)}({m.group(3)}) = {m.group(4)[:50]!r}")
