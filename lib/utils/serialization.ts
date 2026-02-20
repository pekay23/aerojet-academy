/**
 * Utility to serialize Prisma data for Client Components.
 * Specifically handles the "Decimal objects are not supported" error by converting
 * Prisma/Decimal.js objects to numbers.
 */

export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) return data

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(serializePrisma) as unknown as T
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check if it's a Prisma Decimal object
    // These objects typically have a 'toNumber' method and constructor name 'Decimal'
    if (
      (data as any).constructor?.name === 'Decimal' ||
      (typeof (data as any).toNumber === 'function' && (data as any).d && (data as any).s)
    ) {
      return (data as any).toNumber() as unknown as T
    }

    // Preserve Date objects as Next.js can serialize them if they are plain
    if (data instanceof Date) {
      return data
    }

    // Recursively serialize object properties
    const result: any = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializePrisma((data as any)[key])
      }
    }
    return result as T
  }

  return data
}
