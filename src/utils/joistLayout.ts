import type { Point, BoardSize, JoistConfig, PlacedJoist, JoistResult, Offcut, OffcutSettings } from '../types'
import {
  rotatePolygon,
  polygonCentroid,
  polygonScanlineSegments,
  rotatePoint,
} from './geometry'

class JoistPool {
  private pool: Map<string, number[]> = new Map()
  private minLength: number
  usedCount = 0

  constructor(minLength: number) { this.minLength = minLength }

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
  xStart: number; xEnd: number; yStart: number; yEnd: number
}

function minimalDecompose(polygon: Point[]): Rect[] {
  const uniqueYs = [...new Set(polygon.map(p => p.y))].sort((a, b) => a - b)
  const merged = new Map<string, Rect>()
  const rects: Rect[] = []

  for (let i = 0; i < uniqueYs.length - 1; i++) {
    const yStart = uniqueYs[i], yEnd = uniqueYs[i + 1]
    const segs = polygonScanlineSegments(polygon, (yStart + yEnd) / 2)
    for (const [xStart, xEnd] of segs) {
      if (xEnd - xStart < 1) continue
      const key = `${Math.round(xStart)}_${Math.round(xEnd)}`
      const ex = merged.get(key)
      if (ex && Math.abs(ex.yEnd - yStart) < 1) ex.yEnd = yEnd
      else { const r = { xStart, xEnd, yStart, yEnd }; merged.set(key, r); rects.push(r) }
    }
  }
  return rects
}

function optimalJoistPlan(segLen: number, sizes: BoardSize[]): Array<{ size: BoardSize; len: number; cut: boolean }> {
  if (segLen <= 0) return []
  const sorted = [...sizes].sort((a, b) => b.length - a.length)

  let bestPlan: Array<{ size: BoardSize; len: number; cut: boolean }> = []
  let bestEffWaste = Infinity

  for (const primary of sorted) {
    for (const last of sorted) {
      const maxN = Math.floor(segLen / primary.length)
      for (let n = maxN; n >= 0; n--) {
        const filled = n * primary.length
        const remaining = segLen - filled
        if (remaining <= 0) {
          if (Math.abs(filled - segLen) < 1 && 0 < bestEffWaste) {
            bestEffWaste = 0
            bestPlan = []
            for (let i = 0; i < n; i++) bestPlan.push({ size: primary, len: primary.length, cut: false })
          }
          continue
        }
        if (remaining <= last.length) {
          const offcut = last.length - remaining
          const reuseCount = offcut >= segLen ? Math.floor(offcut / segLen) : 0
          const ew = reuseCount > 0 ? (last.length - remaining - reuseCount * segLen) / (reuseCount + 1) : offcut
          if (ew < bestEffWaste) {
            bestEffWaste = ew
            bestPlan = []
            for (let i = 0; i < n; i++) bestPlan.push({ size: primary, len: primary.length, cut: false })
            bestPlan.push({ size: last, len: remaining, cut: remaining < last.length })
          }
          if (ew <= 0) break
        }
      }
    }
  }

  if (bestPlan.length === 0) {
    bestPlan.push({ size: sorted[0], len: Math.min(sorted[0].length, segLen), cut: true })
  }
  return bestPlan
}

function fillJoistLine(
  start: number, end: number,
  fixedCoord: number, joistWidth: number,
  horizontal: boolean,
  sizes: BoardSize[], pool: JoistPool, mode: OffcutSettings['mode'], minLength: number
): PlacedJoist[] {
  const segLen = end - start
  if (segLen <= 0) return []
  const placed: PlacedJoist[] = []

  if (mode === 'reuse-aggressive') {
    const sorted = [...sizes].sort((a, b) => b.length - a.length)
    let cursor = start
    while (cursor < end - 1) {
      const remaining = end - cursor
      const exactPool = pool.findBestFit(remaining)
      if (exactPool) {
        const joist = sizes.find(s => s.id === exactPool.id) || sorted[0]
        pool.take(exactPool.id, exactPool.length)
        const useLen = Math.min(exactPool.length, remaining)
        if (useLen < exactPool.length) pool.add(exactPool.id, exactPool.length - useLen)
        placed.push(makeJoist(cursor, fixedCoord, useLen, joistWidth, horizontal, joist, useLen < exactPool.length, true, exactPool.length))
        cursor += useLen
        continue
      }
      const largest = pool.findLargest()
      if (largest && largest.length >= minLength) {
        const joist = sizes.find(s => s.id === largest.id) || sorted[0]
        pool.take(largest.id, largest.length)
        const useLen = Math.min(largest.length, remaining)
        placed.push(makeJoist(cursor, fixedCoord, useLen, joistWidth, horizontal, joist, false, true, largest.length))
        cursor += useLen
        continue
      }
      const fresh = sorted.find(b => b.length <= remaining)
      if (fresh) {
        placed.push(makeJoist(cursor, fixedCoord, fresh.length, joistWidth, horizontal, fresh, false, false, fresh.length))
        cursor += fresh.length
        continue
      }
      const board = sorted[0]
      const useLen = Math.min(board.length, remaining)
      if (useLen < board.length) pool.add(board.id, board.length - useLen)
      placed.push(makeJoist(cursor, fixedCoord, useLen, joistWidth, horizontal, board, true, false, board.length))
      cursor += useLen
    }
  } else {
    const plan = optimalJoistPlan(segLen, sizes)
    let cursor = start
    for (const step of plan) {
      if (mode === 'reuse-exact') {
        const match = pool.findBestFit(step.len)
        if (match && match.length >= step.len) {
          const joist = sizes.find(s => s.id === match.id) || step.size
          pool.take(match.id, match.length)
          if (step.len < match.length) pool.add(match.id, match.length - step.len)
          placed.push(makeJoist(cursor, fixedCoord, step.len, joistWidth, horizontal, joist, step.len < match.length, true, match.length))
          cursor += step.len
          continue
        }
      }
      if (step.cut) pool.add(step.size.id, step.size.length - step.len)
      placed.push(makeJoist(cursor, fixedCoord, step.len, joistWidth, horizontal, step.size, step.cut, false, step.size.length))
      cursor += step.len
    }
  }

  return placed
}

