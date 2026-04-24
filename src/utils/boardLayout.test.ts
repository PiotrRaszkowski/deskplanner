import { describe, it, expect } from 'vitest'
import { calculateLayout } from './boardLayout'
import type { Point, BoardSize, GapConfig, OffcutSettings } from '../types'
import { polygonArea, polygonScanlineSegments } from './geometry'

const BOARDS: BoardSize[] = [
  { id: '140x2400', width: 140, length: 2400, label: '140 × 2400 mm' },
  { id: '140x3000', width: 140, length: 3000, label: '140 × 3000 mm' },
  { id: '140x4000', width: 140, length: 4000, label: '140 × 4000 mm' },
]

const GAPS: GapConfig = { along: 5, front: 5 }
const NO_REUSE: OffcutSettings = { mode: 'no-reuse', minLength: 500 }
const REUSE_EXACT: OffcutSettings = { mode: 'reuse-exact', minLength: 500 }
const REUSE_AGGRESSIVE: OffcutSettings = { mode: 'reuse-aggressive', minLength: 300 }

const RECTANGLE: Point[] = [
  { x: 0, y: 0 },
  { x: 4220, y: 0 },
  { x: 4220, y: 3000 },
  { x: 0, y: 3000 },
]

const L_SHAPE: Point[] = [
  { x: 5420, y: 11080 },
  { x: 1200, y: 11080 },
  { x: 1200, y: -3720 },
  { x: 5420, y: -3720 },
  { x: 11170, y: -3720 },
  { x: 11170, y: -5640 },
  { x: 14420, y: -5640 },
  { x: 14420, y: 2110 },
  { x: 11170, y: 2110 },
  { x: 11170, y: -1290 },
  { x: 5420, y: -1290 },
]

const TRIANGLE: Point[] = [
  { x: 0, y: 0 },
  { x: 6000, y: 0 },
  { x: 3000, y: 4000 },
]

const TRAPEZOID: Point[] = [
  { x: 1000, y: 0 },
  { x: 5000, y: 0 },
  { x: 4000, y: 3000 },
  { x: 2000, y: 3000 },
]

const PENTAGON: Point[] = [
  { x: 3000, y: 0 },
  { x: 5500, y: 1500 },
  { x: 4500, y: 4000 },
  { x: 1500, y: 4000 },
  { x: 500, y: 1500 },
]

function checkBoardsInsidePolygon(placedBoards: import('../types').PlacedBoard[], polygon: Point[], tolerance = 5) {
  let violations = 0
  for (const board of placedBoards) {
    const midY = (board.corners[0].y + board.corners[2].y) / 2
    const boardMinX = Math.min(...board.corners.map(c => c.x))
    const boardMaxX = Math.max(...board.corners.map(c => c.x))
    const segments = polygonScanlineSegments(polygon, midY)
    const inside = segments.some(([s, e]) => boardMinX >= s - tolerance && boardMaxX <= e + tolerance)
    if (!inside) violations++
  }
  return violations
}

function checkNoOverlap(placedBoards: import('../types').PlacedBoard[]) {
  const byRow = new Map<number, typeof placedBoards>()
  for (const b of placedBoards) {
    const rowY = Math.round(b.corners[0].y)
    const row = byRow.get(rowY) || []
    row.push(b)
    byRow.set(rowY, row)
  }
  let overlaps = 0
  for (const [, row] of byRow) {
    row.sort((a, b) => a.corners[0].x - b.corners[0].x)
    for (let i = 1; i < row.length; i++) {
      if (row[i].corners[0].x < row[i - 1].corners[1].x - 1) overlaps++
    }
  }
  return overlaps
}

function checkMaxBoardLength(placedBoards: import('../types').PlacedBoard[], boards: BoardSize[]) {
  const maxLen = Math.max(...boards.map(b => b.length))
  let violations = 0
  for (const b of placedBoards) {
    if (b.actualLength > maxLen + 1) violations++
  }
  return violations
}

