import { createClient } from './supabase'
import type { Article, ArticleListItem, ParseResponse, GenerateResponse } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await createClient().auth.getSession()
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
  if (!(init.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  return fetch(`${API_URL}${path}`, { ...init, headers })
}

export async function parseDocument(file: File): Promise<ParseResponse> {
  const { data: { session } } = await createClient().auth.getSession()
  const form = new FormData()
  form.append('file', file)
  const resp = await fetch(`${API_URL}/articles/parse`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session?.access_token}` },
    body: form,
  })
  if (!resp.ok) throw new Error((await resp.json()).detail ?? 'Parse failed')
  return resp.json()
}

export async function generateArticle(payload: {
  text: string
  file_url: string
  article_id?: string
}): Promise<GenerateResponse> {
  const resp = await authFetch('/articles/generate', { method: 'POST', body: JSON.stringify(payload) })
  if (!resp.ok) throw new Error((await resp.json()).detail ?? 'Generation failed')
  return resp.json()
}

export async function listArticles(page = 0): Promise<{ articles: ArticleListItem[]; page: number }> {
  const resp = await authFetch(`/articles?page=${page}`)
  if (!resp.ok) throw new Error('Failed to load articles')
  return resp.json()
}

export async function getArticle(id: string): Promise<Article> {
  const resp = await authFetch(`/articles/${id}`)
  if (!resp.ok) throw new Error('Article not found')
  return resp.json()
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
  const resp = await authFetch(`/articles/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
  if (!resp.ok) throw new Error('Failed to save')
  return resp.json()
}

export async function deleteArticle(id: string): Promise<void> {
  await authFetch(`/articles/${id}`, { method: 'DELETE' })
}
