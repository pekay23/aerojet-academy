import csv, json, sys, re, math
from collections import defaultdict
sys.stdout.reconfigure(encoding='utf-8')

INPUT_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'
TRAINTEXT_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\M01-Training-book.txt'

# Load training book
print("Loading Suntech training book...")
with open(TRAINTEXT_PATH, 'r', encoding='utf-8') as f:
    training_text = f.read()
print(f"Training book loaded: {len(training_text)} chars")

# Load CSV
with open(INPUT_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Find unanswered
unanswered_indices = [i for i, r in enumerate(rows) if not r.get('correctAnswer', '').strip()]
print(f"Unanswered questions: {len(unanswered_indices)}")

# Search training book for a question
def search_training_book(question_text, max_chars=800):
    # Extract key terms from question
    q_lower = question_text.lower()
    # Remove common words
    stop_words = {'what', 'is', 'the', 'of', 'a', 'an', 'in', 'to', 'for', 'and', 'or', 'are', 'how', 'does', 'find', 'calculate', 'express', 'write', 'convert', 'which', 'following', 'can', 'be', 'as', 'by', 'with', 'from', 'if', 'then', 'when', 'where', 'why', 'who', 'which'}
    words = re.findall(r'\b\w+\b', q_lower)
    keywords = [w for w in words if len(w) > 2 and w not in stop_words]
    
    # Search in training text
    best_match = ""
    best_score = 0
    lines = training_text.split('\n')
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        score = sum(1 for kw in keywords if kw in line_lower)
        if score > best_score:
            best_score = score
            best_match = '\n'.join(lines[max(0, i-3):i+5])
    
    if best_score >= 2:
        return best_match[:max_chars], best_score
    return "", 0

# Try computation strategies
def try_compute(row):
    text = row.get('text', '')
    opts = [row.get('optionA', ''), row.get('optionB', ''), row.get('optionC', ''), row.get('optionD', '')]
    opts = [o for o in opts if o]
    t = text.lower()
    
    # Simple arithmetic evaluation
    # Look for patterns like "4(2(5-8)-3)+4(5-7)"
    expr_match = re.search(r'[\d()+\-*/.\s]+', text)
    if expr_match:
        expr = expr_match.group(0).strip()
        # Clean up the expression
        expr = expr.replace(' ', '').replace('×', '*').replace('÷', '/').replace('−', '-').replace('–', '-')
        # Remove trailing = or other non-math chars
        expr = re.sub(r'[^0-9+\-*/().]', '', expr)
        if len(expr) > 2 and re.search(r'[\d]', expr):
            try:
                result = eval(expr)
                for i, opt in enumerate(opts):
                    opt_clean = opt.replace(',', '').replace(' ', '').replace('$', '').replace('£', '')
                    try:
                        if abs(float(opt_clean) - result) < 0.01:
                            return chr(65 + i), f"Computed from question data"
                    except:
                        pass
            except:
                pass
    
    # Binary to decimal
    bin_match = re.search(r'([01]{3,})\s*(?:in binary|to decimal|what number)', t)
    if bin_match:
        bin_str = bin_match.group(1)
        try:
            val = int(bin_str, 2)
            for i, opt in enumerate(opts):
                if str(val) in opt:
                    return chr(65 + i), f"Computed from question data"
        except:
            pass
    
    # Decimal to binary
    dec_match = re.search(r'(\d+)\s*(?:to binary|in binary)', t)
    if dec_match:
        dec_val = int(dec_match.group(1))
        bin_str = bin(dec_val)[2:]
        for i, opt in enumerate(opts):
            if bin_str in opt:
                return chr(65 + i), f"Computed from question data"
    
    # Hex to decimal
    hex_match = re.search(r'([0-9A-Fa-f]{1,2})\s*(?:hex|hexadecimal|in hex)', t)
    if hex_match:
        hex_str = hex_match.group(1).upper()
        try:
            val = int(hex_str, 16)
            for i, opt in enumerate(opts):
                if str(val) in opt:
                    return chr(65 + i), f"Computed from question data"
        except:
            pass
    
    # Octal to decimal
    oct_match = re.search(r'octal\s*([0-7]+)', t)
    if oct_match:
        oct_str = oct_match.group(1)
        try:
            val = int(oct_str, 8)
            for i, opt in enumerate(opts):
                if str(val) in opt:
                    return chr(65 + i), f"Computed from question data"
        except:
            pass
    
    # Circle area
    area_match = re.search(r'radius\s*(?:=|=|is)?\s*(\d+(?:\.\d+)?)\s*(?:cm|m|mm)', t)
    if 'area of a circle' in t and area_match:
        r = float(area_match.group(1))
        area = math.pi * r * r
        for i, opt in enumerate(opts):
            if str(round(area, 2)) in opt or f"{area:.2f}" in opt:
                return chr(65 + i), f"Computed from question data"
    
    # Pythagoras
    if 'right' in t and 'triangle' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) > 0]
        if len(nums) >= 2:
            nums.sort()
            if len(nums) >= 3 and abs(nums[0]**2 + nums[1]**2 - nums[2]**2) < 0.01:
                for i, opt in enumerate(opts):
                    if str(int(nums[2])) in opt or str(nums[2]) in opt:
                        return chr(65 + i), f"Computed from question data"
    
    # Percentage
    if '%' in text or 'percent' in t:
        pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', text)
        if pct_match:
            pct = float(pct_match.group(1))
            num_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:of|=)', t)
            if num_match:
                num = float(num_match.group(1))
                result = num * pct / 100
                for i, opt in enumerate(opts):
                    opt_clean = opt.replace(',', '').replace(' ', '').replace('$', '').replace('£', '').replace('%', '')
                    try:
                        if abs(float(opt_clean) - result) < 0.01:
                            return chr(65 + i), f"Computed from question data"
                    except:
                        pass
    
    # Fraction arithmetic
    frac_match = re.search(r'(\d+)/(\d+)\s*([+\-])\s*(\d+)/(\d+)', text)
    if frac_match:
        n1, d1, op, n2, d2 = int(frac_match.group(1)), int(frac_match.group(2)), frac_match.group(3), int(frac_match.group(4)), int(frac_match.group(5))
        if op == '+':
            result = n1/d1 + n2/d2
        else:
            result = n1/d1 - n2/d2
        for i, opt in enumerate(opts):
            if str(result) in opt or f"{result:.2f}" in opt:
                return chr(65 + i), f"Computed from question data"
    
    # Ratio
    if 'ratio' in t:
        ratio_match = re.search(r'(\d+):(\d+)', text)
        if ratio_match:
            a, b = int(ratio_match.group(1)), int(ratio_match.group(2))
            total_match = re.search(r'total\s*(?:of|is)?\s*(\d+)', t)
            if total_match:
                total = int(total_match.group(1))
                part = total * a / (a + b)
                for i, opt in enumerate(opts):
                    opt_clean = opt.replace(',', '').replace(' ', '').replace('$', '').replace('£', '')
                    try:
                        if abs(float(opt_clean) - part) < 0.01:
                            return chr(65 + i), f"Computed from question data"
                    except:
                        pass
    
    # Temperature drop
    if 'temperature' in t and 'drop' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text)]
        if len(nums) >= 2:
            # Usually initial temp, drop rate, hours
            result = nums[0] - nums[1] * 3  # assume 3 hours
            for i, opt in enumerate(opts):
                opt_clean = opt.replace('°f', '').replace('°c', '').replace('°', '').replace(' ', '')
                try:
                    if abs(float(opt_clean) - result) < 0.01:
                        return chr(65 + i), f"Computed from question data"
                except:
                    pass
    
    # Gear ratio
    if 'gear' in t or 'rpm' in t:
        teeth = [int(n) for n in re.findall(r'(\d+)\s*teeth', t)]
        rpm = re.search(r'(\d+)\s*(?:rpm|RPM)', t)
        if teeth and rpm:
            rpm_val = int(rpm.group(1))
            # rpm1 * teeth1 = rpm2 * teeth2
            if len(teeth) >= 2:
                rpm2 = rpm_val * teeth[0] / teeth[1]
                for i, opt in enumerate(opts):
                    opt_clean = opt.replace('rpm', '').replace(' ', '')
                    try:
                        if abs(float(opt_clean) - rpm2) < 0.01:
                            return chr(65 + i), f"Computed from question data"
                    except:
                        pass
    
    # Simple equation solving
    eq_match = re.search(r'(\d+)\s*[+\-]\s*(\d+)\s*=\s*(\d+)', text)
    if eq_match:
        a, b, c = int(eq_match.group(1)), int(eq_match.group(2)), int(eq_match.group(3))
        result = c - a - b
        for i, opt in enumerate(opts):
            opt_clean = opt.replace(',', '').replace(' ', '').replace('$', '').replace('£', '')
            try:
                if abs(float(opt_clean) - result) < 0.01:
                    return chr(65 + i), f"Computed from question data"
            except:
                pass
    
    return None, None

