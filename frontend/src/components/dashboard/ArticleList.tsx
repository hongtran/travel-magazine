'use client'
import { useEffect, useState } from 'react'
import { listArticles } from '@/lib/api'
import { ArticleCard } from './ArticleCard'
import type { ArticleListItem } from '@/lib/types'

export function ArticleList() {
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listArticles().then(r => { setArticles(r.articles); setLoading(false) })
  }, [])

  if (loading) return <p className="text-sm text-stone-400">Loading…</p>
  if (!articles.length) {
    return <p className="text-sm text-stone-500">No articles yet. Upload your first doc to get started.</p>
  }

  return (
    <div className="grid gap-3">
      {articles.map(a => <ArticleCard key={a.id} article={a} />)}
    </div>
  )
}
