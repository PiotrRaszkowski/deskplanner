const translations: Record<string, { pl: string; en: string }> = {
  'app.title': { pl: 'DeckNinja', en: 'DeckNinja' },
  'app.subtitle': { pl: 'Kalkulator desek tarasowych i legarów', en: 'Decking board & joist calculator' },

  'canvas.title': { pl: 'Kształt tarasu', en: 'Terrace shape' },
  'canvas.help': {
    pl: 'Klikaj na canvas aby narysować wielokąt tarasu. Podwójny klik lub klik na pierwszy punkt zamyka kształt. Alt+drag przesuwa, scroll zoomuje.',
    en: 'Click on canvas to draw terrace polygon. Double-click or click first point to close shape. Alt+drag to pan, scroll to zoom.',
  },
  'canvas.draw_hint': {
    pl: 'Klikaj aby dodać punkty wielokąta. Zamknij klikając na pierwszy punkt lub double-click.',
    en: 'Click to add polygon points. Close by clicking first point or double-click.',
  },
  'canvas.ortho_active': { pl: 'Tryb kątów prostych aktywny.', en: 'Right angles mode active.' },
  'canvas.controls': {
    pl: 'Alt+drag = przesuń. Scroll = zoom. Esc = anuluj. Ctrl+Z = cofnij.',
    en: 'Alt+drag = pan. Scroll = zoom. Esc = cancel. Ctrl+Z = undo.',
  },
  'canvas.edit_hint': {
    pl: 'Kliknij na krawędź aby edytować długość. Wybierz róg startowy układania desek.',
    en: 'Click edge to edit length. Select start corner for board layout.',
  },
  'canvas.start_corner': { pl: 'Róg startowy', en: 'Start corner' },
  'canvas.start_click': { pl: 'Kliknij na róg tarasu...', en: 'Click terrace corner...' },
  'canvas.undo_point': { pl: 'Cofnij', en: 'Undo' },
  'canvas.clear': { pl: 'Wyczyść', en: 'Clear' },
  'canvas.snap': { pl: 'Snap to grid', en: 'Snap to grid' },
  'canvas.ortho': { pl: 'Kąty proste (90°)', en: 'Right angles (90°)' },
  'canvas.grid': { pl: 'Siatka', en: 'Grid' },
  'canvas.layer': { pl: 'Warstwa:', en: 'Layer:' },
  'canvas.layer.all': { pl: 'Wszystko', en: 'All' },
  'canvas.layer.boards': { pl: 'Deski', en: 'Boards' },
  'canvas.layer.upper': { pl: 'Legary górne', en: 'Upper joists' },
  'canvas.layer.lower': { pl: 'Legary dolne', en: 'Lower joists' },

  'boards.title': { pl: 'Dostępne deski', en: 'Available boards' },
  'boards.help': {
    pl: 'Dodaj rozmiary desek dostępnych w sklepie. Algorytm wybierze optymalną kombinację minimalizując odpad.',
    en: 'Add board sizes available in store. Algorithm picks optimal combination minimizing waste.',
  },
  'boards.width': { pl: 'Szer. (mm)', en: 'Width (mm)' },
  'boards.length': { pl: 'Dł. (mm)', en: 'Length (mm)' },
  'boards.add': { pl: 'Dodaj', en: 'Add' },
  'boards.remove': { pl: 'Usuń', en: 'Remove' },

  'gaps.title': { pl: 'Dylatacje', en: 'Expansion gaps' },
  'gaps.help': {
    pl: 'Odstępy między deskami. Wzdłuż = między rzędami desek. Od czoła = między końcami desek w rzędzie.',
    en: 'Gaps between boards. Along = between board rows. Front = between board ends in a row.',
  },
  'gaps.along': { pl: 'Wzdłuż (mm)', en: 'Along (mm)' },
  'gaps.front': { pl: 'Od czoła (mm)', en: 'Front (mm)' },

  'angle.title': { pl: 'Kąt układania deski', en: 'Board laying angle' },
  'angle.help': {
    pl: 'Kierunek układania desek. 0° = poziomo, 90° = pionowo, 45° = po skosie.',
    en: 'Board laying direction. 0° = horizontal, 90° = vertical, 45° = diagonal.',
  },

  'offcut.title': { pl: 'Odcinki / reuse', en: 'Offcuts / reuse' },
  'offcut.help': {
    pl: 'Jak wykorzystywać odcinki z ciętych desek. Reuse zmniejsza liczbę desek do kupienia i odpad.',
    en: 'How to reuse offcuts from cut boards. Reuse reduces boards to order and waste.',
  },
  'offcut.reuse_exact': { pl: 'Reuse (pasujące)', en: 'Reuse (exact fit)' },
  'offcut.reuse_exact_desc': {
    pl: 'Używa odcinka z puli tylko gdy jest >= potrzebnej długości',
    en: 'Uses offcut from pool only when >= needed length',
  },
  'offcut.reuse_aggressive': { pl: 'Reuse (agresywny)', en: 'Reuse (aggressive)' },
  'offcut.reuse_aggressive_desc': {
    pl: 'Zawsze zużywa odcinki z puli, nawet krótsze — uzupełnia resztę nową deską',
    en: 'Always uses offcuts, even shorter — fills rest with new board',
  },
  'offcut.no_reuse': { pl: 'Bez reuse', en: 'No reuse' },
  'offcut.no_reuse_desc': {
    pl: 'Zawsze bierze świeże deski, odcinki nie są wykorzystywane',
    en: 'Always takes fresh boards, offcuts not reused',
  },
  'offcut.min_length': { pl: 'Min. długość odcinka do reuse (mm)', en: 'Min offcut length for reuse (mm)' },

  'joists.upper': { pl: 'Legary górne', en: 'Upper joists' },
  'joists.upper_desc': { pl: 'Prostopadłe do desek, bezpośrednio pod nimi', en: 'Perpendicular to boards, directly under them' },
  'joists.upper_help': {
    pl: 'Legary na których leżą deski. Rozmieszczone prostopadle do kierunku desek, wycentrowane w każdym prostokącie.',
    en: 'Joists supporting the boards. Placed perpendicular to board direction, centered in each rectangle.',
  },
  'joists.lower': { pl: 'Legary dolne', en: 'Lower joists' },
  'joists.lower_desc': { pl: 'Prostopadłe do górnych, najniższa warstwa', en: 'Perpendicular to upper, bottom layer' },
  'joists.lower_help': {
    pl: 'Dolna warstwa legarów, prostopadła do górnych. Podpiera górne legary.',
    en: 'Bottom joist layer, perpendicular to upper joists. Supports the upper layer.',
  },
  'joists.spacing': { pl: 'Rozstaw (mm)', en: 'Spacing (mm)' },
  'joists.width': { pl: 'Szer. (mm)', en: 'Width (mm)' },
  'joists.height': { pl: 'Wys. (mm)', en: 'Height (mm)' },
  'joists.lengths': { pl: 'Dostępne długości', en: 'Available lengths' },

  'results.title': { pl: 'Wyniki', en: 'Results' },
  'results.help': {
    pl: 'Do kupienia = ile fizycznych desek zamówić w sklepie. Obejmuje pełne deski i te które będą cięte. Odcinki z reuse nie wymagają nowego zakupu.',
    en: 'To order = physical boards to buy. Includes full boards and ones to cut. Reused offcuts don\'t require purchase.',
  },
  'results.terrace_area': { pl: 'Pow. tarasu (m²)', en: 'Terrace area (m²)' },
  'results.board_area': { pl: 'Pow. desek (m²)', en: 'Board area (m²)' },
  'results.to_order': { pl: 'Do kupienia (nowe deski)', en: 'To order (new boards)' },
  'results.full': { pl: 'pełnych', en: 'full' },
  'results.to_cut': { pl: 'do cięcia', en: 'to cut' },
  'results.rip': { pl: 'wzdłuż', en: 'rip cut' },
  'results.waste': { pl: 'Odpady', en: 'Waste' },
  'results.reuse': { pl: 'Reuse odcinków', en: 'Offcut reuse' },
  'results.remainders': { pl: 'Reszty', en: 'Remainders' },
  'results.empty': { pl: 'Narysuj taras aby zobaczyć wyniki.', en: 'Draw a terrace to see results.' },

  'tab.boards': { pl: 'Deski', en: 'Boards' },
  'tab.joists': { pl: 'Legary', en: 'Joists' },

  'hover.placed': { pl: 'Ułożono', en: 'Placed' },
  'hover.full': { pl: 'Pełna', en: 'Full' },
  'hover.cut': { pl: 'Cięta', en: 'Cut' },
  'hover.rip': { pl: 'Cięta wzdłuż', en: 'Rip cut' },
  'hover.offcut': { pl: 'Z odcinka (reuse)', en: 'From offcut (reuse)' },

  'start_corner.help': {
    pl: 'Punkt od którego zaczyna się układanie desek. Pełne deski przy wybranym rogu, cięcia na przeciwnej stronie.',
    en: 'Starting point for board layout. Full boards near selected corner, cuts on the opposite side.',
  },

  'onboarding.step1_title': { pl: 'Narysuj kształt tarasu', en: 'Draw terrace shape' },
  'onboarding.step1_desc': {
    pl: 'Klikaj na canvas aby dodawać punkty. Podwójny klik zamyka wielokąt. Użyj trybu kątów prostych dla foremnych kształtów.',
    en: 'Click canvas to add points. Double-click closes polygon. Use right angles mode for regular shapes.',
  },
  'onboarding.step2_title': { pl: 'Dodaj rozmiary desek', en: 'Add board sizes' },
  'onboarding.step2_desc': {
    pl: 'W panelu po prawej dodaj rozmiary desek dostępnych w sklepie. Możesz też skonfigurować legary.',
    en: 'In the right panel, add board sizes available in store. You can also configure joists.',
  },
  'onboarding.step3_title': { pl: 'Ustaw parametry', en: 'Set parameters' },
  'onboarding.step3_desc': {
    pl: 'Ustaw dylatacje, kąt układania i tryb reuse odcinków. Wyniki obliczają się automatycznie.',
    en: 'Set expansion gaps, laying angle and offcut reuse mode. Results calculate automatically.',
  },
  'onboarding.step4_title': { pl: 'Gotowe!', en: 'Done!' },
  'onboarding.step4_desc': {
    pl: 'Kliknij na deskę aby zobaczyć szczegóły. Eksportuj SVG lub udostępnij link. Zapisz projekt jako JSON.',
    en: 'Click a board to see details. Export SVG or share a link. Save project as JSON.',
  },
  'onboarding.next': { pl: 'Dalej', en: 'Next' },
  'onboarding.skip': { pl: 'Pomiń', en: 'Skip' },
  'onboarding.done': { pl: 'Zaczynajmy!', en: 'Let\'s go!' },

  'joist_results.empty': { pl: 'Włącz legary w zakładce „Legary" aby zobaczyć wyniki.', en: 'Enable joists in the "Joists" tab to see results.' },
  'joist_results.to_order': { pl: 'Do kupienia', en: 'To order' },
  'joist_results.full': { pl: 'pełnych', en: 'full' },
  'joist_results.to_cut': { pl: 'do cięcia', en: 'to cut' },
  'joist_results.from_offcuts': { pl: 'z odcinków', en: 'from offcuts' },
}

type Lang = 'pl' | 'en'

function detectLang(): Lang {
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('pl')) return 'pl'
  return 'en'
}

let currentLang: Lang = detectLang()

export function setLang(lang: Lang) { currentLang = lang }
export function getLang(): Lang { return currentLang }

export function t(key: string): string {
  const entry = translations[key]
  if (!entry) return key
  return entry[currentLang] || entry.en || key
}
