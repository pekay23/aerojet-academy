import re
RE_OPT_PAREN = re.compile(r"^\s*([A-Da-d])\)\s*(.+?)\s*\*?\s*$")
RE_OPT_PERIOD = re.compile(r"^\s*([A-Da-d])\s*\.\s+(.+?)\s*\*?\s*$")
RE_OPT_DOT_SPACE = re.compile(r"^\s*([A-Da-d])\s+([A-Z].+?)\s*\*?\s*$")
for s in [
    "A) Updated employee schedules",
    "B) Material Safety Data Sheets*",
    "C) Equipment maintenance logs",
    "B) Material Safety Data Sheets *",
]:
    for name, r in [("PAREN", RE_OPT_PAREN), ("PERIOD", RE_OPT_PERIOD), ("DOT_SPACE", RE_OPT_DOT_SPACE)]:
        m = r.match(s)
        if m:
            print(f"{s!r} -> {name}: letter={m.group(1)!r} text={m.group(2)!r}")
