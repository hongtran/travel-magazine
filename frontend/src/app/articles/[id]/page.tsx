'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAtom, useAtomValue } from 'jotai'
import { articleAtom, isSavingAtom, parsedTextAtom } from '@/store/article'
import { getArticle, updateArticle } from '@/lib/api'
import { FieldEditor } from '@/components/article/FieldEditor'
import { BodySectionList } from '@/components/article/BodySectionList'
import { KeyFactsEditor } from '@/components/article/KeyFactsEditor'
import { ImageGallery } from '@/components/article/ImageGallery'
import { PreviewPanel } from '@/components/article/PreviewPanel'
import { RegenerateButton } from '@/components/article/RegenerateButton'
import { PublishButton } from '@/components/article/PublishButton'
import type { Article, BodySection, ArticleImage } from '@/lib/types'

const MAX_REGENERATIONS = 3

export default function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useAtom(articleAtom)
  const [saving, setSaving] = useAtom(isSavingAtom)
  const parsedText = useAtomValue(parsedTextAtom)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getArticle(id).then(a => { setArticle(a); setLoading(false) })
  }, [id])

  async function save(updates: Partial<Article>) {
    if (!article) return
    setSaving(true)
    try {
      const updated = await updateArticle(article.id, updates)
      setArticle(updated)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !article) {
    return <p className="p-8 text-sm text-stone-400">Loading…</p>
  }

  const sourced = article.sourced_fields ?? {}

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
        <Link href="/dashboard" className="text-sm font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          All Articles
        </Link>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-stone-400">Saving…</span>}
          <RegenerateButton
            article={article}
            parsedText={parsedText}
            maxRegenerations={MAX_REGENERATIONS}
            onRegenerated={updates => setArticle(prev => prev ? { ...prev, ...updates } : prev)}
          />
          <PublishButton article={article} onPublished={setArticle} />
        </div>
      </header>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — fields */}
        <div className="w-1/2 overflow-y-auto border-r bg-stone-50 p-4 space-y-3">
          <FieldEditor
            label="Title"
            value={article.title}
            sourced={sourced.title?.sourced ?? true}
            onSave={v => save({ title: v })}
          />
          <FieldEditor
            label="Hook"
            value={article.hook}
            sourced={sourced.hook?.sourced ?? true}
            multiline
            onSave={v => save({ hook: v })}
          />
          {article.body && (
            <BodySectionList
              sections={article.body}
              onChange={sections => save({ body: sections as BodySection[] })}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <FieldEditor
              label="Best For"
              value={article.best_for}
              sourced={sourced.best_for?.sourced ?? true}
              onSave={v => save({ best_for: v })}
            />
            <FieldEditor
              label="Not For"
              value={article.not_for}
              sourced={sourced.not_for?.sourced ?? true}
              onSave={v => save({ not_for: v })}
            />
          </div>
          <FieldEditor
            label="Ethics Notes"
            value={article.ethics_notes}
            sourced={sourced.ethics_notes?.sourced ?? true}
            multiline
            onSave={v => save({ ethics_notes: v })}
          />
          <KeyFactsEditor
            facts={article.key_facts}
            onChange={facts => save({ key_facts: facts })}
          />
          <ImageGallery
            images={article.images}
            onChange={images => save({ images: images as ArticleImage[] })}
          />
        </div>

        {/* Right — preview */}
        <div className="w-1/2 bg-white overflow-hidden">
          <PreviewPanel article={article} />
        </div>
      </div>
    </div>
  )
}
