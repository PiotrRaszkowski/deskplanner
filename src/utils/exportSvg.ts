import type { Point, PlacedBoard, PlacedJoist } from '../types'

const BOARD_COLORS = [
  '#c8a06e', '#7cb07a', '#6ba3c9', '#cf8e6e',
  '#a88bc4', '#d4a84b', '#5ea69e', '#d47b8a',
]

export function exportLayoutSvg(
  polygon: Point[],
  boards: PlacedBoard[],
  upperJoists: PlacedJoist[],
  lowerJoists: PlacedJoist[],
  startPoint: Point | null,
  boardSizeIds: string[]
): string {
  const allX = polygon.map(p => p.x)
  const allY = polygon.map(p => p.y)
  const minX = Math.min(...allX) - 200
  const minY = Math.min(...allY) - 200
  const maxX = Math.max(...allX) + 200
  const maxY = Math.max(...allY) + 200
  const w = maxX - minX
  const h = maxY - minY

  const colorMap = new Map<string, string>()
  boardSizeIds.forEach((id, i) => colorMap.set(id, BOARD_COLORS[i % BOARD_COLORS.length]))

  const lines: string[] = []
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}" width="${w}" height="${h}">`)
  lines.push(`<style>
    text { font-family: monospace; font-size: 60px; fill: #333; }
    .dim { font-size: 50px; fill: #666; }
    .board-label { font-size: 30px; fill: #000; text-anchor: middle; dominant-baseline: middle; }
  </style>`)
  lines.push(`<rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="#f8f9fb"/>`)

  lines.push(`<polygon points="${polygon.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#374151" stroke-width="3"/>`)

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const len = Math.round(Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2))
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    lines.push(`<text x="${mx + 20}" y="${my - 20}" class="dim">${len}</text>`)
  }

  for (const joist of lowerJoists) {
    const pts = joist.corners.map(c => `${c.x},${c.y}`).join(' ')
    lines.push(`<polygon points="${pts}" fill="#8b6c3f" fill-opacity="0.3" stroke="#5a4525" stroke-width="1"/>`)
  }

  for (const joist of upperJoists) {
    const pts = joist.corners.map(c => `${c.x},${c.y}`).join(' ')
    lines.push(`<polygon points="${pts}" fill="#4a7a5e" fill-opacity="0.4" stroke="#2d5a3e" stroke-width="1"/>`)
  }

  for (const board of boards) {
    const color = colorMap.get(board.boardSize.id) || '#c8a06e'
    const pts = board.corners.map(c => `${c.x},${c.y}`).join(' ')
    const opacity = board.fromOffcut ? '0.7' : '0.85'
    lines.push(`<polygon points="${pts}" fill="${color}" fill-opacity="${opacity}" stroke="${darken(color)}" stroke-width="1"/>`)

    if (board.cut || board.ripCut) {
      const cx = board.corners.map(c => c.x)
      const cy = board.corners.map(c => c.y)
      const bMinX = Math.min(...cx)
      const bMaxX = Math.max(...cx)
      const bMinY = Math.min(...cy)
      const bMaxY = Math.max(...cy)
      const clipId = `clip-${Math.random().toString(36).slice(2, 8)}`
      lines.push(`<clipPath id="${clipId}"><polygon points="${pts}"/></clipPath>`)
      lines.push(`<g clip-path="url(#${clipId})">`)
      const color2 = board.ripCut ? 'rgba(220,38,38,0.4)' : 'rgba(0,0,0,0.2)'
      const step = board.ripCut ? 15 : 20
      for (let d = bMinX + bMinY; d < bMaxX + bMaxY; d += step) {
        lines.push(`<line x1="${d - bMaxY}" y1="${bMinY}" x2="${d - bMinY}" y2="${bMaxY}" stroke="${color2}" stroke-width="2"/>`)
      }
      lines.push(`</g>`)
    }

    const cx2 = (board.corners[0].x + board.corners[1].x) / 2
    const cy2 = (board.corners[0].y + board.corners[2].y) / 2
    const label = `${Math.round(board.actualLength)}`
    lines.push(`<text x="${cx2}" y="${cy2}" class="board-label">${label}${board.fromOffcut ? '*' : ''}</text>`)
  }

  if (startPoint) {
    const s = 30
    lines.push(`<line x1="${startPoint.x - s}" y1="${startPoint.y}" x2="${startPoint.x + s}" y2="${startPoint.y}" stroke="red" stroke-width="4"/>`)
    lines.push(`<line x1="${startPoint.x}" y1="${startPoint.y - s}" x2="${startPoint.x}" y2="${startPoint.y + s}" stroke="red" stroke-width="4"/>`)
    lines.push(`<circle cx="${startPoint.x}" cy="${startPoint.y}" r="${s * 1.5}" fill="none" stroke="red" stroke-width="2"/>`)
    lines.push(`<text x="${startPoint.x + s * 2}" y="${startPoint.y + 15}" fill="red" style="font-size:50px;font-weight:bold">START</text>`)
  }

  for (const p of polygon) {
    lines.push(`<circle cx="${p.x}" cy="${p.y}" r="8" fill="#4f46e5"/>`)
  }

  lines.push(`</svg>`)
  return lines.join('\n')
}

