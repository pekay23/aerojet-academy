import { describe, it, expect } from 'vitest'
import { groupBy, unique, chunk, sortBy, naturalCompare, sortNaturally } from '@/lib/utils/array'

describe('groupBy', () => {
  it('groups by string key', () => {
    const items = [
      { category: 'A', value: 1 },
      { category: 'B', value: 2 },
      { category: 'A', value: 3 },
    ]
    const result = groupBy(items, 'category')
    expect(result.A).toHaveLength(2)
    expect(result.B).toHaveLength(1)
  })

  it('returns empty object for empty array', () => {
    expect(groupBy([], 'key')).toEqual({})
  })

  it('handles numeric keys', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 1 }]
    const result = groupBy(items, 'id')
    expect(result[1]).toHaveLength(2)
    expect(result[2]).toHaveLength(1)
  })
})

describe('unique', () => {
  it('removes duplicates without key', () => {
    expect(unique([1, 2, 2, 3])).toEqual([1, 2, 3])
  })

  it('removes duplicates by key', () => {
    const items = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 1, name: 'c' },
    ]
    expect(unique(items, 'id')).toHaveLength(2)
  })

  it('returns new array', () => {
    const input = [1, 2, 3]
    const result = unique(input)
    expect(result).not.toBe(input)
  })
})

describe('chunk', () => {
  it('splits array into chunks', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns single chunk when size >= length', () => {
    expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]])
  })

  it('returns empty array for empty input', () => {
    expect(chunk([], 2)).toEqual([])
  })
})

describe('sortBy', () => {
  it('sorts ascending by default', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }]
    expect(sortBy(items, 'value')).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
  })

  it('sorts descending', () => {
    const items = [{ value: 3 }, { value: 1 }, { value: 2 }]
    expect(sortBy(items, 'value', 'desc')).toEqual([{ value: 3 }, { value: 2 }, { value: 1 }])
  })

  it('does not mutate original', () => {
    const input = [{ value: 3 }, { value: 1 }, { value: 2 }]
    sortBy(input, 'value')
    expect(input).toEqual([{ value: 3 }, { value: 1 }, { value: 2 }])
  })
})

describe('naturalCompare', () => {
  it('sorts numbers naturally', () => {
    const items = ['Module 10', 'Module 1', 'Module 2']
    expect(items.sort(naturalCompare)).toEqual(['Module 1', 'Module 2', 'Module 10'])
  })

  it('falls back to localeCompare for strings without numbers', () => {
    expect(naturalCompare('apple', 'banana')).toBeLessThan(0)
  })

  it('handles equal strings', () => {
    expect(naturalCompare('test', 'test')).toBe(0)
  })
})

describe('sortNaturally', () => {
  it('sorts array naturally by key extractor', () => {
    const items = [
      { name: 'Module 10' },
      { name: 'Module 1' },
      { name: 'Module 2' },
    ]
    const result = sortNaturally(items, (item) => item.name)
    expect(result.map((i) => i.name)).toEqual(['Module 1', 'Module 2', 'Module 10'])
  })

  it('sorts descending', () => {
    const items = [{ name: 'A1' }, { name: 'A10' }, { name: 'A2' }]
    const result = sortNaturally(items, (item) => item.name, 'desc')
    expect(result.map((i) => i.name)).toEqual(['A10', 'A2', 'A1'])
  })
})
