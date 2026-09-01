import { describe, it, expect, vi } from 'vitest'
import {
  apiSuccess,
  apiError,
  apiCreated,
  apiMessage,
  apiPaginated,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  withErrorHandler,
  parsePagination,
  parseSorting,
  parseSearch,
} from '@/lib/api/response'
import { serializePrisma } from '@/lib/utils/serialization'

// ---------------------------------------------------------------------------
// Helpers for reading NextResponse in tests
// ---------------------------------------------------------------------------
async function readJson(res: Response) {
  return res.json()
}

function makeReq(): any {
  // withErrorHandler only forwards req to the handler; it never reads it,
  // so a minimal stub is sufficient.
  return {} as any
}

// ===========================================================================
// apiSuccess / apiError / apiPaginated
// ===========================================================================
describe('apiSuccess', () => {
  it('returns success envelope with serialized data and default 200', async () => {
    const res = apiSuccess({ name: 'Alpha' })
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body).toEqual({ success: true, data: { name: 'Alpha' } })
  })

  it('honours a custom status code', async () => {
    const res = apiSuccess({ id: 1 }, 202)
    expect(res.status).toBe(202)
    const body = await readJson(res)
    expect(body.success).toBe(true)
  })

  it('serializes nested Date and Decimal-like values', async () => {
    const date = new Date('2024-01-02T03:04:05.000Z')
    const res = apiSuccess({ when: date, amount: 12.5, nested: { when: date } })
    const body = await readJson(res)
    expect(body.data.when).toBe('2024-01-02T03:04:05.000Z')
    expect(body.data.amount).toBe(12.5)
    expect(body.data.nested.when).toBe('2024-01-02T03:04:05.000Z')
  })

  it('serializes array data', async () => {
    const res = apiSuccess([{ a: 1 }, { a: 2 }])
    const body = await readJson(res)
    expect(body.data).toEqual([{ a: 1 }, { a: 2 }])
  })
})

describe('apiCreated', () => {
  it('returns 201 with success envelope', async () => {
    const res = apiCreated({ id: 'x' })
    expect(res.status).toBe(201)
    const body = await readJson(res)
    expect(body).toEqual({ success: true, data: { id: 'x' } })
  })
})

describe('apiMessage', () => {
  it('returns success envelope with message and default 200', async () => {
    const res = apiMessage('Done')
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body).toEqual({ success: true, message: 'Done' })
  })

  it('honours a custom status code', async () => {
    const res = apiMessage('Accepted', 202)
    expect(res.status).toBe(202)
  })
})

describe('apiError', () => {
  it('returns error envelope with default 400', async () => {
    const res = apiError('Bad request')
    expect(res.status).toBe(400)
    const body = await readJson(res)
    expect(body).toEqual({ success: false, error: 'Bad request' })
  })

  it('honours a custom status code', async () => {
    const res = apiError('Nope', 418)
    expect(res.status).toBe(418)
    const body = await readJson(res)
    expect(body.error).toBe('Nope')
  })

  it('merges extra data fields', async () => {
    const res = apiError('Invalid', 422, { field: 'email' })
    const body = await readJson(res)
    expect(body).toEqual({ success: false, error: 'Invalid', field: 'email' })
  })
})

describe('apiPaginated', () => {
  it('includes pagination metadata and serializes items', async () => {
    const res = apiPaginated([{ id: 1 }], 25, 2, 10)
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([{ id: 1 }])
    expect(body.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 })
  })

  it('computes totalPages via ceiling', async () => {
    const res = apiPaginated([], 1, 1, 10)
    const body = await readJson(res)
    expect(body.meta.totalPages).toBe(1)
  })

  it('merges extra meta without overwriting base keys', async () => {
    const res = apiPaginated([], 0, 1, 10, { sortBy: 'name' })
    const body = await readJson(res)
    expect(body.meta).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0, sortBy: 'name' })
  })
})

describe('convenience error helpers', () => {
  it('apiUnauthorized returns 401', () => {
    expect(apiUnauthorized().status).toBe(401)
  })
  it('apiForbidden returns 403', () => {
    expect(apiForbidden().status).toBe(403)
  })
  it('apiNotFound returns 404', () => {
    expect(apiNotFound().status).toBe(404)
  })
})

