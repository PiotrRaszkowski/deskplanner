import { useState, useRef, useEffect } from 'react'
import { t } from '../utils/i18n'

interface HelpTooltipProps {
  textKey: string
}

const TOOLTIP_W = 220

export default function HelpTooltip({ textKey }: HelpTooltipProps) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open || !ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const top = rect.bottom + 6
    let left = rect.left

    if (left + TOOLTIP_W > window.innerWidth - 8) {
      left = window.innerWidth - TOOLTIP_W - 8
    }
    if (left < 8) left = 8

    setStyle({ position: 'fixed', top, left, width: TOOLTIP_W })

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          !(e.target as HTMLElement).closest?.('.help-tooltip-body')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <button
        ref={ref}
        onClick={() => setOpen(!open)}
        className="w-4 h-4 rounded-full bg-border-subtle hover:bg-accent/20 text-text-muted hover:text-accent text-[9px] font-bold leading-none flex items-center justify-center transition-colors shrink-0"
      >
        ?
      </button>
      {open && (
        <div
          className="help-tooltip-body z-50 p-2.5 bg-surface-elevated border border-border-subtle rounded-lg shadow-lg text-[11px] text-text-secondary leading-relaxed"
          style={style}
        >
          {t(textKey)}
        </div>
      )}
    </>
  )
}
