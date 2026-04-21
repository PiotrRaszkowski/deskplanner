import { useEffect, useState } from 'react'
import TerraceCanvas from './components/TerraceCanvas'
import BoardConfig from './components/BoardConfig'
import GapConfig from './components/GapConfig'
import AngleSelector from './components/AngleSelector'
import ResultsSummary from './components/ResultsSummary'
import JoistConfig from './components/JoistConfig'
import OffcutConfig from './components/OffcutConfig'
import { useTerraceCalculator } from './hooks/useTerraceCalculator'
import { exportLayoutSvg, downloadSvg } from './utils/exportSvg'

type SidebarTab = 'boards' | 'joists'
type ResultTab = 'boards' | 'joists'

export default function App() {
  const {
    polygon, boards, gaps, angle, startPoint,
    upperJoists, lowerJoists, offcutSettings,
    result, canUndo, canRedo, shared,
    undo, redo,
    handleBoardsChange, handleGapsChange, handleAngleChange,
    handlePolygonComplete, handlePolygonUpdate, handleStartPointSet, handleClear,
    handleUpperJoistsChange, handleLowerJoistsChange,
    handleOffcutSettingsChange,
    handleSave, handleLoad, handleShare,
  } = useTerraceCalculator()

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('boards')
  const [resultTab, setResultTab] = useState<ResultTab>('boards')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [resultsOpen, setResultsOpen] = useState(true)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  const hasJoistResults = result.upperJoists.placedJoists.length > 0 || result.lowerJoists.placedJoists.length > 0

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <header className="flex-none border-b border-border-subtle px-4 py-2.5 bg-surface-elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-indigo-400 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-text-primary tracking-tight">DeckNinja</h1>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={handleLoad} className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors" title="Wczytaj projekt">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            </button>
            <button onClick={handleSave} className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors" title="Zapisz projekt">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            </button>
            <button
              onClick={() => {
                const svg = exportLayoutSvg(
                  polygon, result.boards.placedBoards,
                  result.upperJoists.placedJoists, result.lowerJoists.placedJoists,
                  startPoint, boards.map(b => b.id)
                )
                downloadSvg(svg)
              }}
              className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors"
              title="Eksportuj SVG"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
            </button>
            <button
              onClick={handleShare}
              className={`p-1.5 rounded-md transition-colors ${shared ? 'text-success bg-success/10' : 'text-text-secondary hover:bg-surface-hover'}`}
              title={shared ? 'Skopiowano!' : 'Udostępnij link'}
            >
              {shared ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              )}
            </button>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <button onClick={undo} disabled={!canUndo} className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover disabled:text-border-subtle transition-colors" title="Cofnij">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
            </button>
            <button onClick={redo} disabled={!canRedo} className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover disabled:text-border-subtle transition-colors" title="Ponów">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
            </button>
            <div className="w-px h-4 bg-border-subtle mx-1" />
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors" title="Panel konfiguracji">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
            </button>
            <button onClick={() => setResultsOpen(!resultsOpen)} className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors" title="Panel wyników">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0 p-3 pb-0">
            <div className="h-full rounded-xl border border-border-subtle bg-surface-elevated p-3 flex flex-col">
              <TerraceCanvas
                polygon={polygon}
                placedBoards={result.boards.placedBoards}
                upperJoists={result.upperJoists.placedJoists}
                lowerJoists={result.lowerJoists.placedJoists}
                startPoint={startPoint}
                boardSizes={boards}
                onPolygonComplete={handlePolygonComplete}
                onPolygonUpdate={handlePolygonUpdate}
                onStartPointSet={handleStartPointSet}
                onClear={handleClear}
              />
            </div>
          </div>

          {resultsOpen && (
            <div className="flex-none p-3 max-h-[40vh] overflow-auto">
              <div className="rounded-xl border border-border-subtle bg-surface-elevated shadow-sm overflow-hidden">
                {hasJoistResults && (
                  <div className="flex border-b border-border-subtle">
                    <button onClick={() => setResultTab('boards')} className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${resultTab === 'boards' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-secondary'}`}>Deski</button>
                    <button onClick={() => setResultTab('joists')} className={`flex-1 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${resultTab === 'joists' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-secondary'}`}>Legary</button>
                  </div>
                )}
                <div className="p-4">
                  {resultTab === 'boards' ? (
                    <ResultsSummary result={result.boards} boards={boards} />
                  ) : (
                    <JoistResultsSummary upper={result.upperJoists} lower={result.lowerJoists} upperConfig={upperJoists} lowerConfig={lowerJoists} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <aside className="flex-none w-72 border-l border-border-subtle bg-surface-elevated overflow-y-auto">
            <div className="flex border-b border-border-subtle sticky top-0 bg-surface-elevated z-10">
              <button onClick={() => setSidebarTab('boards')} className={`flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${sidebarTab === 'boards' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-secondary'}`}>Deski</button>
              <button onClick={() => setSidebarTab('joists')} className={`flex-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${sidebarTab === 'joists' ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-secondary'}`}>Legary</button>
            </div>
            <div className="p-4 flex flex-col gap-5">
              {sidebarTab === 'boards' ? (
                <>
                  <BoardConfig boards={boards} onBoardsChange={handleBoardsChange} />
                  <div className="border-t border-border-subtle" />
                  <GapConfig gaps={gaps} onGapsChange={handleGapsChange} />
                  <div className="border-t border-border-subtle" />
                  <AngleSelector angle={angle} onAngleChange={handleAngleChange} />
                  <div className="border-t border-border-subtle" />
                  <OffcutConfig settings={offcutSettings} onChange={handleOffcutSettingsChange} />
                </>
              ) : (
                <>
                  <JoistConfig label="Legary górne" description="Prostopadłe do desek, bezpośrednio pod nimi" config={upperJoists} onChange={handleUpperJoistsChange} />
                  <div className="border-t border-border-subtle" />
                  <JoistConfig label="Legary dolne" description="Prostopadłe do górnych, najniższa warstwa" config={lowerJoists} onChange={handleLowerJoistsChange} />
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function JoistResultsSummary({ upper, lower, upperConfig, lowerConfig }: {
  upper: import('./types').JoistResult
  lower: import('./types').JoistResult
  upperConfig: import('./types').JoistConfig
  lowerConfig: import('./types').JoistConfig
}) {
  if (upper.placedJoists.length === 0 && lower.placedJoists.length === 0) {
    return <div className="py-6 text-center text-text-muted text-sm">Włącz legary w zakładce „Legary" aby zobaczyć wyniki.</div>
  }
  return (
    <div className="flex flex-col gap-5">
      {upper.placedJoists.length > 0 && <JoistTable title="Legary górne" subtitle={`Rozstaw: ${upperConfig.spacing} mm`} result={upper} config={upperConfig} color="#4a7a5e" />}
      {lower.placedJoists.length > 0 && <JoistTable title="Legary dolne" subtitle={`Rozstaw: ${lowerConfig.spacing} mm`} result={lower} config={lowerConfig} color="#8b6c3f" />}
    </div>
  )
}

function JoistTable({ title, subtitle, result, config, color }: {
  title: string; subtitle: string; result: import('./types').JoistResult; config: import('./types').JoistConfig; color: string
}) {
  let totalFull = 0, totalCut = 0
  for (const c of Object.values(result.joistCounts)) { totalFull += c.full; totalCut += c.cut }
  const sizeMap = new Map(config.sizes.map((s) => [s.id, s]))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="text-[10px] text-text-muted">{subtitle} &middot; {config.width}×{config.height} mm</p>
        </div>
      </div>
      <div className="rounded-lg bg-success/5 border border-success/15 p-2.5 mb-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-text-muted uppercase">Do kupienia</div>
            <div className="text-xl font-bold text-success font-mono">{result.totalToOrder} szt.</div>
          </div>
          <div className="text-right text-xs text-text-muted">
            <div>{totalFull} pełnych</div>
            <div>{totalCut} do cięcia</div>
            {result.offcutsUsed > 0 && <div className="text-success">+{result.offcutsUsed} z odcinków</div>}
          </div>
        </div>
      </div>
      {Object.entries(result.joistCounts).map(([id, counts]) => {
        const size = sizeMap.get(id)
        if (!size || (counts.full === 0 && counts.cut === 0)) return null
        return (
          <div key={id} className="flex items-center justify-between text-xs bg-surface rounded-lg px-3 py-1.5 border border-border-subtle">
            <span className="font-mono text-text-secondary">{size.length} mm</span>
            <span className="text-text-muted">{counts.full} pełnych + {counts.cut} ciętych</span>
          </div>
        )
      })}
    </div>
  )
}
