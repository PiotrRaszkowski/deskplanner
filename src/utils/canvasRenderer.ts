import type { Point, PlacedBoard, PlacedJoist, BoardSize } from '../types'
import { isDark } from './theme'

const BOARD_PALETTE = [
  '#c8a06e',
  '#7cb07a',
  '#6ba3c9',
  '#cf8e6e',
  '#a88bc4',
  '#d4a84b',
  '#5ea69e',
  '#d47b8a',
]

interface RenderOptions {
  polygon: Point[]
  placedBoards: PlacedBoard[]
  upperJoists: PlacedJoist[]
  lowerJoists: PlacedJoist[]
  currentPoints: Point[]
  mousePos: Point | null
  scale: number
  offset: Point
  canvasWidth: number
  canvasHeight: number
  drawingMode: boolean
  gridSize: number
  snapToGrid: boolean
  selectedEdge: number | null
  startPoint: Point | null
  boardSizes: BoardSize[]
  visibleLayer: 'boards' | 'upperJoists' | 'lowerJoists' | 'all'
  hoveredBoardIndex: number | null
}

export function renderCanvas(ctx: CanvasRenderingContext2D, options: RenderOptions) {
  const { polygon, placedBoards, upperJoists, lowerJoists, currentPoints, mousePos, scale, offset, canvasWidth, canvasHeight, drawingMode, gridSize, snapToGrid, selectedEdge, startPoint, boardSizes, visibleLayer, hoveredBoardIndex } = options

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  if (snapToGrid) {
    drawGrid(ctx, scale, offset, canvasWidth, canvasHeight, gridSize)
  }

  const colorMap = buildColorMap(boardSizes)
  const showAll = visibleLayer === 'all'

  if ((visibleLayer === 'lowerJoists' || showAll) && lowerJoists.length > 0) {
    drawJoists(ctx, lowerJoists, scale, offset, '#8b6c3f', showAll ? 0.35 : 0.8)
  }

  if ((visibleLayer === 'upperJoists' || showAll) && upperJoists.length > 0) {
    drawJoists(ctx, upperJoists, scale, offset, '#4a7a5e', showAll ? 0.45 : 0.8)
  }

  if ((visibleLayer === 'boards' || showAll) && placedBoards.length > 0) {
    if (showAll) ctx.globalAlpha = 0.7
    drawBoards(ctx, placedBoards, scale, offset, colorMap, hoveredBoardIndex)
    ctx.globalAlpha = 1
  }

  if (polygon.length > 0) {
    drawPolygon(ctx, polygon, scale, offset, selectedEdge)
  }

  if (startPoint) {
    drawStartPoint(ctx, startPoint, scale, offset)
  }

  if (drawingMode && currentPoints.length > 0) {
    drawCurrentPoints(ctx, currentPoints, mousePos, scale, offset)
  }
}

function drawJoists(ctx: CanvasRenderingContext2D, joists: PlacedJoist[], scale: number, offset: Point, color: string, alpha: number) {
  ctx.globalAlpha = alpha
  for (const joist of joists) {
    const corners = joist.corners.map((c) => toScreen(c, scale, offset))
    ctx.beginPath()
    ctx.moveTo(corners[0].x, corners[0].y)
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = darkenColor(color, 0.3)
    ctx.lineWidth = 0.5
    ctx.stroke()

    if (joist.cut) {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(corners[0].x, corners[0].y)
      for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y)
      ctx.closePath()
      ctx.clip()
      const minX = Math.min(...corners.map((c) => c.x)) - 5
      const maxX = Math.max(...corners.map((c) => c.x)) + 5
      const minY = Math.min(...corners.map((c) => c.y)) - 5
      const maxY = Math.max(...corners.map((c) => c.y)) + 5
      ctx.strokeStyle = isDark() ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let d = minX + minY; d < maxX + maxY; d += 6) {
        ctx.moveTo(d - maxY, minY)
        ctx.lineTo(d - minY, maxY)
      }
      ctx.stroke()
      ctx.restore()
    }
  }
  ctx.globalAlpha = 1
}

function buildColorMap(boardSizes: BoardSize[]): Map<string, string> {
  const map = new Map<string, string>()
  boardSizes.forEach((b, i) => {
    map.set(b.id, BOARD_PALETTE[i % BOARD_PALETTE.length])
  })
  return map
}

