import sys
sys.path.insert(0, r"C:\Projects\aerojet-academy\scripts\easa-seed")
from build_lo_catalog import extract_module
import build_lo_catalog
print("RE_PART:", build_lo_catalog.RE_PART.pattern)
print("RE_PART flags:", build_lo_catalog.RE_PART.flags)
los = extract_module("M1")
print(f"got {len(los)} LOs")
for lo in los[:5]:
    print(lo)
