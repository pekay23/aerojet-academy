/**
 * Seed Script: Aptitude Test Question Bank
 *
 * Seeds 100+ aviation-themed aptitude questions across all 5 categories:
 * MATH (20), ENGLISH (20), ENGINEERING (20), LOGICAL_REASONING (20), PHYSICS (20)
 *
 * Usage: npx tsx prisma/seeds/aptitude-questions-seed.ts
 */

import 'dotenv/config'
import { AptitudeCategory, AptitudeQuestionType, PrismaClient, QuestionDifficulty } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || process.env.DIRECT_URL,
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  allowExitOnIdle: true,
})

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// ---------------------------------------------------------------------------
// MATH Questions (20) — Numerical reasoning, calculations, unit conversions
// ---------------------------------------------------------------------------
const MATH_QUESTIONS = [
  {
    text: 'An aircraft fuel tank holds 2,400 litres. If fuel consumption is 150 litres/hour, how many hours of flight time does the full tank provide?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['14 hours', '16 hours', '18 hours', '12 hours'],
    correctAnswer: '16 hours',
    explanation: '2400 ÷ 150 = 16 hours',
    points: 1,
  },
  {
    text: 'Convert 5,280 feet to nautical miles. (1 NM = 6,076 feet)',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['0.87 NM', '1.00 NM', '0.92 NM', '0.79 NM'],
    correctAnswer: '0.87 NM',
    explanation: '5280 ÷ 6076 ≈ 0.869 ≈ 0.87 NM',
    points: 1,
  },
  {
    text: 'A bolt has a torque specification of 25 Nm. If a wrench is 0.5 metres long, what force must be applied perpendicular to the wrench?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['12.5 N', '50 N', '25 N', '75 N'],
    correctAnswer: '50 N',
    explanation: 'Torque = Force × Distance → Force = 25 / 0.5 = 50 N',
    points: 1,
  },
  {
    text: 'If an aircraft cruises at 450 knots and needs to cover 2,700 nautical miles, what is the flight time?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['5 hours', '6 hours', '7 hours', '8 hours'],
    correctAnswer: '6 hours',
    explanation: '2700 ÷ 450 = 6 hours',
    points: 1,
  },
  {
    text: 'A hydraulic system operates at 3,000 PSI. If the piston area is 2 square inches, what is the force output?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['6,000 lbs', '3,000 lbs', '1,500 lbs', '9,000 lbs'],
    correctAnswer: '6,000 lbs',
    explanation: 'Force = Pressure × Area = 3000 × 2 = 6000 lbs',
    points: 1,
  },
  {
    text: 'An engine produces 180 horsepower. Convert this to kilowatts. (1 HP ≈ 0.746 kW)',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['134.3 kW', '241.3 kW', '120.0 kW', '168.5 kW'],
    correctAnswer: '134.3 kW',
    explanation: '180 × 0.746 = 134.28 ≈ 134.3 kW',
    points: 1,
  },
  {
    text: 'What is 15% of 840?',
    questionType: 'NUMERIC_INPUT',
    difficulty: 'EASY',
    options: null,
    correctAnswer: '126',
    explanation: '840 × 0.15 = 126',
    points: 1,
  },
  {
    text: 'A gear ratio is 3:1. If the input shaft rotates at 9,000 RPM, what is the output shaft speed?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['3,000 RPM', '27,000 RPM', '6,000 RPM', '12,000 RPM'],
    correctAnswer: '3,000 RPM',
    explanation: '9000 ÷ 3 = 3000 RPM',
    points: 1,
  },
  {
    text: 'A wire has a resistance of 2.5 ohms and carries a current of 4 amps. What is the voltage drop across the wire?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['10 V', '1.6 V', '6.5 V', '8 V'],
    correctAnswer: '10 V',
    explanation: 'V = IR = 4 × 2.5 = 10 V',
    points: 1,
  },
  {
    text: 'If a maintenance task takes 3 technicians 8 hours to complete, how many hours would it take 6 technicians (assuming equal efficiency)?',
    questionType: 'NUMERIC_INPUT',
    difficulty: 'EASY',
    options: null,
    correctAnswer: '4',
    explanation: 'Total work = 3 × 8 = 24 person-hours. With 6 technicians: 24 ÷ 6 = 4 hours',
    points: 1,
  },
  {
    text: 'A rectangular cargo hold measures 4m × 3m × 2.5m. What is the volume in cubic metres?',
    questionType: 'NUMERIC_INPUT',
    difficulty: 'EASY',
    options: null,
    correctAnswer: '30',
    explanation: '4 × 3 × 2.5 = 30 m³',
    points: 1,
  },
  {
    text: 'An aircraft descends from FL350 (35,000 ft) at a rate of 2,500 ft/min. How long to reach FL100 (10,000 ft)?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['10 minutes', '8 minutes', '14 minutes', '12 minutes'],
    correctAnswer: '10 minutes',
    explanation: '(35000 - 10000) ÷ 2500 = 25000 ÷ 2500 = 10 minutes',
    points: 1,
  },
  {
    text: 'A 24V battery system has two 12V batteries in series. If one battery has an internal resistance of 0.1Ω and the other 0.15Ω, what is the total internal resistance?',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: ['0.25 Ω', '0.06 Ω', '0.125 Ω', '0.05 Ω'],
    correctAnswer: '0.25 Ω',
    explanation: 'Series: R_total = R1 + R2 = 0.1 + 0.15 = 0.25 Ω',
    points: 1,
  },
  {
    text: 'Express the fraction 7/8 as a percentage.',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['87.5%', '78%', '85%', '82.5%'],
    correctAnswer: '87.5%',
    explanation: '7 ÷ 8 = 0.875 = 87.5%',
    points: 1,
  },
  {
    text: 'A propeller turns at 2,200 RPM. How many complete revolutions does it make in 30 seconds?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['1,100', '2,200', '4,400', '660'],
    correctAnswer: '1,100',
    explanation: '2200 RPM = 2200/60 per second ≈ 36.67/s. In 30s: 2200 × 30/60 = 1100',
    points: 1,
  },
  {
    text: 'Calculate the area of a circular piston with a diameter of 10 cm. Give your answer in cm² to one decimal place.',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['78.5 cm²', '31.4 cm²', '314.2 cm²', '100.0 cm²'],
    correctAnswer: '78.5 cm²',
    explanation: 'A = π(d/2)² = π × 5² = π × 25 ≈ 78.5 cm²',
    points: 1,
  },
  {
    text: 'An aircraft uses 2,800 kg of fuel for a 4-hour flight. What is the fuel burn rate in kg/hour?',
    questionType: 'NUMERIC_INPUT',
    difficulty: 'EASY',
    options: null,
    correctAnswer: '700',
    explanation: '2800 ÷ 4 = 700 kg/hour',
    points: 1,
  },
  {
    text: 'If pressure at sea level is 14.7 PSI and it decreases by approximately 0.5 PSI per 1,000 ft, what is the approximate pressure at 10,000 ft?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['9.7 PSI', '10.2 PSI', '11.7 PSI', '8.7 PSI'],
    correctAnswer: '9.7 PSI',
    explanation: '14.7 - (10 × 0.5) = 14.7 - 5.0 = 9.7 PSI',
    points: 1,
  },
  {
    text: 'A mechanic earns $32/hour regular and $48/hour overtime. If they work 40 regular hours and 12 overtime hours, what is their gross weekly pay?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['$1,856', '$1,664', '$2,080', '$1,920'],
    correctAnswer: '$1,856',
    explanation: '(40 × 32) + (12 × 48) = 1280 + 576 = $1,856',
    points: 1,
  },
  {
    text: 'A rivet has a shear strength of 500 lbs. How many rivets are needed to withstand a shear load of 7,500 lbs (with a safety factor of 1.5)?',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: ['23 rivets', '15 rivets', '30 rivets', '20 rivets'],
    correctAnswer: '23 rivets',
    explanation: 'Required strength = 7500 × 1.5 = 11250 lbs. Rivets = 11250 ÷ 500 = 22.5 → round up = 23',
    points: 1,
  },
]

