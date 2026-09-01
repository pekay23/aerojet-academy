import sys
sys.path.insert(0, r"C:\Projects\aerojet-academy\scripts\easa-seed")
from build_lo_catalog import extract_module, RE_PART
import json, re

# Manually trace
from pathlib import Path
corpus_path = Path(r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl")
los = []
seen = set()
with corpus_path.open(encoding="utf-8") as f:
    for line in f:
        rec = json.loads(line)
        print(f"p{rec['page']}, len(los)={len(los)}")
        if rec["page"] > 15 and not los:
            print("  -> skipped")
            continue
        text = rec["text"]
        for m in RE_PART.finditer(text):
            lo_num, sub, letter, desc = m.group(1), m.group(2), m.group(3), m.group(4)
            if letter and len(letter) != 1:
                continue
            lvl_m = re.search(r"Level\s*(\d+)", desc, re.IGNORECASE)
            level = int(lvl_m.group(1)) if lvl_m else None
            desc = re.sub(r"\s*[—\-]\s*Level\s*\d+\s*$", "", desc, flags=re.IGNORECASE).strip()
            desc = re.sub(r"\s{2,}", " ", desc)
            code = f"M1.{lo_num}.{sub}"
            if letter:
                code += f"({letter})"
            if code in seen:
                continue
            seen.add(code)
            if len(desc) < 3 or len(desc) > 200:
                print(f"  SKIP len={len(desc)} code={code!r} desc={desc!r}")
                continue
            los.append({"module": "M1", "code": code, "title": desc, "level": level, "page": rec["page"]})
            print(f"  + {code}: {desc!r} (level={level}) p{rec['page']}")
print(f"total: {len(los)}")
