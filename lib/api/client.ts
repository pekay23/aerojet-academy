/**
 * Standardized API client for staff portal.
 * Provides consistent error handling, response parsing, and type safety.
 */

import { PaginatedResponse, ApiResponse } from '@/lib/types/staff';

interface ApiErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  details?: unknown;
}

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static fromResponse(response: Response, data: unknown): ApiError {
    const errorData = data as ApiErrorResponse;
    const message = errorData?.error || errorData?.message || response.statusText;
    const code = errorData?.code;
    const details = errorData?.details;
    return new ApiError(message, response.status, code, details);
  }
}

/**
 * Fetch with standardized error handling and response parsing
 */
async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'same-origin',
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw ApiError.fromResponse(response, data);
  }

  return data as T;
}

/**
 * GET request with query params
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return fetchJson<T>(url.toString());
}

/**
 * POST request with JSON body
 */
export async function apiPost<T>(
  path: string,
  body: unknown
): Promise<T> {
  return fetchJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request with JSON body
 */
export async function apiPut<T>(
  path: string,
  body: unknown
): Promise<T> {
  return fetchJson<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request with JSON body
 */
export async function apiPatch<T>(
  path: string,
  body: unknown
): Promise<T> {
  return fetchJson<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(path: string): Promise<T> {
  return fetchJson<T>(path, { method: 'DELETE' });
}

/**
 * Typed API endpoints for staff portal
 */
export const staffApi = {
  // Payments
  payments: {
    list: (params?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => apiGet<PaginatedResponse<import('@/lib/types/staff').PaymentRow>>('/api/staff/payments', params),

    approve: (id: string, action: 'approve' | 'reject', reason?: string, notes?: string) =>
      apiPost<ApiResponse<{ message: string }>>(`/api/staff/payments/${id}/approve`, { action, reason, notes }),

    uploads: (id: string) =>
      apiGet<ApiResponse<{ uploads: Array<{ id: string; url: string; filename: string; createdAt: string }> }>>(
        `/api/staff/payments/uploads/${id}`
      ),
  },

  // Wallet Top-ups
  walletTopups: {
    approve: (id: string) =>
      apiPost<ApiResponse<{ success: boolean }>>(`/api/staff/finance/wallet-topups/${id}/approve`, {}),

    reject: (id: string, reason: string) =>
      apiPost<ApiResponse<{ success: boolean }>>(`/api/staff/finance/wallet-topups/${id}/reject`, { reason }),
  },

  // Transactions
  transactions: {
    list: (params?: {
      page?: number;
      limit?: number;
      query?: string;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }) =>
      apiGet<{
        data: import('@/lib/types/staff').SerializedTransactionRow[];
        meta: { total: number; page: number; limit: number };
        related: import('@/lib/types/staff').SerializedTransactionRelated;
      }>('/api/staff/finance/transactions', params),
  },

  // Reconciliation
  reconciliation: {
    pending: (params?: { page?: number; limit?: number }) =>
      apiGet<ApiResponse<{ payments: import('@/lib/types/staff').ReconciliationPaymentRow[] }>>(
        '/api/staff/finance/reconcile/pending',
        params
      ),

    reconcile: (paymentIds: string[], notes?: string) =>
      apiPost<ApiResponse<{ message: string; count: number }>>('/api/staff/finance/reconcile', {
        paymentIds,
        notes,
      }),
  },

  // Reports
  reports: {
    get: (year?: number, month?: number) =>
      apiGet<{
        summary: import('@/lib/types/staff').FinanceReportSummary;
        revenueByType: import('@/lib/types/staff').RevenueByProgrammeItem[];
        paymentMethods: import('@/lib/types/staff').PaymentMethodBreakdownItem[];
        monthlyData: import('@/lib/types/staff').MonthlyRevenueItem[];
        paymentStatus: import('@/lib/types/staff').PaymentStatusBreakdownItem[];
      }>('/api/staff/finance/reports', { year, month }),

    export: (year?: number, month?: number, format: 'html' | 'pdf' | 'csv' = 'html') => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));
      if (month) params.set('month', String(month));
      params.set('format', format);
      return `/api/staff/finance/reports/export?${params}`;
    },
  },

  // Finance Overview
  finance: {
    overview: () =>
      apiGet<import('@/lib/types/staff').FinanceOverviewData>('/api/staff/finance/overview'),
  },

  // Users (for student search)
  users: {
    search: (params: { role: string; search: string; limit?: number }) =>
      apiGet<PaginatedResponse<StaffUser>>('/api/staff/users', params),
  },

  // Refunds
  refunds: {
    request: (input: {
      student: string;
      amount: number;
      reason: string;
      currency?: string;
      walletTxnId?: string;
      paymentId?: string;
      examBookingId?: string;
    }) => apiPost<ApiResponse<{ success: boolean }>>('/api/staff/finance/refunds', input),

    confirm: (id: string) =>
      apiPost<ApiResponse<{ success: boolean }>>(`/api/staff/finance/refunds/${id}/confirm`, {}),

    reject: (id: string, reason: string) =>
      apiPost<ApiResponse<{ success: boolean }>>(`/api/staff/finance/refunds/${id}/reject`, { reason }),

    approve: (id: string) =>
      apiPost<ApiResponse<{ success: boolean }>>(`/api/staff/finance/refunds/${id}/approve`, {}),
  },
};

/* ─── StaffUser type for API ─── */
interface StaffUser {
  id: string;
  email: string;
  personalEmail?: string | null;
  academyEmail?: string | null;
  role: string;
  status: string;
  profile?: {
    firstName: string | null;
    lastName: string | null;
  } | null;
  studentProfile?: {
    studentId: string | null;
  } | null;
}