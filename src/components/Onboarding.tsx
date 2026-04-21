import { useState } from 'react'
import { t } from '../utils/i18n'

const STORAGE_KEY = 'deckninja_onboarded'

interface OnboardingProps {
  forceShow?: boolean
  onDone: () => void
}

export default function Onboarding({ forceShow, onDone }: OnboardingProps) {
  const [step, setStep] = useState(0)

  const alreadyDone = !forceShow && typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1'
  if (alreadyDone) return null

  const steps = [
    { title: t('onboarding.step1_title'), desc: t('onboarding.step1_desc'), icon: '✏️' },
    { title: t('onboarding.step2_title'), desc: t('onboarding.step2_desc'), icon: '📏' },
    { title: t('onboarding.step3_title'), desc: t('onboarding.step3_desc'), icon: '⚙️' },
    { title: t('onboarding.step4_title'), desc: t('onboarding.step4_desc'), icon: '✅' },
  ]

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    onDone()
  }

  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface-elevated rounded-2xl shadow-xl border border-border-subtle max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{steps[step].icon}</span>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{steps[step].title}</h2>
            <p className="text-xs text-text-muted">
              {step + 1} / {steps.length}
            </p>
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed mb-6">{steps[step].desc}</p>

        <div className="flex items-center gap-3 mb-4">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-border-subtle'}`} />
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={finish}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            {t('onboarding.skip')}
          </button>
          <button
            onClick={isLast ? finish : () => setStep(step + 1)}
            className="px-5 py-2 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isLast ? t('onboarding.done') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
