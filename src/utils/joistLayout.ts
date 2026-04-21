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
  xStart: number
  xEnd: number
  yStart: number
  yEnd: number
}

function minimalDecompose(polygon: Point[]): Rect[] {
  const uniqueYs = [...new Set(polygon.map(p => p.y))].sort((a, b) => a - b)
  const merged = new Map<string, Rect>()
  const rects: Rect[] = []

  for (let i = 0; i < uniqueYs.length - 1; i++) {
    const yStart = uniqueYs[i]
    const yEnd = uniqueYs[i + 1]
    const midY = (yStart + yEnd) / 2
    const segments = polygonScanlineSegments(polygon, midY)

    for (const [xStart, xEnd] of segments) {
      if (xEnd - xStart < 1) continue
      const key = `${Math.round(xStart)}_${Math.round(xEnd)}`
      const existing = merged.get(key)
      if (existing && Math.abs(existing.yEnd - yStart) < 1) {
        existing.yEnd = yEnd
      } else {
        const rect = { xStart, xEnd, yStart, yEnd }
        merged.set(key, rect)
        rects.push(rect)
      }
    }
  }

  return rects
}

function optimalJoistPlan(segLen: number, sizes: BoardSize[], gap: number): Array<{ size: BoardSize; len: number; cut: boolean }> {
  if (segLen <= 0) return []

  const sorted = [...sizes].sort((a, b) => b.length - a.length)

  let bestPlan: Array<{ size: BoardSize; len: number; cut: boolean }> = []
  let bestEffWaste = Infinity

  for (const primary of sorted) {
    for (const last of sorted) {
      const maxN = Math.floor((segLen + gap) / (primary.length + gap))

      for (let n = maxN; n >= 0; n--) {
        const filled = n > 0 ? n * primary.length + Math.max(0, n - 1) * gap : 0
        const remaining = n === 0 ? segLen : segLen - filled - gap

        if (remaining <= 0) {
          const adjustedFill = n * primary.length + Math.max(0, n - 1) * gap
          if (Math.abs(adjustedFill - segLen) < 1 && 0 < bestEffWaste) {
            bestEffWaste = 0
            bestPlan = []
            for (let i = 0; i < n; i++) bestPlan.push({ size: primary, len: primary.length, cut: false })
          }
          continue
        }

        if (remaining > 0 && remaining <= last.length) {
          const offcut = last.length - remaining
          const reuseCount = offcut >= segLen ? Math.floor((offcut + gap) / (segLen + gap)) : 0
          const effWaste = reuseCount > 0
            ? (last.length - remaining - reuseCount * segLen) / (reuseCount + 1)
            : offcut

          if (effWaste < bestEffWaste) {
            bestEffWaste = effWaste
            bestPlan = []
            for (let i = 0; i < n; i++) bestPlan.push({ size: primary, len: primary.length, cut: false })
            bestPlan.push({ size: last, len: remaining, cut: remaining < last.length })
          }
          if (effWaste <= 0) break
        }
      }
    }
  }

  if (bestPlan.length === 0) {
    const best = sorted[0]
    bestPlan.push({ size: best, len: Math.min(best.length, segLen), cut: true })
  }

  return bestPlan
}

function fillJoistRow(
  xStart: number, xEnd: number, y: number, joistWidth: number,
  sizes: BoardSize[], gap: number,
  pool: JoistPool, mode: OffcutSettings['mode'], minLength: number
): PlacedJoist[] {
  const segLen = xEnd - xStart
  if (segLen <= 0) return []

  if (mode === 'reuse-aggressive') {
    return fillJoistRowAggressive(xStart, xEnd, y, joistWidth, sizes, pool, minLength)
  }

  const byId = new Map(sizes.map(s => [s.id, s]))
  const plan = optimalJoistPlan(segLen, sizes, gap)
  const placed: PlacedJoist[] = []
  let cursor = xStart

  for (const step of plan) {
    if (mode === 'reuse-exact') {
      const match = pool.findBestFit(step.len)
      if (match && match.length >= step.len) {
        const joist = byId.get(match.id) || step.size
        pool.take(match.id, match.length)
        if (step.len < match.length) pool.add(match.id, match.length - step.len)
        placed.push(makeJoistH(cursor, y, step.len, joistWidth, joist, step.len < match.length, true, match.length))
        cursor += step.len
        continue
      }
    }

    if (step.cut) pool.add(step.size.id, step.size.length - step.len)
    placed.push(makeJoistH(cursor, y, step.len, joistWidth, step.size, step.cut, false, step.size.length))
    cursor += step.len
  }

  return placed
}

