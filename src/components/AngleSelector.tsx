interface AngleSelectorProps {
  angle: number
  onAngleChange: (angle: number) => void
}

const QUICK_ANGLES = [0, 45, 90, 135]

export default function AngleSelector({ angle, onAngleChange }: AngleSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Kąt układania deski</h2>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={180}
          value={angle}
          onChange={(e) => onAngleChange(Number(e.target.value))}
          className="flex-1"
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={angle}
            onChange={(e) => onAngleChange(Math.max(0, Math.min(180, Number(e.target.value))))}
            className="w-14 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary text-center focus:border-accent focus:outline-none transition-colors"
            min={0}
            max={180}
          />
          <span className="text-xs text-text-muted">°</span>
        </div>
      </div>
      <div className="flex gap-2">
        {QUICK_ANGLES.map((a) => (
          <button
            key={a}
            onClick={() => onAngleChange(a)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              angle === a
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface hover:bg-surface-hover text-text-secondary border border-border-subtle'
            }`}
          >
            {a}°
          </button>
        ))}
      </div>
    </div>
  )
}
