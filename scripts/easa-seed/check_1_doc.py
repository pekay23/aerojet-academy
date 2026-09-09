import re
from pathlib import Path

text = Path(__file__).parent / "doc-text" / "M1" / "1.txt"
text = text.read_text(encoding="utf-8", errors="ignore")

# Search for specific question texts
searches = [
    "If a wheel of radius R revolves",
    "exerted 2 feet from its axis",
    "The formula for calculating the torque",
    "Solve the following",
    "wrench. What will the actual reading",
]

for s in searches:
    if s.lower() in text.lower():
        idx = text.lower().index(s.lower())
        context = text[max(0, idx-50):idx+200]
        print(f"FOUND: {s}")
        print(f"  Context: {context[:200]}")
        print()
    else:
        print(f"NOT FOUND: {s}")