function formatDim(mm: number, unit: 'mm' | 'cm' | 'm'): string {
  if (unit === 'cm') return `${(mm / 10).toFixed(1)} cm`
  if (unit === 'm') return `${(mm / 1000).toFixed(3)} m`
  return `${Math.round(mm)} mm`
}

function signedArea(polygon: Point[]): number {
  let area = 0
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length
    area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y
  }
  return area / 2
}

function ptInPoly(px: number, py: number, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function exportDimensionsSvg(polygon: Point[], unit: 'mm' | 'cm' | 'm'): string {
  const n = polygon.length
  const DIM_OFFSET = 180
  const ARROW = 40
  const EXT_EXTRA = 30

  const allX = polygon.map(p => p.x)
  const allY = polygon.map(p => p.y)
  const pad = 500
  const minX = Math.min(...allX) - pad
  const minY = Math.min(...allY) - pad
  const maxX = Math.max(...allX) + pad
  const maxY = Math.max(...allY) + pad
  const w = maxX - minX
  const h = maxY - minY

  const signed = signedArea(polygon)
  const ccw = signed > 0

  const lines: string[] = []
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}" width="${w}" height="${h}">`)
  lines.push(`<style>
    .dim-line { stroke: #4f46e5; stroke-width: 3; }
    .ext-line { stroke: #8b90a3; stroke-width: 2; }
    .dim-text { font-family: monospace; font-size: 70px; font-weight: bold; fill: #1a1d2e; text-anchor: middle; dominant-baseline: middle; }
    .area-text { font-family: sans-serif; font-size: 80px; font-weight: bold; fill: #4f46e5; text-anchor: middle; dominant-baseline: middle; }
    .poly { fill: rgba(99,102,241,0.04); stroke: #374151; stroke-width: 4; }
    .vertex { fill: #4f46e5; }
    .arrow { fill: #4f46e5; }
  </style>`)
  lines.push(`<rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="#fafbfc"/>`)

  lines.push(`<polygon points="${polygon.map(p => `${p.x},${p.y}`).join(' ')}" class="poly"/>`)

  for (let i = 0; i < n; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % n]
    const dx = b.x - a.x, dy = b.y - a.y
    const edgeLen = Math.sqrt(dx * dx + dy * dy)
    if (edgeLen < 1) continue

    const ux = dx / edgeLen, uy = dy / edgeLen
    let nx = ccw ? -uy : uy
    let ny = ccw ? ux : -ux

    const midWx = (a.x + b.x) / 2, midWy = (a.y + b.y) / 2
    if (ptInPoly(midWx + nx * 300, midWy + ny * 300, polygon)) { nx = -nx; ny = -ny }

    const ea1x = a.x + nx * 40, ea1y = a.y + ny * 40
    const ea2x = a.x + nx * (DIM_OFFSET + EXT_EXTRA), ea2y = a.y + ny * (DIM_OFFSET + EXT_EXTRA)
    const eb1x = b.x + nx * 40, eb1y = b.y + ny * 40
    const eb2x = b.x + nx * (DIM_OFFSET + EXT_EXTRA), eb2y = b.y + ny * (DIM_OFFSET + EXT_EXTRA)
    lines.push(`<line x1="${ea1x}" y1="${ea1y}" x2="${ea2x}" y2="${ea2y}" class="ext-line"/>`)
    lines.push(`<line x1="${eb1x}" y1="${eb1y}" x2="${eb2x}" y2="${eb2y}" class="ext-line"/>`)

    const da = { x: a.x + nx * DIM_OFFSET, y: a.y + ny * DIM_OFFSET }
    const db = { x: b.x + nx * DIM_OFFSET, y: b.y + ny * DIM_OFFSET }
    lines.push(`<line x1="${da.x}" y1="${da.y}" x2="${db.x}" y2="${db.y}" class="dim-line"/>`)

    const ax1 = da.x + ux * ARROW - (-ny) * ARROW * 0.35
    const ay1 = da.y + uy * ARROW - nx * ARROW * 0.35
    const ax2 = da.x + ux * ARROW + (-ny) * ARROW * 0.35
    const ay2 = da.y + uy * ARROW + nx * ARROW * 0.35
    lines.push(`<polygon points="${da.x},${da.y} ${ax1},${ay1} ${ax2},${ay2}" class="arrow"/>`)

    const bx1 = db.x - ux * ARROW - (-ny) * ARROW * 0.35
    const by1 = db.y - uy * ARROW - nx * ARROW * 0.35
    const bx2 = db.x - ux * ARROW + (-ny) * ARROW * 0.35
    const by2 = db.y - uy * ARROW + nx * ARROW * 0.35
    lines.push(`<polygon points="${db.x},${db.y} ${bx1},${by1} ${bx2},${by2}" class="arrow"/>`)

    const midDx = (da.x + db.x) / 2, midDy = (da.y + db.y) / 2
    let angle = Math.atan2(db.y - da.y, db.x - da.x) * 180 / Math.PI
    if (angle > 90) angle -= 180
    if (angle < -90) angle += 180
    const label = formatDim(edgeLen, unit)
    lines.push(`<g transform="translate(${midDx},${midDy}) rotate(${angle.toFixed(1)})">`)
    lines.push(`<rect x="-${label.length * 20}" y="-45" width="${label.length * 40}" height="85" fill="#fafbfc" rx="8"/>`)
    lines.push(`<text x="0" y="0" class="dim-text">${label}</text>`)
    lines.push(`</g>`)
  }

  const cx = polygon.reduce((s, p) => s + p.x, 0) / n
  const cy = polygon.reduce((s, p) => s + p.y, 0) / n
  const areaM2 = Math.abs(signed) / 1e6
  lines.push(`<rect x="${cx - 200}" y="${cy - 55}" width="400" height="110" rx="20" fill="rgba(79,70,229,0.08)"/>`)
  lines.push(`<text x="${cx}" y="${cy}" class="area-text">${areaM2.toFixed(2)} m\u00B2</text>`)

  for (const p of polygon) {
    lines.push(`<circle cx="${p.x}" cy="${p.y}" r="10" class="vertex"/>`)
  }

  lines.push(`</svg>`)
  return lines.join('\n')
}

function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * 0.6)},${Math.round(g * 0.6)},${Math.round(b * 0.6)})`
}

export function downloadSvg(svg: string, filename?: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `taras-layout-${new Date().toISOString().slice(0, 10)}.svg`
  a.click()
  URL.revokeObjectURL(url)
}
