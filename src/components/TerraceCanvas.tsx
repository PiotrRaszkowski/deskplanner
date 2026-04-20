import { useRef, useEffect, useCallback, useState } from 'react'
import type { Point, PlacedBoard, PlacedJoist, BoardSize } from '../types'
import { renderCanvas } from '../utils/canvasRenderer'
import { isPointNearPoint, distanceBetween } from '../utils/geometry'

type VisibleLayer = 'boards' | 'upperJoists' | 'lowerJoists' | 'all'

interface TerraceCanvasProps {
  polygon: Point[]
  placedBoards: PlacedBoard[]
  upperJoists: PlacedJoist[]
  lowerJoists: PlacedJoist[]
  startPoint: Point | null
  boardSizes: BoardSize[]
  onPolygonComplete: (polygon: Point[]) => void
  onPolygonUpdate: (polygon: Point[]) => void
  onStartPointSet: (point: Point) => void
  onClear: () => void
}

const SNAP_DISTANCE_PX = 15
const EDGE_HIT_DISTANCE_PX = 10
const POINT_SNAP_THRESHOLD_PX = 20
const GRID_SIZES = [10, 20, 50, 100, 250, 500]

type CanvasMode = 'draw' | 'edit' | 'startPoint'

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  const proj = { x: a.x + t * dx, y: a.y + t * dy }
  return Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2)
}

