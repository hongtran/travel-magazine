export type GenerationStep = 'idle' | 'parsing' | 'generating' | 'done' | 'error'

const LABELS: Record<GenerationStep, string> = {
  idle: '',
  parsing: 'Parsing document…',
  generating: 'Generating article…',
  done: 'Done!',
  error: 'Something went wrong.',
}

const WIDTHS: Record<GenerationStep, string> = {
  idle: '0%',
  parsing: '40%',
  generating: '80%',
  done: '100%',
  error: '0%',
}

export function GenerationProgress({ step, error }: { step: GenerationStep; error?: string }) {
  if (step === 'idle') return null
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-stone-600">
        {step !== 'error' && step !== 'done' && (
          <span className="inline-block w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        )}
        <span>{step === 'error' ? (error ?? LABELS.error) : LABELS[step]}</span>
      </div>
      <div className="h-1 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all duration-500"
          style={{ width: WIDTHS[step] }}
        />
      </div>
    </div>
  )
}