// ---------------------------------------------------------------------------
// ENGLISH Questions (20) — Verbal reasoning, reading comprehension, grammar
// ---------------------------------------------------------------------------
const ENGLISH_QUESTIONS = [
  {
    text: 'Choose the word closest in meaning to "EXPEDITE":',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Delay', 'Accelerate', 'Cancel', 'Inspect'],
    correctAnswer: 'Accelerate',
    explanation: 'Expedite means to speed up or hasten a process.',
    points: 1,
  },
  {
    text: '"The pilot reported severe turbulence ___ the approach." Which preposition correctly completes the sentence?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['during', 'between', 'among', 'against'],
    correctAnswer: 'during',
    explanation: '"During" indicates the time period when turbulence was experienced.',
    points: 1,
  },
  {
    text: 'What does the aviation term "NOTAM" stand for?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Notice To Air Men', 'Not Applicable for Maintenance', 'Navigation On Terminal Approach Mode', 'Night Operations Tracking and Monitoring'],
    correctAnswer: 'Notice To Air Men',
    explanation: 'NOTAM = Notice To Air Men (now "Notice To Air Missions" in some jurisdictions).',
    points: 1,
  },
  {
    text: 'Select the sentence with correct grammar:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'The mechanic have completed the inspection.',
      'The mechanic has completed the inspection.',
      'The mechanic completing the inspection.',
      'The mechanic were completing the inspection.',
    ],
    correctAnswer: 'The mechanic has completed the inspection.',
    explanation: 'Singular subject "mechanic" requires singular verb "has".',
    points: 1,
  },
  {
    text: 'Choose the word that is the OPPOSITE of "DEFICIENT":',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Lacking', 'Adequate', 'Broken', 'Removed'],
    correctAnswer: 'Adequate',
    explanation: 'Deficient = lacking; Adequate = sufficient.',
    points: 1,
  },
  {
    text: '"Compliance with airworthiness directives is mandatory." What does "mandatory" mean in this context?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Optional', 'Recommended', 'Required', 'Suggested'],
    correctAnswer: 'Required',
    explanation: 'Mandatory means compulsory or required by regulation.',
    points: 1,
  },
  {
    text: 'Read the passage: "The landing gear failed to retract after takeoff. The crew performed the emergency checklist and the gear extended and locked in the down position." What happened first?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['The gear locked in the down position', 'The landing gear failed to retract', 'The crew read the emergency checklist', 'The gear extended'],
    correctAnswer: 'The landing gear failed to retract',
    explanation: 'The passage states the gear failure happened first (after takeoff), then the crew performed the checklist.',
    points: 1,
  },
  {
    text: 'Which word best completes: "The aircraft was _____ due to a cracked windshield."',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['grounded', 'promoted', 'elevated', 'improved'],
    correctAnswer: 'grounded',
    explanation: 'Grounded means the aircraft is prevented from flying due to a defect.',
    points: 1,
  },
  {
    text: '"Ensure all safety pins are installed prior to towing." What does "prior to" mean?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['After', 'During', 'Before', 'Instead of'],
    correctAnswer: 'Before',
    explanation: '"Prior to" is a formal way of saying "before".',
    points: 1,
  },
  {
    text: 'Identify the passive voice sentence:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'The engineer inspected the engine.',
      'The engine was inspected by the engineer.',
      'The engineer will inspect the engine.',
      'Inspecting the engine takes two hours.',
    ],
    correctAnswer: 'The engine was inspected by the engineer.',
    explanation: 'Passive voice: subject receives the action ("was inspected").',
    points: 1,
  },
  {
    text: 'What is the meaning of "INOPERATIVE" on an equipment placard?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Working normally', 'Not functioning', 'Partially working', 'Under test'],
    correctAnswer: 'Not functioning',
    explanation: 'Inoperative means the equipment is not working or disabled.',
    points: 1,
  },
  {
    text: '"The technician ___ the component before reassembly." Choose the correct past tense form:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['clean', 'cleaned', 'cleaning', 'will clean'],
    correctAnswer: 'cleaned',
    explanation: 'The context ("before reassembly") indicates past tense — "cleaned".',
    points: 1,
  },
  {
    text: 'Which sentence uses "affect" correctly?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'The weather will affect the flight schedule.',
      'The affect of corrosion was visible.',
      'We need to measure the affect of the repair.',
      'The pilot was affect by fatigue.',
    ],
    correctAnswer: 'The weather will affect the flight schedule.',
    explanation: '"Affect" is a verb meaning "to influence"; "effect" is the noun.',
    points: 1,
  },
  {
    text: 'In a maintenance manual, "SHALL" indicates:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'A suggestion',
      'An optional action',
      'A mandatory requirement',
      'A recommendation',
    ],
    correctAnswer: 'A mandatory requirement',
    explanation: 'In technical/regulatory documents, "shall" indicates a mandatory requirement.',
    points: 1,
  },
  {
    text: 'Choose the correctly spelled word:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Maintanance', 'Maintenance', 'Maintainance', 'Maintenence'],
    correctAnswer: 'Maintenance',
    explanation: 'The correct spelling is M-A-I-N-T-E-N-A-N-C-E.',
    points: 1,
  },
  {
    text: '"The component was serviceable" means the component was:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Broken', 'In working condition', 'New', 'Overdue for check'],
    correctAnswer: 'In working condition',
    explanation: 'Serviceable means fit for use and functioning correctly.',
    points: 1,
  },
  {
    text: 'Which abbreviation means "Minimum Equipment List"?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['MRL', 'MEL', 'MIL', 'MPL'],
    correctAnswer: 'MEL',
    explanation: 'MEL = Minimum Equipment List — defines equipment that may be inoperative for dispatch.',
    points: 1,
  },
  {
    text: '"Corrosion was found on the underside of the wing." In this sentence, "underside" refers to:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['The top surface', 'The bottom surface', 'The leading edge', 'The trailing edge'],
    correctAnswer: 'The bottom surface',
    explanation: 'Underside means the lower or bottom surface of an object.',
    points: 1,
  },
  {
    text: 'Select the sentence with correct punctuation:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'The pilot, who was experienced handled the emergency well.',
      'The pilot who was experienced, handled the emergency well.',
      'The pilot, who was experienced, handled the emergency well.',
      'The pilot who was experienced handled, the emergency well.',
    ],
    correctAnswer: 'The pilot, who was experienced, handled the emergency well.',
    explanation: 'Non-restrictive clause "who was experienced" needs commas on both sides.',
    points: 1,
  },
  {
    text: '"The repair was carried out IAW the AMM." What does "IAW" stand for?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['In Any Way', 'In Accordance With', 'Including All Work', 'Inspected And Warranted'],
    correctAnswer: 'In Accordance With',
    explanation: 'IAW = In Accordance With, a common abbreviation in technical maintenance documentation.',
    points: 1,
  },
]

