'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  facts: Record<string, string> | null
  onChange: (facts: Record<string, string>) => void
}

export function KeyFactsEditor({ facts, onChange }: Props) {
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
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="text-xs text-stone-500 w-28 shrink-0 capitalize">
            {k.replace(/_/g, ' ')}
          </span>
          <Input
            className="text-sm h-7"
            value={v ?? ''}
            onChange={e => setLocal(prev => ({ ...prev, [k]: e.target.value }))}
            onBlur={e => onChange({ ...local, [k]: e.target.value })}
          />
        </div>
      ))}
    </div>
  )
}
