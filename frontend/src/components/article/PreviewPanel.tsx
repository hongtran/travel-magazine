import type { Article } from '@/lib/types'

export function PreviewPanel({ article }: { article: Article }) {
  return (
    <div className="overflow-y-auto h-full px-8 py-8 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-stone-900 leading-snug">
          {article.title ?? 'Untitled'}
        </h1>
        <div className="w-8 h-0.5 bg-orange-500 mt-2 mb-3" />
        {article.hook && (
          <p className="text-sm italic text-stone-600 leading-relaxed">{article.hook}</p>
        )}
      </div>

      {article.body?.map((s, i) => (
        <div key={i}>
          <h3 className="text-sm font-semibold text-stone-800 mb-1">{s.section_title}</h3>
          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{s.content}</p>
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-2">
        {article.best_for && (
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1">
            ✦ {article.best_for}
          </span>
        )}
        {article.not_for && (
          <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-3 py-1">
            ✗ Not for: {article.not_for}
          </span>
        )}
      </div>

      {article.key_facts && Object.keys(article.key_facts).length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 border-t pt-3">
          {Object.entries(article.key_facts).map(([k, v]) => (
            <span key={k}>
              <span className="font-medium capitalize">{k.replace(/_/g, ' ')}:</span> {v}
            </span>
          ))}
        </div>
      )}

      {article.images.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {article.images.map((img, i) => (
            <figure key={i} className="space-y-1">
              <img src={img.url} alt={img.caption ?? img.filename} className="h-24 w-auto rounded object-cover" />
              {img.caption && <figcaption className="text-xs text-stone-400">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
