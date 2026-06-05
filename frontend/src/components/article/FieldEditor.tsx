'use client'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  label: string
  value: string | null
  sourced?: boolean
  sourceRef?: string | null
  verified?: boolean
  onSave: (value: string) => void
  onVerify?: () => void
  multiline?: boolean
}

export function FieldEditor({ label, value, sourced = true, sourceRef, verified, onSave, onVerify, multiline }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const amber = !sourced && !verified

  function handleBlur() {
    setEditing(false)
    onSave(draft)
  }

  return (
    <div className={`rounded-lg border p-3 space-y-1 ${amber ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          {label}
        </span>
        {amber && (
          <span className="text-[10px] text-amber-600 font-medium" title="Could not be sourced directly from your notes">
            Verify — not in notes
          </span>
        )}
        {!sourced && verified && (
          <span className="text-[10px] text-green-600 font-medium">✓ Verified</span>
        )}
      </div>
      {editing ? (
        <Textarea
          autoFocus
          className="text-sm resize-none border-0 p-0 focus-visible:ring-0 bg-transparent min-h-0"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleBlur}
          rows={multiline ? 5 : 2}
        />
      ) : (
        <>
          <p
            className="text-sm text-stone-800 cursor-text whitespace-pre-wrap min-h-[1.5rem]"
            onClick={() => { setDraft(value ?? ''); setEditing(true) }}
          >
            {value ?? <span className="text-stone-300 italic">Click to edit</span>}
          </p>
          {sourceRef && (
            <p className="text-[11px] text-stone-400 italic mt-1 leading-snug">
              From notes: &ldquo;{sourceRef}&rdquo;
            </p>
          )}
          {amber && onVerify && (
            <button
              onClick={onVerify}
              className="text-[11px] text-amber-700 underline hover:text-amber-900 mt-0.5"
            >
              Mark as verified
            </button>
          )}
        </>
      )}
    </div>
  )
}
