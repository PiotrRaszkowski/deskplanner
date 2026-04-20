import type { Point } from '../types'

export function rotatePoint(p: Point, angle: number, origin: Point = { x: 0, y: 0 }): Point {
  const rad = (angle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = p.x - origin.x
  const dy = p.y - origin.y
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

export function rotatePolygon(polygon: Point[], angle: number, origin: Point): Point[] {
  return polygon.map((p) => rotatePoint(p, angle, origin))
}

export function polygonCentroid(polygon: Point[]): Point {
  let cx = 0
  let cy = 0
  for (const p of polygon) {
    cx += p.x
    cy += p.y
  }
  return { x: cx / polygon.length, y: cy / polygon.length }
}

export function polygonArea(polygon: Point[]): number {
  let area = 0
  const n = polygon.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += polygon[i].x * polygon[j].y
    area -= polygon[j].x * polygon[i].y
  }
  return Math.abs(area) / 2
}

export function boundingBox(polygon: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of polygon) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return { minX, minY, maxX, maxY }
}

export function segmentIntersectionX(
  y: number,
  p1: Point,
  p2: Point
): number | null {
  if ((p1.y <= y && p2.y <= y) || (p1.y > y && p2.y > y)) return null
  if (p1.y === p2.y) return null
  const t = (y - p1.y) / (p2.y - p1.y)
  if (t < 0 || t >= 1) return null
  return p1.x + t * (p2.x - p1.x)
}

export function polygonScanlineIntersections(polygon: Point[], y: number): number[] {
  const xs: number[] = []
  const n = polygon.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const x = segmentIntersectionX(y, polygon[i], polygon[j])
    if (x !== null) xs.push(x)
  }
  xs.sort((a, b) => a - b)
  return xs
}

export function polygonScanlineSegments(polygon: Point[], y: number): Array<[number, number]> {
  const xs = polygonScanlineIntersections(polygon, y)
  const segments: Array<[number, number]> = []
  for (let i = 0; i + 1 < xs.length; i += 2) {
    segments.push([xs[i], xs[i + 1]])
  }
  return segments
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export function isPointNearPoint(a: Point, b: Point, threshold: number): boolean {
  return distanceBetween(a, b) <= threshold
}
