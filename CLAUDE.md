# DeckNinja - CLAUDE.md

## Project
DeckNinja (deckninja.app) - frontend-only terrace decking board & joist calculator.

## Tech Stack
- React 18 + TypeScript, Vite, Tailwind CSS v4
- HTML Canvas for drawing/visualization
- No backend - all computation client-side

## Development
```bash
npm run dev     # dev server
npm run build   # tsc -b && vite build
npx vitest run  # tests
```

## Architecture
- `src/utils/boardLayout.ts` - board placement algorithm (polygon decomposition → rectangles → optimal fill)
- `src/utils/joistLayout.ts` - joist placement (upper: perpendicular to boards, lower: parallel to boards)
- `src/utils/geometry.ts` - polygon operations (scanline, rotation, area)
- `src/utils/canvasRenderer.ts` - canvas drawing
- `src/utils/i18n.ts` - translations PL/EN
- `src/hooks/useTerraceCalculator.ts` - main state management with undo/redo, live calculation
- `src/components/` - React components

## Rules
- Every change must bump version in `package.json` and add entry to `CHANGELOG.md`
- Use `t()` from `src/utils/i18n.ts` for ALL user-facing strings (PL + EN)
- Run `npx tsc -b && npx vitest run` before committing
- Git commits: short, descriptive, no co-authored-by
- Push to `main` triggers Docker build via GitHub Actions

## Key Concepts
- Polygon decomposed into rectangles via `minimalDecompose()` (merge adjacent strips with same X range)
- Boards filled per rectangle with `optimalPlan()` (reuse-aware: considers offcut reusability across rows)
- Offcut pool shared across rectangles for material reuse
- Start corner determines board laying direction (full boards at corner, cuts opposite)
- Joists: upper perpendicular to boards (along Y in rotated space), lower parallel (along X)
