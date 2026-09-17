"""Peek HTML text."""
import sys
from bs4 import BeautifulSoup

path = sys.argv[1]
with open(path, "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), "lxml")
text = soup.get_text(separator="\n", strip=True)
sys.stdout.reconfigure(encoding="utf-8")
print(text[:5000])
