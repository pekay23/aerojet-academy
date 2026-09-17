import sys
sys.path.insert(0, r"C:\Projects\aerojet-academy\scripts\easa-seed")
from extract_questions import _parse_block_bare

block = """What must employers ensure is available at all times?
A) Updated employee schedules
B) Material Safety Data Sheets*
C) Equipment maintenance logs"""

result = _parse_block_bare(block)
print(result)