// ===========================================================================
// withErrorHandler
// ===========================================================================
describe('withErrorHandler', () => {
  it('passes through a successful handler response', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = async () => apiSuccess({ ok: true })
    const wrapped = withErrorHandler(handler)
    const res = await wrapped(makeReq(), undefined)
    const body = await readJson(res)
    expect(body).toEqual({ success: true, data: { ok: true } })
    consoleSpy.mockRestore()
  })

  it("maps Error('Unauthorized') to 401", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = async () => {
      throw new Error('Unauthorized')
    }
    const res = await withErrorHandler(handler)(makeReq(), undefined)
    expect(res.status).toBe(401)
    const body = await readJson(res)
    expect(body.success).toBe(false)
    consoleSpy.mockRestore()
  })

  it("maps Error('Forbidden') to 403", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = async () => {
      throw new Error('Forbidden')
    }
    const res = await withErrorHandler(handler)(makeReq(), undefined)
    expect(res.status).toBe(403)
    consoleSpy.mockRestore()
  })

  it("maps Error('... not found') to 404 and preserves message", async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = async () => {
      throw new Error('User not found')
    }
    const res = await withErrorHandler(handler)(makeReq(), undefined)
    expect(res.status).toBe(404)
    const body = await readJson(res)
    expect(body.error).toBe('User not found')
    consoleSpy.mockRestore()
  })

  it('maps other errors to 500', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const handler = async () => {
      throw new Error('Something exploded')
    }
    const res = await withErrorHandler(handler)(makeReq(), undefined)
    expect(res.status).toBe(500)
    consoleSpy.mockRestore()
  })

  it('awaits ctx.params (Next.js 16 async params) before calling handler', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let receivedParams: any = 'unset'
    const handler = async (_req: any, ctx: any) => {
      receivedParams = ctx.params
      return apiSuccess({})
    }
    const params = Promise.resolve({ id: 'abc' })
    await withErrorHandler(handler)(makeReq(), { params })
    expect(receivedParams).toEqual({ id: 'abc' })
    consoleSpy.mockRestore()
  })

  it('calls handler with empty params object when ctx has none', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let receivedParams: any = 'unset'
    const handler = async (_req: any, ctx: any) => {
      receivedParams = ctx.params
      return apiSuccess({})
    }
    await withErrorHandler(handler)(makeReq(), {})
    expect(receivedParams).toEqual({})
    consoleSpy.mockRestore()
  })
})

// ===========================================================================
// serializePrisma
// ===========================================================================
describe('serializePrisma', () => {
  it('converts Date to ISO string', () => {
    const date = new Date('2024-05-06T07:08:09.000Z')
    expect(serializePrisma(date)).toBe('2024-05-06T07:08:09.000Z')
  })

  it('converts Prisma Decimal to number', () => {
    const decimal = { toNumber: () => 99.99, d: [9999], s: 2, constructor: { name: 'Decimal' } }
    expect(serializePrisma(decimal as any)).toBe(99.99)
  })

  it('converts BigInt to number', () => {
    // NOTE: the implementation uses Number(data), so BigInt becomes a JS number,
    // not a string. Tests assert actual behavior; large BigInts may lose precision.
    const result = serializePrisma(42n)
    expect(result).toBe(42)
    expect(typeof result).toBe('number')
  })

  it('recurses into nested objects and arrays', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    const input = {
      when: date,
      list: [date, { nestedWhen: date }],
    }
    const out = serializePrisma(input)
    expect(out.when).toBe('2024-01-01T00:00:00.000Z')
    expect(out.list[0]).toBe('2024-01-01T00:00:00.000Z')
    expect(out.list[1].nestedWhen).toBe('2024-01-01T00:00:00.000Z')
  })

  it('returns null and undefined unchanged', () => {
    expect(serializePrisma(null)).toBeNull()
    expect(serializePrisma(undefined)).toBeUndefined()
  })

  it('passes through plain primitives', () => {
    expect(serializePrisma('hello')).toBe('hello')
    expect(serializePrisma(7)).toBe(7)
    expect(serializePrisma(true)).toBe(true)
  })
})

// ===========================================================================
// parsePagination / parseSorting / parseSearch
// ===========================================================================
describe('parsePagination', () => {
  it('returns defaults when no params provided', () => {
    const params = new URLSearchParams()
    expect(parsePagination(params)).toEqual({ page: 1, limit: 20, skip: 0 })
  })

  it('parses page and limit from query params', () => {
    const params = new URLSearchParams('page=3&limit=10')
    expect(parsePagination(params)).toEqual({ page: 3, limit: 10, skip: 20 })
  })

  it('clamps page to minimum 1', () => {
    const params = new URLSearchParams('page=0')
    expect(parsePagination(params).page).toBe(1)
  })

  it('clamps limit to range 1-100', () => {
    expect(parsePagination(new URLSearchParams('limit=0')).limit).toBe(1)
    expect(parsePagination(new URLSearchParams('limit=50')).limit).toBe(50)
    expect(parsePagination(new URLSearchParams('limit=200')).limit).toBe(100)
  })

  it('computes skip from page and limit', () => {
    const params = new URLSearchParams('page=5&limit=20')
    expect(parsePagination(params).skip).toBe(80)
  })
})

describe('parseSorting', () => {
  it('returns default sortBy and desc order', () => {
    const params = new URLSearchParams()
    expect(parseSorting(params)).toEqual({ sortBy: 'createdAt', sortOrder: 'desc' })
  })

  it('parses sortBy and sortOrder from query params', () => {
    const params = new URLSearchParams('sortBy=name&sortOrder=asc')
    expect(parseSorting(params)).toEqual({ sortBy: 'name', sortOrder: 'asc' })
  })

  it('defaults sortOrder to desc when not asc', () => {
    const params = new URLSearchParams('sortBy=name&sortOrder=desc')
    expect(parseSorting(params).sortOrder).toBe('desc')
  })

  it('uses custom defaultField when sortBy is missing', () => {
    const params = new URLSearchParams()
    expect(parseSorting(params, 'id')).toEqual({ sortBy: 'id', sortOrder: 'desc' })
  })
})

describe('parseSearch', () => {
  it('returns undefined when search is missing', () => {
    const params = new URLSearchParams()
    expect(parseSearch(params)).toBeUndefined()
  })

  it('returns the search query string', () => {
    const params = new URLSearchParams('search=hello')
    expect(parseSearch(params)).toBe('hello')
  })
})
