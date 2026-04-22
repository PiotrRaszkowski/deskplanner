import { useState } from 'react'
import { t } from '../utils/i18n'
import changelog from '../../CHANGELOG.md?raw'

interface HelpPageProps {
  onClose: () => void
}

const SECTIONS = [
  { key: 'drawing', icon: '✏️' },
  { key: 'boards', icon: '📏' },
  { key: 'start', icon: '📍' },
  { key: 'offcut', icon: '♻️' },
  { key: 'joists', icon: '🪵' },
  { key: 'results', icon: '📊' },
  { key: 'export', icon: '📤' },
  { key: 'shortcuts', icon: '⌨️' },
  { key: 'changelog', icon: '📋' },
]

function ChangelogView() {
  const lines = changelog.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('# ')) continue
    if (line.startsWith('## ')) {
      const version = line.replace('## ', '')
      elements.push(
        <h3 key={`h-${i}`} className="text-base font-semibold text-text-primary mt-4 first:mt-0 flex items-center gap-2">
          <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs font-mono">{version.replace(/[\[\]]/g, '')}</span>
        </h3>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={`sh-${i}`} className="text-xs font-semibold text-text-secondary mt-3 uppercase tracking-wider">{line.replace('### ', '')}</h4>
      )
    } else if (line.startsWith('- ')) {
      elements.push(
        <div key={`li-${i}`} className="flex gap-2 text-xs text-text-secondary leading-relaxed ml-1">
          <span className="text-accent mt-0.5 shrink-0">•</span>
          <span>{line.replace('- ', '')}</span>
        </div>
      )
    }
  }

  return <div className="flex flex-col gap-1">{elements}</div>
}

export default function HelpPage({ onClose }: HelpPageProps) {
  const [active, setActive] = useState(0)
  const isChangelog = SECTIONS[active].key === 'changelog'

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-elevated w-full max-w-3xl mx-auto my-4 rounded-2xl shadow-xl border border-border-subtle flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h1 className="text-lg font-semibold text-text-primary">{t('help.title')} — DeckNinja v1.0.0</h1>
          <button onClick={onClose} className="px-4 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent-light transition-colors">
            {t('help.close')}
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <nav className="w-48 shrink-0 border-r border-border-subtle overflow-y-auto py-2">
            {SECTIONS.map((sec, i) => (
              <button
                key={sec.key}
                onClick={() => setActive(i)}
                className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center gap-2 ${
                  active === i ? 'bg-accent/10 text-accent font-semibold border-r-2 border-accent' : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.key === 'changelog' ? t('help.changelog_title') : t(`help.${sec.key}_title`)}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            {isChangelog ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📋</span>
                  <h2 className="text-xl font-semibold text-text-primary">{t('help.changelog_title')}</h2>
                </div>
                <ChangelogView />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{SECTIONS[active].icon}</span>
                  <h2 className="text-xl font-semibold text-text-primary">{t(`help.${SECTIONS[active].key}_title`)}</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {t(`help.${SECTIONS[active].key}_text`)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
