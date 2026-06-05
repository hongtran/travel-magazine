'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface FieldSourcing {
  sourced: boolean
  source_ref: string | null
  verified?: boolean
}

interface Props {
  facts: Record<string, string> | null
  sourcedFields?: Record<string, FieldSourcing>
  onChange: (facts: Record<string, string>) => void
  onVerify?: (key: string) => void
}

export function KeyFactsEditor({ facts, sourcedFields = {}, onChange, onVerify }: Props) {
  const [local, setLocal] = useState<Record<string, string>>(facts ?? {})

  useEffect(() => {
    setLocal(facts ?? {})
  }, [facts])

  const entries = Object.entries(local)
  if (!entries.length) return null

  return (
    <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-3">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
        Key Facts
      </span>
      {entries.map(([k, v]) => {
        const sourcing = sourcedFields[k]
        const amber = sourcing ? !sourcing.sourced && !sourcing.verified : false
        const isVerified = sourcing ? !sourcing.sourced && !!sourcing.verified : false
        const sourceRef = sourcing?.source_ref ?? null

        return (
          <div key={k} className={`rounded p-1.5 -mx-1.5 ${amber ? 'bg-amber-50' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 w-28 shrink-0 capitalize">
                {k.replace(/_/g, ' ')}
              </span>
              <Input
                className={`text-sm h-7 ${amber ? 'border-amber-300 focus-visible:ring-amber-200' : ''}`}
                value={v ?? ''}
                onChange={e => setLocal(prev => ({ ...prev, [k]: e.target.value }))}
                onBlur={e => onChange({ ...local, [k]: e.target.value })}
              />
              {amber && (
                <span className="text-[10px] text-amber-600 font-medium shrink-0">Verify</span>
              )}
              {isVerified && (
                <span className="text-[10px] text-green-600 font-medium shrink-0">✓ Verified</span>
              )}
            </div>
            {sourceRef && (
              <p className="text-[11px] text-stone-400 italic mt-1 ml-[7.5rem] leading-snug">
                From notes: &ldquo;{sourceRef}&rdquo;
              </p>
            )}
            {amber && onVerify && (
              <button
                onClick={() => onVerify(k)}
                className="text-[11px] text-amber-700 underline hover:text-amber-900 mt-0.5 ml-[7.5rem]"
              >
                Mark as verified
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
