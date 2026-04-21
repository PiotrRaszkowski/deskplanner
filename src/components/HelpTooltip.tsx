import { useState, useRef, useEffect } from 'react'
import { t } from '../utils/i18n'

interface HelpTooltipProps {
  textKey: string
}

export default function HelpTooltip({ textKey }: HelpTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full bg-border-subtle hover:bg-accent/20 text-text-muted hover:text-accent text-[9px] font-bold leading-none flex items-center justify-center transition-colors"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-30 top-6 left-0 w-64 p-3 bg-surface-elevated border border-border-subtle rounded-lg shadow-lg text-xs text-text-secondary leading-relaxed">
          {t(textKey)}
        </div>
      )}
    </div>
  )
}
