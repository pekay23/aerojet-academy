/**
 * Seed Script: ATA Chapters, Sample Intake Cycle, and Internal Exam Bank
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seeds/admissions-seed.ts
 * Or: npx tsx prisma/seeds/admissions-seed.ts
 */

import prisma from '../../lib/prisma/client'

// ---------------------------------------------------------------------------
// ATA Chapter Seed Data (EASA Part-66 standard chapters)
// ---------------------------------------------------------------------------

const ATA_CHAPTERS = [
  // Aircraft General
  { code: 'ATA-05', title: 'Time Limits / Maintenance Checks', description: 'Manufacturers recommended time limits, inspections, and maintenance checks for aircraft and systems.', category: 'GENERAL', sortOrder: 5 },
  { code: 'ATA-06', title: 'Dimensions / Areas', description: 'Charts, diagrams, and text showing the area, dimensions, stations, access doors, and zoning of the aircraft.', category: 'GENERAL', sortOrder: 6 },
  { code: 'ATA-07', title: 'Lifting and Shoring', description: 'Instructions and procedures for lifting (jacking) and shoring the aircraft for maintenance.', category: 'GENERAL', sortOrder: 7 },
  { code: 'ATA-08', title: 'Leveling and Weighing', description: 'Procedures for leveling and weighing the aircraft to determine its center of gravity.', category: 'GENERAL', sortOrder: 8 },
  { code: 'ATA-09', title: 'Towing and Taxiing', description: 'Instructions for towing and taxiing the aircraft on the ground safely.', category: 'GENERAL', sortOrder: 9 },
  { code: 'ATA-10', title: 'Parking and Mooring', description: 'Procedures for parking, mooring, storage, and returning the aircraft to service.', category: 'GENERAL', sortOrder: 10 },
  { code: 'ATA-11', title: 'Placards and Markings', description: 'Locations and requirements for exterior and interior decals, placards, and markings.', category: 'GENERAL', sortOrder: 11 },
  { code: 'ATA-12', title: 'Servicing', description: 'Instructions for routine servicing such as replenishing fluids, greasing, and inflating tires.', category: 'GENERAL', sortOrder: 12 },

  // Aircraft Systems
  { code: 'ATA-20', title: 'Standard Practices – Airframe', description: 'General procedures and standard practices applicable to airframe systems.', category: 'AIRFRAME', sortOrder: 20 },
  { code: 'ATA-21', title: 'Air Conditioning and Pressurization', description: 'Systems that provide heating, cooling, moisture control, and pressurization for the cabin.', category: 'AIRFRAME', sortOrder: 21 },
  { code: 'ATA-22', title: 'Auto Flight', description: 'Systems that provide automatic control of the flight path and speed (Autopilot, Autothrottle).', category: 'AVIONICS', sortOrder: 22 },
  { code: 'ATA-23', title: 'Communications', description: 'Voice and data communication systems used between the aircraft, ground stations, and passengers.', category: 'AVIONICS', sortOrder: 23 },
  { code: 'ATA-24', title: 'Electrical Power', description: 'Generation, control, and distribution of AC and DC electrical power throughout the aircraft.', category: 'AVIONICS', sortOrder: 24 },
  { code: 'ATA-25', title: 'Equipment / Furnishings', description: 'Flight deck seats, passenger cabin furnishings, galleys, lavatories, and emergency equipment.', category: 'AIRFRAME', sortOrder: 25 },
  { code: 'ATA-26', title: 'Fire Protection', description: 'Fixed and portable systems for detecting and extinguishing fires or smoke in the aircraft.', category: 'AIRFRAME', sortOrder: 26 },
  { code: 'ATA-27', title: 'Flight Controls', description: 'Primary and secondary flight control surfaces and operating mechanisms.', category: 'AIRFRAME', sortOrder: 27 },
  { code: 'ATA-28', title: 'Fuel', description: 'Fuel storage, distribution, indication, and venting systems.', category: 'AIRFRAME', sortOrder: 28 },
  { code: 'ATA-29', title: 'Hydraulic Power', description: 'Systems that generate, distribute, and control hydraulic fluid under pressure.', category: 'AIRFRAME', sortOrder: 29 },
  { code: 'ATA-30', title: 'Ice and Rain Protection', description: 'Anti-icing and de-icing systems for wings, tail, windshields, and engine cowls.', category: 'AIRFRAME', sortOrder: 30 },
  { code: 'ATA-31', title: 'Indicating / Recording Systems', description: 'Instruments, panels, and recorders that provide visual and recorded data of aircraft systems.', category: 'AVIONICS', sortOrder: 31 },
  { code: 'ATA-32', title: 'Landing Gear', description: 'Main and nose landing gear assemblies, extension/retraction mechanisms, wheels, and brakes.', category: 'AIRFRAME', sortOrder: 32 },
  { code: 'ATA-33', title: 'Lights', description: 'Interior and exterior lighting systems, including passenger, cargo, and navigation lights.', category: 'AVIONICS', sortOrder: 33 },
  { code: 'ATA-34', title: 'Navigation', description: 'Systems used to determine aircraft position and direct its course (e.g., GPS, IRS, VOR, Radar).', category: 'AVIONICS', sortOrder: 34 },
  { code: 'ATA-35', title: 'Oxygen', description: 'Storage and distribution of oxygen for the flight crew and passengers.', category: 'AIRFRAME', sortOrder: 35 },
  { code: 'ATA-36', title: 'Pneumatic', description: 'Systems that distribute pressurized air for engine starting, air conditioning, and anti-icing.', category: 'AIRFRAME', sortOrder: 36 },
  { code: 'ATA-37', title: 'Vacuum / Pressure', description: 'Vacuum or pressure systems used primarily to drive gyro instruments.', category: 'AIRFRAME', sortOrder: 37 },
  { code: 'ATA-38', title: 'Water / Waste', description: 'Potable water supply and waste disposal systems for lavatories and galleys.', category: 'AIRFRAME', sortOrder: 38 },
  { code: 'ATA-39', title: 'Electrical / Electronic Panels', description: 'Main structural panels housing electrical and electronic components and wiring.', category: 'AVIONICS', sortOrder: 39 },
  { code: 'ATA-41', title: 'Water Ballast', description: 'Systems for controlling the center of gravity via water ballast distribution.', category: 'AIRFRAME', sortOrder: 41 },
  { code: 'ATA-42', title: 'Integrated Modular Avionics', description: 'Core computing modules and architecture hosting multiple avionic applications.', category: 'AVIONICS', sortOrder: 42 },
  { code: 'ATA-44', title: 'Cabin Systems', description: 'In-flight entertainment, cabin management, and passenger communication systems.', category: 'AVIONICS', sortOrder: 44 },
  { code: 'ATA-45', title: 'Diagnostic / Maintenance System', description: 'Centralized systems that monitor faults, record data, and assist in troubleshooting.', category: 'AVIONICS', sortOrder: 45 },
  { code: 'ATA-46', title: 'Information Systems', description: 'On-board networks and electronic flight bags providing data to the crew.', category: 'AVIONICS', sortOrder: 46 },
  { code: 'ATA-47', title: 'Nitrogen Generation System', description: 'Systems that produce nitrogen-enriched air to inert the fuel tanks.', category: 'AIRFRAME', sortOrder: 47 },
  { code: 'ATA-48', title: 'In-Flight Fuel Dispensing', description: 'Equipment used for aerial refueling operations.', category: 'AIRFRAME', sortOrder: 48 },
  { code: 'ATA-49', title: 'Airborne Auxiliary Power', description: 'Auxiliary Power Unit (APU) and related systems for ground/in-flight power and air.', category: 'POWERPLANT', sortOrder: 49 },

  // Structure
  { code: 'ATA-51', title: 'Standard Practices – Structures', description: 'General procedures and limits for inspecting and repairing aircraft structures.', category: 'AIRFRAME', sortOrder: 51 },
  { code: 'ATA-52', title: 'Doors', description: 'Passenger, cargo, and service doors, including operating mechanisms and warnings.', category: 'AIRFRAME', sortOrder: 52 },
  { code: 'ATA-53', title: 'Fuselage', description: 'Main body structure of the aircraft including frames, stringers, and skin panels.', category: 'AIRFRAME', sortOrder: 53 },
  { code: 'ATA-54', title: 'Nacelles / Pylons', description: 'Structures that house and support the engines and their accessories.', category: 'AIRFRAME', sortOrder: 54 },
  { code: 'ATA-55', title: 'Stabilizers', description: 'Horizontal and vertical tail structures including elevators and rudders.', category: 'AIRFRAME', sortOrder: 55 },
  { code: 'ATA-56', title: 'Windows', description: 'Flight deck windshields, passenger cabin windows, and inspection observation windows.', category: 'AIRFRAME', sortOrder: 56 },
  { code: 'ATA-57', title: 'Wings', description: 'Main lifting surfaces, center wing box, and internal structural members.', category: 'AIRFRAME', sortOrder: 57 },

  // Propeller / Rotor
  { code: 'ATA-60', title: 'Standard Practices – Propeller/Rotor', description: 'General standard practices for inspecting and maintaining propellers and rotors.', category: 'POWERPLANT', sortOrder: 60 },
  { code: 'ATA-61', title: 'Propellers / Propulsors', description: 'Complete propeller assemblies, including hubs, blades, and pitch control mechanisms.', category: 'POWERPLANT', sortOrder: 61 },
  { code: 'ATA-62', title: 'Main Rotor', description: 'Helicopter main rotor head assemblies and blades.', category: 'POWERPLANT', sortOrder: 62 },
  { code: 'ATA-63', title: 'Main Rotor Drive', description: 'Transmission and drive shafts transmitting power to the main rotor.', category: 'POWERPLANT', sortOrder: 63 },
  { code: 'ATA-64', title: 'Tail Rotor', description: 'Helicopter tail rotor assemblies and pitch control mechanisms.', category: 'POWERPLANT', sortOrder: 64 },
  { code: 'ATA-65', title: 'Tail Rotor Drive', description: 'Drive shafts and gearboxes transmitting power to the tail rotor.', category: 'POWERPLANT', sortOrder: 65 },
  { code: 'ATA-66', title: 'Blades / Rotor Folding', description: 'Mechanisms and systems used to fold rotor blades for storage.', category: 'POWERPLANT', sortOrder: 66 },
  { code: 'ATA-67', title: 'Rotors Flight Control', description: 'Swashplates and mechanisms controlling the pitch of rotor blades.', category: 'POWERPLANT', sortOrder: 67 },

  // Power Plant
  { code: 'ATA-70', title: 'Standard Practices – Engine', description: 'General procedures and limits for engine maintenance and repair.', category: 'POWERPLANT', sortOrder: 70 },
  { code: 'ATA-71', title: 'Power Plant', description: 'Complete engine installation, cowlings, mounts, and related systems.', category: 'POWERPLANT', sortOrder: 71 },
  { code: 'ATA-72', title: 'Engine (Reciprocating or Turbine)', description: 'Internal components of the engine including compressors, combustion chambers, and turbines.', category: 'POWERPLANT', sortOrder: 72 },
  { code: 'ATA-73', title: 'Engine Fuel and Control', description: 'Engine-driven fuel pumps, fuel metering units, and electronic engine controls (FADEC).', category: 'POWERPLANT', sortOrder: 73 },
  { code: 'ATA-74', title: 'Ignition', description: 'Systems that generate and distribute electrical energy to ignite the fuel-air mixture.', category: 'POWERPLANT', sortOrder: 74 },
  { code: 'ATA-75', title: 'Bleed Air', description: 'Systems that extract and control compressed air from the engine for aircraft use.', category: 'POWERPLANT', sortOrder: 75 },
  { code: 'ATA-76', title: 'Engine Controls', description: 'Mechanical and electrical linkages between the flight deck and the engine.', category: 'POWERPLANT', sortOrder: 76 },
  { code: 'ATA-77', title: 'Engine Indicating', description: 'Sensors and transmitters providing engine operating parameters to the flight deck.', category: 'POWERPLANT', sortOrder: 77 },
  { code: 'ATA-78', title: 'Exhaust', description: 'Tailpipes, thrust reversers, and noise suppression systems.', category: 'POWERPLANT', sortOrder: 78 },
  { code: 'ATA-79', title: 'Oil', description: 'Engine lubrication systems including tanks, pumps, filters, and coolers.', category: 'POWERPLANT', sortOrder: 79 },
  { code: 'ATA-80', title: 'Starting', description: 'Pneumatic or electrical systems used to crank the engine for starting.', category: 'POWERPLANT', sortOrder: 80 },
  { code: 'ATA-81', title: 'Turbines (Reciprocating Engines)', description: 'Turbochargers and exhaust-driven turbines for reciprocating engines.', category: 'POWERPLANT', sortOrder: 81 },
  { code: 'ATA-82', title: 'Water Injection', description: 'Systems injecting water/methanol to increase engine thrust or power.', category: 'POWERPLANT', sortOrder: 82 },
  { code: 'ATA-83', title: 'Accessory Gearboxes', description: 'Gearboxes mounted on the engine used to drive aircraft accessories.', category: 'POWERPLANT', sortOrder: 83 },
  { code: 'ATA-84', title: 'Propulsion Augmentation', description: 'Afterburners and systems used to temporarily increase engine thrust.', category: 'POWERPLANT', sortOrder: 84 },
  { code: 'ATA-85', title: 'Reciprocating Engine', description: 'Cylinders, pistons, and internal components specific to reciprocating aviation engines.', category: 'POWERPLANT', sortOrder: 85 },

  // Miscellaneous
  { code: 'ATA-91', title: 'Charts / Diagrams', description: 'Miscellaneous charts and diagrams not applicable to a specific system.', category: 'GENERAL', sortOrder: 91 },
  { code: 'ATA-92', title: 'Electrical System Installation', description: 'Wiring diagrams and routing information for the entire aircraft electrical system.', category: 'GENERAL', sortOrder: 92 },
]

