import { useState, useCallback, useRef, useEffect } from 'react'
import type { Point, BoardSize, GapConfig, LayoutResult, JoistConfig, JoistResult, FullResult, OffcutSettings } from '../types'
import { calculateLayout } from '../utils/boardLayout'
import { calculateJoistLayout } from '../utils/joistLayout'
import { downloadProject, loadProjectFromFile } from '../utils/projectFile'
import type { AppState } from '../utils/projectFile'

const DEFAULT_BOARDS: BoardSize[] = [
  { id: '140x2400', width: 140, length: 2400, label: '140 × 2400 mm' },
  { id: '140x3000', width: 140, length: 3000, label: '140 × 3000 mm' },
  { id: '140x4000', width: 140, length: 4000, label: '140 × 4000 mm' },
]

const DEFAULT_GAPS: GapConfig = { along: 5, front: 5 }

const DEFAULT_OFFCUT: OffcutSettings = { mode: 'reuse-exact', minLength: 500 }

const DEFAULT_UPPER_JOISTS: JoistConfig = {
  enabled: false,
  sizes: [
    { id: 'legar-40x60x3000', width: 40, length: 3000, label: '40×60×3000 mm' },
    { id: 'legar-40x60x4000', width: 40, length: 4000, label: '40×60×4000 mm' },
  ],
  spacing: 350, width: 40, height: 60,
}

const DEFAULT_LOWER_JOISTS: JoistConfig = {
  enabled: false,
  sizes: [
    { id: 'klegar-40x60x3000', width: 40, length: 3000, label: '40×60×3000 mm' },
    { id: 'klegar-40x60x4000', width: 40, length: 4000, label: '40×60×4000 mm' },
  ],
  spacing: 700, width: 40, height: 60,
}

const EMPTY_BOARD_RESULT: LayoutResult = {
  placedBoards: [], boardCounts: {}, terraceArea: 0, boardArea: 0, totalBoardsToOrder: 0, wastePercent: 0, offcutsUsed: 0, offcutsRemaining: [],
}

const EMPTY_JOIST_RESULT: JoistResult = {
  placedJoists: [], joistCounts: {}, offcutsUsed: 0, offcutsRemaining: [],
}

const EMPTY_RESULT: FullResult = {
  boards: EMPTY_BOARD_RESULT, upperJoists: EMPTY_JOIST_RESULT, lowerJoists: EMPTY_JOIST_RESULT,
}

const MAX_HISTORY = 50

export function useTerraceCalculator() {
  const [polygon, setPolygon] = useState<Point[]>([])
  const [boards, setBoards] = useState<BoardSize[]>(DEFAULT_BOARDS)
  const [gaps, setGaps] = useState<GapConfig>(DEFAULT_GAPS)
  const [angle, setAngle] = useState(0)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [upperJoists, setUpperJoists] = useState<JoistConfig>(DEFAULT_UPPER_JOISTS)
  const [lowerJoists, setLowerJoists] = useState<JoistConfig>(DEFAULT_LOWER_JOISTS)
  const [offcutSettings, setOffcutSettings] = useState<OffcutSettings>(DEFAULT_OFFCUT)
  const [result, setResult] = useState<FullResult>(EMPTY_RESULT)

  const history = useRef<AppState[]>([])
  const future = useRef<AppState[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (polygon.length < 3 || boards.length === 0) {
        setResult(EMPTY_RESULT)
        return
      }
      const boardResult = calculateLayout(polygon, boards, gaps, angle, startPoint, offcutSettings)
      const upperResult = calculateJoistLayout(polygon, upperJoists, angle, offcutSettings)
      const lowerResult = calculateJoistLayout(polygon, lowerJoists, angle + 90, offcutSettings)
      setResult({ boards: boardResult, upperJoists: upperResult, lowerJoists: lowerResult })
    }, 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [polygon, boards, gaps, angle, startPoint, upperJoists, lowerJoists, offcutSettings])

  const snapshot = useCallback((): AppState => ({
    polygon: [...polygon], boards: [...boards], gaps: { ...gaps }, angle,
    startPoint: startPoint ? { ...startPoint } : null,
    upperJoists: { ...upperJoists, sizes: [...upperJoists.sizes] },
    lowerJoists: { ...lowerJoists, sizes: [...lowerJoists.sizes] },
    offcutSettings: { ...offcutSettings },
  }), [polygon, boards, gaps, angle, startPoint, upperJoists, lowerJoists, offcutSettings])

  const pushHistory = useCallback(() => {
    history.current.push(snapshot())
    if (history.current.length > MAX_HISTORY) history.current.shift()
    future.current = []
  }, [snapshot])

  const applyState = useCallback((state: AppState) => {
    setPolygon(state.polygon)
    setBoards(state.boards)
    setGaps(state.gaps)
    setAngle(state.angle)
    setStartPoint(state.startPoint)
    setUpperJoists(state.upperJoists)
    setLowerJoists(state.lowerJoists)
    if (state.offcutSettings) setOffcutSettings(state.offcutSettings)
  }, [])

  const undo = useCallback(() => {
    if (history.current.length === 0) return
    future.current.push(snapshot())
    applyState(history.current.pop()!)
  }, [snapshot, applyState])

  const redo = useCallback(() => {
    if (future.current.length === 0) return
    history.current.push(snapshot())
    applyState(future.current.pop()!)
  }, [snapshot, applyState])

  const withHistory = useCallback(<T extends unknown[]>(fn: (...args: T) => void) => {
    return (...args: T) => { pushHistory(); fn(...args) }
  }, [pushHistory])

  const handlePolygonComplete = useCallback(withHistory((points: Point[]) => setPolygon(points)), [withHistory])
  const handlePolygonUpdate = useCallback(withHistory((points: Point[]) => setPolygon(points)), [withHistory])
  const handleStartPointSet = useCallback(withHistory((point: Point) => setStartPoint(point)), [withHistory])
  const handleBoardsChange = useCallback(withHistory((b: BoardSize[]) => setBoards(b)), [withHistory])
  const handleGapsChange = useCallback(withHistory((g: GapConfig) => setGaps(g)), [withHistory])
  const handleAngleChange = useCallback(withHistory((a: number) => setAngle(a)), [withHistory])
  const handleUpperJoistsChange = useCallback(withHistory((c: JoistConfig) => setUpperJoists(c)), [withHistory])
  const handleLowerJoistsChange = useCallback(withHistory((c: JoistConfig) => setLowerJoists(c)), [withHistory])
  const handleOffcutSettingsChange = useCallback(withHistory((s: OffcutSettings) => setOffcutSettings(s)), [withHistory])

  const handleClear = useCallback(() => {
    pushHistory()
    setPolygon([])
    setStartPoint(null)
  }, [pushHistory])

  const handleSave = useCallback(() => downloadProject(snapshot()), [snapshot])

  const handleLoad = useCallback(async () => {
    try {
      const state = await loadProjectFromFile()
      pushHistory()
      applyState(state)
    } catch { /* user cancelled */ }
  }, [pushHistory, applyState])

  const canUndo = history.current.length > 0
  const canRedo = future.current.length > 0

  return {
    polygon, boards, gaps, angle, startPoint,
    upperJoists, lowerJoists, offcutSettings,
    result, canUndo, canRedo,
    undo, redo,
    handleBoardsChange, handleGapsChange, handleAngleChange,
    handlePolygonComplete, handlePolygonUpdate, handleStartPointSet, handleClear,
    handleUpperJoistsChange, handleLowerJoistsChange,
    handleOffcutSettingsChange,
    handleSave, handleLoad,
  }
}