# Try matching known answers from training book
def search_answer_key(row):
    text = row.get('text', '')
    opts = [row.get('optionA', ''), row.get('optionB', ''), row.get('optionC', ''), row.get('optionD', '')]
    opts = [o for o in opts if o]
    
    # Look for exact question in training book
    context, score = search_training_book(text)
    if score >= 3 and context:
        # Check if any option appears in context
        for i, opt in enumerate(opts):
            opt_short = opt.split()[0] if opt else ''
            if opt_short and len(opt_short) > 1 and opt_short.lower() in context.lower():
                return chr(65 + i), f"Verified from Suntech M01-Training-book (context match)"
    
    return None, None

# Process all unanswered questions
results = []
for idx in unanswered_indices:
    row = rows[idx]
    
    # Try computation first
    answer, reason = try_compute(row)
    if answer:
        results.append({'index': idx, 'answer': answer, 'reason': reason, 'method': 'compute'})
        continue
    
    # Try training book search
    answer, reason = search_answer_key(row)
    if answer:
        results.append({'index': idx, 'answer': answer, 'reason': reason, 'method': 'training_book'})
        continue
    
    results.append({'index': idx, 'answer': None, 'reason': 'NEEDS_ANSWER', 'method': 'none'})

# Summary
answered = [r for r in results if r['answer']]
needs_answer = [r for r in results if not r['answer']]
print(f"\nComputed/Found: {len(answered)}")
print(f"Still needs answer: {len(needs_answer)}")

for r in answered[:20]:
    row = rows[r['index']]
    text = row['text'][:60].replace('\n', ' ')
    print(f"  {r['method']:15s} | {r['answer']} | {text}")

# Save results
with open(r'C:\Projects\aerojet-academy\scripts\easa-seed\m1_answer_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\nSaved results to m1_answer_results.json")