// ---------------------------------------------------------------------------
// ENGINEERING Questions (20) — Mechanical principles, materials, processes
// ---------------------------------------------------------------------------
const ENGINEERING_QUESTIONS = [
  {
    text: 'Which type of stress occurs when two forces act in opposite directions along the same plane?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Tension', 'Compression', 'Shear', 'Torsion'],
    correctAnswer: 'Shear',
    explanation: 'Shear stress occurs when parallel forces act in opposite directions.',
    points: 1,
  },
  {
    text: 'What is the primary purpose of an aircraft\'s hydraulic system?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Generate electricity', 'Transmit force using fluid under pressure', 'Cool the engine', 'Provide cabin air'],
    correctAnswer: 'Transmit force using fluid under pressure',
    explanation: 'Hydraulic systems use pressurised fluid to transmit force for actuating components.',
    points: 1,
  },
  {
    text: 'What type of maintenance involves replacing a component before it fails, based on scheduled intervals?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Corrective maintenance', 'Preventive maintenance', 'Emergency maintenance', 'Adaptive maintenance'],
    correctAnswer: 'Preventive maintenance',
    explanation: 'Preventive (or scheduled) maintenance replaces components at predetermined intervals.',
    points: 1,
  },
  {
    text: 'In an aircraft electrical system, a bus bar is used to:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Store electrical energy', 'Convert AC to DC', 'Distribute electrical power to multiple circuits', 'Regulate voltage'],
    correctAnswer: 'Distribute electrical power to multiple circuits',
    explanation: 'A bus bar is a common connection point for distributing power to multiple circuits.',
    points: 1,
  },
  {
    text: 'Which material is most commonly used for aircraft fuselage construction in modern commercial aircraft?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Steel', 'Aluminium alloy', 'Titanium', 'Cast iron'],
    correctAnswer: 'Aluminium alloy',
    explanation: 'Aluminium alloys (2024, 7075) are the most widely used due to their strength-to-weight ratio.',
    points: 1,
  },
  {
    text: 'What does NDT stand for in aviation maintenance?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Non-Destructive Testing', 'Normal Duty Testing', 'New Design Technology', 'Night Departure Time'],
    correctAnswer: 'Non-Destructive Testing',
    explanation: 'NDT = Non-Destructive Testing — methods to inspect components without causing damage.',
    points: 1,
  },
  {
    text: 'Which NDT method uses magnetic fields to detect surface and near-surface defects in ferromagnetic materials?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Ultrasonic testing', 'Magnetic particle inspection', 'Eddy current testing', 'Radiographic testing'],
    correctAnswer: 'Magnetic particle inspection',
    explanation: 'MPI uses magnetic fields and iron particles to reveal cracks in ferromagnetic materials.',
    points: 1,
  },
  {
    text: 'A standard rivet is identified by its head shape. Which rivet head type is most commonly used in aircraft external skin?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Universal head', 'Brazier head', 'Countersunk head', 'Round head'],
    correctAnswer: 'Countersunk head',
    explanation: 'Countersunk (flush) rivets are used on external surfaces to reduce aerodynamic drag.',
    points: 1,
  },
  {
    text: 'The purpose of a torque wrench is to:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Measure bolt length', 'Apply a specific rotational force to fasteners', 'Remove rusted bolts', 'Test bolt material hardness'],
    correctAnswer: 'Apply a specific rotational force to fasteners',
    explanation: 'A torque wrench ensures fasteners are tightened to the correct specification.',
    points: 1,
  },
  {
    text: 'In a turbofan engine, the bypass ratio refers to:',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: [
      'The ratio of engine weight to thrust produced',
      'The ratio of air bypassing the core to air entering the core',
      'The ratio of fuel flow to air intake',
      'The ratio of compressor stages to turbine stages',
    ],
    correctAnswer: 'The ratio of air bypassing the core to air entering the core',
    explanation: 'Bypass ratio = mass of air through the fan duct ÷ mass of air through the engine core.',
    points: 1,
  },
  {
    text: 'Galvanic corrosion occurs when:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'Two dissimilar metals are in contact in the presence of an electrolyte',
      'A single metal fatigues over time',
      'Paint is applied to bare metal',
      'Metal is exposed to high temperatures',
    ],
    correctAnswer: 'Two dissimilar metals are in contact in the presence of an electrolyte',
    explanation: 'Galvanic corrosion results from electrochemical reaction between dissimilar metals.',
    points: 1,
  },
  {
    text: 'An aircraft tyre pressure gauge reads in PSI. What does PSI stand for?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Pounds per Square Inch', 'Pressure System Indicator', 'Pascal Standard Index', 'Pneumatic Safety Instrument'],
    correctAnswer: 'Pounds per Square Inch',
    explanation: 'PSI = Pounds per Square Inch, a common pressure unit.',
    points: 1,
  },
  {
    text: 'What is the function of a check valve in a hydraulic system?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Allow flow in one direction only', 'Regulate pressure', 'Filter contamination', 'Measure flow rate'],
    correctAnswer: 'Allow flow in one direction only',
    explanation: 'A check valve permits hydraulic fluid to flow in one direction while blocking reverse flow.',
    points: 1,
  },
  {
    text: 'True or False: Aluminium is heavier than steel.',
    questionType: 'TRUE_FALSE',
    difficulty: 'EASY',
    options: null,
    correctAnswer: 'False',
    explanation: 'Aluminium (density ≈ 2,700 kg/m³) is much lighter than steel (≈ 7,850 kg/m³).',
    points: 1,
  },
  {
    text: 'What does EWIS stand for in the context of aircraft maintenance?',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: [
      'Electrical Wiring Interconnection System',
      'Engine Warning Indicator System',
      'Emergency Weather Information Service',
      'External Wing Inspection Schedule',
    ],
    correctAnswer: 'Electrical Wiring Interconnection System',
    explanation: 'EWIS encompasses all wiring, connectors, and routing in an aircraft.',
    points: 1,
  },
  {
    text: 'Which of the following is the correct order of a 4-stroke engine cycle?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'Intake, Compression, Power, Exhaust',
      'Compression, Intake, Power, Exhaust',
      'Intake, Power, Compression, Exhaust',
      'Power, Compression, Exhaust, Intake',
    ],
    correctAnswer: 'Intake, Compression, Power, Exhaust',
    explanation: 'The Otto cycle: Intake → Compression → Power (combustion) → Exhaust.',
    points: 1,
  },
  {
    text: 'What is the purpose of Zonal Analysis in aircraft maintenance programmes?',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: [
      'To divide the aircraft into zones for systematic inspection',
      'To calculate fuel consumption per zone',
      'To assign maintenance crews to airport zones',
      'To track spare parts by warehouse zone',
    ],
    correctAnswer: 'To divide the aircraft into zones for systematic inspection',
    explanation: 'MSG-3 Zonal Analysis divides the aircraft into major zones to ensure every area is inspected.',
    points: 1,
  },
  {
    text: 'True or False: A pitot tube measures the static pressure of the ambient air.',
    questionType: 'TRUE_FALSE',
    difficulty: 'MEDIUM',
    options: null,
    correctAnswer: 'False',
    explanation: 'A pitot tube measures total (ram) pressure. Static ports measure static (ambient) pressure.',
    points: 1,
  },
  {
    text: 'The hardness of a metal is typically measured using which test?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Tensile test', 'Rockwell hardness test', 'Fatigue test', 'Creep test'],
    correctAnswer: 'Rockwell hardness test',
    explanation: 'Rockwell (and Brinell/Vickers) are standard hardness testing methods.',
    points: 1,
  },
  {
    text: 'What is the primary risk of using the wrong specification of safety wire on a critical component?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'The wire may be too expensive',
      'The wire may break under vibration, allowing the fastener to loosen',
      'The wire may corrode the paint',
      'The wire may be too shiny',
    ],
    correctAnswer: 'The wire may break under vibration, allowing the fastener to loosen',
    explanation: 'Incorrect safety wire can fail under operational vibration, potentially causing component failure.',
    points: 1,
  },
]

