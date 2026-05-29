'use client'

import { useState, useCallback } from 'react'

type Comment = { variant: string; selector: string; description: string; note: string }

function describe(el: Element): { selector: string; description: string } {
  const testid = el.getAttribute('data-testid')
  if (testid)
    return { selector: `[data-testid='${testid}']`, description: el.tagName.toLowerCase() }
  const cls =
    el.className && typeof el.className === 'string'
      ? '.' + el.className.split(/\s+/).slice(0, 2).join('.')
      : ''
  const text = (el.textContent || '').trim().slice(0, 40)
  return {
    selector: el.tagName.toLowerCase() + cls,
    description: `${el.tagName.toLowerCase()}${text ? ` with "${text}"` : ''}`,
  }
}

function findVariant(el: Element): string {
  let cur: Element | null = el
  while (cur) {
    const v = cur.getAttribute('data-variant')
    if (v) return v
    cur = cur.parentElement
  }
  return '?'
}

export function FeedbackOverlay({ targetName }: { targetName: string }) {
  const [active, setActive] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [overall, setOverall] = useState('')
  const [draft, setDraft] = useState<{
    variant: string
    selector: string
    description: string
  } | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [copied, setCopied] = useState(false)

  const onPick = useCallback(
    (e: MouseEvent) => {
      if (!active) return
      const el = e.target as Element
      if (el.closest('[data-fb-ui]')) return
      e.preventDefault()
      e.stopPropagation()
      const { selector, description } = describe(el)
      setDraft({ variant: findVariant(el), selector, description })
      setDraftNote('')
    },
    [active]
  )

  function toggle() {
    const next = !active
    setActive(next)
    if (next) document.addEventListener('click', onPick, true)
    else document.removeEventListener('click', onPick, true)
  }

  function saveDraft() {
    if (draft && draftNote.trim()) setComments((c) => [...c, { ...draft, note: draftNote.trim() }])
    setDraft(null)
    setDraftNote('')
  }

  function buildText() {
    const byVariant: Record<string, Comment[]> = {}
    comments.forEach((c) => {
      ;(byVariant[c.variant] ||= []).push(c)
    })
    let out = `## Design Lab Feedback\n\n**Target:** ${targetName}\n**Comments:** ${comments.length}\n`
    Object.keys(byVariant)
      .sort()
      .forEach((v) => {
        out += `\n### Variant ${v}\n`
        byVariant[v].forEach((c, i) => {
          out += `${i + 1}. **${c.description}** (\`${c.selector}\`)\n   "${c.note}"\n`
        })
      })
    out += `\n### Overall Direction\n${overall || '(none provided)'}\n`
    return out
  }

  async function submit() {
    const text = buildText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div
      data-fb-ui
      style={{
        position: 'fixed',
        zIndex: 9999,
        right: 16,
        bottom: 16,
        fontFamily: 'ui-sans-serif, system-ui',
      }}
    >
      {(draft || comments.length > 0 || active) && (
        <div
          style={{
            width: 320,
            marginBottom: 12,
            background: '#0b1320',
            color: '#fff',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,.4)',
            border: '1px solid rgba(255,255,255,.1)',
          }}
        >
          {draft ? (
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#7fb3e8',
                }}
              >
                Variant {draft.variant}
              </div>
              <div style={{ fontSize: 13, margin: '6px 0 10px', color: '#cbd5e1' }}>
                {draft.description}
              </div>
              <textarea
                autoFocus
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="What about this element?"
                rows={3}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid #334',
                  background: '#060c16',
                  color: '#fff',
                  padding: 8,
                  fontSize: 13,
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={saveDraft} style={btn('#3894de')}>
                  Save
                </button>
                <button onClick={() => setDraft(null)} style={btn('transparent', '#94a3b8')}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <strong style={{ fontSize: 14 }}>Feedback · {comments.length}</strong>
                <span style={{ fontSize: 11, color: active ? '#4ade80' : '#94a3b8' }}>
                  {active ? '● picking' : 'idle'}
                </span>
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto', margin: '10px 0' }}>
                {comments.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      padding: '6px 0',
                      borderTop: '1px solid #1e293b',
                      color: '#cbd5e1',
                    }}
                  >
                    <b style={{ color: '#7fb3e8' }}>{c.variant}</b> · {c.description}
                    <br />
                    <span style={{ color: '#94a3b8' }}>“{c.note}”</span>
                  </div>
                ))}
              </div>
              <textarea
                value={overall}
                onChange={(e) => setOverall(e.target.value)}
                placeholder="Overall direction (which variant / what to combine)…"
                rows={2}
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid #334',
                  background: '#060c16',
                  color: '#fff',
                  padding: 8,
                  fontSize: 12,
                  resize: 'vertical',
                }}
              />
              <button onClick={submit} style={{ ...btn('#22c55e'), width: '100%', marginTop: 8 }}>
                {copied ? '✓ Copied — paste in chat' : 'Copy feedback'}
              </button>
            </div>
          )}
        </div>
      )}
      <button
        onClick={toggle}
        style={{
          ...btn(active ? '#ef4444' : '#002a5c'),
          width: '100%',
          padding: '12px 18px',
          borderRadius: 999,
          boxShadow: '0 10px 30px rgba(0,0,0,.3)',
        }}
      >
        {active ? '✕ Stop picking' : '＋ Add feedback'}
      </button>
    </div>
  )
}

function btn(bg: string, color = '#fff'): React.CSSProperties {
  return {
    background: bg,
    color,
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  }
}