function toScreen(p: Point, scale: number, offset: Point): Point {
  return {
    x: p.x * scale + offset.x,
    y: p.y * scale + offset.y,
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, scale: number, offset: Point, width: number, height: number, gridSize: number) {
  const gridSpacePx = gridSize * scale
  if (gridSpacePx < 8) return

  const startX = Math.floor(-offset.x / gridSpacePx) * gridSpacePx + (offset.x % gridSpacePx)
  const startY = Math.floor(-offset.y / gridSpacePx) * gridSpacePx + (offset.y % gridSpacePx)

  const dark = isDark()
  ctx.strokeStyle = dark ? '#252631' : '#e8eaef'
  ctx.lineWidth = 0.5
  ctx.beginPath()
  for (let x = startX; x < width; x += gridSpacePx) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  for (let y = startY; y < height; y += gridSpacePx) {
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()

  const majorEvery = 5
  ctx.strokeStyle = dark ? '#3a3c4e' : '#cdd1da'
  ctx.lineWidth = 1
  ctx.beginPath()
  let idx = 0
  for (let x = startX; x < width; x += gridSpacePx) {
    if (idx % majorEvery === 0) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }
    idx++
  }
  idx = 0
  for (let y = startY; y < height; y += gridSpacePx) {
    if (idx % majorEvery === 0) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }
    idx++
  }
  ctx.stroke()

  ctx.fillStyle = dark ? '#6b6f82' : '#8b90a3'
  ctx.font = '9px monospace'
  idx = 0
  for (let x = startX; x < width; x += gridSpacePx) {
    if (idx % majorEvery === 0) {
      const mmVal = Math.round((x - offset.x) / scale)
      ctx.fillText(`${mmVal}`, x + 3, 11)
    }
    idx++
  }
  idx = 0
  for (let y = startY; y < height; y += gridSpacePx) {
    if (idx % majorEvery === 0) {
      const mmVal = Math.round((y - offset.y) / scale)
      ctx.fillText(`${mmVal}`, 3, y - 3)
    }
    idx++
  }
}

function drawPolygon(ctx: CanvasRenderingContext2D, polygon: Point[], scale: number, offset: Point, selectedEdge: number | null) {
  if (polygon.length < 2) return

  ctx.beginPath()
  const first = toScreen(polygon[0], scale, offset)
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < polygon.length; i++) {
    const p = toScreen(polygon[i], scale, offset)
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
  ctx.strokeStyle = isDark() ? '#a0a4b8' : '#374151'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = isDark() ? 'rgba(129, 140, 248, 0.08)' : 'rgba(99, 102, 241, 0.04)'
  ctx.fill()

  if (selectedEdge !== null) {
    const sa = toScreen(polygon[selectedEdge], scale, offset)
    const sb = toScreen(polygon[(selectedEdge + 1) % polygon.length], scale, offset)
    ctx.beginPath()
    ctx.moveTo(sa.x, sa.y)
    ctx.lineTo(sb.x, sb.y)
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 3.5
    ctx.shadowColor = '#05966940'
    ctx.shadowBlur = 6
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  for (let i = 0; i < polygon.length; i++) {
    const p = toScreen(polygon[i], scale, offset)
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fillStyle = isDark() ? '#818cf8' : '#4f46e5'
    ctx.fill()
    ctx.strokeStyle = isDark() ? '#1a1b23' : '#fff'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const len = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
    const mid = toScreen({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, scale, offset)
    const isSelected = i === selectedEdge
    ctx.fillStyle = isSelected ? '#34d399' : (isDark() ? '#a0a4b8' : '#4b5068')
    ctx.font = isSelected ? 'bold 11px monospace' : '10px monospace'
    ctx.fillText(`${Math.round(len)}`, mid.x + 5, mid.y - 6)
  }
}

function drawStartPoint(ctx: CanvasRenderingContext2D, point: Point, scale: number, offset: Point) {
  const sp = toScreen(point, scale, offset)
  const size = 8

  ctx.strokeStyle = '#dc2626'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(sp.x - size, sp.y)
  ctx.lineTo(sp.x + size, sp.y)
  ctx.moveTo(sp.x, sp.y - size)
  ctx.lineTo(sp.x, sp.y + size)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(sp.x, sp.y, 12, 0, Math.PI * 2)
  ctx.strokeStyle = '#dc262680'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = '#dc2626'
  ctx.font = 'bold 9px sans-serif'
  ctx.fillText('START', sp.x + 14, sp.y + 3)
}

function drawBoards(ctx: CanvasRenderingContext2D, boards: PlacedBoard[], scale: number, offset: Point, colorMap: Map<string, string>, hoveredIndex: number | null) {
  for (let bi = 0; bi < boards.length; bi++) {
    const board = boards[bi]
    const isHovered = bi === hoveredIndex
    const corners = board.corners.map((c) => toScreen(c, scale, offset))

    ctx.beginPath()
    ctx.moveTo(corners[0].x, corners[0].y)
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y)
    }
    ctx.closePath()

    const baseColor = colorMap.get(board.boardSize.id) || '#c8a06e'
    ctx.fillStyle = baseColor
    ctx.fill()
    ctx.strokeStyle = darkenColor(baseColor, 0.3)
    ctx.lineWidth = 0.5
    ctx.stroke()

    if (board.cut || board.ripCut) {
      drawHatching(ctx, corners, board.ripCut)
    }

    if (isHovered) {
      ctx.beginPath()
      ctx.moveTo(corners[0].x, corners[0].y)
      for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y)
      ctx.closePath()
      ctx.strokeStyle = '#4f46e5'
      ctx.lineWidth = 2.5
      ctx.shadowColor = '#4f46e580'
      ctx.shadowBlur = 6
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }
}

