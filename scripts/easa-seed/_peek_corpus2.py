"""Look at M1 corpus pages - more pages."""
import json
with open(r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl", encoding="utf-8") as f:
    for i, line in enumerate(f):
        rec = json.loads(line)
        # Look for chapter markers
        if "Chapter" in rec["text"][:200] or "Syllabus" in rec["text"][:200] or "Objective" in rec["text"][:200]:
            print(f"=== p{rec['page']} ===")
            print(rec["text"][:600])
            print()
        if i > 200:
            break
