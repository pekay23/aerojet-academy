import prisma from '../lib/prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Starting database seed...')

  // ============================================================================
  // 1. SYSTEM USERS
  // ============================================================================

  // Create Super Admin
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2026', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aerojet-academy.com' },
    update: {
      password: adminPassword,
      status: 'ACTIVE',
      mustChangePassword: false,
      staffProfile: {
        upsert: {
          create: {
            employeeId: 'AD-001',
            department: 'Administration',
            position: 'Super Administrator',
          },
          update: {},
        },
      },
    },
    create: {
      email: 'admin@aerojet-academy.com',
      academyEmail: 'admin@aerojet-academy.com',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          phone: '+233200000000',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
      staffProfile: {
        create: {
          employeeId: 'AD-001',
          department: 'Administration',
          position: 'Super Administrator',
        },
      },
    },
  })
  console.log(`✅ Super Admin: ${admin.email}`)

  // Create Staff user
  const staffPassword = await bcrypt.hash('Staff@2026', 12)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@aerojet-academy.com' },
    update: {
      staffProfile: {
        upsert: {
          create: {
            employeeId: 'ST-001',
            department: 'Academic Affairs',
            position: 'Academic Coordinator',
          },
          update: {},
        },
      },
    },
    create: {
      email: 'staff@aerojet-academy.com',
      academyEmail: 'staff@aerojet-academy.com',
      password: staffPassword,
      role: 'STAFF',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Staff',
          phone: '+233200000001',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
      staffProfile: {
        create: {
          employeeId: 'ST-001',
          department: 'Academic Affairs',
          position: 'Academic Coordinator',
        },
      },
    },
  })
  console.log(`✅ Staff: ${staff.email}`)

  // Create Instructor
  const instructorPassword = await bcrypt.hash('Instructor@2026', 12)
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@aerojet-academy.com' },
    update: {
      instructorProfile: {
        upsert: {
          create: {
            employeeId: 'IN-001',
            specialization: 'B1 Mechanical',
            qualifications: 'EASA-GH-2024-001',
          },
          update: {},
        },
      },
    },
    create: {
      email: 'instructor@aerojet-academy.com',
      academyEmail: 'instructor@aerojet-academy.com',
      password: instructorPassword,
      role: 'INSTRUCTOR',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Captain',
          lastName: 'Mensah',
          phone: '+233200000002',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
      instructorProfile: {
        create: {
          employeeId: 'IN-001',
          specialization: 'B1 Mechanical',
          qualifications: 'EASA-GH-2024-001',
        },
      },
    },
  })
  console.log(`✅ Instructor: ${instructor.email}`)

  // ============================================================================
  // 2. COURSE CATEGORIES
  // ============================================================================
  const coreCategory = await prisma.courseCategory.upsert({
    where: { name: 'Core Modules' },
    update: {},
    create: {
      name: 'Core Modules',
      description: 'Mandatory foundational modules (M1-M10)',
    },
  })

  const specialistCategory = await prisma.courseCategory.upsert({
    where: { name: 'Specialist Modules' },
    update: {},
    create: {
      name: 'Specialist Modules',
      description: 'Category-specific mechanical and turbine modules',
    },
  })

  const avionicsCategory = await prisma.courseCategory.upsert({
    where: { name: 'Avionics Modules' },
    update: {},
    create: {
      name: 'Avionics Modules',
      description: 'Electronic and systems modules (M13-M14)',
    },
  })
  console.log('✅ Course Categories seeded')

  // ============================================================================
  // 3. LICENSE CATEGORIES
  // ============================================================================
  const licenses = [
    { code: 'A', name: 'Category A \u2013 Line Maintenance Certifying Mechanic' },
    { code: 'B1.1', name: 'Aeroplanes Turbine \u2013 Mechanical' },
    { code: 'B1.2', name: 'Aeroplanes Piston \u2013 Mechanical' },
    { code: 'B1.3', name: 'Helicopters Turbine \u2013 Mechanical' },
    { code: 'B1.4', name: 'Helicopters Piston - Mechanical' },
    { code: 'B2', name: 'Avionics' },
    { code: 'B3', name: 'Non-pressurised Piston Aeroplanes \u22642,000 kg' },
  ]

  const createdLicenses: Record<string, any> = {}
  for (const lic of licenses) {
    createdLicenses[lic.code] = await prisma.licenseCategory.upsert({
      where: { code: lic.code },
      update: {},
      create: lic,
    })
  }
  console.log('✅ License Categories seeded')

  // ============================================================================
  // 4. STUDY PATHWAYS
  // ============================================================================
  const pathways = [
    {
      code: 'FULL_TIME_4Y',
      name: '4-Year Full-Time (Theory + OJT)',
      requiresAutoEnrollment: true,
      grantsTuitionAccess: true,
      includesOjt: true,
      description: 'Comprehensive Theory + OJT',
    },
    {
      code: 'FULL_TIME_2Y',
      name: '2-Year Full-Time (Theory Only)',
      requiresAutoEnrollment: true,
      grantsTuitionAccess: true,
      includesOjt: false,
      description: 'Theoretical training only',
    },
    {
      code: 'MILITARY_1Y',
      name: '1-Year Military Certification',
      requiresAutoEnrollment: true,
      grantsTuitionAccess: true,
      includesOjt: false,
      description: 'Accelerated for experienced personnel',
    },
    {
      code: 'MODULAR',
      name: 'Modular Route',
      requiresAutoEnrollment: false,
      grantsTuitionAccess: true,
      includesOjt: false,
      description: 'A la carte module booking',
    },
    {
      code: 'EXAM_ONLY',
      name: 'Exam-Only Route',
      requiresAutoEnrollment: false,
      grantsTuitionAccess: false,
      includesOjt: false,
      description: 'Self-study, exams only',
    },
  ]

  const createdPathways: Record<string, any> = {}
  for (const p of pathways) {
    createdPathways[p.code] = await prisma.studyPathwayModel.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    })
  }
  console.log('✅ Study Pathways seeded')

  // ============================================================================
  // 5. EASA MODULES (COURSES)
  // ============================================================================
  const moduleData = [
    {
      code: 'M1',
      name: 'Mathematics',
      subtitle: 'Arithmetic \u00b7 Algebra \u00b7 Geometry',
      description: 'Covers the essential mathematical foundation for all subsequent technical modules. Topics include arithmetic operations, fractions, decimals, percentages, algebra, logarithms, geometry, trigonometry, and co-ordinate geometry. Required by all licence categories.',
      duration: 20,
      price: 1190.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: [] as string[],
      requiresPrerequisite: false,
      topics: ['Arithmetic', 'Algebra', 'Geometry', 'Trigonometry', 'Logarithms', 'Statistics'],
      estimatedStudyHoursMin: 40,
      estimatedStudyHoursMax: 60,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M2',
      name: 'Physics',
      subtitle: 'Matter \u00b7 Mechanics \u00b7 Thermodynamics \u00b7 Optics',
      description: 'Provides the scientific underpinning for all engineering modules. Covers the structure of matter and atoms, mechanics (forces, energy, motion), fluid mechanics, thermodynamics, optics, and wave motion/sound. Bridges the gap between mathematics and engineering applications.',
      duration: 20,
      price: 1190.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: ['M1'],
      requiresPrerequisite: true,
      topics: ['Matter & Atoms', 'Mechanics', 'Fluid Dynamics', 'Thermodynamics', 'Optics', 'Wave Motion'],
      estimatedStudyHoursMin: 60,
      estimatedStudyHoursMax: 80,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M3',
      name: 'Electrical Fundamentals',
      subtitle: 'DC/AC Theory \u00b7 Circuits \u00b7 Motors & Generators',
      description: 'Comprehensive coverage of electrical theory from electron theory and static electricity through to complex AC circuits. Includes DC and AC sources, resistance, capacitance, inductance, transformers, filters, and motor/generator theory. Critical for both mechanical (B1) and avionics (B2) pathways.',
      duration: 24,
      price: 1400.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: ['M1', 'M2'],
      requiresPrerequisite: true,
      topics: ['DC Circuits', 'AC Theory', 'Capacitance', 'Magnetism', 'Inductance', 'Transformers', 'Motors'],
      estimatedStudyHoursMin: 80,
      estimatedStudyHoursMax: 120,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M4',
      name: 'Electronic Fundamentals',
      subtitle: 'Semiconductors \u00b7 PCBs \u00b7 Servomechanisms',
      description: 'Builds on Module 3 to cover semiconductor devices (diodes, transistors, integrated circuits), printed circuit boards, and servomechanisms (synchros). B2 licence requires deeper knowledge than B1. Not required for Category A. Foundational for understanding modern aircraft electronics.',
      duration: 20,
      price: 1190.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: ['M3'],
      requiresPrerequisite: true,
      topics: ['Diodes', 'Transistors', 'Integrated Circuits', 'PCBs', 'Synchros', 'Servomechanisms'],
      estimatedStudyHoursMin: 40,
      estimatedStudyHoursMax: 70,
      applicableCategories: ['B1', 'B2', 'B3'],
    },
    {
      code: 'M5',
      name: 'Digital Techniques',
      subtitle: 'Electronic Instrument Systems \u00b7 Avionics \u00b7 Data Buses',
      description: 'Covers the digital and avionics environment essential for modern aircraft maintenance. Topics include numbering systems, data conversion, logic circuits, microprocessors, data buses (ARINC 429, ARINC 629), multiplexing, fibre optics, electronic displays (EFIS), software management, and ESD precautions. B2 exam is significantly more extensive.',
      duration: 24,
      price: 1400.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: ['M1', 'M3', 'M4'],
      requiresPrerequisite: true,
      topics: ['Logic Circuits', 'Microprocessors', 'Data Buses', 'EFIS', 'Fibre Optics', 'ESD', 'Software Mgmt'],
      estimatedStudyHoursMin: 60,
      estimatedStudyHoursMax: 100,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M6',
      name: 'Materials & Hardware',
      subtitle: 'Metals \u00b7 Composites \u00b7 Fasteners \u00b7 Cables',
      description: 'Introduces the full range of aircraft materials (ferrous alloys, non-ferrous alloys, composites, non-metallics) and the hardware that holds aircraft together. Covers corrosion causes and prevention, fasteners, pipes and unions, springs, bearings, transmissions, control cables, and electrical connectors.',
      duration: 25,
      price: 1400.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: ['M2'],
      requiresPrerequisite: true,
      topics: ['Alloys', 'Composites', 'Corrosion', 'Fasteners', 'Bearings', 'Control Cables', 'Pipes'],
      estimatedStudyHoursMin: 80,
      estimatedStudyHoursMax: 120,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M7',
      name: 'Maintenance Practices',
      subtitle: 'Safety \u00b7 Tools \u00b7 Inspection \u00b7 Documentation',
      description: 'The core practical module covering the day-to-day activities of aircraft maintenance. Includes safety precautions, workshop practices, tools, test equipment, engineering drawings, fits and clearances, riveting, welding, aircraft weight and balance, handling/storage, disassembly/inspection/repair, and maintenance procedures. Updated June 2024 \u2014 essay component removed.',
      duration: 15,
      price: 1030.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: ['M1', 'M2', 'M6'],
      requiresPrerequisite: true,
      topics: ['Safety', 'Tools & Equipment', 'Riveting', 'Welding', 'Weight & Balance', 'Inspections', 'Documentation'],
      estimatedStudyHoursMin: 100,
      estimatedStudyHoursMax: 140,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M8',
      name: 'Basic Aerodynamics',
      subtitle: 'Atmosphere \u00b7 Lift & Drag \u00b7 Flight Stability',
      description: 'Builds on Module 2 physics to explain the principles of flight. Covers the International Standard Atmosphere (ISA), airflow over aerofoils, generation of lift and drag, theory of flight, high-speed flight (compressibility), and aircraft stability and control (static and dynamic). Essential groundwork for the aircraft-specific modules (11\u201313).',
      duration: 15,
      price: 1030.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: ['M2'],
      requiresPrerequisite: true,
      topics: ['ISA', 'Aerofoils', 'Lift & Drag', 'Theory of Flight', 'Compressibility', 'Stability'],
      estimatedStudyHoursMin: 40,
      estimatedStudyHoursMax: 60,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M9',
      name: 'Human Factors',
      subtitle: 'Performance \u00b7 Error \u00b7 CRM \u00b7 Safety Culture',
      description: 'Examines the human element in aviation maintenance safety. Covers human performance and limitations, social psychology, team dynamics and communication (CRM), workload, fatigue, stress, situational awareness, and maintenance error. Critically studies accident causation models. Essay requirement removed June 2024 \u2014 MCQ only.',
      duration: 15,
      price: 1030.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: [] as string[],
      requiresPrerequisite: false,
      topics: ['Human Performance', 'Error Models', 'CRM', 'Fatigue', 'Stress', 'Safety Culture'],
      estimatedStudyHoursMin: 30,
      estimatedStudyHoursMax: 50,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M10',
      name: 'Aviation Legislation',
      subtitle: 'EASA \u00b7 Part-M \u00b7 Part-145 \u00b7 Part-66',
      description: 'Covers the regulatory framework governing aviation maintenance. Topics include the role of ICAO and EASA, certifying staff regulations (Part-66), approved maintenance organisations (Part-145/CAMO), commercial air transport operations, aircraft certification, Part-M airworthiness, and international requirements. Essay requirement removed June 2024.',
      duration: 15,
      price: 1030.0,
      categoryId: coreCategory.id,
      moduleType: 'CORE' as const,
      prerequisites: [] as string[],
      requiresPrerequisite: false,
      topics: ['ICAO', 'EASA', 'Part-66', 'Part-145', 'Part-M / CAMO', 'Aircraft Certification'],
      estimatedStudyHoursMin: 40,
      estimatedStudyHoursMax: 60,
      applicableCategories: ['A', 'B1', 'B2', 'B3'],
    },
    {
      code: 'M11A',
      name: 'Turbine Aeroplane Aerodynamics, Structures & Systems',
      subtitle: 'Fixed-wing Turbine \u00b7 Cat A1/A3 \u00b7 B1.1/B1.3',
      description: 'The most extensive B1 module \u2014 covers all major systems of turbine-powered aeroplanes in detail. Includes advanced theory of flight, airframe structures (fuselage, wings, empennage), air conditioning & pressurisation, instruments/avionics, electrical power, flight controls, fuel systems, hydraulics, ice protection, landing gear, oxygen, pneumatics, and onboard maintenance systems (ATA chapters 21\u201345).',
      duration: 25,
      price: 1400.0,
      categoryId: specialistCategory.id,
      moduleType: 'SPECIALIST' as const,
      prerequisites: ['M1', 'M2', 'M3', 'M5', 'M6', 'M7', 'M8'],
      requiresPrerequisite: true,
      topics: ['Theory of Flight', 'Airframe Structures', 'Pressurisation', 'Flight Controls', 'Hydraulics', 'Fuel Systems', 'Landing Gear', 'OBMS'],
      estimatedStudyHoursMin: 200,
      estimatedStudyHoursMax: 280,
      applicableCategories: ['A', 'B1'],
    },
    {
      code: 'M11B',
      name: 'Piston Aeroplane Aerodynamics, Structures & Systems',
      subtitle: 'Fixed-wing Piston \u00b7 Cat A2 \u00b7 B1.2',
      description: 'Equivalent to Module 11A but scoped for piston-engine aeroplanes above 2,000 kg (A2/B1.2 subcategories). Covers airframe structures, flight controls, fuel systems, electrical systems, instruments, hydraulics, landing gear, and all major ATA systems relevant to piston-powered fixed-wing aircraft. Not applicable to B3.',
      duration: 25,
      price: 1400.0,
      categoryId: specialistCategory.id,
      moduleType: 'SPECIALIST' as const,
      prerequisites: ['M1', 'M2', 'M3', 'M5', 'M6', 'M7', 'M8'],
      requiresPrerequisite: true,
      topics: ['Piston Airframe', 'Flight Controls', 'Electrical Systems', 'Instruments', 'Fuel Systems', 'Landing Gear'],
      estimatedStudyHoursMin: 150,
      estimatedStudyHoursMax: 200,
      applicableCategories: ['A', 'B1'],
    },
    {
      code: 'M11C',
      name: 'Piston Aeroplane Aerodynamics, Structures & Systems (B3)',
      subtitle: 'Non-pressurised Light Aircraft \u00b7 Cat B3 \u00b7 \u22642,000 kg MTOM',
      description: 'Specifically scoped for Category B3 \u2014 non-pressurised piston-engine aeroplanes of 2,000 kg MTOM and below. Covers the same general subjects as 11B but with simpler systems appropriate to light aircraft: structures, flight controls, basic electrical systems, fuel systems, and landing gear.',
      duration: 25,
      price: 1400.0,
      categoryId: specialistCategory.id,
      moduleType: 'SPECIALIST' as const,
      prerequisites: ['M1', 'M2', 'M3', 'M5', 'M6', 'M7', 'M8'],
      requiresPrerequisite: true,
      topics: ['Light Aircraft Structures', 'Flight Controls', 'Basic Electrics', 'Fuel Systems', 'Landing Gear'],
      estimatedStudyHoursMin: 120,
      estimatedStudyHoursMax: 160,
      applicableCategories: ['B3'],
    },
    {
      code: 'M12',
      name: 'Helicopter Aerodynamics, Structures & Systems',
      subtitle: 'Rotary Wing \u00b7 Cat A3/A4 \u00b7 B1.3/B1.4',
      description: 'Helicopter-specific module covering rotary-wing aerodynamics, hover, climb, descent, and autorotation theory. Includes rotor systems (blade tracking, vibration), transmission (gearboxes, clutches), flight control systems (collective, cyclic, anti-torque), and all major helicopter systems: air conditioning, electrical power, fuel, hydraulics, ice protection, landing gear, and instruments.',
      duration: 25,
      price: 1400.0,
      categoryId: specialistCategory.id,
      moduleType: 'SPECIALIST' as const,
      prerequisites: ['M1', 'M2', 'M3', 'M5', 'M6', 'M7', 'M8'],
      requiresPrerequisite: true,
      topics: ['Rotary Aerodynamics', 'Rotor Systems', 'Transmission', 'Cyclic/Collective', 'Anti-torque', 'Autorotation', 'Vibration Analysis'],
      estimatedStudyHoursMin: 180,
      estimatedStudyHoursMax: 240,
      applicableCategories: ['A', 'B1'],
    },
    {
      code: 'M13',
      name: 'Aircraft Aerodynamics, Structures & Systems',
      subtitle: 'Avionics Focus \u00b7 Cat B2 Only',
      description: 'The B2-specific equivalent of Module 11. Provides avionics engineers with the comprehensive knowledge of aircraft systems they need to maintain and troubleshoot avionics, electrical systems, and instruments. Includes flight control surfaces, auto-flight (autopilot, autothrust), communications, navigation, electrical power, fuel systems, fire detection, landing gear, pressurisation, and IMA (Integrated Modular Avionics). Updated June 2024.',
      duration: 25,
      price: 1400.0,
      categoryId: avionicsCategory.id,
      moduleType: 'AVIONICS' as const,
      prerequisites: ['M1', 'M2', 'M3', 'M4', 'M5', 'M8'],
      requiresPrerequisite: true,
      topics: ['Autopilot / AFCS', 'Communications', 'Navigation', 'Electrical Power', 'IMA', 'EFIS/ECAM', 'Glass Cockpit'],
      estimatedStudyHoursMin: 250,
      estimatedStudyHoursMax: 320,
      applicableCategories: ['B2'],
    },
    {
      code: 'M14',
      name: 'Propulsion',
      subtitle: 'Engine Systems Interface \u00b7 Cat B2 Only',
      description: 'Provides B2 avionics engineers with essential propulsion knowledge needed to understand the engine/avionics interface. Covers turbine engine fundamentals, FADEC (Full Authority Digital Engine Control), engine indication systems (EICAS/ECAM), engine health monitoring, and the integration of propulsion systems with the wider aircraft avionics architecture.',
      duration: 15,
      price: 1090.0,
      categoryId: avionicsCategory.id,
      moduleType: 'AVIONICS' as const,
      prerequisites: ['M2', 'M3', 'M5', 'M13'],
      requiresPrerequisite: true,
      topics: ['Turbine Fundamentals', 'FADEC', 'EICAS/ECAM', 'Engine Monitoring', 'Propulsion Interface'],
      estimatedStudyHoursMin: 40,
      estimatedStudyHoursMax: 60,
      applicableCategories: ['B2'],
    },
    {
      code: 'M15',
      name: 'Gas Turbine Engine',
      subtitle: 'Turbofan \u00b7 Turboprop \u00b7 Turboshaft \u00b7 APU',
      description: 'Comprehensive coverage of gas turbine engines for turbine-rated licences (A1/A3/B1.1/B1.3). Covers thermodynamic fundamentals, engine performance, intake, compressors, combustion, turbine, exhaust, bearings/seals, lubrication, fuel systems, air systems, starting/ignition, engine indication, power augmentation, turboprop/turboshaft/APU variants, powerplant installation, fire protection, engine monitoring, and storage.',
      duration: 25,
      price: 1400.0,
      categoryId: specialistCategory.id,
      moduleType: 'SPECIALIST' as const,
      prerequisites: ['M1', 'M2', 'M3', 'M6', 'M7', 'M8'],
      requiresPrerequisite: true,
      topics: ['Thermodynamics', 'Compressors', 'Combustion', 'Turbine', 'Lubrication', 'Fuel Systems', 'FADEC', 'APU', 'Turboprop'],
      estimatedStudyHoursMin: 150,
      estimatedStudyHoursMax: 200,
      applicableCategories: ['A', 'B1'],
    },
    {
      code: 'M16',
      name: 'Piston Engine',
      subtitle: 'Reciprocating Engines \u00b7 Cat A2/A4 \u00b7 B1.2/B1.4 \u00b7 B3',
      description: 'Covers reciprocating piston engines used in non-turbine aircraft. Topics include engine fundamentals (2/4-stroke cycles, engine types), performance, engine construction, induction/exhaust/cooling systems, supercharging, lubrication systems, fuel systems and carburettors, ignition systems, engine starting, and engine monitoring. Required for piston-rated licence subcategories.',
      duration: 25,
      price: 1400.0,
      categoryId: specialistCategory.id,
      moduleType: 'SPECIALIST' as const,
      prerequisites: ['M1', 'M2', 'M6', 'M7'],
      requiresPrerequisite: true,
      topics: ['Engine Cycles', 'Engine Construction', 'Carburettors', 'Magneto Ignition', 'Supercharging', 'Lubrication', 'Cooling'],
      estimatedStudyHoursMin: 120,
      estimatedStudyHoursMax: 160,
      applicableCategories: ['A', 'B1', 'B3'],
    },
    {
      code: 'M17',
      name: 'Propeller',
      subtitle: 'Fixed & Variable Pitch \u00b7 Governors \u00b7 Synchronisation',
      description: 'Covers propeller theory, construction, and maintenance for piston and turboprop aircraft. Topics include propeller theory (blade angle, pitch, slip), propeller construction (fixed pitch, ground adjustable, variable pitch), propeller governor and control systems, synchronisation/synchrophasing, ice protection, propeller storage, and inspection/maintenance procedures.',
      duration: 15,
      price: 1090.0,
      categoryId: specialistCategory.id,
      moduleType: 'SPECIALIST' as const,
      prerequisites: ['M2', 'M6', 'M8'],
      requiresPrerequisite: true,
      topics: ['Propeller Theory', 'Fixed Pitch', 'Variable Pitch', 'Governor Systems', 'Synchronisation', 'Ice Protection'],
      estimatedStudyHoursMin: 40,
      estimatedStudyHoursMax: 60,
      applicableCategories: ['A', 'B1', 'B3'],
    },
  ]

  const createdModules: Record<string, any> = {}
  for (const mod of moduleData) {
    createdModules[mod.code] = await prisma.course.upsert({
      where: { code: mod.code },
      update: {
        name: mod.name,
        description: mod.description,
        subtitle: mod.subtitle,
        duration: mod.duration,
        price: mod.price,
        categoryId: mod.categoryId,
        moduleType: mod.moduleType,
        prerequisites: mod.prerequisites,
        requiresPrerequisite: mod.requiresPrerequisite,
        topics: mod.topics,
        estimatedStudyHoursMin: mod.estimatedStudyHoursMin,
        estimatedStudyHoursMax: mod.estimatedStudyHoursMax,
        applicableCategories: mod.applicableCategories,
        isActive: true,
      },
      create: {
        code: mod.code,
        name: mod.name,
        description: mod.description,
        subtitle: mod.subtitle,
        duration: mod.duration,
        price: mod.price,
        categoryId: mod.categoryId,
        moduleType: mod.moduleType,
        prerequisites: mod.prerequisites,
        requiresPrerequisite: mod.requiresPrerequisite,
        topics: mod.topics,
        estimatedStudyHoursMin: mod.estimatedStudyHoursMin,
        estimatedStudyHoursMax: mod.estimatedStudyHoursMax,
        applicableCategories: mod.applicableCategories,
        isActive: true,
      },
    })
  }
  console.log(`✅ ${moduleData.length} EASA Modules seeded`)

  // ============================================================================
  // 6. EXAM COMPONENTS (Per-Category with Question Counts & Durations)
  // ============================================================================
  console.log('📝 Seeding Exam Components...')

  // Per-category exam specifications from EASA Part 66 regulation
  // Format: { code, courseCode, categoryCode, name, type, questionCount, duration, individualPrice, poolPrice }
  const examComponents = [
    // M1 — Mathematics
    { code: 'M1-A',  courseCode: 'M1', categoryCode: 'A',  name: 'Mathematics MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 16, duration: 20 },
    { code: 'M1-B1', courseCode: 'M1', categoryCode: 'B1', name: 'Mathematics MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 32, duration: 40 },
    { code: 'M1-B2', courseCode: 'M1', categoryCode: 'B2', name: 'Mathematics MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 32, duration: 40 },
    { code: 'M1-B3', courseCode: 'M1', categoryCode: 'B3', name: 'Mathematics MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 30, duration: 40 },

    // M2 — Physics
    { code: 'M2-A',  courseCode: 'M2', categoryCode: 'A',  name: 'Physics MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 32, duration: 40 },
    { code: 'M2-B1', courseCode: 'M2', categoryCode: 'B1', name: 'Physics MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 52, duration: 65 },
    { code: 'M2-B2', courseCode: 'M2', categoryCode: 'B2', name: 'Physics MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 52, duration: 65 },
    { code: 'M2-B3', courseCode: 'M2', categoryCode: 'B3', name: 'Physics MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 30, duration: 40 },

    // M3 — Electrical Fundamentals
    { code: 'M3-A',  courseCode: 'M3', categoryCode: 'A',  name: 'Electrical Fundamentals MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 20, duration: 25 },
    { code: 'M3-B1', courseCode: 'M3', categoryCode: 'B1', name: 'Electrical Fundamentals MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 52, duration: 65 },
    { code: 'M3-B2', courseCode: 'M3', categoryCode: 'B2', name: 'Electrical Fundamentals MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 52, duration: 65 },
    { code: 'M3-B3', courseCode: 'M3', categoryCode: 'B3', name: 'Electrical Fundamentals MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 24, duration: 30 },

    // M4 — Electronic Fundamentals (not required for Cat A)
    { code: 'M4-B1', courseCode: 'M4', categoryCode: 'B1', name: 'Electronic Fundamentals MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 20, duration: 25 },
    { code: 'M4-B2', courseCode: 'M4', categoryCode: 'B2', name: 'Electronic Fundamentals MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 40, duration: 50 },
    { code: 'M4-B3', courseCode: 'M4', categoryCode: 'B3', name: 'Electronic Fundamentals MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 20, duration: 25 },

    // M5 — Digital Techniques
    { code: 'M5-A',  courseCode: 'M5', categoryCode: 'A',  name: 'Digital Techniques MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 20, duration: 25 },
    { code: 'M5-B1', courseCode: 'M5', categoryCode: 'B1', name: 'Digital Techniques MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 40, duration: 50 },
    { code: 'M5-B2', courseCode: 'M5', categoryCode: 'B2', name: 'Digital Techniques MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 72, duration: 90 },
    { code: 'M5-B3', courseCode: 'M5', categoryCode: 'B3', name: 'Digital Techniques MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 20, duration: 25 },

    // M6 — Materials & Hardware
    { code: 'M6-A',  courseCode: 'M6', categoryCode: 'A',  name: 'Materials & Hardware MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 52, duration: 65 },
    { code: 'M6-B1', courseCode: 'M6', categoryCode: 'B1', name: 'Materials & Hardware MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 80, duration: 100 },
    { code: 'M6-B2', courseCode: 'M6', categoryCode: 'B2', name: 'Materials & Hardware MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 60, duration: 75 },
    { code: 'M6-B3', courseCode: 'M6', categoryCode: 'B3', name: 'Materials & Hardware MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 80, duration: 100 },

    // M7 — Maintenance Practices (post June 2024)
    { code: 'M7-A',  courseCode: 'M7', categoryCode: 'A',  name: 'Maintenance Practices MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 76, duration: 95 },
    { code: 'M7-B1', courseCode: 'M7', categoryCode: 'B1', name: 'Maintenance Practices MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 80, duration: 100 },
    { code: 'M7-B2', courseCode: 'M7', categoryCode: 'B2', name: 'Maintenance Practices MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 60, duration: 75 },
    { code: 'M7-B3', courseCode: 'M7', categoryCode: 'B3', name: 'Maintenance Practices MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 80, duration: 100 },

    // M8 — Basic Aerodynamics
    { code: 'M8-A',  courseCode: 'M8', categoryCode: 'A',  name: 'Basic Aerodynamics MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 24, duration: 30 },
    { code: 'M8-B1', courseCode: 'M8', categoryCode: 'B1', name: 'Basic Aerodynamics MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 24, duration: 30 },
    { code: 'M8-B2', courseCode: 'M8', categoryCode: 'B2', name: 'Basic Aerodynamics MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 24, duration: 30 },
    { code: 'M8-B3', courseCode: 'M8', categoryCode: 'B3', name: 'Basic Aerodynamics MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 24, duration: 30 },

    // M9 — Human Factors (post June 2024 — MCQ only)
    { code: 'M9-A',  courseCode: 'M9', categoryCode: 'A',  name: 'Human Factors MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 20, duration: 25 },
    { code: 'M9-B1', courseCode: 'M9', categoryCode: 'B1', name: 'Human Factors MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 20, duration: 25 },
    { code: 'M9-B2', courseCode: 'M9', categoryCode: 'B2', name: 'Human Factors MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 20, duration: 25 },
    { code: 'M9-B3', courseCode: 'M9', categoryCode: 'B3', name: 'Human Factors MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 16, duration: 20 },

    // M10 — Aviation Legislation (post June 2024 — MCQ only)
    { code: 'M10-A',  courseCode: 'M10', categoryCode: 'A',  name: 'Aviation Legislation MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 32, duration: 40 },
    { code: 'M10-B1', courseCode: 'M10', categoryCode: 'B1', name: 'Aviation Legislation MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 40, duration: 50 },
    { code: 'M10-B2', courseCode: 'M10', categoryCode: 'B2', name: 'Aviation Legislation MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 40, duration: 50 },
    { code: 'M10-B3', courseCode: 'M10', categoryCode: 'B3', name: 'Aviation Legislation MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 32, duration: 40 },

    // M11A — Turbine Aeroplane Aerodynamics, Structures & Systems
    { code: 'M11A-A',  courseCode: 'M11A', categoryCode: 'A',  name: 'Turbine Aeroplane Systems MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 100, duration: 125 },
    { code: 'M11A-B1', courseCode: 'M11A', categoryCode: 'B1', name: 'Turbine Aeroplane Systems MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 128, duration: 160 },

    // M11B — Piston Aeroplane Aerodynamics, Structures & Systems
    { code: 'M11B-A',  courseCode: 'M11B', categoryCode: 'A',  name: 'Piston Aeroplane Systems MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 72, duration: 90 },
    { code: 'M11B-B1', courseCode: 'M11B', categoryCode: 'B1', name: 'Piston Aeroplane Systems MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 92, duration: 115 },

    // M11C — Piston Aeroplane (B3)
    { code: 'M11C-B3', courseCode: 'M11C', categoryCode: 'B3', name: 'Piston Aeroplane Systems MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 72, duration: 90 },

    // M12 — Helicopter Aerodynamics, Structures & Systems
    { code: 'M12-A',  courseCode: 'M12', categoryCode: 'A',  name: 'Helicopter Systems MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 82, duration: 103 },
    { code: 'M12-B1', courseCode: 'M12', categoryCode: 'B1', name: 'Helicopter Systems MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 108, duration: 135 },

    // M13 — Aircraft Aerodynamics, Structures & Systems (B2 only)
    { code: 'M13-B2', courseCode: 'M13', categoryCode: 'B2', name: 'Aircraft Systems MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 180, duration: 225 },

    // M14 — Propulsion (B2 only)
    { code: 'M14-B2', courseCode: 'M14', categoryCode: 'B2', name: 'Propulsion MCQ (Cat B2)', type: 'MCQ' as const, questionCount: 24, duration: 30 },

    // M15 — Gas Turbine Engine
    { code: 'M15-A',  courseCode: 'M15', categoryCode: 'A',  name: 'Gas Turbine Engine MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 60, duration: 75 },
    { code: 'M15-B1', courseCode: 'M15', categoryCode: 'B1', name: 'Gas Turbine Engine MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 92, duration: 115 },

    // M16 — Piston Engine
    { code: 'M16-A',  courseCode: 'M16', categoryCode: 'A',  name: 'Piston Engine MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 52, duration: 65 },
    { code: 'M16-B1', courseCode: 'M16', categoryCode: 'B1', name: 'Piston Engine MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 72, duration: 90 },
    { code: 'M16-B3', courseCode: 'M16', categoryCode: 'B3', name: 'Piston Engine MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 68, duration: 85 },

    // M17 — Propeller
    { code: 'M17-A',  courseCode: 'M17', categoryCode: 'A',  name: 'Propeller MCQ (Cat A)',  type: 'MCQ' as const, questionCount: 20, duration: 25 },
    { code: 'M17-B1', courseCode: 'M17', categoryCode: 'B1', name: 'Propeller MCQ (Cat B1)', type: 'MCQ' as const, questionCount: 32, duration: 40 },
    { code: 'M17-B3', courseCode: 'M17', categoryCode: 'B3', name: 'Propeller MCQ (Cat B3)', type: 'MCQ' as const, questionCount: 28, duration: 35 },
  ]

  for (const exam of examComponents) {
    await prisma.examComponent.upsert({
      where: { code: exam.code },
      update: {
        name: exam.name,
        type: exam.type,
        questionCount: exam.questionCount,
        duration: exam.duration,
        categoryCode: exam.categoryCode,
        individualPrice: 520.0,
        poolPrice: 300.0,
      },
      create: {
        courseId: createdModules[exam.courseCode].id,
        code: exam.code,
        name: exam.name,
        type: exam.type,
        questionCount: exam.questionCount,
        duration: exam.duration,
        categoryCode: exam.categoryCode,
        individualPrice: 520.0,
        poolPrice: 300.0,
      },
    })
  }
  console.log(`✅ ${examComponents.length} Exam Components seeded`)

  // ============================================================================
  // 7. LICENSE MODULE REQUIREMENTS (Overlap Logic)
  // ============================================================================
  console.log('🔗 Mapping modules to licenses...')
  const requirementsMap: Record<string, string[]> = {
    A: ['M1', 'M2', 'M3', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10'],
    'B1.1': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11A', 'M15', 'M17'],
    'B1.2': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11B', 'M16', 'M17'],
    'B1.3': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M12', 'M15'],
    'B1.4': ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M12', 'M16'],
    B2: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M13', 'M14'],
    B3: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11C', 'M16', 'M17'],
  }

  for (const [licenseCode, requiredModules] of Object.entries(requirementsMap)) {
    const licenseId = createdLicenses[licenseCode].id

    for (const modCode of requiredModules) {
      const courseId = createdModules[modCode].id

      await prisma.licenseModuleRequirement.upsert({
        where: {
          licenseCategoryId_courseId: {
            licenseCategoryId: licenseId,
            courseId: courseId,
          },
        },
        update: {},
        create: {
          licenseCategoryId: licenseId,
          courseId: courseId,
        },
      })
    }
  }

  // ============================================================================
  // 8. FULL-TIME PROGRAMMES
  // ============================================================================
  const programmes = [
    {
      code: 'FT_4Y_B1B2',
      name: 'Four-Year Full-Time B1.1 & B2 Licence Programme',
      durationYears: 4,
      totalFee: 13500.0, // Per year
      description: 'Comprehensive theory, advanced hand-skills, structured work-experience.',
    },
    {
      code: 'FT_2Y_B1',
      name: 'Two-Year Full-Time B1.1 Licence Programme',
      durationYears: 2,
      totalFee: 11250.0, // Per year
      description: 'Theory + hand-skills, learning materials, PPE.',
    },
    {
      code: 'MIL_1Y_B1',
      name: '12-Month B1.1 Engineer Certification',
      durationYears: 1,
      totalFee: 9540.0, // Total
      description:
        'B1.1 theory + EASA exams (no hand-skills). Scheduled for working professionals.',
    },
  ]

  for (const prog of programmes) {
    await prisma.fullTimeProgramme.upsert({
      where: { code: prog.code },
      update: prog,
      create: {
        code: prog.code,
        name: prog.name,
        durationYears: prog.durationYears,
        totalFee: prog.totalFee,
        description: prog.description,
        isActive: true,
      },
    })
  }
  console.log('✅ Full-Time Programmes seeded')

  // ============================================================================
  // 9. ACADEMIC YEAR & SEMESTERS (2026/2027)
  // ============================================================================
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2026/2027' },
    update: {},
    create: {
      name: '2026/2027',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isActive: true,
    },
  })

  const semester1 = await prisma.semester.upsert({
    where: {
      id:
        (
          await prisma.semester.findFirst({
            where: { academicYearId: academicYear.id, name: 'Semester 1' },
          })
        )?.id ?? 'nonexistent',
    },
    update: {},
    create: {
      name: 'Semester 1',
      academicYearId: academicYear.id,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-01-31'),
      isActive: true,
    },
  })

  const semester2 = await prisma.semester.upsert({
    where: {
      id:
        (
          await prisma.semester.findFirst({
            where: { academicYearId: academicYear.id, name: 'Semester 2' },
          })
        )?.id ?? 'nonexistent-2',
    },
    update: {},
    create: {
      name: 'Semester 2',
      academicYearId: academicYear.id,
      startDate: new Date('2027-02-01'),
      endDate: new Date('2027-06-30'),
      isActive: false,
    },
  })
  console.log('✅ Academic Year 2026/2027 and Semesters seeded')

  // ============================================================================
  // 10. PROGRAMME YEARS
  // ============================================================================
  // Fetch programmes by code (already upserted above)
  const prog4Y = await prisma.fullTimeProgramme.findUnique({ where: { code: 'FT_4Y_B1B2' } })
  const prog2Y = await prisma.fullTimeProgramme.findUnique({ where: { code: 'FT_2Y_B1' } })
  const prog1Y = await prisma.fullTimeProgramme.findUnique({ where: { code: 'MIL_1Y_B1' } })

  if (prog4Y) {
    const years4Y = [
      {
        yearNumber: 1,
        yearFeeAmount: 13500,
        seatConfirmationFee: 5400,
        firstPaymentAmount: 4050,
        sem1: '2026-09-01',
        sem2: '2027-02-01',
      },
      {
        yearNumber: 2,
        yearFeeAmount: 13500,
        seatConfirmationFee: 6750,
        firstPaymentAmount: 6750,
        sem1: '2027-09-01',
        sem2: '2028-02-01',
      },
      {
        yearNumber: 3,
        yearFeeAmount: 13500,
        seatConfirmationFee: 6750,
        firstPaymentAmount: 6750,
        sem1: '2028-09-01',
        sem2: '2029-02-01',
      },
      {
        yearNumber: 4,
        yearFeeAmount: 13500,
        seatConfirmationFee: 6750,
        firstPaymentAmount: 6750,
        sem1: '2029-09-01',
        sem2: '2030-02-01',
      },
    ]
    for (const y of years4Y) {
      await prisma.programmeYear.upsert({
        where: { programmeId_yearNumber: { programmeId: prog4Y.id, yearNumber: y.yearNumber } },
        update: {
          yearFeeAmount: y.yearFeeAmount,
          seatConfirmationFee: y.seatConfirmationFee,
          firstPaymentAmount: y.firstPaymentAmount,
        },
        create: {
          programmeId: prog4Y.id,
          yearNumber: y.yearNumber,
          yearFeeAmount: y.yearFeeAmount,
          seatConfirmationFee: y.seatConfirmationFee,
          firstPaymentAmount: y.firstPaymentAmount,
          semesters: [
            {
              name: 'Semester 1',
              startDate: new Date(y.sem1).toISOString(),
              endDate: new Date(y.sem1).toISOString(),
            },
            {
              name: 'Semester 2',
              startDate: new Date(y.sem2).toISOString(),
              endDate: new Date(y.sem2).toISOString(),
            },
          ],
          isActive: true,
        },
      })
    }
  }

  if (prog2Y) {
    const years2Y = [
      {
        yearNumber: 1,
        yearFeeAmount: 11250,
        seatConfirmationFee: 4500,
        firstPaymentAmount: 3375,
        sem1: '2026-09-01',
        sem2: '2027-02-01',
      },
      {
        yearNumber: 2,
        yearFeeAmount: 11250,
        seatConfirmationFee: 5625,
        firstPaymentAmount: 5625,
        sem1: '2027-09-01',
        sem2: '2028-02-01',
      },
    ]
    for (const y of years2Y) {
      await prisma.programmeYear.upsert({
        where: { programmeId_yearNumber: { programmeId: prog2Y.id, yearNumber: y.yearNumber } },
        update: {
          yearFeeAmount: y.yearFeeAmount,
          seatConfirmationFee: y.seatConfirmationFee,
          firstPaymentAmount: y.firstPaymentAmount,
        },
        create: {
          programmeId: prog2Y.id,
          yearNumber: y.yearNumber,
          yearFeeAmount: y.yearFeeAmount,
          seatConfirmationFee: y.seatConfirmationFee,
          firstPaymentAmount: y.firstPaymentAmount,
          semesters: [
            {
              name: 'Semester 1',
              startDate: new Date(y.sem1).toISOString(),
              endDate: new Date(y.sem1).toISOString(),
            },
            {
              name: 'Semester 2',
              startDate: new Date(y.sem2).toISOString(),
              endDate: new Date(y.sem2).toISOString(),
            },
          ],
          isActive: true,
        },
      })
    }
  }

  if (prog1Y) {
    await prisma.programmeYear.upsert({
      where: { programmeId_yearNumber: { programmeId: prog1Y.id, yearNumber: 1 } },
      update: { yearFeeAmount: 9540 },
      create: {
        programmeId: prog1Y.id,
        yearNumber: 1,
        yearFeeAmount: 9540,
        seatConfirmationFee: 3816,
        firstPaymentAmount: 2862,
        semesters: [
          {
            name: 'Semester 1',
            startDate: new Date('2026-09-01').toISOString(),
            endDate: new Date('2026-09-01').toISOString(),
          },
          {
            name: 'Semester 2',
            startDate: new Date('2027-02-01').toISOString(),
            endDate: new Date('2027-02-01').toISOString(),
          },
        ],
        isActive: true,
      },
    })
  }
  console.log('✅ Programme Years seeded')

  // ============================================================================
  // 11. ACADEMIC TERMS + MODULE ASSIGNMENTS PER PATHWAY
  // ============================================================================
  // Helper: upsert an AcademicTerm and assign modules to it
  async function seedTerm(
    pathwayCode: string,
    yearNumber: number,
    semesterNumber: number,
    moduleCodes: string[]
  ) {
    const pathway = createdPathways[pathwayCode]
    if (!pathway) return

    // Find or create the term
    let term = await prisma.academicTerm.findFirst({
      where: { pathwayId: pathway.id, yearNumber, semesterNumber },
    })
    if (!term) {
      term = await prisma.academicTerm.create({
        data: { pathwayId: pathway.id, yearNumber, semesterNumber },
      })
    }

    // Assign modules
    for (const code of moduleCodes) {
      const course = createdModules[code]
      if (!course) continue
      await prisma.termCourseAssignment.upsert({
        where: { termId_courseId: { termId: term.id, courseId: course.id } },
        update: {},
        create: { termId: term.id, courseId: course.id },
      })
    }
  }

  // 4-Year B1.1/B2 Pathway
  // Y1-S1: Foundational science (M1-M4)
  await seedTerm('FULL_TIME_4Y', 1, 1, ['M1', 'M2', 'M3', 'M4'])
  // Y1-S2: Applied science (M5-M8)
  await seedTerm('FULL_TIME_4Y', 1, 2, ['M5', 'M6', 'M7', 'M8'])
  // Y2-S1: Human/Legal + Specialist intro (M9, M10, M11, M13)
  await seedTerm('FULL_TIME_4Y', 2, 1, ['M9', 'M10', 'M11', 'M13'])
  // Y2-S2: Advanced specialist (M14, M15, M17 — dedup filters to student's license)
  await seedTerm('FULL_TIME_4Y', 2, 2, ['M12', 'M14', 'M15', 'M16', 'M17'])
  // Y3 & Y4 are OJT — no module assignments

  // 2-Year B1.1 Pathway
  await seedTerm('FULL_TIME_2Y', 1, 1, ['M1', 'M2', 'M3', 'M4', 'M5'])
  await seedTerm('FULL_TIME_2Y', 1, 2, ['M6', 'M7', 'M8', 'M9', 'M10'])
  await seedTerm('FULL_TIME_2Y', 2, 1, ['M11', 'M13', 'M15', 'M14'])
  await seedTerm('FULL_TIME_2Y', 2, 2, ['M12', 'M16', 'M17'])

  // Military 1-Year Pathway
  await seedTerm('MILITARY_1Y', 1, 1, ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'])
  await seedTerm('MILITARY_1Y', 1, 2, ['M8', 'M9', 'M10', 'M11', 'M13', 'M15'])

  console.log('✅ Academic Terms and Module Assignments seeded')

  // ============================================================================
  // 13. SYSTEM SETTINGS
  // ============================================================================
  const settings = [
    {
      key: 'academy_name',
      value: 'Aerojet Aviation Training Academy',
      type: 'STRING',
      description: 'general',
    },
    {
      key: 'academy_email',
      value: 'info@aerojet-academy.com',
      type: 'STRING',
      description: 'general',
    },
    { key: 'academy_phone', value: '+233 30 123 4567', type: 'STRING', description: 'general' },
    { key: 'bank_name', value: 'FNB Bank', type: 'STRING', description: 'bank' },
    { key: 'bank_account_name', value: 'AEROJET FOUNDATION', type: 'STRING', description: 'bank' },
    { key: 'bank_account_number', value: '1020003980687', type: 'STRING', description: 'bank' },
    { key: 'bank_swift', value: 'FIRNGHACXXX', type: 'STRING', description: 'bank' },
    { key: 'registration_open', value: 'true', type: 'BOOLEAN', description: 'registration' },
    { key: 'registration_fee', value: '350', type: 'NUMBER', description: 'Registration Fee' },
    {
      key: 'registration_currency',
      value: 'GHS',
      type: 'STRING',
      description: 'Registration Currency',
    },

    // Exam Pricing — admin-editable at runtime
    { key: 'pool_exam_fee', value: '300', type: 'NUMBER', description: 'Pool seat price (EUR)' },
    {
      key: 'individual_exam_fee',
      value: '520',
      type: 'NUMBER',
      description: 'Individual exam seat price (EUR)',
    },
    {
      key: 'multi_pool_discount_fee',
      value: '270',
      type: 'NUMBER',
      description: 'Multi-pool/Ambassador discounted seat price (EUR)',
    },
    {
      key: 'two_seat_bundle_price',
      value: '980',
      type: 'NUMBER',
      description: 'Two-seat bundle price (EUR)',
    },
    {
      key: 'four_seat_bundle_price',
      value: '1900',
      type: 'NUMBER',
      description: 'Four-seat bundle price (EUR)',
    },
    { key: 'resit_exam_fee', value: '480', type: 'NUMBER', description: 'Resit exam fee (EUR)' },
    {
      key: 'group_charter_fee',
      value: '7500',
      type: 'NUMBER',
      description: 'Group charter fee (EUR)',
    },
    {
      key: 'late_booking_surcharge',
      value: '50',
      type: 'NUMBER',
      description: 'Late booking surcharge (EUR)',
    },
    {
      key: 'module_change_fee',
      value: '50',
      type: 'NUMBER',
      description: 'Module change admin fee (EUR)',
    },
    {
      key: 'late_booking_days',
      value: '14',
      type: 'NUMBER',
      description: 'Days before exam triggering late surcharge',
    },
    {
      key: 'ambassador_credit_amount',
      value: '100',
      type: 'NUMBER',
      description: 'Ambassador wallet credit (EUR)',
    },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('✅ System Settings seeded')

  // ============================================================================
  // 10. DEMO STUDENT & APPLICANT
  // ============================================================================
  const studentPassword = await bcrypt.hash('Student@2026', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@aerojet-academy.com' },
    update: {
      // Ensure credentials are always fresh when re-seeding
      password: studentPassword,
      status: 'ACTIVE',
      emailVerified: new Date(),
      mustChangePassword: false,
    },
    create: {
      email: 'student@aerojet-academy.com',
      academyEmail: 'k.owusu@aerojet-academy.com',
      password: studentPassword,
      role: 'STUDENT',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Kwame',
          lastName: 'Owusu',
          phone: '+233200000003',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
      studentProfile: {
        create: {
          studentId: 'AJA-2026-0001',
          enrollmentType: 'FULL_TIME',
          enrollmentStatus: 'ENROLLED',
          enrollmentDate: new Date(),
          pathwayId: createdPathways['FULL_TIME_4Y'].id,
        },
      },
      wallet: {
        create: {
          balance: 0,
          reservedBalance: 0,
          availableBalance: 0,
          currency: 'EUR',
        },
      },
    },
  })
  console.log(`✅ Student: ${student.email}`)

  const applicantPassword = await bcrypt.hash('Applicant@2026', 12)
  const applicant = await prisma.user.upsert({
    where: { email: 'applicant@example.com' },
    update: {},
    create: {
      email: 'applicant@example.com',
      password: applicantPassword,
      role: 'APPLICANT',
      status: 'ACTIVE',
      emailVerified: new Date(),
      registrationCode: 'AERO-2026-DEMO01',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Ama',
          lastName: 'Adjei',
          phone: '+233200000004',
          nationality: 'Ghanaian',
          country: 'Ghana',
        },
      },
    },
  })
  console.log(`✅ Applicant: ${applicant.email}`)

  // ============================================================================
  // PAYMENT METHODS — Migrate from flat SystemSettings if needed
  // ============================================================================

  const existingMethods = await prisma.paymentMethod.count()
  if (existingMethods === 0) {
    // Check if there are legacy bank settings to migrate
    const legacySettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'bank_name',
            'bank_account_name',
            'bank_account_number',
            'bank_swift',
            'bank_branch',
            'bank_currency',
          ],
        },
      },
    })
    const legacy: Record<string, string> = {}
    for (const s of legacySettings) legacy[s.key] = s.value

    if (legacy.bank_name || legacy.bank_account_number) {
      await prisma.paymentMethod.create({
        data: {
          type: 'BANK_TRANSFER',
          label: `${legacy.bank_name || 'Bank Transfer'} (${legacy.bank_currency || 'GHS'})`,
          currency: legacy.bank_currency || 'GHS',
          isActive: true,
          sortOrder: 0,
          bankName: legacy.bank_name || null,
          bankAccountName: legacy.bank_account_name || null,
          bankAccountNumber: legacy.bank_account_number || null,
          bankSwiftCode: legacy.bank_swift || null,
          bankBranch: legacy.bank_branch || null,
        },
      })
      console.log('✅ Migrated legacy bank settings to PaymentMethod')
    } else {
      // Create a default placeholder payment method
      await prisma.paymentMethod.create({
        data: {
          type: 'BANK_TRANSFER',
          label: 'FNB Bank (GHS)',
          currency: 'GHS',
          isActive: true,
          sortOrder: 0,
          bankName: 'FNB Bank',
          bankAccountName: 'AEROJET FOUNDATION',
          bankAccountNumber: '1020003980687',
          bankSwiftCode: 'FIRNGHACXXX',
          bankBranch: '330102',
        },
      })
      console.log('✅ Created default PaymentMethod (FNB Bank)')
    }
  } else {
    console.log(`⏭ PaymentMethod already has ${existingMethods} records, skipping`)
  }

  // ============================================================================
  // EXAM EVENTS & POOLS (for dev/testing)
  // ============================================================================

  const existingEvents = await prisma.examEvent.count()
  if (existingEvents === 0) {
    const eventStart = new Date()
    eventStart.setMonth(eventStart.getMonth() + 3)
    eventStart.setHours(0, 0, 0, 0)

    const eventEnd = new Date(eventStart)
    eventEnd.setDate(eventEnd.getDate() + 1)

    const paymentDeadline = new Date(eventStart)
    paymentDeadline.setDate(paymentDeadline.getDate() - 21)

    const joinDeadline = new Date(eventStart)
    joinDeadline.setDate(joinDeadline.getDate() - 45)

    const examEvent = await prisma.examEvent.create({
      data: {
        name: `${eventStart.toLocaleString('en', { month: 'short' })} ${eventStart.getFullYear()} Exam Event`,
        startDate: eventStart,
        endDate: eventEnd,
        paymentDeadline,
        joinDeadline,
        minRevenueTarget: 25000,
        status: 'OPEN',
      },
    })
    console.log(`✅ Created ExamEvent: ${examEvent.name}`)

    // Pool A — Morning session
    const poolAStart = new Date(eventStart)
    poolAStart.setHours(9, 0, 0, 0)
    const poolAEnd = new Date(eventStart)
    poolAEnd.setHours(12, 0, 0, 0)

    // Get first 4 exam components for allowed modules
    const examComponents = await prisma.examComponent.findMany({
      take: 4,
      include: { course: true },
      orderBy: { course: { code: 'asc' } },
    })

    const allowedModules = examComponents.map((ec) => ec.course?.code || ec.id)

    await prisma.examPool.create({
      data: {
        eventId: examEvent.id,
        name: 'Pool A — Morning',
        examDate: eventStart,
        examStartTime: poolAStart,
        examEndTime: poolAEnd,
        minCandidates: 25,
        maxCandidates: 28,
        moduleDiversityCap: 4,
        seatPrice: 300,
        status: 'OPEN',
        allowedModules,
      },
    })
    console.log('✅ Created ExamPool: Pool A — Morning')

    // Pool B — Afternoon session
    const poolBStart = new Date(eventStart)
    poolBStart.setHours(14, 0, 0, 0)
    const poolBEnd = new Date(eventStart)
    poolBEnd.setHours(17, 0, 0, 0)

    await prisma.examPool.create({
      data: {
        eventId: examEvent.id,
        name: 'Pool B — Afternoon',
        examDate: eventStart,
        examStartTime: poolBStart,
        examEndTime: poolBEnd,
        minCandidates: 25,
        maxCandidates: 28,
        moduleDiversityCap: 4,
        seatPrice: 300,
        status: 'OPEN',
        allowedModules,
      },
    })
    console.log('✅ Created ExamPool: Pool B — Afternoon')
  } else {
    console.log(`⏭ ExamEvent already has ${existingEvents} records, skipping`)
  }

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
