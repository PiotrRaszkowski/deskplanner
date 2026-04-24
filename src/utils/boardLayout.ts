import type { Point, BoardSize, GapConfig, PlacedBoard, LayoutResult, Offcut, OffcutSettings } from '../types'
import {
  rotatePolygon,
  polygonCentroid,
  boundingBox,
  polygonScanlineSegments,
  polygonArea,
  rotatePoint,
} from './geometry'

class OffcutPool {
  private pool: Map<string, number[]> = new Map()
  private minLength: number
  usedCount = 0

  constructor(minLength: number) { this.minLength = minLength }

  getMinLength(): number { return this.minLength }

  add(id: string, length: number) {
    if (length < this.minLength) return
    const list = this.pool.get(id) || []
    list.push(length)
    list.sort((a, b) => a - b)
    this.pool.set(id, list)
  }

  findBestFit(minLength: number): { id: string; length: number } | null {
    let best: { id: string; length: number } | null = null
    let bestWaste = Infinity
    for (const [id, lengths] of this.pool) {
      for (const len of lengths) {
        if (len >= minLength && len - minLength < bestWaste) {
          bestWaste = len - minLength
          best = { id, length: len }
          if (bestWaste === 0) return best
        }
      }
    }
    return best
  }

  findLargest(): { id: string; length: number } | null {
    let best: { id: string; length: number } | null = null
    for (const [id, lengths] of this.pool) {
      for (const len of lengths) {
        if (!best || len > best.length) best = { id, length: len }
      }
    }
    return best
  }

  take(id: string, length: number) {
    const list = this.pool.get(id)
    if (!list) return
    const idx = list.indexOf(length)
    if (idx >= 0) { list.splice(idx, 1); this.usedCount++ }
  }

  getRemaining(): Offcut[] {
    const result: Offcut[] = []
    for (const [id, lengths] of this.pool) {
      for (const len of lengths) result.push({ boardSizeId: id, length: len })
    }
    return result
  }
}

interface Rect {
  xStart: number
  xEnd: number
  yStart: number
  yEnd: number
}

function minimalDecompose(polygon: Point[]): Rect[] {
  const uniqueYs = [...new Set(polygon.map(p => p.y))].sort((a, b) => a - b)

  const strips: Array<{ yStart: number; yEnd: number; segments: Array<[number, number]> }> = []
  for (let i = 0; i < uniqueYs.length - 1; i++) {
    const yStart = uniqueYs[i]
    const yEnd = uniqueYs[i + 1]
    const midY = (yStart + yEnd) / 2
    const segments = polygonScanlineSegments(polygon, midY)
    strips.push({ yStart, yEnd, segments })
  }

  const rects: Rect[] = []
  const merged = new Map<string, Rect>()

  for (const strip of strips) {
    for (const [xStart, xEnd] of strip.segments) {
      if (xEnd - xStart < 1) continue
      const key = `${Math.round(xStart)}_${Math.round(xEnd)}`
      const existing = merged.get(key)
      if (existing && Math.abs(existing.yEnd - strip.yStart) < 1) {
        existing.yEnd = strip.yEnd
      } else {
        const rect = { xStart, xEnd, yStart: strip.yStart, yEnd: strip.yEnd }
        merged.set(key, rect)
        rects.push(rect)
      }
    }
  }

  return rects
}

function optimalPlan(segLen: number, boards: BoardSize[], gap: number): Array<{ board: BoardSize; len: number; cut: boolean }> {
  if (segLen <= 0) return []

  const sorted = [...boards].sort((a, b) => b.length - a.length)

  let bestPlan: Array<{ board: BoardSize; len: number; cut: boolean }> = []
  let bestEffectiveWaste = Infinity

  for (const primaryBoard of sorted) {
    for (const lastBoard of sorted) {
      const maxN = Math.floor((segLen + gap) / (primaryBoard.length + gap))

      for (let n = maxN; n >= 0; n--) {
        const filledByFull = n > 0 ? n * primaryBoard.length + Math.max(0, n - 1) * gap : 0
        const remaining = n === 0 ? segLen : segLen - filledByFull - gap

        if (remaining <= 0) {
          const adjustedFill = n * primaryBoard.length + Math.max(0, n - 1) * gap
          if (Math.abs(adjustedFill - segLen) < 1 && 0 < bestEffectiveWaste) {
            bestEffectiveWaste = 0
            bestPlan = []
            for (let i = 0; i < n; i++) bestPlan.push({ board: primaryBoard, len: primaryBoard.length, cut: false })
          }
          continue
        }

        if (remaining > 0 && remaining <= lastBoard.length) {
          const offcut = lastBoard.length - remaining
          const reuseCount = offcut >= segLen ? Math.floor((offcut + gap) / (segLen + gap)) : 0
          const effectiveWaste = reuseCount > 0
            ? (lastBoard.length - remaining - reuseCount * segLen) / (reuseCount + 1)
            : offcut

          if (effectiveWaste < bestEffectiveWaste) {
            bestEffectiveWaste = effectiveWaste
            bestPlan = []
            for (let i = 0; i < n; i++) bestPlan.push({ board: primaryBoard, len: primaryBoard.length, cut: false })
            bestPlan.push({ board: lastBoard, len: remaining, cut: remaining < lastBoard.length })
          }
          if (effectiveWaste <= 0) break
        }
      }
    }
  }

  if (bestPlan.length === 0) {
    const best = sorted[0]
    bestPlan.push({ board: best, len: Math.min(best.length, segLen), cut: true })
  }

  return bestPlan
}

