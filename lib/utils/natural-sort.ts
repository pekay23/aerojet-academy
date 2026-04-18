/**
 * Centralized natural sorting utility for alphanumeric strings (e.g., M1, M2, M10).
 */
export const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

/**
 * Sorts an array of objects naturally based on a string key.
 */
export function naturalSort<T>(
  data: T[],
  keyExtractor: (item: T) => string
): T[] {
  return [...data].sort((a, b) => 
    naturalCollator.compare(keyExtractor(a), keyExtractor(b))
  );
}

/**
 * Compare two strings naturally (A1 < A10, etc.)
 */
export function compareNatural(a: string, b: string): number {
  return naturalCollator.compare(a, b);
}
