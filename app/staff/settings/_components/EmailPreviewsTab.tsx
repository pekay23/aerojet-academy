'use client'

import dynamic from 'next/dynamic'

// EmailPreviewsPage bundles RichTextEditor (TipTap, ~150KB) and a long
// template-preview client component. Loading it only when the Email tab is
// active keeps every other Settings tab snappy.
const EmailPreviewsPage = dynamic(() => import('../email-previews/page'), {
  ssr: false,
  loading: () => (
    <div className="min-h-100 animate-pulse rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
  ),
})

export default function EmailPreviewsTab() {
  return <EmailPreviewsPage />
}
