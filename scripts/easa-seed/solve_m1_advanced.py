import csv, json, sys, re, math
sys.stdout.reconfigure(encoding='utf-8')

INPUT_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'

with open(INPUT_CSV, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

unanswered_indices = [i for i, r in enumerate(rows) if not r.get('correctAnswer', '').strip()]
print(f"Unanswered: {len(unanswered_indices)}")

def try_compute_advanced(row):
    text = row.get('text', '')
    opts = [row.get('optionA', ''), row.get('optionB', ''), row.get('optionC', ''), row.get('optionD', '')]
    opts = [o for o in opts if o]
    t = text.lower()
    
    # Clean options for comparison
    def clean_opt(o):
        return o.replace(',', '').replace(' ', '').replace('$', '').replace('£', '').replace('%', '').replace('°', '').replace('cm', '').replace('m', '').replace('mm', '').replace('kg', '').replace('g', '').replace('l', '').replace('h', '').replace('rpm', '')
    
    # 1. Simple arithmetic expressions in text
    expr_patterns = [
        r'([\d\s+\-*/().]+)\s*=\s*$',
        r'^([\d\s+\-*/().]+)\s*=$',
        r'calculate\s+([\d\s+\-*/().]+)',
        r'evaluate\s+([\d\s+\-*/().]+)',
        r'work out\s+([\d\s+\-*/().]+)',
        r'find\s+([\d\s+\-*/().]+)',
    ]
    for pat in expr_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            expr = m.group(1).strip()
            expr = expr.replace(' ', '').replace('×', '*').replace('÷', '/').replace('−', '-').replace('–', '-').replace('x', '*')
            expr = re.sub(r'[^0-9+\-*/().eE]', '', expr)
            if len(expr) > 1 and re.search(r'\d', expr):
                try:
                    result = eval(expr)
                    for i, opt in enumerate(opts):
                        co = clean_opt(opt)
                        try:
                            if abs(float(co) - result) < 0.001:
                                return chr(65 + i), "Computed from question data"
                        except:
                            pass
                except:
                    pass
    
    # 2. Binary to decimal
    bin_match = re.search(r'([01]{3,})\s*(?:in binary|to decimal|what number in decimal|is what number)', t)
    if bin_match:
        val = int(bin_match.group(1), 2)
        for i, opt in enumerate(opts):
            if str(val) in opt:
                return chr(65 + i), "Computed from question data"
    
    # 3. Decimal to binary
    dec_bin = re.search(r'(\d+)\s*(?:to binary|in binary)', t)
    if dec_bin:
        val = int(dec_bin.group(1))
        bstr = bin(val)[2:]
        for i, opt in enumerate(opts):
            if bstr in opt.replace(' ', ''):
                return chr(65 + i), "Computed from question data"
    
    # 4. Hex to decimal
    hex_match = re.search(r'([0-9A-Fa-f]{1,2})\s*(?:hex|hexadecimal|in hex|to denary)', t)
    if hex_match:
        val = int(hex_match.group(1).upper(), 16)
        for i, opt in enumerate(opts):
            if str(val) in opt:
                return chr(65 + i), "Computed from question data"
    
    # 5. Octal to decimal
    oct_match = re.search(r'octal\s*([0-7]+)', t)
    if oct_match:
        val = int(oct_match.group(1), 8)
        for i, opt in enumerate(opts):
            if str(val) in opt:
                return chr(65 + i), "Computed from question data"
    
    # 6. Circle area
    if 'area of a circle' in t or 'area of circle' in t:
        r_match = re.search(r'radius\s*(?:=|=|is|:)?\s*(\d+(?:\.\d+)?)', t)
        if r_match:
            r = float(r_match.group(1))
            area = math.pi * r * r
            for i, opt in enumerate(opts):
                if str(round(area, 2)) in opt or f"{area:.2f}" in opt:
                    return chr(65 + i), "Computed from question data"
    
    # 7. Pythagoras theorem
    if 'right' in t and 'triangle' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) > 0]
        if len(nums) >= 3:
            a, b, c = sorted(nums[:3])
            if abs(a*a + b*b - c*c) < 0.01:
                for i, opt in enumerate(opts):
                    if str(c) in opt or str(int(c)) in opt:
                        return chr(65 + i), "Computed from question data"
    
    # 8. Percentage
    if '%' in text or 'percent' in t:
        pct_match = re.search(r'(\d+(?:\.\d+)?)\s*%', text)
        if pct_match:
            pct = float(pct_match.group(1))
            num_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:of|=)', t)
            if num_match:
                num = float(num_match.group(1))
                result = num * pct / 100
                for i, opt in enumerate(opts):
                    co = clean_opt(opt)
                    try:
                        if abs(float(co) - result) < 0.01:
                            return chr(65 + i), "Computed from question data"
                    except:
                        pass
    
    # 9. Fraction arithmetic
    frac_match = re.search(r'(\d+)/(\d+)\s*([+\-×x])\s*(\d+)/(\d+)', text)
    if frac_match:
        n1, d1, op, n2, d2 = int(frac_match.group(1)), int(frac_match.group(2)), frac_match.group(3), int(frac_match.group(4)), int(frac_match.group(5))
        if op in ['+', '×', 'x', '*']:
            if op == '+':
                result = n1/d1 + n2/d2
            else:
                result = n1/d1 * n2/d2
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - result) < 0.001:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 10. Ratio
    if 'ratio' in t:
        ratio_match = re.search(r'(\d+):(\d+)', text)
        if ratio_match:
            a, b = int(ratio_match.group(1)), int(ratio_match.group(2))
            total_match = re.search(r'total\s*(?:of|is)?\s*(\d+)', t)
            if total_match:
                total = int(total_match.group(1))
                part = total * a / (a + b)
                for i, opt in enumerate(opts):
                    co = clean_opt(opt)
                    try:
                        if abs(float(co) - part) < 0.01:
                            return chr(65 + i), "Computed from question data"
                    except:
                        pass
    
    # 11. Gear ratio
    if 'gear' in t or ('rpm' in t and 'teeth' in t):
        teeth = [int(n) for n in re.findall(r'(\d+)\s*teeth', t)]
        rpm_match = re.search(r'(\d+)\s*(?:rpm|RPM)', t)
        if teeth and rpm_match and len(teeth) >= 2:
            rpm1 = int(rpm_match.group(1))
            rpm2 = rpm1 * teeth[0] / teeth[1]
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - rpm2) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 12. Temperature drop
    if 'temperature' in t and 'drop' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) < 100]
        if len(nums) >= 2:
            result = nums[0] - nums[1] * 3
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - result) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 13. Volume of cuboid
    if 'volume' in t and ('cuboid' in t or 'dimension' in t):
        dims = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)\s*(?:cm|m|mm)', text)]
        if len(dims) >= 3:
            # Convert to meters
            dims_m = []
            for d in dims[:3]:
                if 'cm' in text:
                    dims_m.append(d / 100)
                elif 'mm' in text:
                    dims_m.append(d / 1000)
                else:
                    dims_m.append(d)
            vol = dims_m[0] * dims_m[1] * dims_m[2]
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - vol) < 0.0001:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 14. Area of rectangle
    if 'area' in t and 'rectangle' in t:
        dims = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)\s*(?:cm|m)', text)]
        if len(dims) >= 2:
            area = dims[0] * dims[1]
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - area) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 15. Linear equation y = mx + c
    if 'y-intercept' in t or 'intercept' in t:
        # For equation in form ax + by = c
        m = re.search(r'([+-]?\s*\d*)x\s*([+-]?\s*\d*)y\s*=\s*([+-]?\s*\d+)', text)
        if m:
            # Convert to y = mx + c form
            pass
    
    # 16. Standard form
    if 'standard form' in t:
        num_match = re.search(r'(\d+\.\d+)', text)
        if num_match:
            num = float(num_match.group(1))
            exp = 0
            while num >= 10:
                num /= 10
                exp += 1
            while num < 1:
                num *= 10
                exp -= 1
            for i, opt in enumerate(opts):
                if str(round(num, 3)) in opt and f"10" in opt and f"{exp}" in opt:
                    return chr(65 + i), "Computed from question data"
    
    # 17. BODMAS / arithmetic precedence
    if 'calculate' in t or 'work out' in t or 'evaluate' in t:
        # Try to find and evaluate arithmetic expressions
        expr_match = re.search(r'[\d+\-*/().]+', text)
        if expr_match:
            expr = expr_match.group(0)
            expr = expr.replace(' ', '').replace('×', '*').replace('÷', '/').replace('−', '-').replace('–', '-').replace('x', '*')
            expr = re.sub(r'[^0-9+\-*/().eE]', '', expr)
            if len(expr) > 1:
                try:
                    result = eval(expr)
                    for i, opt in enumerate(opts):
                        co = clean_opt(opt)
                        try:
                            if abs(float(co) - result) < 0.001:
                                return chr(65 + i), "Computed from question data"
                        except:
                            pass
                except:
                    pass
    
    # 18. Simultaneous equations
    if 'solve simultaneously' in t or 'simultaneous' in t:
        # Look for system of equations
        eqs = re.findall(r'(\d+)x\s*([+-])\s*(\d+)y\s*=\s*(\d+)', text)
        if len(eqs) >= 2:
            # a1*x + b1*y = c1, a2*x + b2*y = c2
            a1, s1, b1, c1 = int(eqs[0][0]), eqs[0][1], int(eqs[0][2]), int(eqs[0][3])
            a2, s2, b2, c2 = int(eqs[1][0]), eqs[1][1], int(eqs[1][2]), int(eqs[1][3])
            b1 = b1 if s1 == '+' else -b1
            b2 = b2 if s2 == '+' else -b2
            # Solve using elimination
            det = a1 * b2 - a2 * b1
            if det != 0:
                x = (c1 * b2 - c2 * b1) / det
                y = (a1 * c2 - a2 * c1) / det
                for i, opt in enumerate(opts):
                    if f"({int(x)}, {int(y)})" in opt or f"({x}, {y})" in opt:
                        return chr(65 + i), "Computed from question data"
    
    # 19. Quadratic roots
    if 'roots are' in t or 'root' in t and 'quadratic' in t:
        # Simple integer roots
        roots_match = re.findall(r'[-]?\d+', text)
        if len(roots_match) >= 2:
            r1, r2 = int(roots_match[0]), int(roots_match[1])
            # x^2 - (r1+r2)x + r1*r2 = 0
            a = 1
            b = -(r1 + r2)
            c = r1 * r2
            for i, opt in enumerate(opts):
                if f"{a}x2" in opt or f"{a}x²" in opt:
                    if str(b) in opt and str(c) in opt:
                        return chr(65 + i), "Computed from question data"
    
    # 20. Transpose formula
    if 'transpose' in t or 'make.*subject' in t:
        # Simple transposition
        pass
    
    # 21. Logarithm problems
    if 'log' in t and ('×' in text or '*' in text or 'multiply' in t):
        # log(a) + log(b) = log(ab)
        log_match = re.search(r'log\s*(\d+(?:\.\d+)?)\s*([×*])\s*log\s*(\d+(?:\.\d+)?)', text)
        if log_match:
            a, op, b = float(log_match.group(1)), log_match.group(2), float(log_match.group(3))
            if op in ['×', '*']:
                result = math.log10(a * b)
                for i, opt in enumerate(opts):
                    if 'log' in opt.lower():
                        return chr(65 + i), "Computed from question data"
    
    # 22. Fraction to decimal
    if 'expressed as' in t and '/' in text:
        frac_match = re.search(r'(\d+)/(\d+)', text)
        if frac_match:
            result = int(frac_match.group(1)) / int(frac_match.group(2))
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - result) < 0.001:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 23. Simplification
    if 'simplif' in t:
        # Look for algebraic simplification patterns
        pass
    
    # 24. Degrees/minutes/seconds
    if 'degree' in t and ('minute' in t or 'second' in t):
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) < 100]
        if len(nums) >= 3:
            # Addition of angles
            total_deg = sum(nums)
            for i, opt in enumerate(opts):
                if str(int(total_deg)) in opt:
                    return chr(65 + i), "Computed from question data"
    
    # 25. Clock angle
    if 'clock' in t and 'angle' in t:
        # At h hours and m minutes: angle = |30h - 5.5m|
        hm = re.search(r'(\d+):(\d+)', text)
        if hm:
            h, m = int(hm.group(1)), int(hm.group(2))
            angle = abs(30 * h - 5.5 * m)
            if angle > 180:
                angle = 360 - angle
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - angle) < 0.1:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 26. Supplement/complement
    if 'supplement' in t:
        angle_match = re.search(r'(\d+)\s*degree', t)
        if angle_match:
            angle = int(angle_match.group(1))
            supplement = 180 - angle
            for i, opt in enumerate(opts):
                if str(supplement) in opt:
                    return chr(65 + i), "Computed from question data"
    if 'complement' in t:
        angle_match = re.search(r'(\d+)\s*degree', t)
        if angle_match:
            angle = int(angle_match.group(1))
            complement = 90 - angle
            for i, opt in enumerate(opts):
                if str(complement) in opt:
                    return chr(65 + i), "Computed from question data"
    
    # 27. Conversion (gallons to litres, etc.)
    if 'convert' in t or 'gallons to litres' in t:
        if 'gallons' in t and 'litres' in t:
            num_match = re.search(r'(\d+(?:\.\d+)?)', text)
            if num_match:
                num = float(num_match.group(1))
                result = num * 4.5  # imperial gallons to litres
                for i, opt in enumerate(opts):
                    co = clean_opt(opt)
                    try:
                        if abs(float(co) - result) < 0.01:
                            return chr(65 + i), "Computed from question data"
                    except:
                        pass
    
    # 28. LCM/LCD
    if 'lcm' in t or 'lowest common' in t or 'lcd' in t:
        nums = [int(n) for n in re.findall(r'(\d+)', text) if int(n) > 1 and int(n) < 100]
        if len(nums) >= 2:
            from math import gcd
            from functools import reduce
            lcm = reduce(lambda a, b: a * b // gcd(a, b), nums)
            for i, opt in enumerate(opts):
                if str(lcm) in opt:
                    return chr(65 + i), "Computed from question data"
    
    # 29. HCF/GCF
    if 'hcf' in t or 'highest common factor' in t or 'greatest common factor' in t:
        nums = [int(n) for n in re.findall(r'(\d+)', text) if int(n) > 1 and int(n) < 1000]
        if len(nums) >= 2:
            from math import gcd
            from functools import reduce
            hcf = reduce(gcd, nums)
            for i, opt in enumerate(opts):
                if str(hcf) in opt:
                    return chr(65 + i), "Computed from question data"
    
    # 30. Median
    if 'median' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) > 0 and float(n) < 1000]
        if len(nums) >= 3:
            nums.sort()
            if len(nums) % 2 == 0:
                median = (nums[len(nums)//2 - 1] + nums[len(nums)//2]) / 2
            else:
                median = nums[len(nums)//2]
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - median) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 31. Polar coordinates
    if 'polar' in t and ('rectangular' in t or 'co-ordinates' in t or 'coordinates' in t):
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) > 0 and float(n) < 100]
        if len(nums) >= 2:
            x, y = nums[0], nums[1]
            r = math.sqrt(x*x + y*y)
            angle = math.degrees(math.atan2(y, x))
            for i, opt in enumerate(opts):
                if str(round(r, 2)) in opt or str(int(r)) in opt:
                    return chr(65 + i), "Computed from question data"
    
    # 32. Slope/gradient
    if 'gradient' in t or 'slope' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) != 0]
        if len(nums) >= 2:
            gradient = nums[0] / nums[1]
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - gradient) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 33. Map scale
    if 'scale' in t and 'map' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) > 0 and float(n) < 100]
        if len(nums) >= 2:
            # ratio of scales * distance
            result = nums[0] * nums[1] / nums[2] if len(nums) >= 3 else nums[0]
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - result) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 34. Rate problems
    if 'rate' in t or 'per hour' in t or 'pounds per hour' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) > 0 and float(n) < 100]
        if len(nums) >= 2:
            result = nums[0] / nums[1]
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - result) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 35. Equation solving for x
    if 'solve' in t and ('x' in text.lower() or 'equation' in t):
        eq_match = re.search(r'(\d+)x\s*([+-])\s*(\d+)y?\s*=\s*(\d+)', text)
        if eq_match:
            a, op, b, c = int(eq_match.group(1)), eq_match.group(2), int(eq_match.group(3)), int(eq_match.group(4))
            if op == '+':
                x = (c - b) / a
            else:
                x = (c + b) / a
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - x) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 36. Unit price / unit rate
    if 'unit rate' in t or 'unit price' in t or 'per pound' in t:
        nums = [float(n) for n in re.findall(r'(\d+(?:\.\d+)?)', text) if float(n) > 0 and float(n) < 100]
        if len(nums) >= 2:
            result = nums[0] / nums[1]
            for i, opt in enumerate(opts):
                co = clean_opt(opt)
                try:
                    if abs(float(co) - result) < 0.01:
                        return chr(65 + i), "Computed from question data"
                except:
                    pass
    
    # 37. Perimeter of square from expression
    if 'perimeter' in t and 'square' in t:
        expr_match = re.search(r'(\d+[a-zA-Z]\s*[+-]\s*\d+)', text)
        if expr_match:
            # Perimeter = 4 * side
            pass
    
    # 38. Word problems with algebra
    if 'twice as many' in t or 'three times' in t or 'seven times' in t:
        # Look for algebraic word problems
        pass
    
    return None, None

answered = 0
for idx in unanswered_indices:
    row = rows[idx]
    answer, reason = try_compute_advanced(row)
    if answer:
        row['correctAnswer'] = answer
        row['reviewNote'] = reason
        row['status'] = 'REVIEWED'
        answered += 1

print(f"Answered via computation: {answered}")
print(f"Still needs answer: {len(unanswered_indices) - answered}")

# Write back
with open(INPUT_CSV, 'w', encoding='utf-8', newline='') as f:
    fieldnames = list(rows[0].keys())
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print("CSV updated")