async function main() {
  console.log('🌱 Seeding admissions data...')

  // 1. Seed ATA chapters (upsert to avoid duplicates)
  console.log('  → ATA Chapters...')
  for (const ch of ATA_CHAPTERS) {
    await prisma.aTAChapter.upsert({
      where: { code: ch.code },
      update: { title: ch.title, description: ch.description, category: ch.category as any, sortOrder: ch.sortOrder },
      create: { code: ch.code, title: ch.title, description: ch.description, category: ch.category as any, sortOrder: ch.sortOrder },
    })
  }
  console.log(`    ✅ ${ATA_CHAPTERS.length} ATA chapters seeded`)

  // 2. Seed sample intake cycle
  console.log('  → Intake Cycle...')
  const existingCycle = await prisma.intakeCycle.findFirst({ where: { name: 'January 2026 Intake' } })
  if (!existingCycle) {
    await prisma.intakeCycle.create({
      data: {
        name: 'January 2026 Intake',
        description: 'First intake cohort of 2026',
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-03-31'),
        isActive: true,
      },
    })
    console.log('    ✅ Intake cycle created')
  } else {
    console.log('    ⏭️  Intake cycle already exists')
  }

  // 3. Seed sample internal exam bank (if courses exist)
  console.log('  → Internal Exam Banks...')
  const courses = await prisma.course.findMany({ take: 3, select: { id: true, name: true, code: true } })
  let banksCreated = 0
  for (const course of courses) {
    const existing = await prisma.internalExamBank.findFirst({ where: { courseId: course.id } })
    if (existing) continue

    const bank = await prisma.internalExamBank.create({
      data: {
        courseId: course.id,
        name: `${course.code} Module Exam`,
        description: `EASA-compliant examination for ${course.name}`,
        mcqCount: 40,
        ruleSet: 'EASA',
        minimumPoolSize: 200,
      },
    })

    // Create EASA rule override
    await prisma.internalExamRuleOverride.create({
      data: {
        bankId: bank.id,
        passMarkPct: 75,
        timePerQuestionSecs: 75,
        retakeWaitDays: 90,
        maxRetakes: 3,
        completionWindowYears: 10,
        allowKeyboardAutoSubmit: true,
      },
    })

    // Create 10 sample questions per bank
    const options = ['A', 'B', 'C']
    for (let i = 1; i <= 10; i++) {
      await prisma.internalExamQuestion.create({
        data: {
          bankId: bank.id,
          text: `Sample question ${i} for ${course.code}: What is the correct procedure for...?`,
          options: options,
          correctAnswer: options[Math.floor(Math.random() * 3)],
          subTopic: i <= 5 ? 'Fundamentals' : 'Advanced',
          difficulty: i <= 3 ? 'EASY' : i <= 7 ? 'MEDIUM' : 'HARD',
          points: 1,
        },
      })
    }

    banksCreated++
  }
  console.log(`    ✅ ${banksCreated} exam banks seeded with sample questions`)

  // 4. Seed email templates for admissions
  console.log('  → Email Templates...')
  const templates = [
    { name: 'aptitude-test-ready', subject: 'Your Aptitude Test Is Ready', body: '<p>Default body</p>' },
    { name: 'shortlisted', subject: 'You\'ve Been Shortlisted!', body: '<p>Default body</p>' },
    { name: 'interview-scheduled', subject: 'Interview Scheduled', body: '<p>Default body</p>' },
    { name: 'interview-reminder', subject: 'Interview Reminder — Tomorrow', body: '<p>Default body</p>' },
    { name: 'medical-pending', subject: 'Medical Examination Required', body: '<p>Default body</p>' },
    { name: 'medical-cleared', subject: 'Medical Cleared!', body: '<p>Default body</p>' },
    { name: 'enrolled', subject: 'Welcome to Aerojet Academy!', body: '<p>Default body</p>' },
    { name: 'rejected', subject: 'Application Update', body: '<p>Default body</p>' },
  ]

  let templatesCreated = 0
  for (const t of templates) {
    const existing = await prisma.emailTemplate.findUnique({ where: { name: t.name } })
    if (!existing) {
      await prisma.emailTemplate.create({
        data: { name: t.name, subject: t.subject, body: t.body, isActive: true },
      })
      templatesCreated++
    }
  }
  console.log(`    ✅ ${templatesCreated} email templates seeded`)

  console.log('\n🎉 Admissions seed complete!')
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
