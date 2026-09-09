import json
from pathlib import Path
from collections import Counter

answers = json.loads(Path(__file__).parent.joinpath("m1_answers.json").read_text(encoding="utf-8"))
tests = Counter()
for key in answers:
    # key is like "test1_q1"
    test_num = key.split("_")[0]
    tests[test_num] += 1

print("Answer distribution by test:")
for test in sorted(tests):
    print(f"  {test}: {tests[test]} questions")
print(f"Total: {sum(tests.values())} answers")
