import re
RE_PART = re.compile(r"^\s*(\d+)\.(\d+)(?:\(([a-z])\))?\s+(.+)$", re.IGNORECASE | re.MULTILINE)
text = "1.2(a) Evaluating - Level 2\n1.2(b) Linear - Level 1"
print("findall:", RE_PART.findall(text))
for m in RE_PART.finditer(text):
    print("match:", m.group(1), m.group(2), m.group(3), m.group(4)[:50])
