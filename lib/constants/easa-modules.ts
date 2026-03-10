export const EASA_MODULES = [
  { code: 'M1', name: 'Mathematics' },
  { code: 'M2', name: 'Physics' },
  { code: 'M3', name: 'Electrical Fundamentals' },
  { code: 'M4', name: 'Electronic Fundamentals' },
  { code: 'M5', name: 'Digital Techniques / Avionics' },
  { code: 'M6', name: 'Materials & Hardware' },
  { code: 'M7A', name: 'Maintenance Practices' },
  { code: 'M7B', name: 'Maintenance Practices (Avionics)' },
  { code: 'M8', name: 'Basic Aerodynamics' },
  { code: 'M9A', name: 'Human Factors' },
  { code: 'M10', name: 'Aviation Legislation' },
  { code: 'M11A', name: 'Aeroplane Aerodynamics (Turbine)' },
  { code: 'M11B', name: 'Aeroplane Aerodynamics (Piston)' },
  { code: 'M12', name: 'Helicopter Aerodynamics' },
  { code: 'M13', name: 'Aircraft Aerodynamics (Structures)' },
  { code: 'M14', name: 'Propulsion' },
  { code: 'M15', name: 'Gas Turbine Engine' },
  { code: 'M16', name: 'Piston Engine' },
  { code: 'M17A', name: 'Propeller' },
] as const

export type EasaModule = (typeof EASA_MODULES)[number]

/** Simple code-only list for staff forms that only need module codes */
export const EASA_MODULE_CODES = EASA_MODULES.map((m) => m.code)