describe('calculateLayout', () => {
  describe('basic rectangle', () => {
    it('all boards should be inside polygon bounds', () => {
      const result = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, null, NO_REUSE)

      for (const board of result.placedBoards) {
        for (const corner of board.corners) {
          expect(corner.x).toBeGreaterThanOrEqual(-1)
          expect(corner.x).toBeLessThanOrEqual(4221)
          expect(corner.y).toBeGreaterThanOrEqual(-1)
          expect(corner.y).toBeLessThanOrEqual(3001)
        }
      }
    })

    it('should have no gaps between consecutive boards in a row', () => {
      const result = calculateLayout(RECTANGLE, BOARDS, { along: 5, front: 0 }, 0, null, NO_REUSE)

      const boardsByRow = new Map<number, typeof result.placedBoards>()
      for (const b of result.placedBoards) {
        const rowY = Math.round(b.corners[0].y)
        const row = boardsByRow.get(rowY) || []
        row.push(b)
        boardsByRow.set(rowY, row)
      }

      for (const [, row] of boardsByRow) {
        row.sort((a, b) => a.corners[0].x - b.corners[0].x)
        let totalLen = 0
        for (const b of row) totalLen += b.actualLength
        expect(totalLen).toBeCloseTo(4220, 0)
      }
    })

    it('should cover the full height of polygon with boards', () => {
      const result = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, null, NO_REUSE)

      let minY = Infinity, maxY = -Infinity
      for (const b of result.placedBoards) {
        for (const c of b.corners) {
          minY = Math.min(minY, c.y)
          maxY = Math.max(maxY, c.y)
        }
      }
      expect(minY).toBeLessThanOrEqual(1)
      expect(maxY).toBeGreaterThanOrEqual(2999)
    })

    it('terraceArea should match polygon area', () => {
      const result = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, null, NO_REUSE)
      const expected = polygonArea(RECTANGLE)
      expect(result.terraceArea).toBeCloseTo(expected, 0)
    })
  })

  describe('start corner', () => {
    it('start at top-left: first row Y should be near minY', () => {
      const startPoint = { x: 0, y: 0 }
      const result = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, startPoint, NO_REUSE)

      const rowYs = [...new Set(result.placedBoards.map((b) => Math.round(b.corners[0].y)))].sort((a, b) => a - b)
      expect(rowYs[0]).toBeLessThanOrEqual(1)
    })

    it('start at bottom-right: first row Y should be near maxY, boards from right', () => {
      const startPoint = { x: 4220, y: 3000 }
      const result = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, startPoint, NO_REUSE)

      const rowYs = [...new Set(result.placedBoards.map((b) => Math.round(b.corners[0].y)))].sort((a, b) => a - b)
      const lastFullRowY = rowYs[rowYs.length - 1]
      expect(lastFullRowY + 140).toBeGreaterThanOrEqual(2999)

      const lastRowBoards = result.placedBoards
        .filter((b) => Math.round(b.corners[0].y) === lastFullRowY)
        .sort((a, b) => a.corners[0].x - b.corners[0].x)

      if (lastRowBoards.length > 1) {
        const rightmostBoard = lastRowBoards[lastRowBoards.length - 1]
        expect(rightmostBoard.cut).toBe(false)
        expect(Math.round(rightmostBoard.corners[1].x)).toBeGreaterThanOrEqual(4219)
      }
    })

    it('start at top-right: cut boards should be on the LEFT side', () => {
      const startPoint = { x: 4220, y: 0 }
      const result = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, startPoint, NO_REUSE)

      const firstRowBoards = result.placedBoards
        .filter((b) => Math.round(b.corners[0].y) === 0)
        .sort((a, b) => a.corners[0].x - b.corners[0].x)

      if (firstRowBoards.length > 1) {
        const leftmost = firstRowBoards[0]
        const rightmost = firstRowBoards[firstRowBoards.length - 1]
        expect(rightmost.cut).toBe(false)
        if (leftmost.actualLength < leftmost.boardSize.length) {
          expect(leftmost.cut).toBe(true)
        }
      }
    })
  })

  describe('L-shaped polygon', () => {
    it('all boards should be inside the bounding box', () => {
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, null, NO_REUSE)

      const bb = {
        minX: Math.min(...L_SHAPE.map((p) => p.x)),
        maxX: Math.max(...L_SHAPE.map((p) => p.x)),
        minY: Math.min(...L_SHAPE.map((p) => p.y)),
        maxY: Math.max(...L_SHAPE.map((p) => p.y)),
      }

      for (const board of result.placedBoards) {
        for (const corner of board.corners) {
          expect(corner.x).toBeGreaterThanOrEqual(bb.minX - 1)
          expect(corner.x).toBeLessThanOrEqual(bb.maxX + 1)
          expect(corner.y).toBeGreaterThanOrEqual(bb.minY - 1)
          expect(corner.y).toBeLessThanOrEqual(bb.maxY + 1)
        }
      }
    })

    it('board area should be less than or equal to polygon area', () => {
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, null, NO_REUSE)
      const polyArea = polygonArea(L_SHAPE)
      expect(result.boardArea).toBeLessThanOrEqual(polyArea + 1000)
    })

    it('should produce boards', () => {
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(result.placedBoards.length).toBeGreaterThan(0)
      expect(result.totalBoardsToOrder).toBeGreaterThan(0)
    })

    it('no board should extend significantly outside the polygon scanline', () => {
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, null, NO_REUSE)

      for (const board of result.placedBoards) {
        const boardMinX = Math.min(...board.corners.map((c) => c.x))
        const boardMaxX = Math.max(...board.corners.map((c) => c.x))

        expect(boardMinX).toBeGreaterThanOrEqual(1199)
        expect(boardMaxX).toBeLessThanOrEqual(14421)
      }
    })
  })

  describe('offcut reuse', () => {
    it('reuse-exact should use fewer new boards than no-reuse', () => {
      const noReuse = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, null, NO_REUSE)
      const withReuse = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, null, REUSE_EXACT)

      expect(withReuse.totalBoardsToOrder).toBeLessThanOrEqual(noReuse.totalBoardsToOrder)
    })

    it('offcutsUsed should be > 0 when boards are cut and reuse is enabled', () => {
      const narrowRect: Point[] = [
        { x: 0, y: 0 },
        { x: 3500, y: 0 },
        { x: 3500, y: 2000 },
        { x: 0, y: 2000 },
      ]
      const result = calculateLayout(narrowRect, BOARDS, GAPS, 0, null, REUSE_EXACT)

      const hasCuts = result.placedBoards.some((b) => b.cut)
      if (hasCuts) {
        expect(result.offcutsUsed + result.offcutsRemaining.length).toBeGreaterThan(0)
      }
    })

    it('reuse-aggressive should use more offcuts than reuse-exact when offcuts are shorter than needed', () => {
      const rect: Point[] = [
        { x: 0, y: 0 },
        { x: 6100, y: 0 },
        { x: 6100, y: 3000 },
        { x: 0, y: 3000 },
      ]
      const singleBoard: BoardSize[] = [
        { id: '140x4000', width: 140, length: 4000, label: '140 × 4000 mm' },
      ]
      const exact = calculateLayout(rect, singleBoard, GAPS, 0, null, REUSE_EXACT)
      const aggressive = calculateLayout(rect, singleBoard, GAPS, 0, null, REUSE_AGGRESSIVE)

      expect(aggressive.offcutsUsed).toBeGreaterThan(exact.offcutsUsed)
    })

    it('reuse-aggressive should order fewer boards than reuse-exact when offcuts are shorter than needed', () => {
      const rect: Point[] = [
        { x: 0, y: 0 },
        { x: 6100, y: 0 },
        { x: 6100, y: 3000 },
        { x: 0, y: 3000 },
      ]
      const singleBoard: BoardSize[] = [
        { id: '140x4000', width: 140, length: 4000, label: '140 × 4000 mm' },
      ]
      const exact = calculateLayout(rect, singleBoard, GAPS, 0, null, REUSE_EXACT)
      const aggressive = calculateLayout(rect, singleBoard, GAPS, 0, null, REUSE_AGGRESSIVE)

      expect(aggressive.totalBoardsToOrder).toBeLessThanOrEqual(exact.totalBoardsToOrder)
    })

    it('reuse-aggressive should not produce boards longer than max available', () => {
      const wideRect: Point[] = [
        { x: 0, y: 0 },
        { x: 14800, y: 0 },
        { x: 14800, y: 4220 },
        { x: 0, y: 4220 },
      ]
      const result = calculateLayout(wideRect, BOARDS, GAPS, 0, null, REUSE_AGGRESSIVE)
      expect(checkMaxBoardLength(result.placedBoards, BOARDS)).toBe(0)
    })

    it('reuse-aggressive should not use short offcuts when longer fresh board is available', () => {
      const rect: Point[] = [
        { x: 0, y: 0 },
        { x: 6100, y: 0 },
        { x: 6100, y: 3000 },
        { x: 0, y: 3000 },
      ]
      const twoBoards: BoardSize[] = [
        { id: '140x3000', width: 140, length: 3000, label: '140 × 3000 mm' },
        { id: '140x4000', width: 140, length: 4000, label: '140 × 4000 mm' },
      ]
      const settings: OffcutSettings = { mode: 'reuse-aggressive', minLength: 500 }
      const result = calculateLayout(rect, twoBoards, GAPS, 0, null, settings)

      const shortOffcuts = result.placedBoards.filter(b =>
        !b.ripCut && b.fromOffcut && b.actualLength < 500
      )
      expect(shortOffcuts.length, `Found ${shortOffcuts.length} short offcut pieces: ${shortOffcuts.map(b => Math.round(b.actualLength)).join(', ')}`).toBe(0)
    })

    it('reuse-aggressive should split short tail into two halves when segment slightly exceeds board length', () => {
      const rect: Point[] = [
        { x: 0, y: 0 },
        { x: 4220, y: 0 },
        { x: 4220, y: 2000 },
        { x: 0, y: 2000 },
      ]
      const singleBoard: BoardSize[] = [
        { id: '140x4000', width: 140, length: 4000, label: '140 × 4000 mm' },
      ]
      const settings: OffcutSettings = { mode: 'reuse-aggressive', minLength: 500 }
      const result = calculateLayout(rect, singleBoard, GAPS, 0, null, settings)

      const shortPieces = result.placedBoards.filter(b => !b.ripCut && b.actualLength < 500)
      expect(shortPieces.length, `Short pieces: ${shortPieces.map(b => Math.round(b.actualLength))}`).toBe(0)
    })

    it('reuse-aggressive should not produce overlapping boards', () => {
      const wideRect: Point[] = [
        { x: 0, y: 0 },
        { x: 14800, y: 0 },
        { x: 14800, y: 4220 },
        { x: 0, y: 4220 },
      ]
      const result = calculateLayout(wideRect, BOARDS, GAPS, 0, null, REUSE_AGGRESSIVE)
      expect(checkNoOverlap(result.placedBoards)).toBe(0)
    })
  })

  describe('L-shape with start corner', () => {
    it('start at bottom-right corner of L-shape: boards from right, rip at left', () => {
      const startPoint = { x: 14420, y: 2110 }
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, startPoint, NO_REUSE)

      expect(result.placedBoards.length).toBeGreaterThan(0)

      for (const board of result.placedBoards) {
        const midY = (board.corners[0].y + board.corners[2].y) / 2
        const boardMinX = Math.min(...board.corners.map((c: Point) => c.x))
        const boardMaxX = Math.max(...board.corners.map((c: Point) => c.x))
        const segments = polygonScanlineSegments(L_SHAPE, midY)

        let inside = false
        for (const [segStart, segEnd] of segments) {
          if (boardMinX >= segStart - 2 && boardMaxX <= segEnd + 2) {
            inside = true
            break
          }
        }
        expect(inside,
          `Board x=[${boardMinX.toFixed(0)}, ${boardMaxX.toFixed(0)}] y=${midY.toFixed(0)} outside polygon. Segments: ${JSON.stringify(segments.map(([a,b]: [number,number]) => [Math.round(a), Math.round(b)]))}`
        ).toBe(true)
      }
    })

    it('start bottom-right: full boards touch right edge, cuts on left', () => {
      const rect: Point[] = [
        { x: 0, y: 0 }, { x: 4220, y: 0 },
        { x: 4220, y: 3000 }, { x: 0, y: 3000 },
      ]
      const startPoint = { x: 4220, y: 3000 }
      const result = calculateLayout(rect, BOARDS, GAPS, 0, startPoint, NO_REUSE)

      const firstRowY = Math.round(result.placedBoards
        .reduce((max, b) => Math.max(max, b.corners[0].y), -Infinity))

      const firstRowBoards = result.placedBoards
        .filter((b) => Math.round(b.corners[0].y) === firstRowY)
        .sort((a, b) => a.corners[0].x - b.corners[0].x)

      expect(firstRowBoards.length).toBeGreaterThan(1)

      const rightmost = firstRowBoards[firstRowBoards.length - 1]
      expect(Math.round(rightmost.corners[1].x)).toBe(4220)
      expect(rightmost.cut).toBe(false)
    })

    it('L-shape bottom edge should be covered (no gap at y=-5640)', () => {
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, null, NO_REUSE)
      const bottomEdge = -5640

      const nearEdge = result.placedBoards.filter(b => {
        const minY = Math.min(...b.corners.map((c: Point) => c.y))
        const maxY = Math.max(...b.corners.map((c: Point) => c.y))
        return Math.abs(minY - bottomEdge) < 10 || Math.abs(maxY - bottomEdge) < 10
      })

      expect(nearEdge.length, 'No boards reach the edge at -5640').toBeGreaterThan(0)
    })

    it('L-shape should have no empty gaps > boardWidth at polygon edges', () => {
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, null, NO_REUSE)

      const boardWidth = 140
      const step = boardWidth + GAPS.along
      const bb = {
        minY: Math.min(...L_SHAPE.map(p => p.y)),
        maxY: Math.max(...L_SHAPE.map(p => p.y)),
      }

      const coveredYRanges = result.placedBoards.map(b => ({
        minY: Math.min(...b.corners.map((c: Point) => c.y)),
        maxY: Math.max(...b.corners.map((c: Point) => c.y)),
      }))

      for (let testY = bb.minY + boardWidth / 2; testY < bb.maxY - boardWidth / 2; testY += step) {
        const segments = polygonScanlineSegments(L_SHAPE, testY)
        if (segments.length === 0) continue

        const hasCoverage = coveredYRanges.some(r => testY >= r.minY && testY <= r.maxY)
        expect(hasCoverage, `No board coverage at Y=${testY}`).toBe(true)
      }
    })

    it('L-shape at 90deg with start at (5420,11080): no cuts near start', () => {
      const startPoint = { x: 5420, y: 11080 }
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 90, startPoint, REUSE_EXACT)

      expect(result.placedBoards.length).toBeGreaterThan(0)

      const cutsNearStart = result.placedBoards.filter(b => {
        if (!b.cut) return false
        return b.corners.some((c: Point) =>
          Math.abs(c.x - startPoint.x) < 300 && Math.abs(c.y - startPoint.y) < 300
        )
      })

      expect(cutsNearStart.length, `${cutsNearStart.length} cut boards near START at 90deg`).toBe(0)
    })

    it('all 4 corners should work without errors', () => {
      const corners = [
        { x: 1200, y: -5640 },
        { x: 14420, y: -5640 },
        { x: 14420, y: 2110 },
        { x: 1200, y: 11080 },
      ]
      for (const corner of corners) {
        const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, corner, REUSE_EXACT)
        expect(result.placedBoards.length).toBeGreaterThan(0)

        for (const board of result.placedBoards) {
          const midY = (board.corners[0].y + board.corners[2].y) / 2
          const boardMinX = Math.min(...board.corners.map((c: Point) => c.x))
          const boardMaxX = Math.max(...board.corners.map((c: Point) => c.x))
          const segments = polygonScanlineSegments(L_SHAPE, midY)

          let inside = false
          for (const [segStart, segEnd] of segments) {
            if (boardMinX >= segStart - 2 && boardMaxX <= segEnd + 2) {
              inside = true
              break
            }
          }
          expect(inside,
            `Corner ${JSON.stringify(corner)}: Board x=[${boardMinX.toFixed(0)}, ${boardMaxX.toFixed(0)}] y=${midY.toFixed(0)} outside. Segs: ${JSON.stringify(segments.map(([a,b]: [number,number]) => [Math.round(a), Math.round(b)]))}`
          ).toBe(true)
        }
      }
    })
  })

  describe('boards must stay inside polygon segments', () => {
    it('board top and bottom Y must both have valid polygon scanline segments', () => {
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, null, NO_REUSE)

      let violations = 0
      for (const board of result.placedBoards) {
        if (board.ripCut) continue
        const topY = Math.min(...board.corners.map((c: Point) => c.y))
        const botY = Math.max(...board.corners.map((c: Point) => c.y))
        const boardMinX = Math.min(...board.corners.map((c: Point) => c.x))
        const boardMaxX = Math.max(...board.corners.map((c: Point) => c.x))

        for (const checkY of [topY + 1, botY - 1]) {
          const segments = polygonScanlineSegments(L_SHAPE, checkY)
          let inside = false
          for (const [segStart, segEnd] of segments) {
            if (boardMinX >= segStart - 2 && boardMaxX <= segEnd + 2) {
              inside = true
              break
            }
          }
          if (!inside) violations++
        }
      }
      expect(violations, `${violations} boards have edges outside polygon`).toBe(0)
    })

    it('each board center Y scanline segment must contain the board X range', () => {
      const result = calculateLayout(L_SHAPE, BOARDS, GAPS, 0, null, NO_REUSE)

      for (const board of result.placedBoards) {
        const midY = (board.corners[0].y + board.corners[2].y) / 2
        const boardMinX = Math.min(...board.corners.map((c: Point) => c.x))
        const boardMaxX = Math.max(...board.corners.map((c: Point) => c.x))

        const segments: Array<[number, number]> = polygonScanlineSegments(L_SHAPE, midY)

        let insideAnySegment = false
        for (const [segStart, segEnd] of segments) {
          if (boardMinX >= segStart - 2 && boardMaxX <= segEnd + 2) {
            insideAnySegment = true
            break
          }
        }

        expect(insideAnySegment,
          `Board at x=[${boardMinX.toFixed(0)}, ${boardMaxX.toFixed(0)}] y=${midY.toFixed(0)} is outside all polygon segments: ${JSON.stringify(segments.map(([a,b]: [number,number]) => [Math.round(a), Math.round(b)]))}`
        ).toBe(true)
      }
    })
  })

  describe('board placement consistency', () => {
    it('boards in a row should not overlap', () => {
      const result = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, null, NO_REUSE)

      const boardsByRow = new Map<number, typeof result.placedBoards>()
      for (const b of result.placedBoards) {
        const rowY = Math.round(b.corners[0].y)
        const row = boardsByRow.get(rowY) || []
        row.push(b)
        boardsByRow.set(rowY, row)
      }

      for (const [, row] of boardsByRow) {
        row.sort((a, b) => a.corners[0].x - b.corners[0].x)
        for (let i = 1; i < row.length; i++) {
          const prevEnd = row[i - 1].corners[1].x
          const currStart = row[i].corners[0].x
          expect(currStart).toBeGreaterThanOrEqual(prevEnd - 1)
        }
      }
    })

    it('rows should not overlap vertically', () => {
      const result = calculateLayout(RECTANGLE, BOARDS, GAPS, 0, null, NO_REUSE)

      const rowYs = [...new Set(result.placedBoards.map((b) => Math.round(b.corners[0].y)))].sort((a, b) => a - b)
      for (let i = 1; i < rowYs.length; i++) {
        const prevBottom = rowYs[i - 1] + 140
        expect(rowYs[i]).toBeGreaterThanOrEqual(prevBottom - 1)
      }
    })
  })

  describe('triangle (non-rectilinear)', () => {
    it('all boards should be inside polygon', () => {
      const result = calculateLayout(TRIANGLE, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(result.placedBoards.length).toBeGreaterThan(0)
      const violations = checkBoardsInsidePolygon(result.placedBoards, TRIANGLE)
      expect(violations, `${violations} boards outside triangle`).toBe(0)
    })

    it('no boards should overlap', () => {
      const result = calculateLayout(TRIANGLE, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(checkNoOverlap(result.placedBoards)).toBe(0)
    })

    it('no board longer than max available', () => {
      const result = calculateLayout(TRIANGLE, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(checkMaxBoardLength(result.placedBoards, BOARDS)).toBe(0)
    })

    it('board area should not exceed polygon area', () => {
      const result = calculateLayout(TRIANGLE, BOARDS, GAPS, 0, null, NO_REUSE)
      const polyArea = polygonArea(TRIANGLE)
      expect(result.boardArea).toBeLessThanOrEqual(polyArea + 1000)
    })
  })

  describe('trapezoid (non-rectilinear)', () => {
    it('all boards should be inside polygon', () => {
      const result = calculateLayout(TRAPEZOID, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(result.placedBoards.length).toBeGreaterThan(0)
      const violations = checkBoardsInsidePolygon(result.placedBoards, TRAPEZOID)
      expect(violations, `${violations} boards outside trapezoid`).toBe(0)
    })

    it('no boards should overlap', () => {
      const result = calculateLayout(TRAPEZOID, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(checkNoOverlap(result.placedBoards)).toBe(0)
    })

    it('no board longer than max available', () => {
      const result = calculateLayout(TRAPEZOID, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(checkMaxBoardLength(result.placedBoards, BOARDS)).toBe(0)
    })
  })

  describe('pentagon (non-rectilinear)', () => {
    it('all boards should be inside polygon', () => {
      const result = calculateLayout(PENTAGON, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(result.placedBoards.length).toBeGreaterThan(0)
      const violations = checkBoardsInsidePolygon(result.placedBoards, PENTAGON)
      expect(violations, `${violations} boards outside pentagon`).toBe(0)
    })

    it('no boards should overlap', () => {
      const result = calculateLayout(PENTAGON, BOARDS, GAPS, 0, null, NO_REUSE)
      expect(checkNoOverlap(result.placedBoards)).toBe(0)
    })
  })

  describe('non-rectilinear at angle', () => {
    it('triangle at 45°: produces boards with valid lengths', () => {
      const result = calculateLayout(TRIANGLE, BOARDS, GAPS, 45, null, NO_REUSE)
      expect(result.placedBoards.length).toBeGreaterThan(0)
      expect(checkMaxBoardLength(result.placedBoards, BOARDS)).toBe(0)
      expect(result.boardArea).toBeGreaterThan(0)
    })

    it('trapezoid at 90°: produces boards with valid lengths', () => {
      const result = calculateLayout(TRAPEZOID, BOARDS, GAPS, 90, null, NO_REUSE)
      expect(result.placedBoards.length).toBeGreaterThan(0)
      expect(checkMaxBoardLength(result.placedBoards, BOARDS)).toBe(0)
      expect(result.boardArea).toBeGreaterThan(0)
    })
  })

  describe('universal invariants (all shapes)', () => {
    const shapes = [
      { name: 'rectangle', poly: RECTANGLE },
      { name: 'L-shape', poly: L_SHAPE },
      { name: 'triangle', poly: TRIANGLE },
      { name: 'trapezoid', poly: TRAPEZOID },
      { name: 'pentagon', poly: PENTAGON },
    ]

    for (const { name, poly } of shapes) {
      it(`${name}: totalBoardsToOrder >= 0`, () => {
        const result = calculateLayout(poly, BOARDS, GAPS, 0, null, REUSE_EXACT)
        expect(result.totalBoardsToOrder).toBeGreaterThanOrEqual(0)
      })

      it(`${name}: wastePercent between 0 and 100`, () => {
        const result = calculateLayout(poly, BOARDS, GAPS, 0, null, NO_REUSE)
        expect(result.wastePercent).toBeGreaterThanOrEqual(0)
        expect(result.wastePercent).toBeLessThanOrEqual(100)
      })

      it(`${name}: reuse-exact <= no-reuse boards`, () => {
        const noReuse = calculateLayout(poly, BOARDS, GAPS, 0, null, NO_REUSE)
        const withReuse = calculateLayout(poly, BOARDS, GAPS, 0, null, REUSE_EXACT)
        expect(withReuse.totalBoardsToOrder).toBeLessThanOrEqual(noReuse.totalBoardsToOrder)
      })

      it(`${name}: reuse-aggressive <= no-reuse boards`, () => {
        const noReuse = calculateLayout(poly, BOARDS, GAPS, 0, null, NO_REUSE)
        const aggressive = calculateLayout(poly, BOARDS, GAPS, 0, null, REUSE_AGGRESSIVE)
        expect(aggressive.totalBoardsToOrder).toBeLessThanOrEqual(noReuse.totalBoardsToOrder)
      })
    }
  })
})