// ---------------------------------------------------------------------------
// LOGICAL REASONING Questions (20) — Patterns, sequences, logic
// ---------------------------------------------------------------------------
const LOGICAL_REASONING_QUESTIONS = [
  {
    text: 'What comes next in the sequence: 2, 6, 18, 54, ?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['108', '162', '72', '216'],
    correctAnswer: '162',
    explanation: 'Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162.',
    points: 1,
  },
  {
    text: 'All aircraft require fuel. This jet is an aircraft. Therefore:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['This jet may not need fuel', 'This jet requires fuel', 'Only jets need fuel', 'Not all aircraft need fuel'],
    correctAnswer: 'This jet requires fuel',
    explanation: 'Valid syllogism: All A require B; X is A; therefore X requires B.',
    points: 1,
  },
  {
    text: 'If PILOT = 16, 9, 12, 15, 20 (letter positions), then CREW = ?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['3, 18, 5, 23', '3, 18, 5, 25', '3, 17, 5, 23', '4, 18, 5, 23'],
    correctAnswer: '3, 18, 5, 23',
    explanation: 'C=3, R=18, E=5, W=23 (alphabetical positions).',
    points: 1,
  },
  {
    text: 'In a maintenance hangar, Task A must be done before Task B. Task C can be done at any time. Task D must be done after Task B. What is the earliest Task D can start?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['After A and B are complete', 'After A is complete', 'Before B starts', 'Simultaneously with A'],
    correctAnswer: 'After A and B are complete',
    explanation: 'D requires B, which requires A. So D starts after both A→B are done.',
    points: 1,
  },
  {
    text: 'Find the odd one out: Spanner, Hammer, Screwdriver, Compressor, Pliers',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Spanner', 'Hammer', 'Compressor', 'Pliers'],
    correctAnswer: 'Compressor',
    explanation: 'All others are hand tools; a compressor is a machine/equipment.',
    points: 1,
  },
  {
    text: 'If it takes 5 machines 5 minutes to make 5 widgets, how many minutes would it take 100 machines to make 100 widgets?',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: ['100 minutes', '5 minutes', '20 minutes', '1 minute'],
    correctAnswer: '5 minutes',
    explanation: 'Each machine takes 5 minutes for 1 widget. 100 machines each making 1 widget = 5 minutes total.',
    points: 1,
  },
  {
    text: 'Complete the analogy: Engine is to Aircraft as Heart is to:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Blood', 'Human body', 'Brain', 'Lungs'],
    correctAnswer: 'Human body',
    explanation: 'Engine powers the aircraft; heart powers the human body.',
    points: 1,
  },
  {
    text: 'A fault code shows: E-HYD-3001. Based on the pattern E-SYS-NNNN, what system does this likely relate to?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Hydraulic', 'Hydroelectric', 'Hydrostatic', 'Hydrogen'],
    correctAnswer: 'Hydraulic',
    explanation: 'HYD is the standard abbreviation for Hydraulic in aviation fault codes.',
    points: 1,
  },
  {
    text: 'If all scheduled checks are on time and Check A was done on Day 1, Check B every 7 days, and Check C every 14 days, on which day will all three checks coincide again?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Day 7', 'Day 14', 'Day 21', 'Day 28'],
    correctAnswer: 'Day 14',
    explanation: 'LCM of 7 and 14 = 14. All three checks will coincide on Day 14 (and then every 14 days).',
    points: 1,
  },
  {
    text: 'A technician has 4 tasks. Task 1 takes 2 hours, Task 2 takes 1.5 hours, Task 3 takes 3 hours, and Task 4 takes 0.5 hours. Tasks 1 and 3 can run simultaneously. What is the minimum total time?',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: ['7 hours', '5 hours', '4 hours', '3 hours'],
    correctAnswer: '5 hours',
    explanation: 'Run 1 & 3 in parallel (3 hrs) + Task 2 (1.5 hrs) + Task 4 (0.5 hrs) = 5 hours.',
    points: 1,
  },
  {
    text: 'What is the next number: 1, 1, 2, 3, 5, 8, ?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['11', '13', '10', '15'],
    correctAnswer: '13',
    explanation: 'Fibonacci sequence: each number is the sum of the two preceding ones. 5+8=13.',
    points: 1,
  },
  {
    text: 'Statement: "No defective parts should be installed on aircraft." Conclusion: "Part X has a crack." Therefore:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'Part X should be installed if the crack is small',
      'Part X should not be installed on the aircraft',
      'Part X can be installed after painting',
      'The crack is irrelevant to the decision',
    ],
    correctAnswer: 'Part X should not be installed on the aircraft',
    explanation: 'A cracked part is defective, and no defective parts should be installed.',
    points: 1,
  },
  {
    text: 'If RED = 27, GREEN = 49, what does BLUE equal?',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: ['40', '36', '33', '30'],
    correctAnswer: '40',
    explanation: 'Sum of letter positions: B(2)+L(12)+U(21)+E(5)=40. RED: R(18)+E(5)+D(4)=27. GREEN: G(7)+R(18)+E(5)+E(5)+N(14)=49.',
    points: 1,
  },
  {
    text: 'A logbook entry shows: "Replaced O-ring P/N 12345 with P/N 12346." What is the most likely issue with this entry?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'Nothing wrong — it is a valid entry',
      'The replacement part number is different from the original',
      'The date is missing',
      'The technician name is missing',
    ],
    correctAnswer: 'The replacement part number is different from the original',
    explanation: 'Unless the different P/N is an approved alternative, installing a different part number may be non-compliant.',
    points: 1,
  },
  {
    text: 'True or False: In binary logic, if A AND B must both be true for C to be true, then if A is false, C is always false regardless of B.',
    questionType: 'TRUE_FALSE',
    difficulty: 'MEDIUM',
    options: null,
    correctAnswer: 'True',
    explanation: 'In AND logic, both inputs must be true. If either is false, the output is false.',
    points: 1,
  },
  {
    text: 'Mirror image: If the word "AMBULANCE" is written as its mirror image on the front of the vehicle, what would you read when looking at it in your rear-view mirror?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['ECNALUBMA', 'AMBULANCE', 'ECNALUBM', 'AMBLUANCE'],
    correctAnswer: 'AMBULANCE',
    explanation: 'The mirror image reverses back to normal when seen in the rear-view mirror.',
    points: 1,
  },
  {
    text: 'A switch has 3 positions: OFF, LOW, HIGH. If two switches control the same system independently and the system only activates when BOTH are on HIGH, how many total switch combinations keep the system OFF?',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: ['8', '6', '4', '5'],
    correctAnswer: '8',
    explanation: 'Total combinations = 3×3 = 9. Only 1 (HIGH+HIGH) activates. So 9-1 = 8 keep it OFF.',
    points: 1,
  },
  {
    text: 'Complete the pattern: ✈ ✈ ✈ ⚙ ✈ ✈ ✈ ⚙ ✈ ✈ ✈ ?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['✈', '⚙', '✈ ✈', '⚙ ⚙'],
    correctAnswer: '⚙',
    explanation: 'The pattern repeats every 4 elements: 3 planes then 1 gear. Position 12 = gear.',
    points: 1,
  },
  {
    text: 'In a troubleshooting flowchart, if Step 1 says "Is voltage present?" and the answer is NO, you go to Step 4. If YES, you go to Step 2. Step 2 says "Is voltage within range?" If NO, you go to Step 5. If YES, go to Step 3. What is the path if voltage is present but out of range?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['1 → 2 → 5', '1 → 4', '1 → 2 → 3', '1 → 5'],
    correctAnswer: '1 → 2 → 5',
    explanation: 'Voltage present (YES → Step 2). Voltage out of range (NO → Step 5). Path: 1→2→5.',
    points: 1,
  },
  {
    text: 'If a component has a Mean Time Between Failure (MTBF) of 10,000 hours and has been in service for 8,000 hours, what can you conclude?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'It will definitely fail at exactly 10,000 hours',
      'It has a 2,000-hour remaining life guarantee',
      'MTBF is a statistical average — the component could fail at any time',
      'It should have failed by now',
    ],
    correctAnswer: 'MTBF is a statistical average — the component could fail at any time',
    explanation: 'MTBF is a statistical measure, not a guaranteed life. Components can fail before or after MTBF.',
    points: 1,
  },
]

