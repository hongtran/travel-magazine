export type GenerationStep = 'idle' | 'parsing' | 'generating' | 'done' | 'error'

const LABELS: Record<Exclude<GenerationStep, 'error'>, string> = {
  idle: '',
  parsing: 'Parsing document…',
  generating: 'Generating article…',
  done: 'Done!',
}

const WIDTHS: Record<Exclude<GenerationStep, 'error'>, string> = {
  idle: '0%',
  parsing: '40%',
  generating: '80%',
  done: '100%',
}

export function GenerationProgress({ step }: { step: GenerationStep }) {
  if (step === 'idle' || step === 'error') return null
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-stone-600">
        {step !== 'done' && (
          <span className="inline-block w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        )}
        <span>{LABELS[step]}</span>
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
