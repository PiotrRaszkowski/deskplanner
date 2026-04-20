import type { Point, BoardSize, JoistConfig, PlacedJoist, JoistResult, Offcut, OffcutSettings } from '../types'
import {
  rotatePolygon,
  polygonCentroid,
  boundingBox,
  rotatePoint,
} from './geometry'

class JoistOffcutPool {
  private pool: Map<string, number[]> = new Map()
  private minLength: number
  usedCount = 0

  constructor(minLength: number) {
    this.minLength = minLength
  }

  add(sizeId: string, length: number) {
    if (length < this.minLength) return
    const list = this.pool.get(sizeId) || []
    list.push(length)
    list.sort((a, b) => a - b)
    this.pool.set(sizeId, list)
  }

  findExactOrLarger(minLength: number): { sizeId: string; length: number } | null {
    let best: { sizeId: string; length: number } | null = null
    let bestWaste = Infinity
    for (const [id, lengths] of this.pool) {
      for (const len of lengths) {
        if (len >= minLength && len - minLength < bestWaste) {
          bestWaste = len - minLength
          best = { sizeId: id, length: len }
          if (bestWaste === 0) return best
        }
      }
    }
    return best
  }

  findLargestUnder(maxLength: number): { sizeId: string; length: number } | null {
    let best: { sizeId: string; length: number } | null = null
    for (const [id, lengths] of this.pool) {
      for (const len of lengths) {
        if (len <= maxLength && (!best || len > best.length)) best = { sizeId: id, length: len }
      }
    }
    return best
  }

  remove(sizeId: string, length: number) {
    const list = this.pool.get(sizeId)
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

function fillJoistSegmentWithPool(
  segStart: number, segEnd: number, x: number, joistWidth: number,
  availableSizes: BoardSize[], pool: JoistOffcutPool, mode: OffcutSettings['mode']
): PlacedJoist[] {
  const segLen = segEnd - segStart
  if (segLen <= 0) return []

  const placed: PlacedJoist[] = []
  const sorted = [...availableSizes].sort((a, b) => b.length - a.length)
  const byId = new Map(availableSizes.map((s) => [s.id, s]))
  let cursor = segStart

  while (cursor < segEnd - 1) {
    const remaining = segEnd - cursor

    if (mode !== 'no-reuse') {
      const exact = pool.findExactOrLarger(remaining)
      if (exact) {
        const joist = byId.get(exact.sizeId) || sorted[0]
        pool.remove(exact.sizeId, exact.length)
        const actualLen = Math.min(exact.length, remaining)
        if (actualLen < exact.length) pool.add(exact.sizeId, exact.length - actualLen)
        placed.push(makeJoist(x, cursor, actualLen, joistWidth, joist, actualLen < exact.length, true, exact.length))
        cursor += actualLen
        continue
      }
      if (mode === 'reuse-aggressive') {
        const largest = pool.findLargestUnder(remaining)
        if (largest) {
          const joist = byId.get(largest.sizeId) || sorted[0]
          pool.remove(largest.sizeId, largest.length)
          placed.push(makeJoist(x, cursor, largest.length, joistWidth, joist, false, true, largest.length))
          cursor += largest.length
          continue
        }
      }
    }

    let best: BoardSize | null = null
    for (const s of sorted) { if (s.length <= remaining) { best = s; break } }
    if (!best) best = sorted[0]

    const actualLen = Math.min(best.length, remaining)
    const isCut = actualLen < best.length
    if (isCut) pool.add(best.id, best.length - actualLen)

    placed.push(makeJoist(x, cursor, actualLen, joistWidth, best, isCut, false, best.length))
    cursor += actualLen
  }

  return placed
}

function makeJoist(
  x: number, y: number, length: number, width: number,
  joistSize: BoardSize, cut: boolean, fromOffcut: boolean, originalLength: number
): PlacedJoist {
  return {
    corners: [
      { x: x - width / 2, y }, { x: x + width / 2, y },
      { x: x + width / 2, y: y + length }, { x: x - width / 2, y: y + length },
    ],
    joistSize, cut, fromOffcut, originalLength, actualLength: length,
  }
}

export function calculateJoistLayout(
  polygon: Point[], config: JoistConfig, directionAngle: number, offcutSettings: OffcutSettings
): JoistResult {
  const empty: JoistResult = { placedJoists: [], joistCounts: {}, offcutsUsed: 0, offcutsRemaining: [] }
  if (!config.enabled || polygon.length < 3 || config.sizes.length === 0) return empty

  const centroid = polygonCentroid(polygon)
  const rotated = rotatePolygon(polygon, -directionAngle, centroid)
  const bb = boundingBox(rotated)

  const pool = new JoistOffcutPool(offcutSettings.minLength)
  const allPlaced: PlacedJoist[] = []

  const totalWidth = bb.maxX - bb.minX
  const joistCount = Math.max(1, Math.floor(totalWidth / config.spacing) + 1)
  const usedSpan = (joistCount - 1) * config.spacing
  const startOffset = (totalWidth - usedSpan) / 2

  for (let i = 0; i < joistCount; i++) {
    const x = bb.minX + startOffset + i * config.spacing
    const segments = getVerticalSegments(rotated, x)
    for (const [segStart, segEnd] of segments) {
      allPlaced.push(...fillJoistSegmentWithPool(segStart, segEnd, x, config.width, config.sizes, pool, offcutSettings.mode))
    }
  }

  const placedJoists = allPlaced.map((j) => ({
    ...j, corners: j.corners.map((c) => rotatePoint(c, directionAngle, centroid)),
  }))

  const joistCounts: Record<string, { full: number; cut: number }> = {}
  for (const s of config.sizes) joistCounts[s.id] = { full: 0, cut: 0 }
  for (const j of allPlaced) {
    const entry = joistCounts[j.joistSize.id]
    if (entry) { if (j.cut) entry.cut++; else entry.full++ }
  }

  return { placedJoists, joistCounts, offcutsUsed: pool.usedCount, offcutsRemaining: pool.getRemaining() }
}

function getVerticalSegments(polygon: Point[], x: number): Array<[number, number]> {
  const ys: number[] = []
  const n = polygon.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const p1 = polygon[i], p2 = polygon[j]
    if ((p1.x <= x && p2.x <= x) || (p1.x > x && p2.x > x)) continue
    if (p1.x === p2.x) continue
    const t = (x - p1.x) / (p2.x - p1.x)
    if (t < 0 || t >= 1) continue
    ys.push(p1.y + t * (p2.y - p1.y))
  }
  ys.sort((a, b) => a - b)
  const segments: Array<[number, number]> = []
  for (let i = 0; i + 1 < ys.length; i += 2) segments.push([ys[i], ys[i + 1]])
  return segments
}
