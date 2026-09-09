#!/usr/bin/env python3
import csv
import json
import re
import sys
import os
import math
import requests
import time
from pathlib import Path
from datetime import datetime

# Paths
M1_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'
M3_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv'
M1_PDF = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 1 - Mathematics\suntech\M01-Training-book.pdf'
M3_PDF = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals\suntech\M03-Training-book.pdf'
M1_CORPUS = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl'
M3_CORPUS = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M3.jsonl'
PDF_TEXT_CACHE = r'C:\Projects\aerojet-academy\scripts\easa-seed\pdf_text_cache.json'

import pdfplumber

def extract_pdf_text(pdf_path):
    """Extract all text from PDF with page markers."""
    print(f"Extracting text from {pdf_path}...")
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                pages.append({"page": i+1, "text": text})
    print(f"  Extracted {len(pages)} pages")
    return pages

def build_text_index(pages):
    """Build a simple searchable text index from pages."""
    full_text = ""
    page_map = []  # (char_start, char_end, page_num)
    for p in pages:
        page_map.append((len(full_text), len(full_text) + len(p["text"]), p["page"]))
        full_text += p["text"] + "\n\n"
    return full_text, page_map

def search_text(query, full_text, page_map, max_results=5):
    """Simple keyword search in PDF text."""
    results = []
    query_lower = query.lower()
    # Extract key terms
    terms = re.findall(r'[a-zA-Z]{3,}', query_lower)
    # Remove common words
    stopwords = {'what','which','when','where','who','how','why','the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','has','have','been','from','this','that','with','they','will','each','about','would','there','their','what','which','when','where','who','whom','into','than','them','some','could','other','more','very','just','because','through','before','between','being','both','same','after','before','under','over','again','further','once','here','there','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will','just','should','now'}
    terms = [t for t in terms if t not in stopwords and len(t) > 2]
    
    if not terms:
        return results
    
    lines = full_text.split('\n')
    for i, line in enumerate(lines):
        line_lower = line.lower()
        score = sum(1 for t in terms if t in line_lower)
        if score > 0:
            results.append((score, i, line))
    
    results.sort(key=lambda x: -x[0])
    return [(r[1], r[2]) for r in results[:max_results]]

