import { useState, useRef, useEffect } from 'react'
import { t } from '../utils/i18n'

interface HelpTooltipProps {
  textKey: string
}

export default function HelpTooltip({ textKey }: HelpTooltipProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<'left' | 'right'>('left')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const spaceRight = window.innerWidth - rect.right
    const spaceLeft = rect.left
    setPos(spaceRight > 230 ? 'right' : spaceLeft > 230 ? 'left' : 'right')

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
        className="w-4 h-4 rounded-full bg-border-subtle hover:bg-accent/20 text-text-muted hover:text-accent text-[9px] font-bold leading-none flex items-center justify-center transition-colors shrink-0"
      >
        ?
      </button>
      {open && (
        <div
          className={`absolute z-30 top-6 w-52 p-2.5 bg-surface-elevated border border-border-subtle rounded-lg shadow-lg text-[11px] text-text-secondary leading-relaxed ${pos === 'right' ? 'left-0' : 'right-0'}`}
        >
          {t(textKey)}
        </div>
      )}
    </div>
  )
}
