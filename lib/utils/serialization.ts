/**
 * Recursive type that represents the output of serializePrisma.
 * Converts Decimal properties to number and Date properties to string.
 */
type DecimalLike = { toNumber(): number; d: readonly number[]; s: number }

export type SerializedPrisma<T> = T extends Date
  ? string
  : T extends DecimalLike
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
  if (data === null || data === undefined) return data as SerializedPrisma<T>

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item)) as SerializedPrisma<T>
  }

  // Handle BigInt (e.g., Passkey.counter)
  if (typeof data === 'bigint') {
    return Number(data) as SerializedPrisma<T>
  }

  // Handle Buffer/Bytes (e.g., Passkey.publicKey)
  if (Buffer.isBuffer(data)) {
    return data.toString('base64') as SerializedPrisma<T>
  }

  // Handle Uint8Array
  if (data instanceof Uint8Array) {
    return Buffer.from(data).toString('base64') as SerializedPrisma<T>
  }

  // Handle objects
  if (typeof data === 'object') {
    const candidate = data as unknown as { constructor?: { name: string }; toNumber?: () => number; d?: unknown; s?: unknown }
    // Check if it's a Prisma Decimal object
    if (
      candidate.constructor?.name === 'Decimal' ||
      (typeof candidate.toNumber === 'function' && candidate.d && candidate.s)
    ) {
      return candidate.toNumber!() as SerializedPrisma<T>
    }

    // Convert Date objects to strings for consistent client consumption
    if (data instanceof Date) {
      return data.toISOString() as SerializedPrisma<T>
    }

    // Recursively serialize object properties
    const result: Record<string, unknown> = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializePrisma((data as Record<string, unknown>)[key])
      }
    }
    return result as SerializedPrisma<T>
  }

  return data as SerializedPrisma<T>
}