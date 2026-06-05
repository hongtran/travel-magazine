export interface SourcedField {
  value: string | null
  sourced: boolean
  source_ref: string | null
}

export interface BodySection {
  section_title: string
  content: string
  source_ref: string | null
}

export interface ArticleImage {
  url: string
  filename: string
  caption: string | null
}

export interface Article {
  id: string
  user_id: string
  title: string | null
  status: 'draft' | 'published'
  hook: string | null
  body: BodySection[] | null
  best_for: string | null
  not_for: string | null
  ethics_notes: string | null
  key_facts: Record<string, string> | null
  sourced_fields: Record<string, { sourced: boolean; source_ref: string | null; verified?: boolean }> | null
  images: ArticleImage[]
  original_file_url: string | null
  regeneration_count: number
  word_count_target: number | null
  created_at: string
  updated_at: string
}

export interface ArticleListItem {
  id: string
  title: string | null
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  regeneration_count: number
}

export interface ParseResponse {
  text: string
  file_url: string
  pending_image_paths: string[]
  warning: string | null
}

export interface GenerateResponse {
  id: string
  article: Omit<Article, 'id'>
}
