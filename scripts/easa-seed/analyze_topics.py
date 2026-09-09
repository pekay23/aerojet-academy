import sys
sys.stdout.reconfigure(encoding='utf-8')
import json, re, csv, math

# ============================================================
# Load data
# ============================================================

# Load CSV
csv_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M3.csv'
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    csv_rows = list(reader)

unanswered = [r for r in csv_rows if not r.get('correctAnswer','').strip()]

# Load PDF questions
pdf_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\onedrive_261722955-Module-3_v2.txt'
with open(pdf_path, 'r', encoding='utf-8') as f:
    pdf_text = f.read()

# Parse PDF questions
lines = pdf_text.split('\n')
pdf_questions = {}
current_num = None
current_q = {}

for line in lines:
    line = line.strip()
    q_match = re.match(r'^(\d+)\.\s+(.+)', line)
    if q_match:
        if current_num is not None and 'a' in current_q and 'b' in current_q and 'c' in current_q:
            pdf_questions[current_num] = current_q.copy()
        current_num = int(q_match.group(1))
        current_q = {'text': q_match.group(2)}
    elif current_num is not None:
        opt_match = re.match(r'^([abc])\)\s+(.+)', line)
        if opt_match:
            current_q[opt_match.group(1)] = opt_match.group(2)

if current_num is not None and 'a' in current_q and 'b' in current_q and 'c' in current_q:
    pdf_questions[current_num] = current_q.copy()

print(f"Parsed {len(pdf_questions)} PDF questions")

# Load Suntech corpus
corpus_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\corpus\M3.jsonl'
corpus_entries = []
with open(corpus_path, 'r', encoding='utf-8') as f:
    for line in f:
        entry = json.loads(line.strip())
        corpus_entries.append(entry)
corpus_text = ' '.join(e.get('text', '') for e in corpus_entries)

# Load EAS A book answers
easa_path = r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M3\easa_book_full.txt'
with open(easa_path, 'r', encoding='utf-8') as f:
    easa_text = f.read()

# ============================================================
# Build knowledge base from corpus - extract relevant concepts
# ============================================================

# Search for key concept explanations in the corpus
concepts = {
    'time_constant': r'time constant.*?(\d\.\d+)',
    'ohm_law': r'Ohms Law.*?V\s*=\s*I.*?R',
    'power_formula': r'power.*?(V\s*\*\s*I|I\s*\*\s*V|I.*R|P\s*=\s*E.*I)',
    'transformer': r'transformer.*?turns ratio.*?voltage ratio',
    'capacitor_series': r'capacitor.*?series.*?1/C',
    'capacitor_parallel': r'capacitor.*?parallel.*?C\s*=\s*C',
    'rc_time_constant': r'e\s*\(.*?2\.718.*?RC.*?tau',
    'rms_value': r'root.?mean.?square.*?0\.707',
    'peak_value': r'peak.*?1\.414.*?rms',
    'capacitive_reactance': r'capacitive reactance.*?1/(2.*pi.*f.*C)',
    'inductive_reactance': r'inductive reactance.*?2.*pi.*f.*L',
}

print("\n=== Searching corpus for key concepts ===")
for concept, pattern in concepts.items():
    matches = re.findall(pattern, corpus_text, re.IGNORECASE | re.DOTALL)
    if matches:
        print(f"  {concept}: {matches[0][:100]}")
    else:
        # Try searching for the concept name
        idx = corpus_text.lower().find(concept.replace('_', ' '))
        if idx >= 0:
            print(f"  {concept}: found at pos {idx}, context: {corpus_text[max(0,idx-50):idx+100]}")
        else:
            print(f"  {concept}: NOT FOUND")

# Let's search for specific concepts we know will be needed
search_terms = [
    'time constant', 'one time constant', 'e^(-t/RC)', 'tau',
    'Ohm\'s law', 'ohms law', 'V = IR', 'V=IR',
    'power formula', 'P = VI', 'P=VI',
    'turns ratio', 'N1/N2',
    'RMS', 'root mean square', 'peak value',
    'capacitive reactance', 'inductive reactance',
    'power factor', 'phase angle',
    'eddy current', 'hysteresis loss',
    'magnetic inclination', 'magnetic dip',
    'ferromagnetic', 'Curie temperature',
    'Faraday', 'Lenz',
    'delta', 'wye', 'star connection',
    'shunt motor', 'field current',
    'high pass filter', 'low pass filter',
    'band pass',
    'Wheatstone',
    'Kirchhoff',
    'resistivity',
]

print("\n=== Searching corpus for key terms ===")
for term in search_terms:
    idx = corpus_text.lower().find(term.lower())
    if idx >= 0:
        context = corpus_text[max(0, idx-30):idx+200].replace('\n', ' ')
        print(f"  '{term}': ...{context}...")
    else:
        # Try alternate search
        idx2 = corpus_text.lower().find(term.lower().split()[0])
        if idx2 >= 0:
            context = corpus_text[max(0, idx2-50):idx2+200].replace('\n', ' ')
            print(f"  '{term}': not found, but '{term.lower().split()[0]}' found: ...{context}...")
        else:
            print(f"  '{term}': NOT FOUND")

# ============================================================
# Analyze question topics
# ============================================================
# Categorize unanswered questions by topic
from collections import Counter
keywords_to_topic = {
    'capacitor': 'capacitance',
    'capacitance': 'capacitance',
    'resistor': 'resistance',
    'resistance': 'resistance',
    'ohm': 'resistance',
    'ohm\'s': 'resistance',
    'power': 'power',
    'watt': 'power',
    'transformer': 'transformer',
    'motor': 'motor',
    'generator': 'generator',
    'induct': 'inductance',
    'magnet': 'magnetism',
    'magnetic': 'magnetism',
    'current': 'current',
    'voltage': 'voltage',
    'voltage': 'voltage',
    'frequency': 'frequency',
    'filter': 'filters',
    'phase': 'ac_theory',
    'sine': 'ac_theory',
    'waveform': 'ac_theory',
    'rms': 'ac_theory',
    'cell': 'cells',
    'battery': 'cells',
    'chemical': 'cells',
    'thermo': 'thermal',
    'photo': 'optoelectronics',
    'semicon': 'semiconductors',
    'diode': 'diodes',
    'transistor': 'transistors',
    'cable': 'conductors',
    'conductor': 'conductors',
    'insulator': 'conductors',
    'eddy': 'magnetism',
    'hysteresis': 'magnetism',
    'flux': 'magnetism',
    'solenoid': 'magnetism',
}

topics = Counter()
for r in unanswered:
    text = r.get('text', '').lower()
    for kw, topic in keywords_to_topic.items():
        if kw in text:
            topics[topic] += 1
            break
    else:
        topics['other'] += 1

print(f"\n=== Question topics (unanswered) ===")
for topic, count in topics.most_common():
    print(f"  {topic}: {count}")
