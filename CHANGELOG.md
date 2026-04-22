# Changelog

## [1.1.0] - 2026-04-22

### Features
- Support for non-rectilinear polygons (triangles, trapezoids, pentagons) via scanline algorithm
- Auto-fit: canvas centers and zooms to polygon on load (URL/JSON import)
- Bug report section in help page (GitHub Issues link)
- 49 unit tests covering 5 polygon shapes

### Fixed
- Boards extending outside non-rectangular polygons
- Joists clipped to polygon boundaries for all shapes
- Repo renamed to deckninja, Docker image updated

## [1.0.0] - 2026-04-22

### Features
- Interactive canvas for drawing terrace polygon (click to add points, double-click to close)
- Snap to grid (10/20/50/100/250/500mm) and right angles (90°) mode
- Snap to existing point coordinates while drawing
- Edge length editing (click edge → type new length)
- Start corner selection for board laying direction
- Board configuration (multiple sizes, width × length)
- Expansion gaps (along rows, between board ends)
- Board laying angle (0°-180° with quick buttons)
- Optimal board placement algorithm with polygon decomposition into rectangles
- Reuse-aware board selection (considers offcut reusability across rows)
- Three offcut modes: exact fit, aggressive (piece assembly), no reuse
- Configurable minimum offcut length
- Rip cut detection (boards cut along width at polygon edges)
- Upper joists (perpendicular to boards) with centering per rectangle
- Lower joists (parallel to boards) with centering per rectangle
- Aggressive joist reuse (assembles from multiple offcut pieces)
- Separate offcut settings for boards and joists
- Live calculation (auto-recalculates on any parameter change, 150ms debounce)
- Results: terrace area m², board area m², boards to order (count + m²), waste %, offcut reuse count
- Joist results: needed running meters, running meters to order, piece counts
- Per-size breakdown table with order count and m²
- Board hover tooltip (size, placed dimensions, cut/full/rip status, offcut source)
- Layer visibility toggle (all / boards / upper joists / lower joists)
- Grid toggle button
- Undo/redo with full state history (Ctrl+Z / Ctrl+Shift+Z, max 50 steps)
- Save/load project as JSON
- Export layout as SVG with dimensions, board labels, hatching for cuts
- Share via URL (lz-string compressed config in hash, ~72% shorter than raw JSON)
- QR code generation for sharing
- Onboarding tutorial (4 steps, shown on first visit)
- Help tooltips (?) on each config section
- Full help page with 8 sections
- i18n PL/EN with auto-detection and manual toggle
- Language saved in localStorage
- Docker build via GitHub Actions (ghcr.io)
- Umami Analytics placeholder
