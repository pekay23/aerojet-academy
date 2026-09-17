import os

# List doc-text files
files = os.listdir('doc-text/M2')
print("Doc-text files:")
for f in sorted(files):
    size = os.path.getsize(os.path.join('doc-text/M2', f))
    print(f"  {f} ({size} bytes)")

# Count corpus lines
with open('corpus/M2.jsonl', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()
print(f"\nCorpus lines: {len(lines)}")