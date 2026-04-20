import type { Point, BoardSize, GapConfig, JoistConfig, OffcutSettings } from '../types'

export interface AppState {
  polygon: Point[]
  boards: BoardSize[]
  gaps: GapConfig
  angle: number
  startPoint: Point | null
  upperJoists: JoistConfig
  lowerJoists: JoistConfig
  offcutSettings?: OffcutSettings
}

export function exportProject(state: AppState): string {
  return JSON.stringify({ version: 1, ...state }, null, 2)
}

export function importProject(json: string): AppState {
  const data = JSON.parse(json)
  return {
    polygon: data.polygon || [],
    boards: data.boards || [],
    gaps: data.gaps || { along: 5, front: 5 },
    angle: data.angle || 0,
    startPoint: data.startPoint || null,
    upperJoists: data.upperJoists || { enabled: false, sizes: [], spacing: 350, width: 40, height: 60 },
    lowerJoists: data.lowerJoists || { enabled: false, sizes: [], spacing: 700, width: 40, height: 60 },
    offcutSettings: data.offcutSettings || undefined,
  }
}

export function downloadProject(state: AppState) {
  const json = exportProject(state)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `taras-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function loadProjectFromFile(): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) { reject(new Error('No file selected')); return }
      const reader = new FileReader()
      reader.onload = () => {
        try { resolve(importProject(reader.result as string)) }
        catch (e) { reject(e) }
      }
      reader.readAsText(file)
    }
    input.click()
  })
}
