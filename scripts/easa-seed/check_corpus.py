#!/usr/bin/env python3
import sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

corpus_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl'
with open(corpus_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'M1 corpus entries: {len(lines)}')
for i, line in enumerate(lines[:5]):
    obj = json.loads(line)
    print(f'--- Entry {i} ---')
    print(json.dumps(obj, indent=2)[:500])
    print()