function drawHatching(ctx: CanvasRenderingContext2D, corners: Point[], isRipCut: boolean) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(corners[0].x, corners[0].y)
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y)
  }
  ctx.closePath()
  ctx.clip()

  const minX = Math.min(...corners.map((c) => c.x)) - 5
  const maxX = Math.max(...corners.map((c) => c.x)) + 5
  const minY = Math.min(...corners.map((c) => c.y)) - 5
  const maxY = Math.max(...corners.map((c) => c.y)) + 5

  if (isRipCut) {
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    for (let d = minX + minY; d < maxX + maxY; d += 6) {
      ctx.moveTo(d - maxY, minY)
      ctx.lineTo(d - minY, maxY)
    }
    for (let d = minX + minY; d < maxX + maxY; d += 6) {
      ctx.moveTo(d - maxY + 3, minY)
      ctx.lineTo(d - minY + 3, maxY)
    }
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    ctx.strokeStyle = isDark() ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let d = minX + minY; d < maxX + maxY; d += 7) {
      ctx.moveTo(d - maxY, minY)
      ctx.lineTo(d - minY, maxY)
    }
    ctx.stroke()
  }

  ctx.restore()
}

function darkenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - amount))}, ${Math.round(g * (1 - amount))}, ${Math.round(b * (1 - amount))})`
}

function drawCurrentPoints(ctx: CanvasRenderingContext2D, points: Point[], mousePos: Point | null, scale: number, offset: Point) {
  if (points.length === 0) return

  if (mousePos && points.length > 0) {
    drawSnapGuides(ctx, points, mousePos, scale, offset)
  }

  ctx.beginPath()
  const first = toScreen(points[0], scale, offset)
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < points.length; i++) {
    const p = toScreen(points[i], scale, offset)
    ctx.lineTo(p.x, p.y)
  }
  if (mousePos) {
    const mp = toScreen(mousePos, scale, offset)
    ctx.lineTo(mp.x, mp.y)
  }
  ctx.strokeStyle = '#4f46e5'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.stroke()
  ctx.setLineDash([])

  if (mousePos && points.length > 0) {
    const lastPt = toScreen(points[points.length - 1], scale, offset)
    const mp = toScreen(mousePos, scale, offset)
    const len = Math.sqrt(
      (mousePos.x - points[points.length - 1].x) ** 2 +
        (mousePos.y - points[points.length - 1].y) ** 2
    )
    const midX = (lastPt.x + mp.x) / 2
    const midY = (lastPt.y + mp.y) / 2
    ctx.fillStyle = '#059669'
    ctx.font = '10px monospace'
    ctx.fillText(`${Math.round(len)} mm`, midX + 5, midY - 5)
  }

  for (const p of points) {
    const sp = toScreen(p, scale, offset)
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = isDark() ? '#818cf8' : '#4f46e5'
    ctx.fill()
    ctx.strokeStyle = isDark() ? '#1a1b23' : '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  if (points.length >= 2) {
    const fp = toScreen(points[0], scale, offset)
    ctx.beginPath()
    ctx.arc(fp.x, fp.y, 12, 0, Math.PI * 2)
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 2
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawSnapGuides(ctx: CanvasRenderingContext2D, points: Point[], mousePos: Point, scale: number, offset: Point) {
  const mp = toScreen(mousePos, scale, offset)
  const tolerance = 0.5

  for (const pt of points) {
    if (Math.abs(mousePos.x - pt.x) < tolerance) {
      const sp = toScreen(pt, scale, offset)
      ctx.beginPath()
      ctx.moveTo(sp.x, sp.y)
      ctx.lineTo(mp.x, mp.y)
      ctx.strokeStyle = '#f59e0b80'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }
    if (Math.abs(mousePos.y - pt.y) < tolerance) {
      const sp = toScreen(pt, scale, offset)
      ctx.beginPath()
      ctx.moveTo(sp.x, sp.y)
      ctx.lineTo(mp.x, mp.y)
      ctx.strokeStyle = '#f59e0b80'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
}