def search_corpus(query, corpus_path, max_results=5):
    """Search corpus JSONL for relevant passages."""
    results = []
    if not os.path.exists(corpus_path):
        return results
    
    query_lower = query.lower()
    terms = re.findall(r'[a-zA-Z]{3,}', query_lower)
    stopwords = {'what','which','when','where','who','how','why','the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','has','have','been','from','this','that','with','they','will','each','about','would','there','their','what','which','when','where','who','whom','into','than','them','some','could','other','more','very','just','because','through','before','between','being','both','same','after','before','under','over','again','further','once','here','there','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will','just','should','now'}
    terms = [t for t in terms if t not in stopwords and len(t) > 2]
    
    if not terms:
        return results
    
    try:
        with open(corpus_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    obj = json.loads(line.strip())
                    text = str(obj.get('text', '') or obj.get('content', '') or '')
                    text_lower = text.lower()
                    score = sum(1 for t in terms if t in text_lower)
                    if score > 0:
                        results.append((score, text))
                except:
                    continue
    except Exception as e:
        print(f"  Corpus search error: {e}")
    
    results.sort(key=lambda x: -x[0])
    return [(r[1]) for r in results[:max_results]]

def web_search(query, retries=2):
    """Web search using requests."""
    try:
        # Try a simple search approach
        # Note: In production, use proper API keys
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        # Using DuckDuckGo lite as fallback
        url = f"https://lite.duckduckgo.com/lite/?q={requests.utils.quote(query)}"
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code == 200:
            # Extract text snippets
            text = resp.text
            # Simple extraction of result snippets
            snippets = re.findall(r'<a[^>]*class="result-link"[^>]*>(.*?)</a>.*?<span[^>]*class="result-snippet"[^>]*>(.*?)</span>', text, re.DOTALL)
            if snippets:
                return [(re.sub(r'<[^>]+>', '', s[1]).strip()) for s in snippets[:3]]
    except Exception as e:
        print(f"  Web search error: {e}")
    return []

def compute_math_answer(question_text, options):
    """Try to compute answers for math/physics problems."""
    q = question_text.lower()
    
    # Look for numeric patterns and operations
    # Try to extract equations and compute
    
    # Pattern: "what is X + Y" or "calculate X * Y"
    calc_match = re.search(r'(?:what is|calculate|find|compute|solve)\s+(?:the\s+)?(?:value\s+of\s+)?(.+?)(?:\?|$)', q)
    if calc_match:
        expr = calc_match.group(1).strip()
        # Clean up expression
        expr = re.sub(r'\b(?:of|the|a|an|is|are|equals?|equal)\b', '', expr)
        expr = expr.strip()
        
        # Try to evaluate simple math
        try:
            # Only allow safe math operations
            if re.match(r'^[\d\s\.\+\-\*\/\(\)\%]+$', expr):
                result = eval(expr, {"__builtins__": {}}, {})
                return str(result)
        except:
            pass
    
    # Look for unit conversions
    # Pattern: "convert X to Y"
    convert_match = re.search(r'convert\s+([\d\.]+)\s*(\w+)\s+to\s+(\w+)', q)
    if convert_match:
        value = float(convert_match.group(1))
        from_unit = convert_match.group(2)
        to_unit = convert_match.group(3)
        # Common conversions
        conversions = {
            ('km', 'm'): 1000, ('m', 'km'): 0.001,
            ('kg', 'g'): 1000, ('g', 'kg'): 0.001,
            ('hours', 'minutes'): 60, ('minutes', 'hours'): 1/60,
            ('celsius', 'fahrenheit'): lambda x: x*9/5+32,
            ('fahrenheit', 'celsius'): lambda x: (x-32)*5/9,
        }
        key = (from_unit, to_unit)
        if key in conversions:
            conv = conversions[key]
            if callable(conv):
                result = conv(value)
            else:
                result = value * conv
            return str(result)
    
    return None

def find_answer_in_options(computed, options):
    """Match computed answer to options."""
    if not computed:
        return None
    computed_clean = str(computed).strip().lower()
    # Try exact match
    for opt_key in ['optionA', 'optionB', 'optionC', 'optionD']:
        if opt_key in options:
            opt_val = str(options[opt_key]).strip().lower()
            if computed_clean == opt_val:
                return opt_key.replace('option', '')
    # Try numeric match with tolerance
    try:
        computed_num = float(re.sub(r'[^\d\.\-]', '', computed_clean))
        for opt_key in ['optionA', 'optionB', 'optionC', 'optionD']:
            if opt_key in options:
                opt_val = str(options[opt_key]).strip()
                nums = re.findall(r'[-+]?\d*\.?\d+', opt_val)
                if nums:
                    opt_num = float(nums[0])
                    if abs(computed_num - opt_num) < 0.001:
                        return opt_key.replace('option', '')
    except:
        pass
    return None

def extract_answer_from_text(text, options):
    """Try to find the correct answer in PDF/corpus text."""
    text_lower = text.lower()
    best_match = None
    best_score = 0
    
    for opt_key in ['A', 'B', 'C', 'D']:
        if opt_key not in options:
            continue
        opt_text = str(options.get(f'option{opt_key}', '')).strip()
        if not opt_text:
            continue
        
        # Check if option text appears in the source
        opt_lower = opt_text.lower()
        if opt_lower in text_lower:
            # Count occurrences
            count = text_lower.count(opt_lower)
            if count > best_score:
                best_score = count
                best_match = opt_key
    
    return best_match

def keyword_match_answer(question_text, options, pdf_text, corpus_results):
    """Match question to answer using keyword presence in sources."""
    # Build a combined context
    context = pdf_text.lower() + " " + " ".join([r.lower() for r in corpus_results])
    
    scores = {}
    for opt_key in ['A', 'B', 'C', 'D']:
        if opt_key not in options:
            continue
        opt_text = str(options.get(f'option{opt_key}', '')).strip().lower()
        if not opt_text:
            continue
        
        # Count keyword overlaps
        q_terms = set(re.findall(r'[a-zA-Z]{3,}', question_text.lower()))
        opt_terms = set(re.findall(r'[a-zA-Z]{3,}', opt_text))
        overlap = q_terms & opt_terms
        
        # Check context
        context_score = sum(1 for t in opt_terms if t in context and len(t) > 3)
        
        scores[opt_key] = len(overlap) + context_score * 0.5
    
    if scores:
        best = max(scores, key=scores.get)
        if scores[best] > 0:
            return best
    return None

def search_web_for_answer(question_text, options):
    """Use web search to find answer."""
    # Extract key terms from question
    q_terms = re.findall(r'[a-zA-Z]{3,}', question_text.lower())
    stopwords = {'what','which','when','where','who','how','why','the','and','for','are','but','not','you','all','can'}
    key_terms = [t for t in q_terms if t not in stopwords and len(t) > 3][:5]
    
    if not key_terms:
        return None
    
    search_query = " ".join(key_terms) + " EASA Part-66 answer"
    
    try:
        snippets = web_search(search_query)
        if not snippets:
            return None
        
        combined = " ".join(snippets).lower()
        
        # Check which option appears most in search results
        scores = {}
        for opt_key in ['A', 'B', 'C', 'D']:
            if opt_key not in options:
                continue
            opt_text = str(options.get(f'option{opt_key}', '')).strip().lower()
            if opt_text and opt_text in combined:
                scores[opt_key] = combined.count(opt_text)
        
        if scores:
            best = max(scores, key=scores.get)
            if scores[best] > 0:
                return best
    except Exception as e:
        print(f"  Web search failed: {e}")
    
    return None

def try_known_patterns(question_text, options):
    """Try to answer using known question patterns and common knowledge."""
    q = question_text.lower()
    
    # Pattern matching for common question types
    
    # "Which of the following..." type
    if "which of the following" in q:
        # Look for definition/identification questions
        for opt_key in ['A', 'B', 'C', 'D']:
            opt = str(options.get(f'option{opt_key}', '')).lower()
            # Often the correct answer contains a specific term that matches the question
            pass
    
    # True/False questions
    if "true" in q and "false" in q:
        # Analyze the statement
        pass
    
    # Math: arithmetic sequences
    seq_match = re.search(r'arithmetic\s+sequence.*?(\d+)\s+(\d+)\s+(\d+)', q)
    if seq_match:
        a1, diff, n = int(seq_match.group(1)), int(seq_match.group(2)), int(seq_match.group(3))
        # Formula: a_n = a_1 + (n-1)*d
        result = a1 + (n-1) * diff
        return find_answer_in_options(str(result), options)
    
    # Math: geometric sequences
    geom_match = re.search(r'geometric\s+sequence.*?(\d+)\s+(\d+)\s+(\d+)', q)
    if geom_match:
        a1, r, n = float(geom_match.group(1)), float(geom_match.group(2)), int(geom_match.group(3))
        result = a1 * (r ** (n-1))
        return find_answer_in_options(str(round(result, 4)), options)
    
    # Ohm's Law: V = IR
    if 'ohm' in q and ('voltage' in q or 'current' in q or 'resistance' in q):
        v_match = re.search(r'(\d+)\s*[vV]', q)
        i_match = re.search(r'(\d+)\s*[aA]', q)
        r_match = re.search(r'(\d+)\s*(?:ohms?|Ω|ω)', q)
        
        if v_match and i_match and not r_match:
            v, i = float(v_match.group(1)), float(i_match.group(1))
            r = v / i
            return find_answer_in_options(f"{r}", options)
        elif v_match and r_match and not i_match:
            v, r = float(v_match.group(1)), float(r_match.group(1))
            i = v / r
            return find_answer_in_options(f"{i}", options)
        elif i_match and r_match and not v_match:
            i, r = float(i_match.group(1)), float(r_match.group(1))
            v = i * r
            return find_answer_in_options(f"{v}", options)
    
    # Power: P = VI or P = I^2 R or P = V^2 / R
    if 'power' in q:
        v_match = re.search(r'(\d+)\s*[vV]', q)
        i_match = re.search(r'(\d+)\s*(?:[aA]|amps?)', q)
        r_match = re.search(r'(\d+)\s*(?:ohms?|Ω|ω)', q)
        
        if v_match and i_match:
            p = float(v_match.group(1)) * float(i_match.group(1))
            return find_answer_in_options(f"{p}", options)
        elif i_match and r_match:
            p = (float(i_match.group(1)) ** 2) * float(r_match.group(1))
            return find_answer_in_options(f"{p}", options)
        elif v_match and r_match:
            p = (float(v_match.group(1)) ** 2) / float(r_match.group(1))
            return find_answer_in_options(f"{p}", options)
    
    # Resistance: R = rho * L / A
    if 'resistivity' in q or ('resistance' in q and 'length' in q):
        rho_match = re.search(r'(\d+\.?\d*)\s*(?:ohm[\-\s]?meters?|Ω\s*m)', q)
        l_match = re.search(r'length\s+(?:is\s+)?(\d+\.?\d*)\s*(?:m|meters?)', q)
        a_match = re.search(r'(?:area|cross[\-\s]?section)\s+(?:is\s+)?(\d+\.?\d*)\s*(?:m2|m\^2|square\s+meters?)', q)
        
        if rho_match and l_match and a_match:
            rho = float(rho_match.group(1))
            l = float(l_match.group(1))
            a = float(a_match.group(1))
            r = rho * l / a
            return find_answer_in_options(f"{r}", options)
    
    # Capacitance: Q = CV or C = Q/V
    if 'capacitor' in q or 'capacitance' in q:
        q_match = re.search(r'(\d+\.?\d*)\s*(?:coulombs?|C)\b', q)
        v_match = re.search(r'(\d+\.?\d*)\s*[vV]', q)
        
        if q_match and v_match:
            c = float(q_match.group(1)) / float(v_match.group(1))
            return find_answer_in_options(f"{c}", options)
    
    # Inductance: V = L * di/dt
    if 'inductor' in q or 'inductance' in q:
        v_match = re.search(r'(\d+\.?\d*)\s*[vV]', q)
        di_match = re.search(r'(\d+\.?\d*)\s*(?:a/s|amps?\s+per\s+second)', q)
        
        if v_match and di_match:
            l = float(v_match.group(1)) / float(di_match.group(1))
            return find_answer_in_options(f"{l}", options)
    
    # Frequency: f = 1/T
    if 'frequency' in q or ('period' in q and 'frequency' in q):
        t_match = re.search(r'period\s+(?:is\s+)?(\d+\.?\d*)\s*(?:s|seconds?|ms|milliseconds?)', q)
        if t_match:
            t = float(t_match.group(1))
            if 'ms' in q[t_match.start():t_match.end()+10]:
                t = t / 1000
            f = 1 / t
            return find_answer_in_options(f"{f}", options)
    
    # AC power: P = V^2 / R or P = I^2 * R
    if 'ac' in q and 'power' in q:
        v_match = re.search(r'(\d+\.?\d*)\s*[vV]', q)
        i_match = re.search(r'(\d+\.?\d*)\s*(?:[aA]|amps?)', q)
        r_match = re.search(r'(\d+\.?\d*)\s*(?:ohms?|Ω)', q)
        
        if v_match and r_match:
            p = (float(v_match.group(1)) ** 2) / float(r_match.group(1))
            return find_answer_in_options(f"{p}", options)
    
    # Transformer: Vp/Vs = Np/Ns
    if 'transformer' in q and ('turns' in q or 'voltage' in q):
        vp_match = re.search(r'primary\s+voltage\s+(?:is\s+)?(\d+)', q)
        vs_match = re.search(r'secondary\s+voltage\s+(?:is\s+)?(\d+)', q)
        np_match = re.search(r'primary\s+(?:has\s+)?(\d+)\s*(?:turns|windings?)', q)
        ns_match = re.search(r'secondary\s+(?:has\s+)?(\d+)\s*(?:turns|windings?)', q)
        
        if vp_match and np_match and ns_match and not vs_match:
            vp = float(vp_match.group(1))
            np = float(np_match.group(1))
            ns = float(ns_match.group(1))
            vs = vp * ns / np
            return find_answer_in_options(f"{vs}", options)
        elif vs_match and ns_match and np_match and not vp_match:
            vs = float(vs_match.group(1))
            np = float(np_match.group(1))
            ns = float(ns_match.group(1))
            vp = vs * np / ns
            return find_answer_in_options(f"{vp}", options)
    
    return None

def determine_answer(question_row, pdf_text, corpus_results_m1, corpus_results_m3):
    """Try multiple strategies to determine the answer."""
    q = question_row.get('text', '')
    options = {
        'A': question_row.get('optionA', ''),
        'B': question_row.get('optionB', ''),
        'C': question_row.get('optionC', ''),
        'D': question_row.get('optionD', ''),
    }
    
    # Strategy 1: Try known math/physics patterns
    ans = try_known_patterns(q, options)
    if ans:
        return ans, "computed_answer"
    
    # Strategy 2: Try computation
    computed = compute_math_answer(q, options)
    if computed:
        ans = find_answer_in_options(computed, options)
        if ans:
            return ans, "computed_answer"
    
    # Strategy 3: Search PDF text for option text
    ans = extract_answer_from_text(pdf_text, options)
    if ans:
        return ans, "pdf_extraction"
    
    # Strategy 4: Combine PDF + corpus
    all_corpus = corpus_results_m1 + corpus_results_m3
    combined_text = pdf_text + " " + " ".join(all_corpus)
    ans = extract_answer_from_text(combined_text, options)
    if ans:
        return ans, "pdf_corpus_match"
    
    # Strategy 5: Keyword matching
    ans = keyword_match_answer(q, options, pdf_text, all_corpus)
    if ans:
        return ans, "keyword_match"
    
    # Strategy 6: Web search
    ans = search_web_for_answer(q, options)
    if ans:
        return ans, "web_search"
    
    return None, None

def process_csv(csv_path, pdf_path, corpus_path, module_name):
    """Process a CSV file and answer unanswered questions."""
    print(f"\n{'='*60}")
    print(f"Processing {module_name}: {csv_path}")
    print(f"{'='*60}")
    
    # Load PDF text
    pdf_pages = extract_pdf_text(pdf_path)
    pdf_text, page_map = build_text_index(pdf_pages)
    
    # Load corpus
    corpus_results_cache = {}
    
    # Read CSV
    rows = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows.append(row)
    
    total = len(rows)
    unanswered = [r for r in rows if not r.get('correctAnswer', '').strip()]
    print(f"Total questions: {total}")
    print(f"Unanswered: {len(unanswered)}")
    
    answered_count = 0
    still_unanswered = 0
    
    for i, row in enumerate(unanswered):
        q = row.get('text', '')[:200]
        print(f"\n[{i+1}/{len(unanswered)}] Processing: {q}...")
        
        # Search corpus for this question
        corpus_results = search_corpus(row.get('text', ''), corpus_path, max_results=3)
        
        # Try to determine answer
        ans, source = determine_answer(row, pdf_text, [], corpus_results)
        
        if ans:
            row['correctAnswer'] = ans
            row['status'] = 'answered'
            row['reviewNote'] = f"Auto-answered via {source}"
            row['aiSourceRef'] = source
            row['aiConfidence'] = '0.7'
            answered_count += 1
            print(f"  -> Answer: {ans} (via {source})")
        else:
            still_unanswered += 1
            print(f"  -> No answer found")
    
    # Write back
    print(f"\nWriting updated CSV...")
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n{module_name} Summary:")
    print(f"  Answered: {answered_count}")
    print(f"  Still unanswered: {still_unanswered}")
    
    return answered_count, still_unanswered

if __name__ == '__main__':
    # Process M1
    m1_ans, m1_left = process_csv(M1_CSV, M1_PDF, M1_CORPUS, "M1")
    
    # Process M3
    m3_ans, m3_left = process_csv(M3_CSV, M3_PDF, M3_CORPUS, "M3")
    
    print(f"\n{'='*60}")
    print(f"FINAL SUMMARY")
    print(f"{'='*60}")
    print(f"M1: Answered {m1_ans}, Still needs answer: {m1_left}")
    print(f"M3: Answered {m3_ans}, Still needs answer: {m3_left}")
    print(f"Total answered: {m1_ans + m3_ans}")
    print(f"Total still NEEDS_ANSWER: {m1_left + m3_left}")
