import { atom } from 'jotai'
import type { Article } from '@/lib/types'

export const articleAtom = atom<Article | null>(null)
export const isSavingAtom = atom(false)
export const parsedTextAtom = atom<string | null>(null)
export const pendingFileUrlAtom = atom<string | null>(null)
