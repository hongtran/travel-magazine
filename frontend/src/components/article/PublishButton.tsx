'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { updateArticle } from '@/lib/api'
import type { Article } from '@/lib/types'

interface Props {
  article: Article
  onPublished: (updated: Article) => void
}

export function PublishButton({ article, onPublished }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const unsourcedFields = Object.entries(article.sourced_fields ?? {})
    .filter(([, v]) => !v.sourced)
    .map(([k]) => k.replace(/_/g, ' '))

  async function publish() {
    setLoading(true)
    const updated = await updateArticle(article.id, { status: 'published' })
    onPublished(updated)
    setOpen(false)
    setLoading(false)
  }

  function handleClick() {
    if (unsourcedFields.length > 0) setOpen(true)
    else publish()
  }

  return (
    <>
      <Button onClick={handleClick} disabled={article.status === 'published'}>
        {article.status === 'published' ? 'Published' : 'Publish'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish with unverified fields?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600">
            {unsourcedFields.length} field{unsourcedFields.length !== 1 ? 's' : ''} (
            <span className="font-medium">{unsourcedFields.join(', ')}</span>) could not be
            sourced directly from your notes. Please verify them before publishing.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Go back</Button>
            <Button onClick={publish} disabled={loading}>
              {loading ? 'Publishing…' : 'Publish anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
