import { NextRequest, NextResponse } from 'next/server'
import { serializePrisma } from '@/lib/utils/serialization'


// ---------------------------------------------------------------------------
// ROUTE CONTEXT TYPE
// ---------------------------------------------------------------------------

export interface RouteContext<TParams extends Record<string, string> = Record<string, string>> {
  params: Promise<TParams> & TParams
}

// ---------------------------------------------------------------------------
// STANDARD RESPONSE TYPES
// ---------------------------------------------------------------------------

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

// ---------------------------------------------------------------------------
// SUCCESS RESPONSES
// ---------------------------------------------------------------------------

export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data: serializePrisma(data) } as ApiResponse<T>, {
    status,
  })
}

export function apiCreated<T>(data: T): NextResponse {
  return apiSuccess(data, 201)
}

export function apiMessage(message: string, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, message } as ApiResponse, { status })
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  extraMeta?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({
    success: true,
    data: serializePrisma(data),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      ...extraMeta,
    },
  } as ApiResponse<T[]>)
}

// ---------------------------------------------------------------------------
// ERROR RESPONSES
// ---------------------------------------------------------------------------

export function apiError(
  error: string,
  status: number = 400,
  data?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ success: false, error, ...data } as ApiResponse, { status })
}

export function apiUnauthorized(message: string = 'Authentication required'): NextResponse {
  return apiError(message, 401)
}

export function apiForbidden(message: string = 'Insufficient permissions'): NextResponse {
  return apiError(message, 403)
}

export function apiNotFound(message: string = 'Resource not found'): NextResponse {
  return apiError(message, 404)
}

export function apiConflict(message: string = 'Resource already exists'): NextResponse {
  return apiError(message, 409)
}

export function apiTooManyRequests(
  message: string = 'Too many requests, please try again later'
): NextResponse {
  return apiError(message, 429)
}

export function apiServerError(message: string = 'Internal server error'): NextResponse {
  return apiError(message, 500)
}

// ---------------------------------------------------------------------------
// ERROR HANDLER WRAPPER
// ---------------------------------------------------------------------------

type FrameworkRouteContext = {
  params?: Promise<Record<string, string | string[]>>
}

export type RouteHandler<TParams extends Record<string, string> = Record<string, string>> = (
  req: NextRequest,
  ctx: RouteContext<TParams>
) => Promise<NextResponse>

function normalizeRouteParams(params: Record<string, string | string[]>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  )
}

export function withErrorHandler<TParams extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<TParams>
) {
  return async (req: NextRequest, ctx?: FrameworkRouteContext) => {
    try {
      const params = ctx?.params ? await ctx.params : undefined
      const normalizedParams = normalizeRouteParams(params || {}) as TParams
      return await handler(req, {
        params: Object.assign(Promise.resolve(normalizedParams), normalizedParams),
      })
    } catch (error: unknown) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        if (error.message === 'Unauthorized') {
          return apiUnauthorized()
        }
        if (error.message === 'Forbidden') {
          return apiForbidden()
        }
        if (error.message.includes('not found')) {
          return apiNotFound(error.message)
        }
      }

      return apiServerError(
        process.env.NODE_ENV === 'development'
          ? (error as Error)?.message || 'Unknown error'
          : 'Internal server error'
      )
    }
  }
}

// ---------------------------------------------------------------------------
// PAGINATION HELPERS
// ---------------------------------------------------------------------------

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export function parseSorting(searchParams: URLSearchParams, defaultField: string = 'createdAt') {
  const sortBy = searchParams.get('sortBy') || defaultField
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  return { sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
}

export function parseSearch(searchParams: URLSearchParams) {
  return searchParams.get('search') || undefined
}

// Re-export validateBody for API routes that import it from here
export { validateBody } from '@/lib/validation/schemas'
