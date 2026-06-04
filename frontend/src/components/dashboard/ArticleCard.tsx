import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { ArticleListItem } from '@/lib/types'

export function ArticleCard({ article }: { article: ArticleListItem }) {
  const date = new Date(article.created_at).toLocaleDateString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <Link
      href={`/articles/${article.id}`}
      className="block p-4 rounded-lg border border-stone-200 bg-white hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-stone-900 line-clamp-2">
          {article.title ?? 'Untitled'}
        </h3>
        <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
          {article.status}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-stone-400">{date}</p>
    </Link>
  )
}
