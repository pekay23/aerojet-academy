import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes with clsx and tailwind-merge
 * Required for Shadcn UI components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates an institutional email based on name parts.
 * Logic:
 * - "Samuel Hughes" -> s.hughes@aerojet-academy.com
 * - "Samuel Emmanuel Hughes" -> s.e.hughes@aerojet-academy.com
 */
export function generateInstitutionalEmail(name: string): string {
  if (!name) return 'student@aerojet-academy.com';
  
  const cleanName = name.trim().toLowerCase();
  const parts = cleanName.split(/\s+/);
  
  if (parts.length === 1) {
    return `${parts[0]}@aerojet-academy.com`;
  }

  const lastName = parts[parts.length - 1];
  let prefix = parts[0][0]; // First initial
  
  if (parts.length > 2) {
    // If middle name exists, take its initial
    prefix += `.${parts[1][0]}`; 
  }
  
  return `${prefix}.${lastName}@aerojet-academy.com`;
}
