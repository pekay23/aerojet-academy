import re

files = {
    'DGCA_MATHS_1': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\DGCA MODULE 1 MATHS  -1 2023-06-02 16_30_09.txt',
    'DGCA_GEOM_3': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\DGCA MODULE 01 GEOMETRI 03 2023-06-02 16_30_10.txt',
    'DGCA_ALJ_2': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\DGCA MODULE 1 ALJEBRA -2 2023-06-02 16_30_12.txt',
    'EASA_P1': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\EASA PART66 MODULE 01 NEW PART 1 (1) 2023-06-02 16_30_11.txt',
    'EASA_P2': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\EASA PART66 MODULE 01 NEW PART 2 2023-06-02 16_30_11.txt',
    'M1_ANSWERS': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\Module 1 Answers.txt',
    'M1_QUESTIONS': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\Module 1 Questions.txt',
}

for name, path in files.items():
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        count = len(re.findall(r'[Cc]orrect [Aa]nswer', content))
        print(f'{name}: {count} "correct answer" mentions, {len(content)} chars')
        idx = content.lower().find('correct answer')
        if idx > 0:
            sample = content[max(0, idx-80):idx+120]
            print(f'  Sample: {repr(sample)}')
    except Exception as e:
        print(f'{name}: ERROR - {e}')

# Also search in M1-B1B2 and M01-Training-book
big_files = {
    'M1B1B2': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\M1-B1B2_Mathematics for Aviation Maintenance.txt',
    'M01_TRAINING': r'C:\Projects\aerojet-academy\scripts\easa-seed\doc-text\M1\M01-Training-book.txt',
}
for name, path in big_files.items():
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    count = len(re.findall(r'[Cc]orrect [Aa]nswer', content))
    count2 = len(re.findall(r'[Aa]nswer:.*[a-c]', content))
    print(f'{name}: {count} "correct answer" mentions, {count2} "answer:" mentions, {len(content)} chars')
