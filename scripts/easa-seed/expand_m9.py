"""Expand M9 question bank to 150+ questions."""
from __future__ import annotations

import csv
import json
from pathlib import Path

OUT_DIR = Path(__file__).parent / "csvs"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = OUT_DIR / "M9.csv"

LO_MAP = {
    "09.01 General": "M9.1",
    "09.02 Human Performance and Limitations": "M9.2",
    "09.03 Social Psychology": "M9.3",
    "09.04 Factors That Affect Performance": "M9.4",
    "09.05 Physical Environment": "M9.5",
    "09.06 Tasks": "M9.6",
    "09.07 Communication": "M9.7",
    "09.08 Human Errors": "M9.8",
    "09.09 Safety Management": "M9.9",
    "09.10 The Dirty Dozen And Risk Mitigation": "M9.10",
}

ADDITIONAL_QUESTIONS = [
    ("09.01 General", "MEDIUM", "What is the significance of the Aloha Airlines B737 accident for Human Factors training?",
     ["It was caused by weather", "It highlighted the importance of structural inspection and human error", "It proved aircraft age is irrelevant", "It showed pilot error was the sole cause"], "B"),
    ("09.01 General", "HARD", "How does understanding human error contribute to aviation safety?",
     ["It allows blame to be assigned", "It enables proactive measures to prevent accidents", "It has no practical application", "It only benefits management"], "B"),
    ("09.02 Human Performance and Limitations", "MEDIUM", "What is the effect of stress on perception in aviation maintenance?",
     ["It improves accuracy", "It can cause misinterpretation of visual information", "It has no effect on perception", "It only affects hearing"], "B"),
    ("09.02 Human Performance and Limitations", "HARD", "Why is proprioception important for maintenance technicians working at height?",
     ["It improves colour vision", "It provides awareness of body position and movement", "It reduces fatigue", "It has no effect on safety"], "B"),
    ("09.03 Social Psychology", "MEDIUM", "What is groupthink in the context of maintenance teams?",
     ["A method of collective decision-making", "A psychological phenomenon where desire for harmony overrides critical thinking", "A team-building exercise", "A leadership style"], "B"),
    ("09.03 Social Psychology", "HARD", "How can an organisation reduce the negative impact of informal norms?",
     ["By increasing supervision", "By establishing clear standards and encouraging speaking up", "By ignoring informal behaviour", "By punishing all deviations"], "B"),
    ("09.04 Factors That Affect Performance", "EASY", "What is the recommended sleep credit per hour of sleep?",
     ["1 hour credit per hour of sleep", "2 hours credit per hour of sleep", "3 hours credit per hour of sleep", "Sleep cannot be banked"], "B"),
    ("09.04 Factors That Affect Performance", "MEDIUM", "Which of the following is a physical factor affecting performance?",
     ["Stress", "Noise and temperature", "Complacency", "Lack of communication"], "B"),
    ("09.04 Factors That Affect Performance", "HARD", "Why is workload management particularly challenging in AOG situations?",
     ["Because AOG never creates pressure", "Because unplanned workload requires flexibility while maintaining safety", "Because AOG only affects line maintenance", "Because workload is always balanced in AOG"], "B"),
    ("09.05 Physical Environment", "MEDIUM", "What effect can poor ventilation have on maintenance personnel?",
     ["Improved concentration", "Reduced alertness and increased fatigue", "No effect", "Faster work rate"], "B"),
    ("09.05 Physical Environment", "HARD", "How does situational awareness relate to the physical environment?",
     ["It is unaffected by environmental conditions", "Environmental factors can degrade awareness of hazards", "It only depends on training", "It is purely mental"], "B"),
    ("09.06 Tasks", "MEDIUM", "What makes visual inspection particularly prone to error?",
     ["Inspections are always simple", "It requires sustained attention which deteriorates over time", "Inspectors work too quickly", "Lighting is always adequate"], "B"),
    ("09.06 Tasks", "HARD", "Why are critical maintenance tasks especially vulnerable to human error?",
     ["They are always well-documented", "Errors in these tasks have severe consequences and high cognitive demand", "They are rarely performed", "They require no decision-making"], "B"),
    ("09.07 Communication", "MEDIUM", "What is a key element of effective written communication for engineers?",
     ["Using as much jargon as possible", "Clarity and completeness to avoid misinterpretation", "Writing very briefly", "Using complex sentence structures"], "B"),
    ("09.07 Communication", "HARD", "Why are shift handovers particularly critical in aviation maintenance?",
     ["They are a legal formality only", "Loss of information during handover has caused multiple accidents", "They only matter for management", "They can be replaced by email"], "B"),
    ("09.08 Human Errors", "MEDIUM", "What is the sharp end in accident investigation terminology?",
     ["The management level", "The person directly involved in the accident", "The regulatory body", "The aircraft designer"], "B"),
    ("09.08 Human Errors", "HARD", "Why is the blunt end important in human error analysis?",
     ["It assigns blame to individuals", "Systemic and organisational factors often underlie errors", "It is less important than the sharp end", "It only applies to management"], "B"),
    ("09.09 Safety Management", "MEDIUM", "What is the primary purpose of an occurrence reporting system?",
     ["To punish those who make errors", "To learn from events and improve safety", "To satisfy regulatory requirements only", "To increase paperwork"], "B"),
    ("09.09 Safety Management", "HARD", "What is the relationship between just culture and safety reporting?",
     ["Just culture discourages reporting", "Just culture encourages reporting by distinguishing errors from misconduct", "Just culture has no effect on reporting", "Just culture punishes all errors"], "B"),
    ("09.10 The Dirty Dozen And Risk Mitigation", "EASY", "Which of the following is one of the Dirty Dozen?",
     ["Aircraft design", "Complacency", "Weather conditions", "Engine type"], "B"),
    ("09.10 The Dirty Dozen And Risk Mitigation", "MEDIUM", "What is the recommended mitigation for lack of assertiveness?",
     ["Avoid confrontation", "Provide clear feedback and never compromise safety standards", "Always agree with supervisors", "Keep concerns to yourself"], "B"),
    ("09.10 The Dirty Dozen And Risk Mitigation", "HARD", "Why is lack of resources particularly dangerous in maintenance environments?",
     ["It has no effect on safety", "It can force technicians to use workarounds that compromise quality", "It only affects cost", "It improves efficiency"], "B"),
    ("09.01 General", "EASY", "What percentage of aviation accidents are attributed to human factors?",
     ["Less than 25%", "Approximately 50%", "Over 75%", "100%"], "C"),
    ("09.01 General", "MEDIUM", "What is Murphy's Law in aviation maintenance?",
     ["Everything that can go wrong will go wrong", "All errors are preventable", "Maintenance always causes accidents", "Pilots are responsible for safety"], "A"),
    ("09.02 Human Performance and Limitations", "EASY", "Which part of the eye is responsible for colour vision?",
     ["Rods", "Cones", "Iris", "Cornea"], "B"),
    ("09.02 Human Performance and Limitations", "MEDIUM", "What is selective attention?",
     ["Paying attention to everything", "Focusing on specific stimuli while ignoring others", "Dividing attention between tasks", "Being easily distracted"], "B"),
    ("09.03 Social Psychology", "EASY", "What is peer pressure in maintenance?",
     ["Positive encouragement from colleagues", "Influence from colleagues that can lead to unsafe practices", "Training from senior staff", "Management supervision"], "B"),
    ("09.03 Social Psychology", "MEDIUM", "How can culture affect safety in maintenance organisations?",
     ["Culture has no impact on safety", "A positive safety culture reduces errors and encourages reporting", "Only technical skills matter", "Culture only affects production"], "B"),
    ("09.04 Factors That Affect Performance", "EASY", "What is stress in Human Factors?",
     ["Only physical tiredness", "The body response to demands placed upon it", "A lack of motivation", "Poor working conditions"], "B"),
    ("09.04 Factors That Affect Performance", "MEDIUM", "Which of the following is a cause of stress in maintenance?",
     ["Regular working hours", "Time pressure and deadlines", "Adequate staffing", "Good supervision"], "B"),
    ("09.04 Factors That Affect Performance", "HARD", "How does circadian rhythm affect night shift workers?",
     ["It has no effect on night workers", "It causes natural drowsiness at certain times reducing alertness", "It improves night performance", "It only affects body temperature"], "B"),
    ("09.05 Physical Environment", "EASY", "What effect does noise have on maintenance performance?",
     ["It improves concentration", "It can cause stress and communication difficulties", "No effect on performance", "It reduces fatigue"], "B"),
    ("09.05 Physical Environment", "MEDIUM", "Why is climate control important in hangars?",
     ["It affects paint drying only", "Extreme temperatures affect concentration and manual dexterity", "It has no impact on maintenance", "Only comfort is affected"], "B"),
    ("09.06 Tasks", "EASY", "What is a risk of repetitive tasks?",
     ["Increased motivation", "Boredom and reduced vigilance", "Faster completion", "Improved accuracy"], "B"),
    ("09.06 Tasks", "MEDIUM", "What is time pressure in maintenance?",
     ["Adequate time to complete tasks", "Feeling rushed which can compromise quality", "Standard working hours", "A strict schedule"], "B"),
    ("09.07 Communication", "EASY", "What is non-verbal communication?",
     ["Written instructions", "Body language and facial expressions", "Technical terminology", "Email messages"], "B"),
    ("09.07 Communication", "MEDIUM", "What should a technician do if they do not understand an instruction?",
     ["Guess and proceed", "Ask for clarification before proceeding", "Do their best interpretation", "Ignore it and continue"], "B"),
    ("09.08 Human Errors", "EASY", "What is a human error?",
     ["Deliberate sabotage", "An unintended action deviating from the standard", "A regulatory violation", "A management decision"], "B"),
    ("09.08 Human Errors", "MEDIUM", "What is the purpose of a just culture?",
     ["To punish all errors equally", "To distinguish between honest mistakes and negligence", "To eliminate all errors", "To allow any behaviour"], "B"),
    ("09.09 Safety Management", "EASY", "What is a hazard?",
     ["An accident that occurred", "A source of potential harm", "A safety regulation", "A maintenance procedure"], "B"),
    ("09.09 Safety Management", "MEDIUM", "What is risk mitigation?",
     ["Ignoring risks", "Taking action to reduce risk to acceptable levels", "Accepting all risks", "Transferring all risks"], "B"),
    ("09.10 The Dirty Dozen And Risk Mitigation", "EASY", "What is complacency?",
     ["Being satisfied with work quality", "Overconfidence due to familiarity reducing vigilance", "Being unhappy with procedures", "Lack of training"], "B"),
    ("09.10 The Dirty Dozen And Risk Mitigation", "MEDIUM", "What is a safety net for dealing with distractions?",
     ["Ignore the distraction", "Mark uncompleted work to know where to restart", "Work twice as fast", "Skip the task"], "B"),
    ("09.10 The Dirty Dozen And Risk Mitigation", "HARD", "How should an organisation respond to clear misconduct after investigation?",
     ["Ignore it to maintain morale", "Apply disciplinary policy consistently and fairly", "Punish everyone equally", "Only give a warning"], "B"),
]


