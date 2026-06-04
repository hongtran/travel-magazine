import { DocUploader } from '@/components/upload/DocUploader'

export default function NewArticlePage() {
  return (
    <main className="max-w-xl mx-auto py-16 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">New article</h1>
        <p className="mt-1 text-sm text-stone-500">
          Upload your notes and we'll generate a structured magazine article.
        </p>
      </div>
      <DocUploader />
    </main>
  )
}
