'use client'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import type { BodySection } from '@/lib/types'

interface Props {
  sections: BodySection[]
  onChange: (sections: BodySection[]) => void
}

export function BodySectionList({ sections, onChange }: Props) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
        Body Sections
      </span>
      {sections.map((s, i) => (
        <SectionItem
          key={i}
          section={s}
          onSave={updated => {
            const next = [...sections]
            next[i] = updated
            onChange(next)
          }}
        />
      ))}
    </div>
  )
}

function SectionItem({ section, onSave }: { section: BodySection; onSave: (s: BodySection) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(section.content)

  return (
    <div className="border border-stone-200 rounded-lg bg-white overflow-hidden">
      <button
        className="w-full text-left px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 flex justify-between items-center"
        onClick={() => setOpen(o => !o)}
      >
        <span>{section.section_title}</span>
        <span className="text-stone-300 text-xs">{open ? '▲' : '▸'}</span>
      </button>
      {open && (
        <Textarea
          className="border-0 border-t rounded-none text-sm resize-none focus-visible:ring-0"
          value={draft}
          rows={6}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => onSave({ ...section, content: draft })}
        />
      )}
    </div>
  )
}