function fillJoistRowAggressive(
  xStart: number, xEnd: number, y: number, joistWidth: number,
  sizes: BoardSize[], pool: JoistPool, minLength: number
): PlacedJoist[] {
  const sorted = [...sizes].sort((a, b) => b.length - a.length)
  const placed: PlacedJoist[] = []
  let cursor = xStart

  while (cursor < xEnd - 1) {
    const remaining = xEnd - cursor

    const exactPool = pool.findBestFit(remaining)
    if (exactPool) {
      const joist = sizes.find(s => s.id === exactPool.id) || sorted[0]
      pool.take(exactPool.id, exactPool.length)
      const useLen = Math.min(exactPool.length, remaining)
      if (useLen < exactPool.length) pool.add(exactPool.id, exactPool.length - useLen)
      placed.push(makeJoistH(cursor, y, useLen, joistWidth, joist, useLen < exactPool.length, true, exactPool.length))
      cursor += useLen
      continue
    }

    const largest = pool.findLargest()
    if (largest && largest.length >= minLength) {
      const joist = sizes.find(s => s.id === largest.id) || sorted[0]
      pool.take(largest.id, largest.length)
      const useLen = Math.min(largest.length, remaining)
      placed.push(makeJoistH(cursor, y, useLen, joistWidth, joist, false, true, largest.length))
      cursor += useLen
      continue
    }

    const fresh = sorted.find(b => b.length <= remaining)
    if (fresh) {
      placed.push(makeJoistH(cursor, y, fresh.length, joistWidth, fresh, false, false, fresh.length))
      cursor += fresh.length
      continue
    }

    const useLen = Math.min(sorted[0].length, remaining)
    const board = sorted[0]
    if (useLen < board.length) pool.add(board.id, board.length - useLen)
    placed.push(makeJoistH(cursor, y, useLen, joistWidth, board, true, false, board.length))
    cursor += useLen
  }

  return placed
}

function makeJoistH(
  x: number, y: number, length: number, width: number,
  joistSize: BoardSize, cut: boolean, fromOffcut: boolean, originalLength: number
): PlacedJoist {
  return {
    corners: [
      { x, y: y - width / 2 }, { x: x + length, y: y - width / 2 },
      { x: x + length, y: y + width / 2 }, { x, y: y + width / 2 },
    ],
    joistSize, cut, fromOffcut, originalLength, actualLength: length,
  }
}

export function calculateJoistLayout(
  polygon: Point[], config: JoistConfig, directionAngle: number, offcutSettings: OffcutSettings
): JoistResult {
  const empty: JoistResult = { placedJoists: [], joistCounts: {}, totalToOrder: 0, offcutsUsed: 0, offcutsRemaining: [] }
  if (!config.enabled || polygon.length < 3 || config.sizes.length === 0) return empty

  const centroid = polygonCentroid(polygon)
  const rotated = rotatePolygon(polygon, -directionAngle, centroid)
  const rects = minimalDecompose(rotated)

  const pool = new JoistPool(offcutSettings.minLength)
  const allPlaced: PlacedJoist[] = []

  for (const rect of rects) {
    const rectHeight = rect.yEnd - rect.yStart
    const joistCount = Math.max(1, Math.floor(rectHeight / config.spacing) + 1)
    const usedSpan = (joistCount - 1) * config.spacing
    const startOffset = (rectHeight - usedSpan) / 2

    for (let i = 0; i < joistCount; i++) {
      const y = rect.yStart + startOffset + i * config.spacing

      const topSegs = polygonScanlineSegments(rotated, y - config.width / 2 + 0.5)
      const midSegs = polygonScanlineSegments(rotated, y)
      const botSegs = polygonScanlineSegments(rotated, y + config.width / 2 - 0.5)

      for (const [midStart, midEnd] of midSegs) {
        let xStart = Math.max(midStart, rect.xStart)
        let xEnd = Math.min(midEnd, rect.xEnd)

        for (const [ts, te] of topSegs) {
          if (ts < xEnd && te > xStart) { xStart = Math.max(xStart, ts); xEnd = Math.min(xEnd, te) }
        }
        for (const [bs, be] of botSegs) {
          if (bs < xEnd && be > xStart) { xStart = Math.max(xStart, bs); xEnd = Math.min(xEnd, be) }
        }

        if (xEnd - xStart < 1) continue
        allPlaced.push(...fillJoistRow(
          xStart, xEnd, y, config.width,
          config.sizes, 0, pool, offcutSettings.mode, offcutSettings.minLength
        ))
      }
    }
  }

  const placedJoists = allPlaced.map(j => ({
    ...j, corners: j.corners.map(c => rotatePoint(c, directionAngle, centroid)),
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
