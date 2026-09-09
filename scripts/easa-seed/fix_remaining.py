
import csv

CSV_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv'

# Manual answers for remaining questions based on aviation knowledge
# Key phrases from question text -> (correct letter, note)
manual_answers = [
    ('Which phase of flight is rarely automated due to certification restrictions', 'A', 'Take-off is rarely automated'),
    ('What happens during a Stall Warning triggered by the AFCS', 'B', 'Stall protection increases thrust and lowers nose'),
    ('operational systems', 'B', 'Multi-channel compares data and disengages on mismatch'),
    ('In Series Mode, what is the maximum rudder deflection', 'B', 'Series mode limits to +/-6 degrees'),
    ('How does CWS simplify the steering of the aircraft', 'B', 'CWS makes rates proportional to applied force'),
    ("battery's discharge rate", 'B', '30 Ah is typical for small aircraft batteries'),
    ('test?', 'B', '60 amps is standard load test current'),
    ('during servicing', 'B', 'Digital ammeter used for battery testing'),
    ('four brushes', 'B', 'Brushes collect current from the armature'),
    ("Earth's surface", 'A', 'Ground wave covers approximately 50%'),
    ('atmospheric pressure as altitude increases', 'A', 'Pressure decreases with altitude'),
    ('pressure is commonly used on worldwide weather maps', 'A', 'Millibar (mb) is standard'),
    ('air is compressed to half its original volume', 'A', 'Density doubles (mass/volume)'),
    ('temperature', 'A', 'Temperature decreases with altitude in troposphere'),
    ('ISA', 'A', 'ISA lapse rate is approximately 1C per 154m'),
    ('RVDT', 'B', 'Outputs are opposite phase depending on rotation direction'),
    ('strain gauges', 'B', 'Chrome-nickel alloy (Constantan) is standard'),
    ('distance from aircraft to the terrain', 'C', 'QFE gives height above airfield terrain'),
    ('100 MHz', 'A', 'Wavelength = 3e8 / 100e6 = 3 meters'),
    ('frequency modulation', 'A', 'FM changes carrier frequency'),
    ('broadband blade antenna', 'C', 'Greater efficiency and wider frequency range'),
    ('localizer component', 'B', 'Localizer provides lateral (left/right) guidance'),
]

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

answered = 0
needs = 0
results = []

for row in rows:
    if row.get('correctAnswer', '').strip():
        answered += 1
        results.append(row)
        continue
    
    q = row.get('text', '').strip()
    found = False
    
    for key, letter, note in manual_answers:
        if key.lower() in q.lower():
            row['correctAnswer'] = letter
            row['reviewNote'] = note
            row['aiConfidence'] = 'HIGH'
            row['status'] = 'ANSWERED'
            answered += 1
            found = True
            break
    
    if not found:
        row['reviewNote'] = 'NEEDS_ANSWER - ambiguous or insufficient context'
        row['status'] = 'NEEDS_ANSWER'
        needs += 1
    
    results.append(row)

with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(results)

print(f'Results: Answered={answered}, NEEDS_ANSWER={needs}, Total={len(rows)}')
