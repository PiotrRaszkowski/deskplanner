import LZString from 'lz-string'
import type { AppState } from './projectFile'
import type { OffcutSettings, OffcutMode } from '../types'

const MODE_MAP: Record<OffcutMode, number> = { 'no-reuse': 0, 'reuse-exact': 1, 'reuse-aggressive': 2 }
const MODE_REV: OffcutMode[] = ['no-reuse', 'reuse-exact', 'reuse-aggressive']

interface CompactState {
  v: number
  p: number[][]
  b: number[][]
  g: number[]
  a: number
  s: number[] | null
  uj: { s: number[]; sp: number; w: number; h: number } | null
  lj: { s: number[]; sp: number; w: number; h: number } | null
  o: number[]
  jo?: number[]
}

function toCompact(state: AppState): CompactState {
  return {
    v: 2,
    p: state.polygon.map(p => [p.x, p.y]),
    b: state.boards.map(b => [b.width, b.length]),
    g: [state.gaps.along, state.gaps.front],
    a: state.angle,
    s: state.startPoint ? [state.startPoint.x, state.startPoint.y] : null,
    uj: state.upperJoists?.enabled ? {
      s: state.upperJoists.sizes.map(s => s.length),
      sp: state.upperJoists.spacing, w: state.upperJoists.width, h: state.upperJoists.height,
    } : null,
    lj: state.lowerJoists?.enabled ? {
      s: state.lowerJoists.sizes.map(s => s.length),
      sp: state.lowerJoists.spacing, w: state.lowerJoists.width, h: state.lowerJoists.height,
    } : null,
    o: [MODE_MAP[state.offcutSettings?.mode || 'reuse-exact'], state.offcutSettings?.minLength || 500],
    jo: state.joistOffcutSettings ? [MODE_MAP[state.joistOffcutSettings.mode], state.joistOffcutSettings.minLength] : undefined,
  }
}

function fromCompact(c: CompactState): AppState {
  function makeJoistConfig(j: { s: number[]; sp: number; w: number; h: number } | null) {
    if (!j) return { enabled: false, sizes: [], spacing: 350, width: 40, height: 60 }
    return {
      enabled: true,
      sizes: j.s.map((len, i) => ({
        id: `legar-${j.w}x${j.h}x${len}-${i}`,
        width: j.w, length: len, label: `${j.w} × ${len} mm`,
      })),
      spacing: j.sp, width: j.w, height: j.h,
    }
  }

  function makeOffcut(arr?: number[]): OffcutSettings | undefined {
    if (!arr) return undefined
    return { mode: MODE_REV[arr[0]] || 'reuse-exact', minLength: arr[1] || 500 }
  }

  return {
    polygon: c.p.map(([x, y]) => ({ x, y })),
    boards: c.b.map(([ w, l], i) => ({
      id: `${w}x${l}-${i}`, width: w, length: l, label: `${w} × ${l} mm`,
    })),
    gaps: { along: c.g[0], front: c.g[1] },
    angle: c.a,
    startPoint: c.s ? { x: c.s[0], y: c.s[1] } : null,
    upperJoists: makeJoistConfig(c.uj),
    lowerJoists: makeJoistConfig(c.lj),
    offcutSettings: makeOffcut(c.o),
    joistOffcutSettings: makeOffcut(c.jo),
  }
}

export function encodeStateToHash(state: AppState): string {
  const compact = toCompact(state)
  return LZString.compressToEncodedURIComponent(JSON.stringify(compact))
}

export function decodeHashToState(hash: string): AppState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash)
    if (!json) return null
    const parsed = JSON.parse(json)
    if (parsed.v === 2) return fromCompact(parsed as CompactState)
    return parsed as AppState
  } catch {
    return null
  }
}