// ---------------------------------------------------------------------------
// PHYSICS Questions (20) — Forces, motion, thermodynamics, electricity
// ---------------------------------------------------------------------------
const PHYSICS_QUESTIONS = [
  {
    text: 'Which of the four forces acting on an aircraft in flight opposes thrust?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Lift', 'Weight', 'Drag', 'Gravity'],
    correctAnswer: 'Drag',
    explanation: 'The four forces: Lift opposes Weight; Thrust opposes Drag.',
    points: 1,
  },
  {
    text: 'According to Newton\'s Third Law, for every action there is:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['An unequal reaction', 'An equal and opposite reaction', 'A delayed reaction', 'No reaction'],
    correctAnswer: 'An equal and opposite reaction',
    explanation: 'Newton\'s Third Law: Every action has an equal and opposite reaction.',
    points: 1,
  },
  {
    text: 'What is Bernoulli\'s principle in relation to aircraft wings?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'Faster-moving air has lower pressure',
      'Slower-moving air has lower pressure',
      'Air pressure is constant across the wing',
      'Lift is generated by engine thrust alone',
    ],
    correctAnswer: 'Faster-moving air has lower pressure',
    explanation: 'Bernoulli: increased velocity → decreased pressure. The wing shape creates lower pressure on top.',
    points: 1,
  },
  {
    text: 'What unit is used to measure electrical resistance?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Volts', 'Amps', 'Ohms', 'Watts'],
    correctAnswer: 'Ohms',
    explanation: 'Electrical resistance is measured in ohms (Ω).',
    points: 1,
  },
  {
    text: 'In a DC circuit, if voltage is 28V and current is 2A, what is the power consumption?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['14 W', '56 W', '30 W', '26 W'],
    correctAnswer: '56 W',
    explanation: 'P = V × I = 28 × 2 = 56 W.',
    points: 1,
  },
  {
    text: 'The temperature at which water boils at sea level is 100°C. Convert this to Fahrenheit.',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['180°F', '212°F', '200°F', '220°F'],
    correctAnswer: '212°F',
    explanation: 'F = (C × 9/5) + 32 = (100 × 1.8) + 32 = 212°F.',
    points: 1,
  },
  {
    text: 'An object at rest tends to stay at rest unless acted upon by an external force. This is:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Newton\'s First Law (Inertia)', 'Newton\'s Second Law', 'Newton\'s Third Law', 'Archimedes\' Principle'],
    correctAnswer: 'Newton\'s First Law (Inertia)',
    explanation: 'Newton\'s First Law describes inertia — objects resist changes in their state of motion.',
    points: 1,
  },
  {
    text: 'Which type of energy does a compressed spring store?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Kinetic energy', 'Thermal energy', 'Potential (elastic) energy', 'Chemical energy'],
    correctAnswer: 'Potential (elastic) energy',
    explanation: 'A compressed spring stores elastic potential energy.',
    points: 1,
  },
  {
    text: 'In a hydraulic system, Pascal\'s Law states that pressure applied to an enclosed fluid is:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'Lost through friction',
      'Transmitted equally in all directions',
      'Only transmitted downward',
      'Increased at the output',
    ],
    correctAnswer: 'Transmitted equally in all directions',
    explanation: 'Pascal\'s Law: pressure in an enclosed fluid is transmitted undiminished in all directions.',
    points: 1,
  },
  {
    text: 'True or False: Sound travels faster in air than in steel.',
    questionType: 'TRUE_FALSE',
    difficulty: 'MEDIUM',
    options: null,
    correctAnswer: 'False',
    explanation: 'Sound travels faster in solids (~5,000 m/s in steel) than in air (~343 m/s).',
    points: 1,
  },
  {
    text: 'What happens to the resistance of a copper conductor as its temperature increases?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Decreases', 'Stays the same', 'Increases', 'Fluctuates randomly'],
    correctAnswer: 'Increases',
    explanation: 'Metals have a positive temperature coefficient — resistance increases with temperature.',
    points: 1,
  },
  {
    text: 'An aircraft accelerates from 0 to 150 knots in 30 seconds. What is its acceleration? (1 knot ≈ 0.514 m/s)',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: ['2.57 m/s²', '5.00 m/s²', '1.28 m/s²', '7.71 m/s²'],
    correctAnswer: '2.57 m/s²',
    explanation: '150 knots = 150 × 0.514 = 77.1 m/s. a = v/t = 77.1/30 ≈ 2.57 m/s².',
    points: 1,
  },
  {
    text: 'What is the Venturi effect used for in carburetted engines?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'To cool the engine',
      'To create a pressure drop that draws fuel into the airstream',
      'To increase exhaust pressure',
      'To filter air intake',
    ],
    correctAnswer: 'To create a pressure drop that draws fuel into the airstream',
    explanation: 'The Venturi narrows the airflow, decreasing pressure and drawing fuel into the stream.',
    points: 1,
  },
  {
    text: 'Two resistors of 10Ω each are connected in parallel. What is the total resistance?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['20 Ω', '10 Ω', '5 Ω', '15 Ω'],
    correctAnswer: '5 Ω',
    explanation: 'Parallel: 1/R = 1/10 + 1/10 = 2/10 → R = 5 Ω.',
    points: 1,
  },
  {
    text: 'The unit of force in the SI system is:',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['Joule', 'Newton', 'Watt', 'Pascal'],
    correctAnswer: 'Newton',
    explanation: 'The Newton (N) is the SI unit of force: 1 N = 1 kg·m/s².',
    points: 1,
  },
  {
    text: 'What principle explains why an aircraft wing generates lift?',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: [
      'Only Newton\'s Third Law',
      'Only Bernoulli\'s principle',
      'Both Bernoulli\'s principle and Newton\'s Third Law',
      'Neither — lift is purely from engine thrust',
    ],
    correctAnswer: 'Both Bernoulli\'s principle and Newton\'s Third Law',
    explanation: 'Lift is explained by both pressure differential (Bernoulli) and downward deflection of air (Newton\'s 3rd).',
    points: 1,
  },
  {
    text: 'What is the specific gravity of water?',
    questionType: 'MCQ',
    difficulty: 'EASY',
    options: ['0.5', '1.0', '1.5', '2.0'],
    correctAnswer: '1.0',
    explanation: 'Water is the reference substance for specific gravity, so SG = 1.0.',
    points: 1,
  },
  {
    text: 'Heat transfer by electromagnetic waves (no medium required) is called:',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['Conduction', 'Convection', 'Radiation', 'Induction'],
    correctAnswer: 'Radiation',
    explanation: 'Radiation transfers heat via electromagnetic waves and requires no physical medium.',
    points: 1,
  },
  {
    text: 'A 500 kg object is lifted 10 metres. How much work is done? (g = 9.81 m/s²)',
    questionType: 'MCQ',
    difficulty: 'MEDIUM',
    options: ['49,050 J', '5,000 J', '50,000 J', '4,905 J'],
    correctAnswer: '49,050 J',
    explanation: 'W = mgh = 500 × 9.81 × 10 = 49,050 J.',
    points: 1,
  },
  {
    text: 'In an AC circuit, the frequency of the power supply in most aircraft is:',
    questionType: 'MCQ',
    difficulty: 'HARD',
    options: ['50 Hz', '60 Hz', '400 Hz', '1000 Hz'],
    correctAnswer: '400 Hz',
    explanation: 'Aircraft use 400 Hz AC power — higher frequency allows smaller, lighter transformers and motors.',
    points: 1,
  },
]

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱 Seeding aptitude test questions...\n')

  // First, ensure a test bank exists
  let bank = await prisma.aptitudeTestBank.findFirst({
    where: { isActive: true },
  })

  if (!bank) {
    bank = await prisma.aptitudeTestBank.create({
      data: {
        name: 'General Aptitude Test — Aviation',
        description:
          'Comprehensive aptitude assessment covering mathematical reasoning, verbal ability, engineering fundamentals, logical reasoning, and physics. Aligned with Criteria Corp CBST/CCAT methodology.',
        isActive: true,
        applicableProgrammes: [
          'FULL_TIME_4YEAR',
          'FULL_TIME_2YEAR',
          'MILITARY_1YEAR',
          'MODULAR',
          'EXAM_ONLY',
        ],
      },
    })
    console.log(`  ✅ Created test bank: "${bank.name}" (${bank.id})`)
  } else {
    console.log(`  ⏭️  Using existing bank: "${bank.name}" (${bank.id})`)
  }

  // Check existing question count
  const existingCount = await prisma.aptitudeQuestion.count({
    where: { bankId: bank.id },
  })

  if (existingCount >= 80) {
    console.log(`  ⏭️  Bank already has ${existingCount} questions — skipping seed`)
    return
  }

  // Seed questions by category
  const categoryMap: Record<string, { questions: typeof MATH_QUESTIONS; label: string }> = {
    MATH: { questions: MATH_QUESTIONS, label: 'Math' },
    ENGLISH: { questions: ENGLISH_QUESTIONS, label: 'English / Verbal' },
    ENGINEERING: { questions: ENGINEERING_QUESTIONS, label: 'Engineering' },
    LOGICAL_REASONING: { questions: LOGICAL_REASONING_QUESTIONS, label: 'Logical Reasoning' },
    PHYSICS: { questions: PHYSICS_QUESTIONS, label: 'Physics' },
  }

  let totalCreated = 0

  for (const [category, { questions, label }] of Object.entries(categoryMap)) {
    let created = 0
    for (const q of questions) {
      // Check if a question with the same text already exists to avoid duplicates
      const exists = await prisma.aptitudeQuestion.findFirst({
        where: { bankId: bank.id, text: q.text },
      })
      if (exists) continue

      await prisma.aptitudeQuestion.create({
        data: {
          bankId: bank.id,
          category: category as unknown as AptitudeCategory,
          questionType: q.questionType as unknown as AptitudeQuestionType,
          difficulty: q.difficulty as unknown as QuestionDifficulty,
          text: q.text,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points,
          isActive: true,
        },
      })
      created++
    }
    totalCreated += created
    console.log(`  📝 ${label}: ${created} questions seeded (${questions.length} total in set)`)
  }

  console.log(`\n🎉 Aptitude question seed complete! ${totalCreated} new questions added.`)
  console.log(`   Total questions in bank: ${existingCount + totalCreated}`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
