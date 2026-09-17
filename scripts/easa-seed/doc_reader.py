"""Read old .doc (Word 97-2003 binary) files via olefile + ASCII extraction.

Word stores text in compressed or uncompressed Unicode within the WordDocument
stream. For simple documents (which these team submissions are), the text
appears as readable ASCII runs when extracted naively.
"""
from __future__ import annotations

import re

import olefile


def read_doc(path: str) -> str:
    """Return concatenated readable text from a .doc file."""
    ole = olefile.OleFileIO(path)
    parts: list[str] = []
    for entry in ole.listdir():
        name = entry[-1] if entry else ""
        if name in ("WordDocument", "1Table"):
            try:
                data = ole.openstream(entry).read()
            except Exception:
                continue
            # Concatenate ASCII runs of length >= 3
            runs = re.findall(rb"[\x20-\x7e]{3,}", data)
            parts.append(b"\n".join(runs).decode("ascii", errors="ignore"))
    return "\n".join(parts)