function makeJoist(
  pos: number, fixedCoord: number, length: number, width: number,
  horizontal: boolean, joistSize: BoardSize,
  cut: boolean, fromOffcut: boolean, originalLength: number
): PlacedJoist {
  if (horizontal) {
    return {
      corners: [
        { x: pos, y: fixedCoord - width / 2 },
        { x: pos + length, y: fixedCoord - width / 2 },
        { x: pos + length, y: fixedCoord + width / 2 },
        { x: pos, y: fixedCoord + width / 2 },
      ],
      joistSize, cut, fromOffcut, originalLength, actualLength: length,
    }
  } else {
    return {
      corners: [
        { x: fixedCoord - width / 2, y: pos },
        { x: fixedCoord + width / 2, y: pos },
        { x: fixedCoord + width / 2, y: pos + length },
        { x: fixedCoord - width / 2, y: pos + length },
      ],
      joistSize, cut, fromOffcut, originalLength, actualLength: length,
    }
  }
}

export function calculateJoistLayout(
  polygon: Point[],
  config: JoistConfig,
  boardAngle: number,
  direction: 'upper' | 'lower',
  offcutSettings: OffcutSettings
): JoistResult {
  const empty: JoistResult = { placedJoists: [], joistCounts: {}, totalToOrder: 0, offcutsUsed: 0, offcutsRemaining: [] }
  if (!config.enabled || polygon.length < 3 || config.sizes.length === 0) return empty

  const centroid = polygonCentroid(polygon)
  const rotatedPoly = rotatePolygon(polygon, -boardAngle, centroid)
  const rects = minimalDecompose(rotatedPoly)

  const pool = new JoistPool(offcutSettings.minLength)
  const allPlaced: PlacedJoist[] = []

  for (const rect of rects) {
    const w = rect.xEnd - rect.xStart
    const h = rect.yEnd - rect.yStart

    if (direction === 'upper') {
      const joistCount = Math.max(1, Math.floor(h / config.spacing) + 1)
      const usedSpan = (joistCount - 1) * config.spacing
      const offset = (h - usedSpan) / 2
      for (let i = 0; i < joistCount; i++) {
        const y = rect.yStart + offset + i * config.spacing
        allPlaced.push(...fillJoistLine(
          rect.xStart, rect.xEnd, y, config.width, true,
          config.sizes, pool, offcutSettings.mode, offcutSettings.minLength
        ))
      }
    } else {
      const joistCount = Math.max(1, Math.floor(w / config.spacing) + 1)
      const usedSpan = (joistCount - 1) * config.spacing
      const offset = (w - usedSpan) / 2
      for (let i = 0; i < joistCount; i++) {
        const x = rect.xStart + offset + i * config.spacing
        allPlaced.push(...fillJoistLine(
          rect.yStart, rect.yEnd, x, config.width, false,
          config.sizes, pool, offcutSettings.mode, offcutSettings.minLength
        ))
      }
    }
  }

  const placedJoists = allPlaced.map(j => ({
    ...j, corners: j.corners.map(c => rotatePoint(c, boardAngle, centroid)),
  }))

  const joistCounts: Record<string, { full: number; cut: number }> = {}
  for (const s of config.sizes) joistCounts[s.id] = { full: 0, cut: 0 }
  for (const j of allPlaced) {
    const entry = joistCounts[j.joistSize.id]
    if (entry) { if (j.cut) entry.cut++; else entry.full++ }
  }

  let totalToOrder = 0
  for (const j of allPlaced) { if (!j.fromOffcut) totalToOrder++ }

  return { placedJoists, joistCounts, totalToOrder, offcutsUsed: pool.usedCount, offcutsRemaining: pool.getRemaining() }
}
