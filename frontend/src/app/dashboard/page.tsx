import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArticleList } from '@/components/dashboard/ArticleList'

export default function DashboardPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Articles</h1>
        <Button asChild>
          <Link href="/articles/new">New article</Link>
        </Button>
      </div>
      <ArticleList />
    </main>
  )
}