function fillRow(
  xStart: number, xEnd: number,
  rowY: number, rowHeight: number, isRip: boolean,
  boards: BoardSize[], gap: number,
  pool: OffcutPool, mode: OffcutSettings['mode'], fromRight: boolean
): PlacedBoard[] {
  const segLen = xEnd - xStart
  if (segLen <= 0) return []

  const byId = new Map(boards.map(b => [b.id, b]))
  const pieces: Array<{ len: number; board: BoardSize; cut: boolean; fromOffcut: boolean; origLen: number }> = []

  const plan = optimalPlan(segLen, boards, gap)

  if (mode === 'reuse-aggressive') {
    const minLen = pool.getMinLength()

    const sorted = [...boards].sort((a, b) => b.length - a.length)

    const fillWithPlan = (planLen: number, planPieces: typeof pieces) => {
      const p = optimalPlan(planLen, boards, gap)

      if (p.length > 0 && p[p.length - 1].len < minLen && p[p.length - 1].cut) {
        const tail = p[p.length - 1]
        if (p.length >= 2) {
          const prev = p[p.length - 2]
          const combinedLen = prev.len + gap + tail.len
          const bestBoard = sorted.find(b => b.length >= combinedLen) || sorted[0]
          if (bestBoard.length >= combinedLen) {
            p.splice(p.length - 2, 2)
            p.push({ board: bestBoard, len: combinedLen, cut: combinedLen < bestBoard.length })
          } else {
            const half1 = Math.ceil((combinedLen - gap) / 2)
            const half2 = combinedLen - gap - half1
            const b1 = sorted.find(b => b.length >= half1) || sorted[0]
            const b2 = sorted.find(b => b.length >= half2) || sorted[0]
            if (half1 >= minLen && half2 >= minLen && b1.length >= half1 && b2.length >= half2) {
              p.splice(p.length - 2, 2)
              p.push({ board: b1, len: half1, cut: half1 < b1.length })
              p.push({ board: b2, len: half2, cut: half2 < b2.length })
            }
          }
        }
      }

      for (const step of p) {
        if (step.cut) {
          const offcut = step.board.length - step.len
          if (offcut >= minLen) pool.add(step.board.id, offcut)
        }
        planPieces.push({ len: step.len, board: step.board, cut: step.cut, fromOffcut: false, origLen: step.board.length })
      }
    }

    const hasShortTail = (p: typeof pieces) => p.length > 0 && p[p.length - 1].len < minLen

    const tryWithOffcut = (): boolean => {
      const offcut = pool.findBestFit(minLen)
      if (!offcut || offcut.length < minLen) return false

      pool.take(offcut.id, offcut.length)
      const board = byId.get(offcut.id) || boards[0]
      const useLen = Math.min(offcut.length, segLen)
      const leftover = offcut.length - useLen
      if (leftover >= minLen) pool.add(offcut.id, leftover)

      const attempt: typeof pieces = []
      attempt.push({ len: useLen, board, cut: useLen < offcut.length, fromOffcut: true, origLen: offcut.length })

      const usedWithGap = useLen + gap
      const rest = segLen - usedWithGap
      if (rest > 0) {
        fillWithPlan(rest, attempt)
      }

      if (!hasShortTail(attempt)) {
        pieces.push(...attempt)
        return true
      }

      pool.add(offcut.id, offcut.length)
      for (const p of attempt) {
        if (!p.fromOffcut && p.cut) {
          const off = p.origLen - p.len
          if (off >= minLen) pool.take(p.board.id, off)
        }
      }
      return false
    }

    if (!tryWithOffcut()) {
      fillWithPlan(segLen, pieces)

      if (hasShortTail(pieces) && pieces.length >= 2) {
        const last = pieces[pieces.length - 1]
        const prev = pieces[pieces.length - 2]
        if (prev.len + gap + last.len <= prev.origLen) {
          if (prev.cut) {
            const oldOff = prev.origLen - prev.len
            if (oldOff >= minLen) pool.take(prev.board.id, oldOff)
          }
          prev.len += gap + last.len
          prev.cut = true
          const newOff = prev.origLen - prev.len
          if (newOff >= minLen) pool.add(prev.board.id, newOff)
          pieces.pop()
        }
      }
    }
  } else {
    let filled = 0
    for (const step of plan) {
      const remaining = segLen - filled

      if (mode === 'reuse-exact') {
        const match = pool.findBestFit(step.len)
        if (match && match.length >= step.len) {
          const board = byId.get(match.id) || step.board
          pool.take(match.id, match.length)
          const useLen = Math.min(match.length, remaining)
          if (useLen < match.length) pool.add(match.id, match.length - useLen)
          pieces.push({ len: step.len, board, cut: step.len < match.length, fromOffcut: true, origLen: match.length })
          filled += step.len + gap
          continue
        }
      }

      if (step.cut) pool.add(step.board.id, step.board.length - step.len)
      pieces.push({ len: step.len, board: step.board, cut: step.cut, fromOffcut: false, origLen: step.board.length })
      filled += step.len + gap
    }
  }

  const placed: PlacedBoard[] = []
  if (fromRight) {
    let cursor = xEnd
    for (const p of pieces) {
      cursor -= p.len
      placed.push(makeBoard(cursor, rowY, p.len, rowHeight, p.board, p.cut, isRip, p.fromOffcut, p.origLen))
      cursor -= gap
    }
  } else {
    let cursor = xStart
    for (const p of pieces) {
      placed.push(makeBoard(cursor, rowY, p.len, rowHeight, p.board, p.cut, isRip, p.fromOffcut, p.origLen))
      cursor += p.len + gap
    }
  }
  return placed
}