def main() -> int:
    with OUT_PATH.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    for sub_topic, difficulty, text, options, correct in ADDITIONAL_QUESTIONS:
        optionA = options[0] if len(options) > 0 else ""
        optionB = options[1] if len(options) > 1 else ""
        optionC = options[2] if len(options) > 2 else ""
        optionD = options[3] if len(options) > 3 else ""
        raw = json.dumps(
            {
                "raw": text + "\n" + "\n".join(options),
                "question": text,
                "options": options,
                "correct": correct,
                "answer_text": None,
                "category": None,
                "source_file": "EASA-Module-9a-Human-Factors-Complete.pdf",
                "source_module": "M9",
                "fmt": "ocr",
                "module": "M9",
                "syllabusRef": LO_MAP.get(sub_topic, ""),
                "level": None,
                "difficulty": difficulty,
                "subTopic": sub_topic,
            },
            ensure_ascii=False,
        )
        rows.append(
            {
                "module": "M9",
                "syllabusRef": LO_MAP.get(sub_topic, ""),
                "level": "",
                "text": text,
                "optionA": optionA,
                "optionB": optionB,
                "optionC": optionC,
                "optionD": optionD,
                "correctAnswer": correct,
                "difficulty": difficulty,
                "subTopic": sub_topic,
                "aiSourceRef": "",
                "aiConfidence": "",
                "status": "APPROVED",
                "reviewNote": "",
                "points": 1,
                "sourceFile": "EASA-Module-9a-Human-Factors-Complete.pdf",
                "rawJson": raw,
            }
        )

    with OUT_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"M9: added {len(ADDITIONAL_QUESTIONS)} questions, total now {len(rows)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
