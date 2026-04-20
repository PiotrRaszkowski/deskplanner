export interface Point {
  x: number
  y: number
}

export interface BoardSize {
  id: string
  width: number
  length: number
  label: string
}

export interface GapConfig {
  along: number
  front: number
}

export interface PlacedBoard {
  corners: Point[]
  boardSize: BoardSize
  cut: boolean
  ripCut: boolean
  fromOffcut: boolean
  originalLength: number
  actualLength: number
  actualWidth: number
}

export interface BoardCount {
  full: number
  cut: number
  ripCut: number
}

export interface Offcut {
  boardSizeId: string
  length: number
}

export interface LayoutResult {
  placedBoards: PlacedBoard[]
  boardCounts: Record<string, BoardCount>
  terraceArea: number
  boardArea: number
  totalBoardsToOrder: number
  wastePercent: number
  offcutsUsed: number
  offcutsRemaining: Offcut[]
}

export interface JoistConfig {
  enabled: boolean
  sizes: BoardSize[]
  spacing: number
  width: number
  height: number
}

export interface PlacedJoist {
  corners: Point[]
  joistSize: BoardSize
  cut: boolean
  fromOffcut: boolean
  originalLength: number
  actualLength: number
}

export interface JoistCount {
  full: number
  cut: number
}

export interface JoistResult {
  placedJoists: PlacedJoist[]
  joistCounts: Record<string, JoistCount>
  offcutsUsed: number
  offcutsRemaining: Offcut[]
}

export type OffcutMode = 'reuse-exact' | 'reuse-aggressive' | 'no-reuse'

export interface OffcutSettings {
  mode: OffcutMode
  minLength: number
}

export interface FullResult {
  boards: LayoutResult
  upperJoists: JoistResult
  lowerJoists: JoistResult
}
