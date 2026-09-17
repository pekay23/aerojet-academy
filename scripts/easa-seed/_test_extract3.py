import sys
sys.path.insert(0, r"C:\Projects\aerojet-academy\scripts\easa-seed")
import re, json
from pathlib import Path

RE_PART = re.compile(r"^\s*(\d+)\.(\d+)(?:\(([a-z])\))?\s+(.+)$", re.IGNORECASE | re.MULTILINE)

corpus_path = Path(r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl")
los = []
seen = set()
with corpus_path.open(encoding="utf-8") as f:
    for line in f:
        rec = json.loads(line)
        if rec["page"] > 15 and not los:
            continue
        text = rec["text"]
        for m in RE_PART.finditer(text):
            lo_num, sub, letter, desc = m.group(1), m.group(2), m.group(3), m.group(4)
            if letter and len(letter) != 1:
                continue
            lvl_m = re.search(r"Level\s*(\d+)", desc, re.IGNORECASE)
            level = int(lvl_m.group(1)) if lvl_m else None
            desc2 = re.sub(r"\s*[—\-]\s*Level\s*\d+\s*$", "", desc, flags=re.IGNORECASE).strip()
            desc2 = re.sub(r"\s{2,}", " ", desc2)
            code = f"M1.{lo_num}.{sub}"
            if letter:
                code += f"({letter})"
            if code in seen:
                continue
            seen.add(code)
            print(f"  TRY: code={code!r} desc={desc2!r} (len={len(desc2)}, lvl={level})")
            if len(desc2) < 3 or len(desc2) > 200:
                print(f"    SKIP")
                continue
            los.append({"code": code, "title": desc2, "level": level, "page": rec["page"]})
print(f"total: {len(los)}")
