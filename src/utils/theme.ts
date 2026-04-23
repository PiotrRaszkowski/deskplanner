import { useState, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'deckninja_theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function detectTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  }
  return 'system'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyTheme(resolved: 'light' | 'dark') {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }
}

let currentTheme: Theme = detectTheme()
applyTheme(resolveTheme(currentTheme))

let listeners: Array<() => void> = []

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') {
      applyTheme(getSystemTheme())
      listeners.forEach(fn => fn())
    }
  })
}

export function setTheme(theme: Theme) {
  currentTheme = theme
  if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, theme)
  applyTheme(resolveTheme(theme))
  listeners.forEach(fn => fn())
}

export function getTheme(): Theme { return currentTheme }

export function getResolvedTheme(): 'light' | 'dark' {
  return resolveTheme(currentTheme)
}

export function isDark(): boolean {
  return resolveTheme(currentTheme) === 'dark'
}

export function useTheme() {
  const [, forceUpdate] = useState(0)

  const subscribe = useCallback(() => {
    const fn = () => forceUpdate(n => n + 1)
    listeners.push(fn)
    return () => { listeners = listeners.filter(l => l !== fn) }
  }, [])

  useState(() => { const unsub = subscribe(); return unsub })

  return { theme: currentTheme, resolvedTheme: resolveTheme(currentTheme), setTheme, isDark: isDark() }
}
