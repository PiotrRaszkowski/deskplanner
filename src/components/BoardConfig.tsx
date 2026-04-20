import { useState } from 'react'
import type { BoardSize } from '../types'

interface BoardConfigProps {
  boards: BoardSize[]
  onBoardsChange: (boards: BoardSize[]) => void
}

const PALETTE_PREVIEW = [
  '#c8a06e', '#7cb07a', '#6ba3c9', '#cf8e6e',
  '#a88bc4', '#d4a84b', '#5ea69e', '#d47b8a',
]

export default function BoardConfig({ boards, onBoardsChange }: BoardConfigProps) {
  const [newWidth, setNewWidth] = useState(140)
  const [newLength, setNewLength] = useState(3000)

  const addBoard = () => {
    const id = `${newWidth}x${newLength}-${Date.now()}`
    onBoardsChange([
      ...boards,
      { id, width: newWidth, length: newLength, label: `${newWidth} × ${newLength} mm` },
    ])
  }

  const removeBoard = (id: string) => {
    onBoardsChange(boards.filter((b) => b.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Dostępne deski</h2>
      <div className="flex flex-col gap-1.5">
        {boards.map((board, i) => (
          <div key={board.id} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2 border border-border-subtle">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: PALETTE_PREVIEW[i % PALETTE_PREVIEW.length] }}
              />
              <span className="text-sm font-mono text-text-secondary">{board.label}</span>
            </div>
            <button
              onClick={() => removeBoard(board.id)}
              className="text-danger/60 hover:text-danger text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <label className="flex flex-col text-xs text-text-muted">
          Szer. (mm)
          <input
            type="number"
            value={newWidth}
            onChange={(e) => setNewWidth(Number(e.target.value))}
            className="mt-1 w-20 px-2 py-1.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none transition-colors"
            min={10}
          />
        </label>
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
          onClick={addBoard}
          className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-sm rounded-lg transition-colors border border-accent/20"
        >
          Dodaj
        </button>
      </div>
    </div>
  )
}
