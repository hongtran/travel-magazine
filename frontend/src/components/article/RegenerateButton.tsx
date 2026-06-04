'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateArticle } from '@/lib/api'
import type { Article } from '@/lib/types'

interface Props {
  article: Article
  parsedText: string | null
  maxRegenerations: number
  onRegenerated: (updated: Partial<Article> & { regeneration_count: number }) => void
}

export function RegenerateButton({ article, parsedText, maxRegenerations, onRegenerated }: Props) {
  const [loading, setLoading] = useState(false)
  const used = article.regeneration_count
  const remaining = maxRegenerations - used
  const disabled = remaining <= 0 || !parsedText || loading

  async function handleRegenerate() {
    if (!parsedText) return
    setLoading(true)
    try {
      const generated = await generateArticle({
        text: parsedText,
        file_url: article.original_file_url ?? '',
        article_id: article.id,
      })
      onRegenerated({ ...generated.article, regeneration_count: used + 1 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={disabled} onClick={handleRegenerate}>
      {loading
        ? 'Regenerating…'
        : remaining <= 0
          ? `Regenerate (limit reached)`
          : `Regenerate (${used}/${maxRegenerations} used)`}
    </Button>
  )
}
