import { describe, it, expect, vi, beforeEach } from 'vitest'
import { serializePrisma, SerializedPrisma } from '@/lib/utils/serialization'

describe('lib/utils/serialization', () => {
  it('serializes null and undefined', () => {
    expect(serializePrisma(null)).toBeNull()
    expect(serializePrisma(undefined)).toBeUndefined()
  })

  it('serializes Date to ISO string', () => {
    const date = new Date('2026-01-15T12:00:00Z')
    const result = serializePrisma(date)
    expect(result).toBe('2026-01-15T12:00:00.000Z')
  })

  it('serializes plain objects', () => {
    const input = { name: 'test', value: 123 }
    const result = serializePrisma(input)
    expect(result).toEqual({ name: 'test', value: 123 })
  })

  it('serializes nested objects', () => {
    const input = { user: { name: 'test', created: new Date('2026-01-15T12:00:00Z') } }
    const result = serializePrisma(input)
    expect(result.user.name).toBe('test')
    expect(result.user.created).toBe('2026-01-15T12:00:00.000Z')
  })

  it('serializes arrays', () => {
    const input = [1, 2, 3]
    const result = serializePrisma(input)
    expect(result).toEqual([1, 2, 3])
  })

  it('leaves primitives unchanged', () => {
    expect(serializePrisma('hello')).toBe('hello')
    expect(serializePrisma(42)).toBe(42)
    expect(serializePrisma(true)).toBe(true)
  })

  it('serializes BigInt to number', () => {
    const result = serializePrisma(BigInt(123))
    expect(result).toBe(123)
  })
})
