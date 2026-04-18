/**
 * Centralized business rules for Aerojet Academy.
 * These should eventually be moved to the database for dynamic control.
 */

export const ACADEMIC_RULES = {
  // EASA Standard Pass Mark for Modules
  EASA_PASS_MARK: 75,
  
  // General Grade Thresholds
  GRADE_THRESHOLD_PASS: 75, // Green
  GRADE_THRESHOLD_WARNING: 50, // Amber
  
  // Default values
  DEFAULT_MAX_CANDIDATES: 28,
  MAX_MODULES_PER_EVENT: 4,
}
