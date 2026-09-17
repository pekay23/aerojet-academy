"""Extract TOC pages of M1 training book."""
import json
with open(r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl", encoding="utf-8") as f:
    for line in f:
        rec = json.loads(line)
        if 5 <= rec["page"] <= 12:
            print(f"=== p{rec['page']} ===")
            print(rec["text"])
            print()