function makeBoard(
  x: number, y: number, length: number, width: number,
  boardSize: BoardSize, cut: boolean, ripCut: boolean, fromOffcut: boolean, originalLength: number
): PlacedBoard {
  return {
    corners: [
      { x, y }, { x: x + length, y },
      { x: x + length, y: y + width }, { x, y: y + width },
    ],
    boardSize, cut, ripCut, fromOffcut, originalLength, actualLength: length, actualWidth: width,
  }
}

function isRectilinear(polygon: Point[]): boolean {
  const n = polygon.length
  for (let i = 0; i < n; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % n]
    const dx = Math.abs(b.x - a.x)
    const dy = Math.abs(b.y - a.y)
    if (dx > 1 && dy > 1) return false
  }
  return true
}

export function calculateLayout(
  polygon: Point[],
  availableBoards: BoardSize[],
  gaps: GapConfig,
  angle: number,
  startPoint: Point | null,
  offcutSettings: OffcutSettings
): LayoutResult {
  const empty: LayoutResult = {
    placedBoards: [], boardCounts: {}, terraceArea: 0, boardArea: 0,
    totalBoardsToOrder: 0, wastePercent: 0, offcutsUsed: 0, offcutsRemaining: [],
  }
  if (polygon.length < 3 || availableBoards.length === 0) return empty

  const boardWidth = availableBoards[0].width
  const step = boardWidth + gaps.along
  const minRipWidth = Math.max(10, boardWidth * 0.1)
  const centroid = polygonCentroid(polygon)
  const rotated = rotatePolygon(polygon, -angle, centroid)
  const bb = boundingBox(rotated)

  let fromRight = false
  let fromBottom = false

  if (startPoint) {
    const rc = rotatePoint(startPoint, -angle, centroid)
    for (const probeOffset of [1, -1, 5, -5, 20, -20]) {
      const segs = polygonScanlineSegments(rotated, rc.y + probeOffset)
      for (const [s, e] of segs) {
        if (rc.x >= s - 1 && rc.x <= e + 1) {
          fromRight = (rc.x - s) > (e - rc.x)
          fromBottom = probeOffset < 0
          break
        }
      }
      if (fromRight || fromBottom) break
    }
  }

  const rectilinear = isRectilinear(rotated)
  const rects = rectilinear ? minimalDecompose(rotated) : []

  let startY = fromBottom ? bb.maxY : bb.minY
  if (startPoint) {
    startY = rotatePoint(startPoint, -angle, centroid).y
  }

  const globalRows: Array<{ y: number; height: number; isRip: boolean }> = []

  if (fromBottom) {
    let y = startY - boardWidth
    while (y >= bb.minY - 0.5) { globalRows.push({ y, height: boardWidth, isRip: false }); y -= step }
    const rem = (y + step) - bb.minY
    if (rem >= minRipWidth && rem < boardWidth) globalRows.push({ y: bb.minY, height: rem, isRip: true })

    y = startY + gaps.along
    while (y + boardWidth <= bb.maxY + 0.5) { globalRows.push({ y, height: boardWidth, isRip: false }); y += step }
    const remUp = bb.maxY - y
    if (remUp >= minRipWidth) globalRows.push({ y, height: remUp, isRip: true })
  } else {
    let y = startY
    while (y + boardWidth <= bb.maxY + 0.5) { globalRows.push({ y, height: boardWidth, isRip: false }); y += step }
    const rem = bb.maxY - y
    if (rem >= minRipWidth) globalRows.push({ y, height: rem, isRip: true })

    y = startY - step
    while (y >= bb.minY - 0.5) { globalRows.push({ y, height: boardWidth, isRip: false }); y -= step }
    const remUp = (y + step) - bb.minY
    if (remUp >= minRipWidth && remUp < boardWidth) globalRows.push({ y: bb.minY, height: remUp, isRip: true })
  }

  const pool = new OffcutPool(offcutSettings.minLength)
  const allPlaced: PlacedBoard[] = []

  for (const row of globalRows) {
    const rowTop = row.y
    const rowBot = row.y + row.height

    if (rectilinear) {
      for (const rect of rects) {
        if (rowBot <= rect.yStart + 0.5 || rowTop >= rect.yEnd - 0.5) continue
        const clippedTop = Math.max(rowTop, rect.yStart)
        const clippedBot = Math.min(rowBot, rect.yEnd)
        const clippedHeight = clippedBot - clippedTop
        if (clippedHeight < minRipWidth) continue
        const isRip = row.isRip || clippedHeight < row.height - 1
        allPlaced.push(...fillRow(
          rect.xStart, rect.xEnd, clippedTop, clippedHeight, isRip,
          availableBoards, gaps.front, pool, offcutSettings.mode, fromRight
        ))
      }
    } else {
      const midSegs = polygonScanlineSegments(rotated, (rowTop + rowBot) / 2)
      const topSegs = polygonScanlineSegments(rotated, rowTop + 0.5)
      const botSegs = polygonScanlineSegments(rotated, rowBot - 0.5)

      for (const [midStart, midEnd] of midSegs) {
        let xStart = midStart, xEnd = midEnd
        for (const [ts, te] of topSegs) {
          if (ts < xEnd && te > xStart) { xStart = Math.max(xStart, ts); xEnd = Math.min(xEnd, te) }
        }
        for (const [bs, be] of botSegs) {
          if (bs < xEnd && be > xStart) { xStart = Math.max(xStart, bs); xEnd = Math.min(xEnd, be) }
        }
        if (xEnd - xStart < 1) continue

        const isRip = row.isRip || xEnd - xStart < midEnd - midStart - 1
        allPlaced.push(...fillRow(
          xStart, xEnd, rowTop, row.height, isRip,
          availableBoards, gaps.front, pool, offcutSettings.mode, fromRight
        ))
      }
    }
  }

  const placedBoards = allPlaced.map(b => ({
    ...b, corners: b.corners.map(c => rotatePoint(c, angle, centroid)),
  }))

  const boardCounts: Record<string, { full: number; cut: number; ripCut: number }> = {}
  for (const board of availableBoards) boardCounts[board.id] = { full: 0, cut: 0, ripCut: 0 }
  for (const p of allPlaced) {
    const entry = boardCounts[p.boardSize.id]
    if (entry) {
      if (p.ripCut) entry.ripCut++
      else if (p.cut) entry.cut++
      else entry.full++
    }
  }

  const terraceArea = polygonArea(polygon)
  let boardArea = 0, totalBoardArea = 0, totalBoardsToOrder = 0
  for (const b of allPlaced) {
    boardArea += b.actualLength * b.actualWidth
    if (!b.fromOffcut) { totalBoardArea += b.originalLength * b.boardSize.width; totalBoardsToOrder++ }
  }
  const wastePercent = totalBoardArea > 0 ? Math.max(0, ((totalBoardArea - boardArea) / totalBoardArea) * 100) : 0

  return {
    placedBoards, boardCounts, terraceArea, boardArea, totalBoardsToOrder, wastePercent,
    offcutsUsed: pool.usedCount, offcutsRemaining: pool.getRemaining(),
  }
}
