import sanitize from 'sanitize-html'

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows standard formatting tags but strips scripts, event handlers, iframe, data: URIs, and wildcard style/id attributes.
 * Client-safe: does not use server-only imports.
 */
const SANITIZE_OPTIONS = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'hr',
    'ul',
    'ol',
    'li',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'del',
    'ins',
    'a',
    'img',
    'blockquote',
    'pre',
    'code',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'div',
    'span',
    'sub',
    'sup',
    'figure',
    'figcaption',
    'video',
    'source',
    'audio',
  ],
  allowedAttributes: {
    '*': ['class'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    table: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
    video: ['src', 'controls', 'width', 'height'],
    audio: ['src', 'controls'],
    source: ['src', 'type'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
} satisfies sanitize.IOptions

export function sanitizeHtml(html: string): string {
  return sanitize(html, SANITIZE_OPTIONS)
}

/**
 * Validate and sanitize a document URL for safe rendering.
 * Ensures the URL uses http/https protocol and has a valid hostname.
 * Returns the sanitized URL string, or null if invalid.
 */
export function safeDocumentUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    if (!parsed.hostname) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}
