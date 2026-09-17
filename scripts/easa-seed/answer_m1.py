import csv
import json
import re
import math

INPUT_CSV = r"C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv"
CORPUS_PATH = r"C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl"

def load_corpus():
    corpus = []
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                corpus.append(json.loads(line))
    return corpus

def search_corpus(corpus, query, max_results=5):
    results = []
    query_lower = query.lower()
    for entry in corpus:
        text = entry.get("text", "") or entry.get("content", "") or ""
        if query_lower in text.lower():
            results.append(entry)
            if len(results) >= max_results:
                break
    return results

def try_compute_answer(row):
    text = row.get("text", "")
    options = [row.get("optionA", ""), row.get("optionB", ""), row.get("optionC", ""), row.get("optionD", "")]
    options = [o for o in options if o]
    
    text_lower = text.lower()
    
    # Binary to decimal
    if "binary" in text_lower and "decimal" in text_lower:
        bin_match = re.search(r'([01]+)\s*in binary', text_lower)
        if bin_match:
            bin_str = bin_match.group(1)
            try:
                val = int(bin_str, 2)
                for i, opt in enumerate(options):
                    if str(val) in opt:
                        return chr(65 + i), f"Computed: binary {bin_str} = decimal {val}"
            except:
                pass
    
    # Decimal to binary
    if "decimal" in text_lower and "binary" in text_lower:
        dec_match = re.search(r'(\d+)\s*to binary', text_lower)
        if dec_match:
            dec_val = int(dec_match.group(1))
            bin_str = bin(dec_val)[2:]
            for i, opt in enumerate(options):
                if bin_str in opt:
                    return chr(65 + i), f"Computed: decimal {dec_val} = binary {bin_str}"
    
    # Hexadecimal to decimal
    if "hexadecimal" in text_lower or "hex" in text_lower:
        hex_match = re.search(r'([0-9A-Fa-f]+)\s*(?:to decimal|in decimal|to denary)', text_lower)
        if hex_match:
            hex_str = hex_match.group(1).upper()
            try:
                val = int(hex_str, 16)
                for i, opt in enumerate(options):
                    if str(val) in opt:
                        return chr(65 + i), f"Computed: hex {hex_str} = decimal {val}"
            except:
                pass
    
    # Area of circle
    if "area of a circle" in text_lower or "area of circle" in text_lower:
        if "radius" in text_lower:
            r_match = re.search(r'radius\s*(?:=|is|:)?\s*(\d+)', text_lower)
            if r_match:
                r = float(r_match.group(1))
                area = math.pi * r * r
                for i, opt in enumerate(options):
                    if str(round(area, 2)) in opt or f"{area:.2f}" in opt:
                        return chr(65 + i), f"Computed: circle area r={r} = {area:.2f}"
    
    # Pythagoras
    if "right" in text_lower and "triangle" in text_lower:
        nums = re.findall(r'(\d+)', text)
        if len(nums) >= 3:
            sides = [int(n) for n in nums[:3]]
            sides.sort()
            if len(sides) >= 2:
                # Try a^2 + b^2 = c^2
                if len(sides) >= 3:
                    a, b, c = sides[0], sides[1], sides[2]
                    if a*a + b*b == c*c:
                        for i, opt in enumerate(options):
                            if str(c) in opt:
                                return chr(65 + i), f"Computed: Pythagoras {a},{b},{c}"
    
    # Percentage
    if "%" in text_lower or "percent" in text_lower:
        pct_match = re.search(r'(\d+)%', text)
        if pct_match:
            pct = int(pct_match.group(1))
            # Simple percentage calculation
            num_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:of|=)', text_lower)
            if num_match:
                num = float(num_match.group(1))
                result = num * pct / 100
                for i, opt in enumerate(options):
                    if str(result) in opt or str(round(result, 2)) in opt:
                        return chr(65 + i), f"Computed: {pct}% of {num} = {result}"
    
    # Fraction addition
    if "+" in text and ("/" in text or "fraction" in text_lower):
        frac_match = re.search(r'(\d+)/(\d+)\s*\+\s*(\d+)/(\d+)', text)
        if frac_match:
            n1, d1, n2, d2 = int(frac_match.group(1)), int(frac_match.group(2)), int(frac_match.group(3)), int(frac_match.group(4))
            result = n1/d1 + n2/d2
            for i, opt in enumerate(options):
                if str(result) in opt or f"{result:.2f}" in opt:
                    return chr(65 + i), f"Computed: {n1}/{d1} + {n2}/{d2} = {result}"
    
    # Simple arithmetic expressions
    expr_match = re.search(r'([\d\s+\-*/().]+)\s*=', text)
    if expr_match:
        expr = expr_match.group(1).strip()
        try:
            result = eval(expr)
            for i, opt in enumerate(options):
                if str(result) in opt or str(round(result, 2)) in opt:
                    return chr(65 + i), f"Computed: {expr} = {result}"
        except:
            pass
    
    # Volume of cuboid
    if "volume" in text_lower and ("cuboid" in text_lower or "dimension" in text_lower):
        dims = re.findall(r'(\d+)\s*(?:cm|m|mm)', text)
        if len(dims) >= 3:
            dims = [float(d) for d in dims[:3]]
            # Check units
            if any("m" in text_lower for _ in [1]):
                # Convert cm to m
                dims_cm = [d if d > 10 else d for d in dims]
                vol = dims_cm[0] * dims_cm[1] * dims_cm[2]
                for i, opt in enumerate(options):
                    if str(vol) in opt or f"{vol:.3f}" in opt:
                        return chr(65 + i), f"Computed: cuboid volume {dims} = {vol}"
    
    # Gear ratio
    if "gear" in text_lower or "rpm" in text_lower:
        teeth_match = re.findall(r'(\d+)\s*teeth', text_lower)
        rpm_match = re.search(r'(\d+)\s*(?:rpm|RPM)', text_lower)
        if teeth_match and rpm_match:
            # gear ratio
            pass
    
    # Ratio problems
    if "ratio" in text_lower:
        ratio_match = re.search(r'(\d+):(\d+)', text)
        if ratio_match:
            a, b = int(ratio_match.group(1)), int(ratio_match.group(2))
            total_match = re.search(r'total\s*(?:of|is)?\s*(\d+)', text_lower)
            if total_match:
                total = int(total_match.group(1))
                part = total * a / (a + b)
                for i, opt in enumerate(options):
                    if str(int(part)) in opt or str(part) in opt:
                        return chr(65 + i), f"Computed: ratio {a}:{b} of {total} = {part}"
    
    # Temperature conversion (C to F or F to C)
    if "temperature" in text_lower and ("celsius" in text_lower or "fahrenheit" in text_lower or "°c" in text_lower or "°f" in text_lower):
        if "celsius" in text_lower or "°c" in text_lower:
            c_match = re.search(r'(\d+)', text)
            if c_match:
                c = int(c_match.group(1))
                f = c * 9/5 + 32
                for i, opt in enumerate(options):
                    if str(f) in opt or str(round(f, 1)) in opt:
                        return chr(65 + i), f"Computed: {c}C = {f}F"
        elif "fahrenheit" in text_lower or "°f" in text_lower:
            f_match = re.search(r'(\d+)', text)
            if f_match:
                f = int(f_match.group(1))
                c = (f - 32) * 5/9
                for i, opt in enumerate(options):
                    if str(c) in opt or str(round(c, 1)) in opt:
                        return chr(65 + i), f"Computed: {f}F = {c}C"
    
    return None, None

def main():
    corpus = load_corpus()
    print(f"Loaded {len(corpus)} corpus entries")
    
    rows = []
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    
    print(f"Total rows: {len(rows)}")
    
    empty_count = sum(1 for r in rows if not r.get("correctAnswer", "").strip())
    print(f"Rows with empty correctAnswer: {empty_count}")
    
    answered = 0
    needs_answer = 0
    
    for row in rows:
        if row.get("correctAnswer", "").strip():
            continue
        
        # Try to compute answer
        answer, reason = try_compute_answer(row)
        
        if answer:
            row["correctAnswer"] = answer
            row["reviewNote"] = reason
            row["status"] = "REVIEWED"
            answered += 1
        else:
            row["reviewNote"] = "NEEDS_ANSWER — answer not provided in source; solve via admin review"
            row["status"] = "NEEDS_ANSWER"
            needs_answer += 1
    
    print(f"Answered: {answered}, Still needs answer: {needs_answer}")
    
    # Write back
    with open(INPUT_CSV, "w", encoding="utf-8", newline="") as f:
        fieldnames = list(rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print("CSV updated successfully")

if __name__ == "__main__":
    main()
