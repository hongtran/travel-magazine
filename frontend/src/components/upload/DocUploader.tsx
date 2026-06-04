'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { parseDocument, generateArticle } from '@/lib/api'
import { parsedTextAtom, pendingFileUrlAtom } from '@/store/article'
import { GenerationProgress, type GenerationStep } from './GenerationProgress'

export function DocUploader() {
  const [step, setStep] = useState<GenerationStep>('idle')
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const setParsedText = useSetAtom(parsedTextAtom)
  const setPendingFileUrl = useSetAtom(pendingFileUrlAtom)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.docx')) {
      setError('Only .docx files are accepted')
      setStep('error')
      return
    }
    setError(undefined)
    try {
      setStep('parsing')
      const parsed = await parseDocument(file)
      if (parsed.warning === 'multiple_experiences') {
        setWarning('These notes seem to cover more than one experience. For best results, split into separate files.')
      }
      setParsedText(parsed.text)
      setPendingFileUrl(parsed.file_url)

      setStep('generating')
      const generated = await generateArticle({ text: parsed.text, file_url: parsed.file_url })
      setStep('done')
      router.push(`/articles/${generated.id}`)
    } catch (e: any) {
      setError(e.message)
      setStep('error')
    }
  }

  return (
    <div className="space-y-4">
      {warning && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {warning}
        </div>
      )}
      <div
        className="border-2 border-dashed border-stone-200 rounded-xl p-12 text-center cursor-pointer hover:border-orange-400 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <p className="text-stone-500 text-sm">
          Drop your <span className="font-medium">.docx</span> here, or{' '}
          <span className="text-orange-600 font-medium">click to browse</span>
        </p>
        <p className="text-xs text-stone-400 mt-1">Word documents only</p>
      </div>
      <GenerationProgress step={step} error={error} />
    </div>
  )
}
