"""Look at M1 corpus pages."""
import json
with open(r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i > 8:
            break
        rec = json.loads(line)
        print(f"=== {rec['source']} p{rec['page']} ===")
        print(rec["text"][:800])
        print()
