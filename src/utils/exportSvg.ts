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

function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * 0.6)},${Math.round(g * 0.6)},${Math.round(b * 0.6)})`
}

export function downloadSvg(svg: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `taras-layout-${new Date().toISOString().slice(0, 10)}.svg`
  a.click()
  URL.revokeObjectURL(url)
}
