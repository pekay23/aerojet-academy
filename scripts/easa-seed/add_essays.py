"""Add essay questions for M7, M9, M10 based on part66online.com content.

Sources:
- https://www.part66online.com/easa-part-66-essay-questions/module-7/
- https://www.part66online.com/easa-part-66-essay-questions/module-9/
- https://www.part66online.com/easa-part-66-essay-questions/module-10/

Note: Under Commission Implementing Regulation (EU) 2023/989 (in force 12 June 2024),
only Module 7 (Maintenance Practices) still carries essay questions in the EASA exam.
Module 9 and Module 10 essays were removed for EASA but retained for UK CAA.
"""
from __future__ import annotations

import csv
import json
from pathlib import Path

OUT_DIR = Path(__file__).parent / "csvs"
OUT_DIR.mkdir(parents=True, exist_ok=True)

ESSAY_QUESTIONS = {
    "M7": [
        (
            "M7.1",
            "HARD",
            "Describe the safety precautions to be observed when working on or near an aircraft oxygen system, and state the action to take if an oxygen-related fire occurs.",
            "Candidates should cover: oxygen as an oxidiser, absolute cleanliness, oxygen-approved lubricants/sealants, no ignition sources, good ventilation, slow depressurisation, cylinder handling, and fire response (raise alarm, isolate oxygen, do not fight large fires).",
            "part66online.com/easa-part-66-essay-questions/module-7/",
        ),
        (
            "M7.2",
            "HARD",
            "Describe the common classes of fire encountered in a hangar or workshop, and explain the principal fire-extinguishing agents available and their correct application to each class of fire.",
            "Candidates should cover: fire triangle, fire classes (solids, flammable liquids, gases, combustible metals, electrical), water/foam/dry powder/CO2 agents and their correct/incorrect applications, and specialist agents for metal fires.",
            "part66online.com/easa-part-66-essay-questions/module-7/",
        ),
    ],
    "M9": [
        (
            "M9.1",
            "HARD",
            "Explain why human factors must be taken into account in aircraft maintenance, how human error contributes to incidents, and what is meant by Murphy's law.",
            "Candidates should cover: human factors as study of capabilities/limitations, engineer as last line of defence, proportion of incidents from human error, Dirty Dozen contributors, and Murphy's law as error-tolerant design philosophy.",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.2",
            "HARD",
            "Describe the limitations of human vision and explain how they affect the maintenance engineer when carrying out visual inspection, including measures that reduce the risk.",
            "Candidates should cover: central vs peripheral vision, visual acuity, dark adaptation, colour perception, need for light/contrast, perception bias, and mitigations (lighting, magnifiers, systematic scan, NDT).",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.3",
            "HARD",
            "Describe the types of human memory and their limitations, and explain how these affect the aircraft maintenance engineer and how the risks can be reduced.",
            "Candidates should cover: sensory, short-term/working and long-term memory; fragility of working memory; effects of interruption; mitigations (approved data, work cards, check off, write down).",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.4",
            "HARD",
            "Explain how information processing, attention and perception work and describe their limitations and effects on the aircraft maintenance engineer.",
            "Candidates should cover: processing chain (sense, attend, perceive, decide, act), limited attention resource, attentional tunnelling, perception shaped by expectation/set, and mitigations (systematic methods, independent checks).",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.5",
            "HARD",
            "Explain what is meant by peer pressure in the maintenance environment, why it is a hazard, and how an aircraft maintenance engineer should resist it.",
            "Candidates should cover: definition of peer pressure, open and subtle forms, link to Dirty Dozen (pressure, lack of assertiveness, norms), personal responsibility, and defences (follow approved data, be assertive, escalate/report).",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.6",
            "HARD",
            "Explain the importance of effective team working, supervision and leadership in an aircraft maintenance organisation, and describe how each contributes to maintaining safety and quality.",
            "Candidates should cover: teamwork/shared responsibility, diffusion of responsibility, supervisor as first defence, leadership setting safety culture, and links to Dirty Dozen items.",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.7",
            "HARD",
            "Describe the sources of stress affecting an aircraft maintenance engineer, explain how stress can degrade performance, and outline how stress can be recognised and managed.",
            "Candidates should cover: work-related and domestic sources, cognitive/behavioural/physical effects, recognition (mood changes, errors, absenteeism), and management at personal and organisational levels.",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.8",
            "HARD",
            "Explain the relationship between sleep, fatigue and shiftwork for an aircraft maintenance engineer, the effect of fatigue on performance, and how the associated risks can be mitigated.",
            "Candidates should cover: circadian rhythm, sleep debt, shiftwork conflict, fatigue effects (reactions, vigilance, slips), micro-sleeps, and mitigations (sleep hygiene, rosters, forward rotation, open reporting).",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.9",
            "HARD",
            "Describe the effects of alcohol, medication and drug abuse on an aircraft maintenance engineer's fitness to work, and explain the engineer's responsibilities in this area.",
            "Candidates should cover: alcohol as CNS depressant, hangover effects, medication side effects, drug abuse incompatibility with safety work, and responsibilities (no impairment, seek medical advice, comply with policy, self-declare).",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
        (
            "M9.10",
            "HARD",
            "Explain what is meant by workload in the context of aircraft maintenance, and describe how both overload and underload can degrade an engineer's performance and how they can be managed.",
            "Candidates should cover: workload definition, inverted-U performance curve, overload causes/effects (rushing, shortcuts, attentional narrowing), underload effects (boredom, complacency), and organisational/individual management.",
            "part66online.com/easa-part-66-essay-questions/module-9/",
        ),
    ],
    "M10": [
        (
            "M10.1",
            "HARD",
            "Explain the regulatory framework governing aviation safety in Europe by describing the roles of ICAO, the European Commission, EASA, and the Member States and their National Aviation Authorities, and how these bodies relate to one another.",
            "Candidates should cover: ICAO (SARPs, Chicago Convention), European Commission (binding Regulations), EASA (technical authority, CS/AMC/GM), and Member States/NAAs (licensing, oversight).",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.2",
            "HARD",
            "Describe the categories and subcategories of the Part-66 aircraft maintenance licence and outline the certification privileges associated with each.",
            "Candidates should cover: categories A, B1, B2, B2L, B3, C; their scopes; subcategories for aeroplane/helicopter and turbine/piston; need for type/group ratings and organisation authorisation.",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.3",
            "HARD",
            "Explain the purpose of the Certificate of Release to Service (CRS), stating when it is required, who is entitled to issue it, and what information it must contain.",
            "Candidates should cover: purpose (maintenance done correctly, aircraft fit for service), when required (any maintenance), who may issue (authorised certifying staff with appropriate licence/authorisation), and required content.",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.4",
            "HARD",
            "Describe the requirements an organisation must satisfy to obtain and hold a Part-145 approval, and outline the process by which that approval is granted and maintained.",
            "Candidates should cover: MOE, Accountable Manager, competent personnel, facilities, tooling/data, compliance monitoring, occurrence reporting, authority assessment/audit, and continued oversight.",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.5",
            "HARD",
            "Explain the basic experience requirements for obtaining a Part-66 aircraft maintenance licence and the recency requirements that a holder must satisfy in order to continue exercising certification privileges.",
            "Candidates should cover: practical experience before licence, graduated minimum by category, effect of approved training, recency requirement, currency regaining, and need for organisation authorisation.",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.6",
            "HARD",
            "Describe the purpose of the EASA Form 1 (Authorised Release Certificate) and explain when and how it is used in aircraft component maintenance.",
            "Candidates should cover: purpose (component produced/maintained to approved data, fit for service), use for new production and post-maintenance, content, traceability, and distinction from the aircraft CRS.",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.7",
            "HARD",
            "Describe the Minimum Equipment List (MEL) and the Configuration Deviation List (CDL), explaining the purpose of each and how they permit an aircraft to be dispatched with inoperative or missing items.",
            "Candidates should cover: MEL derived from MMEL, O/M procedures, rectification intervals; CDL for missing secondary parts with performance penalties; both under Regulation (EU) No 965/2012.",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.8",
            "HARD",
            "Explain what maintenance records a Part-145 organisation is required to keep, why they are kept, and the principles governing how long they must be retained.",
            "Candidates should cover: records as proof of airworthiness, work done/data used/CRS or Form 1, certifying staff records, integrity/storage/access, retention for regulated periods, and transfer with aircraft/component.",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.9",
            "HARD",
            "Describe the concept of independent certifying staff introduced by Regulation (EU) 2023/989, explaining their privileges, responsibilities and limitations.",
            "Candidates should cover: Part-66 licence holder certifying without Part-145 framework, privilege to issue CRS within scope, heightened personal responsibility, and limitations (lighter aircraft, licence scope, recency, authority oversight).",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
        (
            "M10.10",
            "HARD",
            "State the documents that must be carried on board an aircraft when it is operated, and briefly explain the purpose of each.",
            "Candidates should cover: Certificate of Registration, Airworthiness Certificate, Noise Certificate, Certificate of Insurance, Radio Licence, Aircraft Radio Station Licence, Weight and Balance documentation, and any operational-specific documents.",
            "part66online.com/easa-part-66-essay-questions/module-10/",
        ),
    ],
}


def add_essays(module: str, essays: list) -> None:
    path = OUT_DIR / f"{module}.csv"
    if not path.exists():
        print(f"{module}: CSV not found, skipping")
        return
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    existing_keys = {(r["syllabusRef"], r["text"][:80]) for r in rows}
    updated = 0
    added = 0
    for syllabus, difficulty, text, answer_mark, source in essays:
        raw = json.dumps(
            {
                "raw": text,
                "question": text,
                "options": [],
                "correct": None,
                "answer_text": answer_mark,
                "category": "ESSAY",
                "source_file": source,
                "source_module": module,
                "fmt": "essay",
                "module": module,
                "syllabusRef": syllabus,
                "level": None,
                "difficulty": difficulty,
                "subTopic": syllabus,
            },
            ensure_ascii=False,
        )
        key = (syllabus, text[:80])
        if key in existing_keys:
            for r in rows:
                if r["syllabusRef"] == syllabus and r["text"][:80] == text[:80]:
                    r["isEssay"] = "True"
                    updated += 1
                    break
        else:
            rows.append(
                {
                    "module": module,
                    "syllabusRef": syllabus,
                    "level": "",
                    "text": text,
                    "optionA": "",
                    "optionB": "",
                    "optionC": "",
                    "optionD": "",
                    "correctAnswer": "",
                    "difficulty": difficulty,
                    "subTopic": syllabus,
                    "aiSourceRef": "",
                    "aiConfidence": "",
                    "status": "APPROVED",
                    "reviewNote": "",
                    "points": 5,
                    "sourceFile": source,
                    "rawJson": raw,
                    "isEssay": "True",
                }
            )
            existing_keys.add(key)
            added += 1
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"{module}: added {added}, updated {updated}, total now {len(rows)}")


def main() -> int:
    for module, essays in ESSAY_QUESTIONS.items():
        add_essays(module, essays)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
