/**
 * Recursive type that represents the output of serializePrisma.
 * Converts Decimal properties to number and Date properties to string.
 */
export type SerializedPrisma<T> = T extends Date
  ? string
  : T extends { toNumber(): number; d: any; s: any } // Prisma Decimal check
  ? number
  : T extends Array<infer U>
  ? Array<SerializedPrisma<U>>
  : T extends object
  ? { [K in keyof T]: SerializedPrisma<T[K]> }
  : T

/**
 * Utility to serialize Prisma data for Client Components.
 * Specifically handles the "Decimal objects are not supported" error by converting
 * Prisma/Decimal.js objects to numbers and Date objects to ISO strings.
 */
export function serializePrisma<T>(data: T): SerializedPrisma<T> {
  if (data === null || data === undefined) return data as any

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item)) as any
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check if it's a Prisma Decimal object
    if (
      (data as any).constructor?.name === 'Decimal' ||
      (typeof (data as any).toNumber === 'function' && (data as any).d && (data as any).s)
    ) {
      return (data as any).toNumber()
    }

    // Convert Date objects to strings for consistent client consumption
    if (data instanceof Date) {
      return data.toISOString() as any
    }

    // Recursively serialize object properties
    const result: any = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializePrisma((data as any)[key])
      }
    }
    return result
  }

  return data as any
}
