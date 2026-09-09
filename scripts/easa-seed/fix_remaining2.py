
import csv

CSV_PATH = r'C:\Projects\aerojet-academy\scripts\easa-seed\csvs_answered\M13.csv'

manual_answers = [
    ('What was the primary function of early automatic pilots', 'B', 'Early autopilots provided pilot relief by maintaining straight and level flight'),
    ('What aerodynamic effect does Mach Pitch Trim compensate for', 'B', 'Compensates for nose-down effect from increased lift on outer wings at high speed'),
    ('How does the system handle failures in the dual channel fail passive', 'B', 'Performs online comparisons and disconnects faulty channel'),
    ('for different aircraft models', 'B', 'AFCS development spanned 1960s to 2000s'),
    ('Why are engine instruments placed in the center of the front panel', 'B', 'Allows easy monitoring by both pilot and copilot'),
    ('Which of these is not a standard unit used to measure atmospheric pressure', 'B', 'Kilowatt is a unit of power, not pressure'),
    ('In what unit is air density commonly measured', 'B', 'Air density is measured in kg/m³'),
    ('Water vapor is approximately what fraction the weight of dry air', 'A', 'Water vapor is approximately 5/8 the weight of dry air'),
    ('A synchro typically has how many stator coils', 'C', 'A synchro typically has 3 stator coils'),
    ('What does the curved shape of the Bourdon tube do when the pressure increases', 'B', 'Bourdon tube straightens out when pressure increases'),
    ('What components can control the frequency in a variable frequency signal', 'B', 'Frequency controlled by control voltage, variable capacitors, or variable resistors'),
    ('distance from aircraft to sea level', 'C', 'QNH gives height above mean sea level'),
    ('What is the frequency range of the VOR system', 'B', 'VOR operates in 108.00-117.95 MHz'),
    ('When a radio wave strikes a receiver antenna', 'C', 'Induces a weaker voltage replicating the transmitter signal'),
    ('The number of complete cycles of a recurring event in one second is', 'B', 'Frequency is cycles per second'),
    ('also an electromagnetic wave but at a higher frequency', 'C', 'Light is an EM wave at higher frequency than radio'),
    ('primary purpose of Damage Tolerance Monitoring', 'B', 'Detects and records structural stresses or impacts'),
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
