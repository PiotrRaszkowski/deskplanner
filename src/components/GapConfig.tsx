import type { GapConfig as GapConfigType } from '../types'
import HelpTooltip from './HelpTooltip'
import { t } from '../utils/i18n'

interface GapConfigProps {
  gaps: GapConfigType
  onGapsChange: (gaps: GapConfigType) => void
}

export default function GapConfig({ gaps, onGapsChange }: GapConfigProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">{t('gaps.title')} <HelpTooltip textKey="gaps.help" /></h2>
      <div className="flex gap-4">
        <label className="flex flex-col text-xs text-text-muted">
          Wzdłuż (mm)
          <input
            type="number"
            value={gaps.along}
            onChange={(e) => onGapsChange({ ...gaps, along: Number(e.target.value) })}
            className="mt-1 w-20 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            min={0}
            step={1}
          />
        </label>
        <label className="flex flex-col text-xs text-text-muted">
          Od czoła (mm)
          <input
            type="number"
            value={gaps.front}
            onChange={(e) => onGapsChange({ ...gaps, front: Number(e.target.value) })}
            className="mt-1 w-20 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            min={0}
            step={1}
          />
        </label>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">
        Wzdłuż = między rzędami desek<br />
        Od czoła = między końcami desek w rzędzie
      </p>
    </div>
  )
}
