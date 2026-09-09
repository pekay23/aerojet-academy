#!/usr/bin/env python3
"""
Comprehensive EASA question answering script.
Uses: PDF extraction, computation, corpus search, keyword matching.
"""
import sys
import io
import csv
import json
import re
import os
import math
import traceback
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import pdfplumber
except ImportError:
    print("pdfplumber not available")
    pdfplumber = None

# Paths
M1_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M1.csv'
M3_CSV = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv'
M1_PDF = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 1 - Mathematics\suntech\M01-Training-book.pdf'
M3_PDF = r'C:\Users\Pekay\OneDrive - Ghana Communication Technology University\AerojetAviation\Module 3 - Electrical Fundamentals\suntech\M03-Training-book.pdf'
M1_CORPUS = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M1.jsonl'
M3_CORPUS = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M3.jsonl'

class PDFSearcher:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.pages = []
        self.full_text = ""
        self.loaded = False
    
    def load(self):
        if self.loaded or not pdfplumber or not os.path.exists(self.pdf_path):
            return
        print(f"Loading PDF: {self.pdf_path}")
        with pdfplumber.open(self.pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    self.pages.append({"page": i+1, "text": text})
                    self.full_text += text + "\n\n"
        self.loaded = True
        print(f"  Loaded {len(self.pages)} pages")
    
    def search(self, query, max_results=5):
        """Search PDF for query, return matching page texts."""
        if not self.loaded:
            return []
        
        query_lower = query.lower()
        terms = self._extract_terms(query_lower)
        
        results = []
        for p in self.pages:
            page_lower = p["text"].lower()
            score = sum(1 for t in terms if t in page_lower)
            if score > 0:
                results.append((score, p["page"], p["text"]))
        
        results.sort(key=lambda x: -x[0])
        return [(r[1], r[2]) for r in results[:max_results]]
    
    def find_nearby_answer(self, question_text, options, context_chars=500):
        """Try to find question and answer nearby in PDF."""
        if not self.loaded:
            return None
        
        q_lower = question_text.lower()
        terms = self._extract_terms(q_lower)
        
        best_page = None
        best_score = 0
        
        for p in self.pages:
            page_lower = p["text"].lower()
            score = sum(1 for t in terms if t in page_lower)
            if score > best_score:
                best_score = score
                best_page = p
        
        if not best_page or best_score < 2:
            return None
        
        page_text = best_page["text"]
        page_lower = page_text.lower()
        
        # Check each option
        for opt_key in ['A', 'B', 'C', 'D']:
            opt_text = str(options.get(f'option{opt_key}', '')).strip()
            if not opt_text:
                continue
            opt_lower = opt_text.lower()
            
            # Look for option text on this page
            if opt_lower in page_lower:
                # Check proximity to question terms
                opt_pos = page_lower.find(opt_lower)
                context_start = max(0, opt_pos - context_chars)
                context_end = min(len(page_text), opt_pos + len(opt_text) + context_chars)
                context = page_text[context_start:context_end].lower()
                
                # Count question terms in context
                q_terms_in_context = sum(1 for t in terms if t in context)
                if q_terms_in_context >= 2:
                    return opt_key
        
        return None
    
    def _extract_terms(self, text):
        """Extract meaningful search terms."""
        words = re.findall(r'[a-zA-Z]{3,}', text)
        stopwords = {
            'what', 'which', 'when', 'where', 'who', 'how', 'why', 'the', 'and', 'for',
            'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our',
            'out', 'has', 'have', 'been', 'from', 'this', 'that', 'with', 'they', 'will',
            'each', 'about', 'would', 'there', 'their', 'into', 'than', 'them', 'some',
            'could', 'other', 'more', 'very', 'just', 'because', 'through', 'before',
            'between', 'being', 'both', 'same', 'after', 'under', 'over', 'again',
            'further', 'once', 'here', 'also', 'than', 'too', 'only', 'such', 'any',
            'most', 'few', 'many', 'much', 'well', 'even', 'back', 'still', 'then',
            'than', 'these', 'those', 'does', 'doing', 'done', 'make', 'made', 'like',
            'using', 'used', 'use', 'known', 'call', 'called', 'name', 'term', 'terms',
            'value', 'values', 'given', 'find', 'calculate', 'compute', 'solve', 'determine',
            'following', 'statement', 'correct', 'true', 'false', 'answer', 'question'
        }
        return [w for w in words if w not in stopwords and len(w) > 3]


class CorpusSearcher:
    def __init__(self, corpus_path):
        self.corpus_path = corpus_path
        self.entries = []
        self.loaded = False
    
    def load(self):
        if self.loaded or not os.path.exists(self.corpus_path):
            return
        print(f"Loading corpus: {self.corpus_path}")
        with open(self.corpus_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    obj = json.loads(line.strip())
                    text = str(obj.get('text', '') or obj.get('content', '') or obj.get('passage', '') or '')
                    if text:
                        self.entries.append(text)
                except:
                    continue
        self.loaded = True
        print(f"  Loaded {len(self.entries)} entries")
    
    def search(self, query, max_results=5):
        """Search corpus for relevant passages."""
        if not self.loaded:
            return []
        
        q_lower = query.lower()
        terms = PDFSearcher._extract_terms(None, q_lower)
        
        results = []
        for entry in self.entries:
            entry_lower = entry.lower()
            score = sum(1 for t in terms if t in entry_lower)
            if score > 0:
                results.append((score, entry))
        
        results.sort(key=lambda x: -x[0])
        return [r[1] for r in results[:max_results]]


class MathSolver:
    """Solve math/physics problems from question text."""
    
    @staticmethod
    def solve(question_text, options):
        q = question_text.lower()
        
        # === ARITHMETIC SEQUENCES ===
        m = re.search(r'arithmetic\s+sequence.*?first\s+term\s+(?:is\s+)?(\d+).*?common\s+difference\s+(?:is\s+)?(\d+).*?(\d+)(?:th|st|nd|rd)\s+term', q)
        if m:
            a1, d, n = int(m.group(1)), int(m.group(2)), int(m.group(3))
            result = a1 + (n-1) * d
            return MathSolver._match_option(result, options)
        
        # === GEOMETRIC SEQUENCES ===
        m = re.search(r'geometric\s+sequence.*?first\s+term\s+(?:is\s+)?(\d+).*?common\s+ratio\s+(?:is\s+)?(\d+).*?(\d+)(?:th|st|nd|rd)\s+term', q)
        if m:
            a1, r, n = float(m.group(1)), float(m.group(2)), int(m.group(3))
            result = a1 * (r ** (n-1))
            return MathSolver._match_option(result, options)
        
        # === OHM'S LAW ===
        ans = MathSolver._ohms_law(q, options)
        if ans:
            return ans
        
        # === POWER ===
        ans = MathSolver._power(q, options)
        if ans:
            return ans
        
        # === RESISTANCE ===
        ans = MathSolver._resistance(q, options)
        if ans:
            return ans
        
        # === CAPACITANCE ===
        ans = MathSolver._capacitance(q, options)
        if ans:
            return ans
        
        # === INDUCTANCE ===
        ans = MathSolver._inductance(q, options)
        if ans:
            return ans
        
        # === FREQUENCY ===
        ans = MathSolver._frequency(q, options)
        if ans:
            return ans
        
        # === TRANSFORMER ===
        ans = MathSolver._transformer(q, options)
        if ans:
            return ans
        
        # === KIRCHHOFF'S LAWS ===
        ans = MathSolver._kirchhoff(q, options)
        if ans:
            return ans
        
        # === MAGNETISM ===
        ans = MathSolver._magnetism(q, options)
        if ans:
            return ans
        
        # === ELECTRIC FIELD ===
        ans = MathSolver._electric_field(q, options)
        if ans:
            return ans
        
        # === LOGARITHMS ===
        ans = MathSolver._logarithms(q, options)
        if ans:
            return ans
        
        # === ALGEBRA ===
        ans = MathSolver._algebra(q, options)
        if ans:
            return ans
        
        # === TRIGONOMETRY ===
        ans = MathSolver._trigonometry(q, options)
        if ans:
            return ans
        
        # === STATISTICS ===
        ans = MathSolver._statistics(q, options)
        if ans:
            return ans
        
        # === MATRICES ===
        ans = MathSolver._matrices(q, options)
        if ans:
            return ans
        
        # === COMPLEX NUMBERS ===
        ans = MathSolver._complex_numbers(q, options)
        if ans:
            return ans
        
        return None
    
    @staticmethod
    def _ohms_law(q, options):
        if 'ohm' not in q:
            return None
        
        # Extract values with units
        def extract_value(pattern):
            m = re.search(pattern, q)
            if m:
                val = m.group(1).replace(',', '')
                try:
                    return float(val)
                except:
                    return None
            return None
        
        v = extract_value(r'(\d+\.?\d*)\s*(?:v|volts?)')
        i = extract_value(r'(\d+\.?\d*)\s*(?:a|amps?|amperes?)')
        r = extract_value(r'(\d+\.?\d*)\s*(?:ohms?|ω|ohm)')
        
        if v is not None and i is not None and r is None:
            r = v / i
            return MathSolver._match_option(r, options)
        elif v is not None and r is not None and i is None:
            i = v / r
            return MathSolver._match_option(i, options)
        elif i is not None and r is not None and v is None:
            v = i * r
            return MathSolver._match_option(v, options)
        return None
    
    @staticmethod
    def _power(q, options):
        if 'power' not in q:
            return None
        
        def extract_val(pattern):
            m = re.search(pattern, q)
            if m:
                return float(m.group(1).replace(',', ''))
            return None
        
        v = extract_val(r'(\d+\.?\d*)\s*(?:v|volts?)')
        i = extract_val(r'(\d+\.?\d*)\s*(?:a|amps?|amperes?)')
        r = extract_val(r'(\d+\.?\d*)\s*(?:ohms?|ω|ohm)')
        
        if v is not None and i is not None:
            p = v * i
            return MathSolver._match_option(p, options)
        elif i is not None and r is not None:
            p = (i ** 2) * r
            return MathSolver._match_option(p, options)
        elif v is not None and r is not None:
            p = (v ** 2) / r
            return MathSolver._match_option(p, options)
        return None
    
    @staticmethod
    def _resistance(q, options):
        if 'resistivity' in q or ('resistance' in q and ('length' in q or 'area' in q or 'cross-section' in q)):
            rho_m = re.search(r'(\d+\.?\d*)\s*(?:ohm[\-\s]?m|ω\s*m|Ω\s*m|ohm[\-\s]?meter)', q)
            l_m = re.search(r'(?:length|wire\s+length)\s+(?:is\s+)?(\d+\.?\d*)\s*(?:m|meter)', q)
            a_m = re.search(r'(?:area|cross[\-\s]?section(?:al)?\s+area)\s+(?:is\s+)?(\d+\.?\d*)\s*(?:m2|m\^2|mm2|square)', q)
            
            if rho_m and l_m and a_m:
                rho = float(rho_m.group(1))
                l = float(l_m.group(1))
                a = float(a_m.group(1))
                r = rho * l / a
                return MathSolver._match_option(r, options)
        return None
    
    @staticmethod
    def _capacitance(q, options):
        if 'capacitor' in q or 'capacitance' in q:
            c_m = re.search(r'(\d+\.?\d*)\s*(?:μf|uf|nf|pf|f|farads?)', q)
            v_m = re.search(r'(\d+\.?\d*)\s*(?:v|volts?)', q)
            
            if c_m and v_m:
                c = float(c_m.group(1))
                v = float(v_m.group(1))
                q_val = c * v
                return MathSolver._match_option(q_val, options)
            
            # Q = CV, find C
            q_m = re.search(r'charge\s+(?:is\s+)?(\d+\.?\d*)\s*(?:c|coulombs?)', q)
            if q_m and v_m:
                q_val = float(q_m.group(1))
                v = float(v_m.group(1))
                c = q_val / v
                return MathSolver._match_option(c, options)
        return None
    
    @staticmethod
    def _inductance(q, options):
        if 'inductor' in q or 'inductance' in q:
            v_m = re.search(r'(\d+\.?\d*)\s*(?:v|volts?)', q)
            di_m = re.search(r'(\d+\.?\d*)\s*(?:a/s|amps?\s+per\s+sec|amperes?\s+per\s+sec)', q)
            
            if v_m and di_m:
                l = float(v_m.group(1)) / float(di_m.group(1))
                return MathSolver._match_option(l, options)
        return None
    
    @staticmethod
    def _frequency(q, options):
        if 'frequency' in q or 'hertz' in q or ('period' in q and 'frequency' in q):
            t_m = re.search(r'period\s+(?:is\s+)?(\d+\.?\d*)\s*(?:ms|milliseconds?|s|seconds?|μs|microseconds?)', q)
            if t_m:
                t = float(t_m.group(1))
                if 'ms' in q[t_m.start():t_m.end()+5]:
                    t = t / 1000
                elif 'μs' in q[t_m.start():t_m.end()+5] or 'micro' in q[t_m.start():t_m.end()+10]:
                    t = t / 1_000_000
                f = 1 / t
                return MathSolver._match_option(f, options)
        return None
    
    @staticmethod
    def _transformer(q, options):
        if 'transformer' in q:
            vp_m = re.search(r'primary\s+(?:voltage\s+(?:is\s+)?|has\s+)(\d+)', q)
            vs_m = re.search(r'secondary\s+(?:voltage\s+(?:is\s+)?|has\s+)(\d+)', q)
            np_m = re.search(r'primary\s+(?:has\s+)?(\d+)\s*(?:turns|windings?)', q)
            ns_m = re.search(r'secondary\s+(?:has\s+)?(\d+)\s*(?:turns|windings?)', q)
            
            if vp_m and np_m and ns_m and not vs_m:
                vp = float(vp_m.group(1))
                np = float(np_m.group(1))
                ns = float(ns_m.group(1))
                vs = vp * ns / np
                return MathSolver._match_option(vs, options)
            elif vs_m and ns_m and np_m and not vp_m:
                vs = float(vs_m.group(1))
                np = float(np_m.group(1))
                ns = float(ns_m.group(1))
                vp = vs * np / ns
                return MathSolver._match_option(vp, options)
        return None
    
    @staticmethod
    def _kirchhoff(q, options):
        if 'kirchhoff' in q or re.search(r'voltage.*loop|loop.*voltage', q):
            # KVL: sum of voltages around loop = 0
            voltages = re.findall(r'(\d+\.?\d*)\s*(?:v|volts?)', q)
            if len(voltages) >= 2:
                total = sum(float(v) for v in voltages)
                return MathSolver._match_option(total, options)
        return None
    
    @staticmethod
    def _magnetism(q, options):
        if 'magnetic' in q or 'flux' in q or 'reluctance' in q:
            # Flux = NI / R (reluctance)
            n_m = re.search(r'(\d+)\s*(?:turns|windings?)', q)
            i_m = re.search(r'(\d+\.?\d*)\s*(?:a|amps?|amperes?)', q)
            r_m = re.search(r'(\d+\.?\d*)\s*(?:at|ampere[\-\s]?turns?|reluctance)', q)
            
            if n_m and i_m and r_m:
                flux = (float(n_m.group(1)) * float(i_m.group(1))) / float(r_m.group(1))
                return MathSolver._match_option(flux, options)
        return None
    
    @staticmethod
    def _electric_field(q, options):
        if 'electric field' in q or re.search(r'electric\s+field', q):
            v_m = re.search(r'(\d+\.?\d*)\s*(?:v|volts?)', q)
            d_m = re.search(r'(\d+\.?\d*)\s*(?:m|mm|cm|meter)', q)
            
            if v_m and d_m:
                v = float(v_m.group(1))
                d = float(d_m.group(1))
                e = v / d
                return MathSolver._match_option(e, options)
        return None
    
    @staticmethod
    def _logarithms(q, options):
        if 'logarithm' in q or 'log\b' in q:
            # log base problems
            log_match = re.search(r'log[_\s]?(\d+)\s*(\d+\.?\d*)', q)
            if log_match:
                base = float(log_match.group(1))
                val = float(log_match.group(2))
                result = math.log(val, base)
                return MathSolver._match_option(result, options)
        return None
    
    @staticmethod
    def _algebra(q, options):
        # Linear equations: solve for x
        eq_match = re.search(r'(?:solve|find)\s+(?:for\s+)?[xX]\s*[:=]\s*(.+)', q)
        if eq_match:
            expr = eq_match.group(1)
            # Simple: ax + b = c
            m = re.match(r'(\d+\.?\d*)\s*[xX]\s*[+\-]\s*(\d+\.?\d*)\s*[=]\s*(\d+\.?\d*)', expr)
            if m:
                a, b, c = float(m.group(1)), float(m.group(2)), float(m.group(3))
                x = (c - b) / a
                return MathSolver._match_option(x, options)
        return None
    
    @staticmethod
    def _trigonometry(q, options):
        if 'sin' in q or 'cos' in q or 'tan' in q or 'trigonometry' in q:
            # Look for angle values
            angle_m = re.search(r'(\d+)\s*(?:degrees?|°)', q)
            if angle_m:
                angle = float(angle_m.group(1))
                rad = math.radians(angle)
                
                if 'sin' in q and 'cos' not in q and 'tan' not in q:
                    result = round(math.sin(rad), 4)
                elif 'cos' in q and 'sin' not in q and 'tan' not in q:
                    result = round(math.cos(rad), 4)
                elif 'tan' in q:
                    result = round(math.tan(rad), 4)
                else:
                    return None
                
                return MathSolver._match_option(result, options)
        return None
    
    @staticmethod
    def _statistics(q, options):
        if 'mean' in q or 'average' in q:
            nums = re.findall(r'(\d+\.?\d*)', q)
            if len(nums) >= 3:
                vals = [float(n) for n in nums[:5]]
                mean = sum(vals) / len(vals)
                return MathSolver._match_option(mean, options)
        
        if 'median' in q:
            nums = re.findall(r'(\d+\.?\d*)', q)
            if len(nums) >= 3:
                vals = sorted([float(n) for n in nums[:5]])
                n = len(vals)
                if n % 2 == 0:
                    median = (vals[n//2 - 1] + vals[n//2]) / 2
                else:
                    median = vals[n//2]
                return MathSolver._match_option(median, options)
        return None
    
    @staticmethod
    def _matrices(q, options):
        if 'matrix' in q or 'determinant' in q:
            # 2x2 determinant
            det_match = re.search(r'determinant\s+(?:of\s+)?.*?(\d+)\s+(\d+)\s+(\d+)\s+(\d+)', q)
            if det_match:
                a, b, c, d = int(det_match.group(1)), int(det_match.group(2)), int(det_match.group(3)), int(det_match.group(4))
                det = a*d - b*c
                return MathSolver._match_option(det, options)
        return None
    
    @staticmethod
    def _complex_numbers(q, options):
        if 'complex' in q or 'imaginary' in q:
            # |z| = sqrt(a^2 + b^2)
            mag_match = re.search(r'\|?(\d+)\s*[+\-]\s*[ij]\s*(\d+)\s*\|?', q)
            if mag_match:
                a, b = int(mag_match.group(1)), int(mag_match.group(2))
                mag = math.sqrt(a**2 + b**2)
                return MathSolver._match_option(mag, options)
        return None
    
    @staticmethod
    def _match_option(value, options):
        """Match a computed value to the closest option."""
        if value is None:
            return None
        
        # Clean value
        try:
            val_clean = float(value)
        except (ValueError, TypeError):
            val_clean = value
        
        best_key = None
        best_diff = float('inf')
        
        for opt_key in ['A', 'B', 'C', 'D']:
            opt_text = str(options.get(f'option{opt_key}', '')).strip()
            if not opt_text:
                continue
            
            # Extract numeric value from option
            nums = re.findall(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', opt_text)
            if nums:
                for num_str in nums:
                    try:
                        opt_val = float(num_str)
                        diff = abs(val_clean - opt_val)
                        if diff < best_diff and diff < 0.001:
                            best_diff = diff
                            best_key = opt_key
                    except:
                        continue
        
        return best_key


def answer_question(row, pdf_searcher, corpus_searcher):
    """Try all strategies to answer a single question."""
    q = row.get('text', '')
    options = {
        'A': row.get('optionA', ''),
        'B': row.get('optionB', ''),
        'C': row.get('optionC', ''),
        'D': row.get('optionD', ''),
    }
    
    # Filter out empty options
    options = {k: v for k, v in options.items() if v and str(v).strip()}
    
    if not options:
        return None, None
    
    # Strategy 1: Computation (math/physics)
    ans = MathSolver.solve(q, options)
    if ans:
        return ans, "computed"
    
    # Strategy 2: PDF nearby search
    if pdf_searcher.loaded:
        ans = pdf_searcher.find_nearby_answer(q, options)
        if ans:
            return ans, "pdf_nearby"
    
    # Strategy 3: PDF keyword search + option matching
    if pdf_searcher.loaded:
        pdf_results = pdf_searcher.search(q, max_results=3)
        for page_num, page_text in pdf_results:
            ans = _match_in_text(q, options, page_text)
            if ans:
                return ans, "pdf_keyword"
    
    # Strategy 4: Corpus search
    if corpus_searcher.loaded:
        corpus_results = corpus_searcher.search(q, max_results=3)
        combined = " ".join(corpus_results)
        ans = _match_in_text(q, options, combined)
        if ans:
            return ans, "corpus_match"
    
    # Strategy 5: PDF + Corpus combined
    if pdf_searcher.loaded and corpus_searcher.loaded:
        combined = pdf_searcher.full_text + " " + " ".join(corpus_searcher.search(q, max_results=3))
        ans = _match_in_text(q, options, combined)
        if ans:
            return ans, "pdf_corpus_combined"
    
    return None, None


def _match_in_text(question, options, text):
    """Match options against text, preferring options that appear with question terms."""
    text_lower = text.lower()
    q_terms = set(re.findall(r'[a-zA-Z]{4,}', question.lower()))
    stopwords = {'what', 'which', 'when', 'where', 'who', 'how', 'why', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'this', 'that', 'with', 'they', 'will', 'each', 'about', 'would', 'there', 'their'}
    q_terms = {t for t in q_terms if t not in stopwords}
    
    best_key = None
    best_score = 0
    
    for opt_key in ['A', 'B', 'C', 'D']:
        opt_text = str(options.get(f'option{opt_key}', '')).strip()
        if not opt_text:
            continue
        
        opt_lower = opt_text.lower()
        
        # Check if option appears in text
        if opt_lower in text_lower:
            # Count question terms near the option
            opt_pos = text_lower.find(opt_lower)
            window_start = max(0, opt_pos - 300)
            window_end = min(len(text_lower), opt_pos + len(opt_lower) + 300)
            window = text_lower[window_start:window_end]
            
            terms_in_window = sum(1 for t in q_terms if t in window)
            
            # Bonus for longer option text (more specific)
            length_bonus = min(len(opt_lower) / 50, 2.0)
            
            score = terms_in_window + length_bonus
            
            if score > best_score:
                best_score = score
                best_key = opt_key
    
    return best_key if best_score >= 2 else None


def process_csv(csv_path, pdf_path, corpus_path, module_name):
    """Process a single CSV file."""
    print(f"\n{'='*70}")
    print(f"Processing {module_name}")
    print(f"{'='*70}")
    
    # Load resources
    pdf_searcher = PDFSearcher(pdf_path)
    pdf_searcher.load()
    
    corpus_searcher = CorpusSearcher(corpus_path)
    corpus_searcher.load()
    
    # Read CSV
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    total = len(rows)
    unanswered = [r for r in rows if not r.get('correctAnswer', '').strip()]
    print(f"Total: {total}, Unanswered: {len(unanswered)}")
    
    answered = 0
    still_unanswered = 0
    
    for idx, row in enumerate(unanswered):
        q_preview = row.get('text', '')[:80].replace('\n', ' ')
        print(f"\n[{idx+1}/{len(unanswered)}] {q_preview}...")
        
        ans, source = answer_question(row, pdf_searcher, corpus_searcher)
        
        if ans:
            row['correctAnswer'] = ans
            row['status'] = 'answered'
            row['reviewNote'] = f"Auto-answered via {source}"
            row['aiSourceRef'] = source
            row['aiConfidence'] = '0.7'
            answered += 1
            print(f"  -> Answer: {ans} ({source})")
        else:
            still_unanswered += 1
            print(f"  -> No answer found")
    
    # Write back
    print(f"\nWriting {csv_path}...")
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n{module_name} Results:")
    print(f"  Answered: {answered}")
    print(f"  Still unanswered: {still_unanswered}")
    
    return answered, still_unanswered


def main():
    print("="*70)
    print("EASA Question Answering - Final Aggressive Pass")
    print("="*70)
    
    m1_ans, m1_left = process_csv(M1_CSV, M1_PDF, M1_CORPUS, "M1")
    m3_ans, m3_left = process_csv(M3_CSV, M3_PDF, M3_CORPUS, "M3")
    
    print(f"\n{'='*70}")
    print(f"FINAL SUMMARY")
    print(f"{'='*70}")
    print(f"M1: Answered {m1_ans}, Still NEEDS_ANSWER: {m1_left}")
    print(f"M3: Answered {m3_ans}, Still NEEDS_ANSWER: {m3_left}")
    print(f"Total answered: {m1_ans + m3_ans}")
    print(f"Total still NEEDS_ANSWER: {m1_left + m3_left}")


if __name__ == '__main__':
    main()
