import 'server-only'
import { sanitizeHtml as _sanitizeHtml } from './sanitize'

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows standard formatting tags but strips scripts, event handlers, etc.
 * Server-only: re-exports the shared sanitizer config from ./sanitize.
 */
export const sanitizeHtml = _sanitizeHtml
