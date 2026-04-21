import { useState, useRef, useEffect, useCallback } from 'react'
import { t } from '../utils/i18n'

interface HelpTooltipProps {
  textKey: string
}

const TOOLTIP_W = 220

export default function HelpTooltip({ textKey }: HelpTooltipProps) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({ position: 'fixed', visibility: 'hidden' })
  const btnRef = useRef<HTMLButtonElement>(null)

  const calcPosition = useCallback(() => {
    if (!btnRef.current) return { position: 'fixed' as const, visibility: 'hidden' as const }
    const rect = btnRef.current.getBoundingClientRect()
    const top = rect.bottom + 6
    let left = rect.left
    if (left + TOOLTIP_W > window.innerWidth - 8) left = window.innerWidth - TOOLTIP_W - 8
    if (left < 8) left = 8
    return { position: 'fixed' as const, top, left, width: TOOLTIP_W }
  }, [])

  const handleClick = useCallback(() => {
    if (!open) {
      setStyle(calcPosition())
    }
    setOpen(o => !o)
  }, [open, calcPosition])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (btnRef.current?.contains(target)) return
      if (target.closest?.('.help-tooltip-body')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
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
