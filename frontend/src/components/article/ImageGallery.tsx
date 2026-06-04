'use client'
import { Input } from '@/components/ui/input'
import type { ArticleImage } from '@/lib/types'

interface Props {
  images: ArticleImage[]
  onChange: (images: ArticleImage[]) => void
}

export function ImageGallery({ images, onChange }: Props) {
  if (!images.length) return null

  return (
    <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-3">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
        Images
      </span>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={i} className="space-y-1">
            <img
              src={img.url}
              alt={img.caption ?? img.filename}
              className="h-20 w-auto rounded object-cover border border-stone-100"
            />
            <Input
              className="text-xs h-6 w-32"
              placeholder="Add caption…"
              defaultValue={img.caption ?? ''}
              onBlur={e => {
                const next = [...images]
                next[i] = { ...img, caption: e.target.value || null }
                onChange(next)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
