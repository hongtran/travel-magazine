import Link from 'next/link'
import { DocUploader } from '@/components/upload/DocUploader'

export default function NewArticlePage() {
  return (
    <main className="max-w-xl mx-auto py-16 px-4 space-y-6">
      <div className="space-y-1">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          All Articles
        </Link>
        <h1 className="text-2xl font-semibold text-stone-900">New article</h1>
        <p className="text-sm text-stone-500">
          Upload your notes and we'll generate a structured magazine article.
        </p>
      </div>
      <DocUploader />
    </main>
  )
}
