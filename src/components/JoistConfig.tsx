import { useState } from 'react'
import type { JoistConfig as JoistConfigType } from '../types'

interface JoistConfigProps {
  label: string
  description: string
  config: JoistConfigType
  onChange: (config: JoistConfigType) => void
}

export default function JoistConfig({ label, description, config, onChange }: JoistConfigProps) {
  const [newLength, setNewLength] = useState(3000)

  const addSize = () => {
    const id = `legar-${config.width}x${config.height}x${newLength}-${Date.now()}`
    onChange({
      ...config,
      sizes: [
        ...config.sizes,
        { id, width: config.width, length: newLength, label: `${config.width}×${config.height}×${newLength} mm` },
      ],
    })
  }

  const removeSize = (id: string) => {
    onChange({ ...config, sizes: config.sizes.filter((s) => s.id !== id) })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{label}</h2>
          <p className="text-[10px] text-text-muted mt-0.5">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-border-subtle rounded-full peer peer-checked:bg-accent transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
        </label>
      </div>

      {config.enabled && (
        <>
          <div className="flex gap-3">
            <label className="flex flex-col text-xs text-text-muted">
              Rozstaw (mm)
              <input
                type="number"
                value={config.spacing}
                onChange={(e) => onChange({ ...config, spacing: Number(e.target.value) })}
                className="mt-1 w-24 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
                min={50}
                step={10}
              />
            </label>
            <label className="flex flex-col text-xs text-text-muted">
              Szer. (mm)
              <input
                type="number"
                value={config.width}
                onChange={(e) => onChange({ ...config, width: Number(e.target.value) })}
                className="mt-1 w-16 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
                min={10}
              />
            </label>
            <label className="flex flex-col text-xs text-text-muted">
              Wys. (mm)
              <input
                type="number"
                value={config.height}
                onChange={(e) => onChange({ ...config, height: Number(e.target.value) })}
                className="mt-1 w-16 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
                min={10}
              />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-text-muted">Dostępne długości</span>
            {config.sizes.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-surface rounded-lg px-3 py-1.5 border border-border-subtle">
                <span className="text-xs font-mono text-text-secondary">{s.length} mm</span>
                <button onClick={() => removeSize(s.id)} className="text-danger/60 hover:text-danger text-xs transition-colors">✕</button>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <label className="flex flex-col text-xs text-text-muted">
              Dł. (mm)
              <input
                type="number"
                value={newLength}
                onChange={(e) => setNewLength(Number(e.target.value))}
                className="mt-1 w-24 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
                min={100}
              />
            </label>
            <button
              onClick={addSize}
              className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-sm rounded-lg transition-colors border border-accent/20"
            >
              Dodaj
            </button>
          </div>
        </>
      )}
    </div>
  )
}