export default function TerraceCanvas({ polygon, placedBoards, upperJoists, lowerJoists, startPoint, boardSizes, onPolygonComplete, onPolygonUpdate, onStartPointSet, onClear }: TerraceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [mousePos, setMousePos] = useState<Point | null>(null)
  const [scale, setScale] = useState(0.15)
  const [offset, setOffset] = useState<Point>({ x: 50, y: 50 })
  const [isPanning, setIsPanning] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [orthoMode, setOrthoMode] = useState(true)
  const [gridSize, setGridSize] = useState(100)
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null)
  const [edgeLengthInput, setEdgeLengthInput] = useState('')
  const [edgeInputPos, setEdgeInputPos] = useState<Point>({ x: 0, y: 0 })
  const [settingStartPoint, setSettingStartPoint] = useState(false)
  const [visibleLayer, setVisibleLayer] = useState<VisibleLayer>('all')
  const [hoveredBoard, setHoveredBoard] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const edgeInputRef = useRef<HTMLInputElement>(null)
  const panStart = useRef<Point>({ x: 0, y: 0 })
  const offsetStart = useRef<Point>({ x: 0, y: 0 })

  const drawingMode = polygon.length === 0
  const mode: CanvasMode = drawingMode ? 'draw' : settingStartPoint ? 'startPoint' : 'edit'

  const snapPoint = useCallback(
    (p: Point): Point => {
      let result = { ...p }

      if (snapToGrid) {
        result.x = Math.round(result.x / gridSize) * gridSize
        result.y = Math.round(result.y / gridSize) * gridSize
      }

      if (orthoMode && currentPoints.length > 0) {
        const last = currentPoints[currentPoints.length - 1]
        const dx = Math.abs(result.x - last.x)
        const dy = Math.abs(result.y - last.y)
        if (dx > dy) {
          result.y = last.y
        } else {
          result.x = last.x
        }
        if (snapToGrid) {
          result.x = Math.round(result.x / gridSize) * gridSize
          result.y = Math.round(result.y / gridSize) * gridSize
        }
      }

      const snapThresholdWorld = POINT_SNAP_THRESHOLD_PX / scale
      for (const pt of currentPoints) {
        if (Math.abs(result.x - pt.x) < snapThresholdWorld) {
          result.x = pt.x
        }
        if (Math.abs(result.y - pt.y) < snapThresholdWorld) {
          result.y = pt.y
        }
      }

      return result
    },
    [snapToGrid, orthoMode, gridSize, currentPoints, scale]
  )

  const screenToWorld = useCallback(
    (sx: number, sy: number): Point => ({
      x: (sx - offset.x) / scale,
      y: (sy - offset.y) / scale,
    }),
    [scale, offset]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    renderCanvas(ctx, {
      polygon,
      placedBoards,
      upperJoists,
      lowerJoists,
      currentPoints,
      mousePos,
      scale,
      offset,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
      drawingMode,
      gridSize,
      snapToGrid,
      selectedEdge,
      startPoint,
      boardSizes,
      visibleLayer,
      hoveredBoardIndex: hoveredBoard,
    })
  }, [polygon, placedBoards, upperJoists, lowerJoists, currentPoints, mousePos, scale, offset, drawingMode, gridSize, snapToGrid, selectedEdge, startPoint, boardSizes, visibleLayer, hoveredBoard])

  const findClickedEdge = useCallback(
    (sx: number, sy: number): number | null => {
      if (polygon.length < 2) return null
      for (let i = 0; i < polygon.length; i++) {
        const a = { x: polygon[i].x * scale + offset.x, y: polygon[i].y * scale + offset.y }
        const b = {
          x: polygon[(i + 1) % polygon.length].x * scale + offset.x,
          y: polygon[(i + 1) % polygon.length].y * scale + offset.y,
        }
        const dist = distanceToSegment({ x: sx, y: sy }, a, b)
        if (dist < EDGE_HIT_DISTANCE_PX) return i
      }
      return null
    },
    [polygon, scale, offset]
  )

  const findClickedVertex = useCallback(
    (sx: number, sy: number): number | null => {
      for (let i = 0; i < polygon.length; i++) {
        const sp = { x: polygon[i].x * scale + offset.x, y: polygon[i].y * scale + offset.y }
        if (isPointNearPoint({ x: sx, y: sy }, sp, SNAP_DISTANCE_PX)) return i
      }
      return null
    },
    [polygon, scale, offset]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) return

      const rect = canvasRef.current!.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top

      if (mode === 'startPoint') {
        const clickedVertex = findClickedVertex(sx, sy)
        if (clickedVertex !== null) {
          onStartPointSet(polygon[clickedVertex])
          setSettingStartPoint(false)
        }
        return
      }

      if (mode === 'edit') {
        const edgeIdx = findClickedEdge(sx, sy)
        if (edgeIdx !== null) {
          const a = polygon[edgeIdx]
          const b = polygon[(edgeIdx + 1) % polygon.length]
          const len = distanceBetween(a, b)
          setSelectedEdge(edgeIdx)
          setEdgeLengthInput(Math.round(len).toString())
          const midScreen = {
            x: (a.x + b.x) / 2 * scale + offset.x,
            y: (a.y + b.y) / 2 * scale + offset.y,
          }
          setEdgeInputPos(midScreen)
          setTimeout(() => edgeInputRef.current?.focus(), 0)
        } else {
          setSelectedEdge(null)
        }
        return
      }

      const rawWorld = screenToWorld(sx, sy)
      const worldPoint = snapPoint(rawWorld)

      if (currentPoints.length >= 2) {
        const firstScreen = {
          x: currentPoints[0].x * scale + offset.x,
          y: currentPoints[0].y * scale + offset.y,
        }
        if (isPointNearPoint({ x: sx, y: sy }, firstScreen, SNAP_DISTANCE_PX)) {
          onPolygonComplete([...currentPoints])
          setCurrentPoints([])
          return
        }
      }

      setCurrentPoints((prev) => [...prev, worldPoint])
    },
    [mode, isPanning, screenToWorld, snapPoint, currentPoints, scale, offset, onPolygonComplete, findClickedEdge, polygon, onStartPointSet]
  )

  const handleEdgeLengthSubmit = useCallback(() => {
    if (selectedEdge === null) return
    const newLen = parseFloat(edgeLengthInput)
    if (isNaN(newLen) || newLen <= 0) {
      setSelectedEdge(null)
      return
    }

    const i = selectedEdge
    const j = (i + 1) % polygon.length
    const a = polygon[i]
    const b = polygon[j]
    const currentLen = distanceBetween(a, b)
    if (Math.abs(currentLen - newLen) < 0.5) {
      setSelectedEdge(null)
      return
    }

    const dx = b.x - a.x
    const dy = b.y - a.y
    const ratio = newLen / currentLen
    const newB = { x: a.x + dx * ratio, y: a.y + dy * ratio }

    const offsetX = newB.x - b.x
    const offsetY = newB.y - b.y

    const newPolygon = polygon.map((p, idx) => {
      if (idx <= i) return p
      return { x: p.x + offsetX, y: p.y + offsetY }
    })

    onPolygonUpdate(newPolygon)
    setSelectedEdge(null)
  }, [selectedEdge, edgeLengthInput, polygon, onPolygonUpdate])

  const handleDoubleClick = useCallback(() => {
    if (mode !== 'draw' || currentPoints.length < 3) return
    onPolygonComplete([...currentPoints])
    setCurrentPoints([])
  }, [mode, currentPoints, onPolygonComplete])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top

      if (isPanning) {
        setOffset({
          x: offsetStart.current.x + (sx - panStart.current.x),
          y: offsetStart.current.y + (sy - panStart.current.y),
        })
        return
      }

      if (drawingMode) {
        const raw = screenToWorld(sx, sy)
        setMousePos(snapPoint(raw))
      }

      if (!drawingMode && !isPanning) {
        const worldPt = screenToWorld(sx, sy)
        let found = -1
        for (let i = placedBoards.length - 1; i >= 0; i--) {
          const b = placedBoards[i]
          const xs = b.corners.map(c => c.x)
          const ys = b.corners.map(c => c.y)
          if (worldPt.x >= Math.min(...xs) && worldPt.x <= Math.max(...xs) &&
              worldPt.y >= Math.min(...ys) && worldPt.y <= Math.max(...ys)) {
            found = i
            break
          }
        }
        setHoveredBoard(found >= 0 ? found : null)
        setTooltipPos({ x: sx, y: sy })
      }
    },
    [isPanning, drawingMode, screenToWorld, snapPoint, placedBoards]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true)
        const rect = canvasRef.current!.getBoundingClientRect()
        panStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        offsetStart.current = { ...offset }
        e.preventDefault()
      }
    },
    [offset]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const rect = canvasRef.current!.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
      const newScale = Math.max(0.01, Math.min(2, scale * zoomFactor))

      setOffset({
        x: mx - (mx - offset.x) * (newScale / scale),
        y: my - (my - offset.y) * (newScale / scale),
      })
      setScale(newScale)
    },
    [scale, offset]
  )

  const handleClear = () => {
    setCurrentPoints([])
    setMousePos(null)
    setSelectedEdge(null)
    setSettingStartPoint(false)
    onClear()
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingStartPoint) {
          setSettingStartPoint(false)
        } else if (selectedEdge !== null) {
          setSelectedEdge(null)
        } else if (currentPoints.length > 0) {
          setCurrentPoints([])
          setMousePos(null)
        }
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey && currentPoints.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        setCurrentPoints((prev) => prev.slice(0, -1))
      }
    },
    [currentPoints, selectedEdge, settingStartPoint]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Kształt tarasu</h2>
        <div className="flex gap-2">
          {!drawingMode && (
            <button
              onClick={() => setSettingStartPoint(!settingStartPoint)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors border ${
                settingStartPoint
                  ? 'bg-danger/10 border-danger/30 text-danger'
                  : 'bg-surface-hover border-border-subtle text-text-secondary hover:bg-border-subtle'
              }`}
            >
              {settingStartPoint ? 'Kliknij na róg tarasu...' : 'Róg startowy'}
            </button>
          )}
          {drawingMode && currentPoints.length > 0 && (
            <button
              onClick={() => setCurrentPoints((prev) => prev.slice(0, -1))}
              className="px-3 py-1.5 text-xs bg-surface-hover hover:bg-border-subtle text-text-secondary rounded-lg transition-colors border border-border-subtle"
            >
              Cofnij
            </button>
          )}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors border ${
              snapToGrid ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-hover border-border-subtle text-text-muted'
            }`}
            title="Siatka"
          >
            ▦
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors border border-danger/20"
          >
            Wyczyść
          </button>
        </div>
      </div>

      {drawingMode && (
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="accent-accent w-3.5 h-3.5"
            />
            Snap to grid
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={orthoMode}
              onChange={(e) => setOrthoMode(e.target.checked)}
              className="accent-accent w-3.5 h-3.5"
            />
            Kąty proste (90°)
          </label>
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="text-xs bg-surface-elevated border border-border-subtle rounded-lg px-2 py-1 text-text-secondary"
          >
            {GRID_SIZES.map((s) => (
              <option key={s} value={s}>
                Siatka {s} mm
              </option>
            ))}
          </select>
        </div>
      )}

      {drawingMode && (
        <p className="text-xs text-text-muted">
          Klikaj aby dodać punkty wielokąta. Zamknij klikając na pierwszy punkt lub double-click.
          {orthoMode && ' Tryb kątów prostych aktywny.'}
          {' '}Alt+drag = przesuń. Scroll = zoom. Esc = anuluj. Ctrl+Z = cofnij.
        </p>
      )}

      {!drawingMode && !settingStartPoint && selectedEdge === null && (
        <p className="text-xs text-text-muted">
          Kliknij na krawędź aby edytować długość. Wybierz róg startowy układania desek.
        </p>
      )}

      {!drawingMode && (placedBoards.length > 0 || upperJoists.length > 0 || lowerJoists.length > 0) && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-text-muted mr-1">Warstwa:</span>
          {(['all', 'boards', 'upperJoists', 'lowerJoists'] as VisibleLayer[]).map((layer) => {
            const labels: Record<VisibleLayer, string> = { all: 'Wszystko', boards: 'Deski', upperJoists: 'Legary górne', lowerJoists: 'Legary dolne' }
            return (
              <button
                key={layer}
                onClick={() => setVisibleLayer(layer)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  visibleLayer === layer
                    ? 'bg-accent text-white'
                    : 'bg-surface-hover text-text-secondary hover:bg-border-subtle'
                }`}
              >
                {labels[layer]}
              </button>
            )
          })}
        </div>
      )}

      <div className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className={`w-full h-full rounded-xl bg-canvas-bg border border-border-subtle ${
            settingStartPoint ? 'cursor-cell' : 'cursor-crosshair'
          }`}
          style={{ minHeight: 300 }}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleMouseUp(); setHoveredBoard(null) }}
          onWheel={handleWheel}
        />

        {hoveredBoard !== null && placedBoards[hoveredBoard] && (
          <div
            className="absolute z-20 pointer-events-none bg-surface-elevated border border-border-subtle rounded-lg px-3 py-2 shadow-lg text-xs"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 40 }}
          >
            {(() => {
              const b = placedBoards[hoveredBoard]
              const status = b.ripCut ? 'Cięta wzdłuż' : b.cut ? 'Cięta' : 'Pełna'
              return (
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-text-primary">{b.boardSize.label}</span>
                  <span className="text-text-muted">Ułożono: {Math.round(b.actualLength)} × {Math.round(b.actualWidth)} mm</span>
                  <span className={b.cut || b.ripCut ? 'text-warning' : 'text-success'}>{status}</span>
                  {b.fromOffcut && <span className="text-accent">Z odcinka (reuse)</span>}
                </div>
              )
            })()}
          </div>
        )}

        {selectedEdge !== null && (
          <div
            className="absolute z-10"
            style={{ left: edgeInputPos.x - 60, top: edgeInputPos.y - 16 }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleEdgeLengthSubmit()
              }}
              className="flex items-center gap-1 bg-surface-elevated border border-accent rounded-lg px-2 py-1 shadow-lg"
            >
              <input
                ref={edgeInputRef}
                type="number"
                value={edgeLengthInput}
                onChange={(e) => setEdgeLengthInput(e.target.value)}
                onBlur={handleEdgeLengthSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSelectedEdge(null)
                }}
                className="w-20 px-1.5 py-0.5 bg-surface border border-border-subtle rounded text-sm text-text-primary text-center font-mono focus:border-accent focus:outline-none"
                min={1}
              />
              <span className="text-xs text-text-muted">mm</span>
              <button
                type="submit"
                className="ml-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded hover:bg-accent/20 transition-colors"
              >
                ✓
              </button>
            </form>
          </div>
        )}
      </div>

      {mousePos && drawingMode && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted font-mono">
            {Math.round(mousePos.x)} , {Math.round(mousePos.y)} mm
          </p>
          {currentPoints.length > 0 && (
            <p className="text-xs text-text-muted">
              {currentPoints.length} punkt{currentPoints.length === 1 ? '' : currentPoints.length < 5 ? 'y' : 'ów'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
