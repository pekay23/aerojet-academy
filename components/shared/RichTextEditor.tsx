'use client'

import dynamic from 'next/dynamic'

// Re-export the TipTap-based editor via `next/dynamic` so every consumer pays
// the ~150KB TipTap bundle only when the editor actually renders. Keeping the
// dynamic-wrap in this file (rather than at each call site) ensures future
// callers can't forget. Implementation lives in `./RichTextEditorInner.tsx`.

const RichTextEditor = dynamic(() => import('./RichTextEditorInner'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] animate-pulse rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800" />
  ),
})

export default RichTextEditor
