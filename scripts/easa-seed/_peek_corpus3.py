"""Look at M1 corpus pages - first 30 lines."""
import json
with open(r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i >= 30:
            break
        rec = json.loads(line)
        print(f"p{rec['page']}: {rec['text'][:300].strip()}")
        print()
