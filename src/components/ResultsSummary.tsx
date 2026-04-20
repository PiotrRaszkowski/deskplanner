import type { LayoutResult, BoardSize } from '../types'

interface ResultsSummaryProps {
  result: LayoutResult
  boards: BoardSize[]
}

export default function ResultsSummary({ result, boards }: ResultsSummaryProps) {
  if (result.placedBoards.length === 0) {
    return (
      <div className="py-8 text-center text-text-muted text-sm">
        Narysuj taras aby zobaczyć wyniki.
      </div>
    )
  }

  const boardMap = new Map(boards.map((b) => [b.id, b]))

  let totalFull = 0
  let totalCut = 0
  let totalRip = 0
  for (const counts of Object.values(result.boardCounts)) {
    totalFull += counts.full
    totalCut += counts.cut
    totalRip += counts.ripCut
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Wyniki</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-accent/5 border border-accent/15 p-3 text-center">
          <div className="text-xl font-bold text-accent font-mono">{(result.terraceArea / 1_000_000).toFixed(2)}</div>
          <div className="text-[10px] text-text-muted mt-0.5 uppercase">Pow. tarasu (m²)</div>
        </div>
        <div className="rounded-xl bg-accent/5 border border-accent/15 p-3 text-center">
          <div className="text-xl font-bold text-accent font-mono">{(result.boardArea / 1_000_000).toFixed(2)}</div>
          <div className="text-[10px] text-text-muted mt-0.5 uppercase">Pow. desek (m²)</div>
        </div>
      </div>

      <div className="rounded-xl bg-success/5 border border-success/15 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-text-muted uppercase">Do kupienia (nowe deski)</div>
            <div className="text-2xl font-bold text-success font-mono mt-0.5">{result.totalBoardsToOrder} szt.</div>
          </div>
          <div className="text-right text-xs text-text-muted leading-relaxed">
            <div>{totalFull} pełnych</div>
            <div>{totalCut} do cięcia</div>
            {totalRip > 0 && <div>{totalRip} wzdłuż</div>}
            {result.offcutsUsed > 0 && <div className="text-success">+{result.offcutsUsed} z odcinków</div>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-xs text-text-muted">
        <span>Odpady: <strong className="text-warning">{result.wastePercent.toFixed(1)}%</strong></span>
        {result.offcutsUsed > 0 && (
          <span>Reuse odcinków: <strong className="text-success">{result.offcutsUsed}</strong></span>
        )}
        {result.offcutsRemaining.length > 0 && (
          <span>Reszty: <strong className="text-text-secondary">{result.offcutsRemaining.map((o) => `${Math.round(o.length)}mm`).join(', ')}</strong></span>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left py-2 text-text-muted font-medium text-xs">Rozmiar</th>
            <th className="text-right py-2 text-text-muted font-medium text-xs">Pełne</th>
            <th className="text-right py-2 text-text-muted font-medium text-xs">Cięte</th>
            <th className="text-right py-2 text-text-muted font-medium text-xs">Wzdłuż</th>
            <th className="text-right py-2 text-text-muted font-medium text-xs">Zamów.</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(result.boardCounts).map(([id, counts]) => {
            const board = boardMap.get(id)
            if (!board || (counts.full === 0 && counts.cut === 0 && counts.ripCut === 0)) return null
            const orderCount = result.placedBoards
              .filter((b) => b.boardSize.id === id && !b.fromOffcut)
              .length
            return (
              <tr key={id} className="border-b border-border-subtle/50">
                <td className="py-2 text-text-secondary font-mono text-xs">{board.label}</td>
                <td className="py-2 text-right text-text-primary">{counts.full}</td>
                <td className="py-2 text-right text-warning">{counts.cut}</td>
                <td className="py-2 text-right text-danger">{counts.ripCut}</td>
                <td className="py-2 text-right font-semibold text-success">{orderCount}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border-subtle">
            <td className="py-2 font-semibold text-text-primary text-xs">SUMA</td>
            <td className="py-2 text-right font-semibold text-text-primary">{totalFull}</td>
            <td className="py-2 text-right font-semibold text-warning">{totalCut}</td>
            <td className="py-2 text-right font-semibold text-danger">{totalRip}</td>
            <td className="py-2 text-right font-bold text-success">{result.totalBoardsToOrder}</td>
          </tr>
        </tfoot>
      </table>

      <div className="flex items-center gap-4 text-xs text-text-muted pt-2 border-t border-border-subtle">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm bg-[#c8a06e] inline-block"></span> Pełna
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm bg-[#c8a06e] inline-block relative overflow-hidden">
            <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 3px)' }}></span>
          </span> Cięta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-3 rounded-sm bg-[#c8a06e] inline-block relative overflow-hidden">
            <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(220,38,38,0.4) 1px, rgba(220,38,38,0.4) 2px)' }}></span>
          </span> Cięta wzdłuż
        </span>
      </div>
    </div>
  )
}
