from pathlib import Path

doc_dir = Path(__file__).parent / "doc-text"
for module_dir in sorted(doc_dir.iterdir()):
    if module_dir.is_dir():
        files = list(module_dir.glob("*.txt"))
        print(f"{module_dir.name}: {len(files)} files")
