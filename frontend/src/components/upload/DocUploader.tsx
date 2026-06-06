'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { parseDocument, generateArticle } from '@/lib/api'
import { parsedTextAtom, pendingFileUrlAtom } from '@/store/article'
import { GenerationProgress, type GenerationStep } from './GenerationProgress'

type GeneratePayload = { text: string; file_url: string; pending_image_paths: string[] }

export function DocUploader() {
  const [step, setStep] = useState<GenerationStep>('idle')
  const [warning, setWarning] = useState<string | null>(null)
  const [limitError, setLimitError] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const [retryPayload, setRetryPayload] = useState<GeneratePayload | null>(null)
  const setParsedText = useSetAtom(parsedTextAtom)
  const setPendingFileUrl = useSetAtom(pendingFileUrlAtom)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  async function runGenerate(payload: GeneratePayload) {
    setError(undefined)
    setStep('generating')
    try {
      const generated = await generateArticle(payload)
      setStep('done')
      router.push(`/articles/${generated.id}`)
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('daily generation limit')) {
        setLimitError(e.message)
        setStep('idle')
        setRetryPayload(null)
      } else {
        setError(e.message)
        setStep('error')
      }
    }
  }

  async function handleFile(file: File) {
    if (!file.name.endsWith('.docx')) {
      setError('Only .docx files are accepted')
      setStep('error')
      return
    }
    setError(undefined)
    setLimitError(null)
    setRetryPayload(null)
    try {
      setStep('parsing')
      const parsed = await parseDocument(file)
      if (parsed.warning === 'multiple_experiences') {
        setWarning('These notes seem to cover more than one experience. For best results, split into separate files.')
      }
      setParsedText(parsed.text)
      setPendingFileUrl(parsed.file_url)

      const payload: GeneratePayload = { text: parsed.text, file_url: parsed.file_url, pending_image_paths: parsed.pending_image_paths }
      setRetryPayload(payload)
      await runGenerate(payload)
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('daily generation limit')) {
        setLimitError(e.message)
        setStep('idle')
      } else {
        setError(e.message)
        setStep('error')
      }
    }
  }

  const activeError = limitError ?? (step === 'error' ? error : null)
  const canRetry = step === 'error' && retryPayload !== null
  const isProcessing = step === 'parsing' || step === 'generating'

  return (
    <div className="space-y-4">
      {activeError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {activeError}
        </div>
      )}
      {warning && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {warning}
        </div>
      )}
      {canRetry ? (
        <div className="space-y-3">
          <button
            onClick={() => runGenerate(retryPayload)}
            className="w-full py-3 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            Retry generation
          </button>
          <button
            onClick={() => { setRetryPayload(null); setStep('idle'); setError(undefined) }}
            className="w-full py-2 text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            Upload a different file
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isProcessing
              ? 'border-stone-200 cursor-not-allowed opacity-50'
              : 'border-stone-200 cursor-pointer hover:border-orange-400'
          }`}
          onClick={() => { if (!isProcessing) inputRef.current?.click() }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            if (isProcessing) return
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".docx"
            className="hidden"
            disabled={isProcessing}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <p className="text-stone-500 text-sm">
            Drop your <span className="font-medium">.docx</span> here, or{' '}
            <span className="text-orange-600 font-medium">click to browse</span>
          </p>
          <p className="text-xs text-stone-400 mt-1">Word documents only</p>
        </div>
      )}
      {step !== 'error' && <GenerationProgress step={step} />}
    </div>
  )
}
