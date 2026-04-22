import { t } from '../utils/i18n'

interface PrivacyPolicyProps {
  onClose: () => void
}

const SECTIONS = [
  { key: 'intro', icon: 'ℹ️' },
  { key: 'data', icon: '🔒' },
  { key: 'analytics', icon: '📊' },
  { key: 'localstorage', icon: '💾' },
  { key: 'sharing', icon: '🔗' },
  { key: 'contact', icon: '✉️' },
]

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-elevated w-full max-w-2xl mx-4 max-h-[80vh] rounded-2xl shadow-xl border border-border-subtle flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h1 className="text-lg font-semibold text-text-primary">{t('privacy.title')}</h1>
          <button onClick={onClose} className="px-4 py-1.5 bg-accent text-white text-sm rounded-lg hover:bg-accent-light transition-colors">
            {t('privacy.close')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {SECTIONS.map(sec => (
            <div key={sec.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{sec.icon}</span>
                <h2 className="text-sm font-semibold text-text-primary">{t(`privacy.${sec.key}_title`)}</h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed pl-7">
                {t(`privacy.${sec.key}_text`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
