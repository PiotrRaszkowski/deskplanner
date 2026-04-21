import type { OffcutSettings, OffcutMode } from '../types'
import HelpTooltip from './HelpTooltip'
import { t } from '../utils/i18n'

interface OffcutConfigProps {
  settings: OffcutSettings
  onChange: (settings: OffcutSettings) => void
}

const MODES: Array<{ value: OffcutMode; label: string; desc: string }> = [
  { value: 'reuse-exact', label: 'Reuse (pasujące)', desc: 'Używa odcinka z puli tylko gdy jest >= potrzebnej długości' },
  { value: 'reuse-aggressive', label: 'Reuse (agresywny)', desc: 'Zawsze zużywa odcinki z puli, nawet krótsze — uzupełnia resztę nową deską' },
  { value: 'no-reuse', label: 'Bez reuse', desc: 'Zawsze bierze świeże deski, odcinki nie są wykorzystywane' },
]

export default function OffcutConfig({ settings, onChange }: OffcutConfigProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">{t('offcut.title')} <HelpTooltip textKey="offcut.help" /></h2>
      <div className="flex flex-col gap-1.5">
        {MODES.map((m) => (
          <label
            key={m.value}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
              settings.mode === m.value
                ? 'border-accent/40 bg-accent/5'
                : 'border-border-subtle hover:bg-surface-hover'
            }`}
          >
            <input
              type="radio"
              name="offcutMode"
              value={m.value}
              checked={settings.mode === m.value}
              onChange={() => onChange({ ...settings, mode: m.value })}
              className="accent-accent mt-0.5"
            />
            <div>
              <div className="text-xs font-medium text-text-primary">{m.label}</div>
              <div className="text-[10px] text-text-muted leading-tight mt-0.5">{m.desc}</div>
            </div>
          </label>
        ))}
      </div>
      {settings.mode !== 'no-reuse' && (
        <label className="flex flex-col text-xs text-text-muted">
          Min. długość odcinka do reuse (mm)
          <input
            type="number"
            value={settings.minLength}
            onChange={(e) => onChange({ ...settings, minLength: Math.max(0, Number(e.target.value)) })}
            className="mt-1 w-28 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            min={0}
            step={50}
          />
        </label>
      )}
    </div>
  )
}
