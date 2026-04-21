import LZString from 'lz-string'
import type { AppState } from './projectFile'

export function encodeStateToHash(state: AppState): string {
  const json = JSON.stringify(state)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodeHashToState(hash: string): AppState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash)
    if (!json) return null
    return JSON.parse(json) as AppState
  } catch {
    return null
  }
}
