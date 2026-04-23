import { useState, useCallback } from 'react'

const translations: Record<string, { pl: string; en: string }> = {
  'app.title': { pl: 'DeckNinja', en: 'DeckNinja' },
  'app.subtitle': { pl: 'Kalkulator desek tarasowych i legarów', en: 'Decking board & joist calculator' },

  // Header buttons
  'header.new': { pl: 'Nowy projekt', en: 'New project' },
  'header.load': { pl: 'Wczytaj projekt', en: 'Load project' },
  'header.save': { pl: 'Zapisz projekt', en: 'Save project' },
  'header.export_svg': { pl: 'Eksportuj SVG', en: 'Export SVG' },
  'header.share': { pl: 'Udostępnij link', en: 'Share link' },
  'header.shared': { pl: 'Skopiowano!', en: 'Copied!' },
  'header.qr': { pl: 'QR kod', en: 'QR code' },
  'header.undo': { pl: 'Cofnij', en: 'Undo' },
  'header.redo': { pl: 'Ponów', en: 'Redo' },
  'header.config': { pl: 'Panel konfiguracji', en: 'Config panel' },
  'header.results': { pl: 'Panel wyników', en: 'Results panel' },
  'header.help': { pl: 'Pomoc', en: 'Help' },

  // QR modal
  'qr.title': { pl: 'Zeskanuj QR kod', en: 'Scan QR code' },
  'qr.desc': { pl: 'Zeskanuj telefonem aby otworzyć ten projekt na innym urządzeniu', en: 'Scan with phone to open this project on another device' },
  'qr.close': { pl: 'Zamknij', en: 'Close' },

  // Tabs
  'tab.boards': { pl: 'Deski', en: 'Boards' },
  'tab.joists': { pl: 'Legary', en: 'Joists' },

  // Canvas
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
  'canvas.grid_mm': { pl: 'Siatka {0} mm', en: 'Grid {0} mm' },
  'canvas.layer': { pl: 'Warstwa:', en: 'Layer:' },
  'canvas.layer.all': { pl: 'Wszystko', en: 'All' },
  'canvas.layer.boards': { pl: 'Deski', en: 'Boards' },
  'canvas.layer.upper': { pl: 'Legary górne', en: 'Upper joists' },
  'canvas.layer.lower': { pl: 'Legary dolne', en: 'Lower joists' },
  'canvas.position': { pl: 'Pozycja', en: 'Position' },
  'canvas.points': { pl: 'punktów', en: 'points' },

  // Boards
  'boards.title': { pl: 'Dostępne deski', en: 'Available boards' },
  'boards.help': {
    pl: 'Dodaj rozmiary desek dostępnych w sklepie. Algorytm wybierze optymalną kombinację minimalizując odpad.',
    en: 'Add board sizes available in store. Algorithm picks optimal combination minimizing waste.',
  },
  'boards.width': { pl: 'Szer. (mm)', en: 'Width (mm)' },
  'boards.length': { pl: 'Dł. (mm)', en: 'Length (mm)' },
  'boards.add': { pl: 'Dodaj', en: 'Add' },

  // Gaps
  'gaps.title': { pl: 'Dylatacje', en: 'Expansion gaps' },
  'gaps.help': {
    pl: 'Odstępy między deskami. Wzdłuż = między rzędami desek. Od czoła = między końcami desek w rzędzie.',
    en: 'Gaps between boards. Along = between board rows. Front = between board ends in a row.',
  },
  'gaps.along': { pl: 'Wzdłuż (mm)', en: 'Along (mm)' },
  'gaps.front': { pl: 'Od czoła (mm)', en: 'Front (mm)' },
  'gaps.along_desc': { pl: 'Wzdłuż = między rzędami desek', en: 'Along = between board rows' },
  'gaps.front_desc': { pl: 'Od czoła = między końcami desek w rzędzie', en: 'Front = between board ends in a row' },

  // Angle
  'angle.title': { pl: 'Kąt układania deski', en: 'Board laying angle' },
  'angle.help': {
    pl: 'Kierunek układania desek. 0° = poziomo, 90° = pionowo, 45° = po skosie.',
    en: 'Board laying direction. 0° = horizontal, 90° = vertical, 45° = diagonal.',
  },

  // Offcut
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

  // Joists
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

  // Results
  'results.title': { pl: 'Wyniki', en: 'Results' },
  'results.help': {
    pl: 'Do kupienia = ile fizycznych desek zamówić w sklepie. Obejmuje pełne deski i te które będą cięte. Odcinki z reuse nie wymagają nowego zakupu.',
    en: 'To order = physical boards to buy. Includes full boards and ones to cut. Reused offcuts don\'t require purchase.',
  },
  'results.terrace_area': { pl: 'Pow. tarasu (m²)', en: 'Terrace area (m²)' },
  'results.board_area': { pl: 'Pow. desek (m²)', en: 'Board area (m²)' },
  'results.to_order': { pl: 'Do kupienia (nowe deski)', en: 'To order (new boards)' },
  'results.pcs': { pl: 'szt.', en: 'pcs' },
  'results.full': { pl: 'pełnych', en: 'full' },
  'results.to_cut': { pl: 'do cięcia', en: 'to cut' },
  'results.rip': { pl: 'wzdłuż', en: 'rip cut' },
  'results.from_offcuts': { pl: 'z odcinków', en: 'from offcuts' },
  'results.waste': { pl: 'Odpady', en: 'Waste' },
  'results.reuse': { pl: 'Reuse odcinków', en: 'Offcut reuse' },
  'results.remainders': { pl: 'Reszty', en: 'Remainders' },
  'results.empty': { pl: 'Narysuj taras aby zobaczyć wyniki.', en: 'Draw a terrace to see results.' },
  'results.size': { pl: 'Rozmiar', en: 'Size' },
  'results.full_header': { pl: 'Pełne', en: 'Full' },
  'results.cut_header': { pl: 'Cięte', en: 'Cut' },
  'results.rip_header': { pl: 'Wzdłuż', en: 'Rip' },
  'results.order_header': { pl: 'Zamów.', en: 'Order' },
  'results.total': { pl: 'SUMA', en: 'TOTAL' },
  'results.legend_full': { pl: 'Pełna', en: 'Full' },
  'results.legend_cut': { pl: 'Cięta', en: 'Cut' },
  'results.legend_rip': { pl: 'Cięta wzdłuż', en: 'Rip cut' },

  // Hover tooltip
  'hover.placed': { pl: 'Ułożono', en: 'Placed' },
  'hover.full': { pl: 'Pełna', en: 'Full' },
  'hover.cut': { pl: 'Cięta', en: 'Cut' },
  'hover.rip': { pl: 'Cięta wzdłuż', en: 'Rip cut' },
  'hover.offcut': { pl: 'Z odcinka (reuse)', en: 'From offcut (reuse)' },

  'start_corner.help': {
    pl: 'Punkt od którego zaczyna się układanie desek. Pełne deski przy wybranym rogu, cięcia na przeciwnej stronie.',
    en: 'Starting point for board layout. Full boards near selected corner, cuts on the opposite side.',
  },

  // Joist results
  'joist_results.empty': { pl: 'Włącz legary w zakładce „Legary" aby zobaczyć wyniki.', en: 'Enable joists in the "Joists" tab to see results.' },
  'joist_results.to_order': { pl: 'Do kupienia', en: 'To order' },
  'joist_results.needed': { pl: 'Potrzeba', en: 'Needed' },
  'joist_results.full': { pl: 'pełnych', en: 'full' },
  'joist_results.cut': { pl: 'ciętych', en: 'cut' },
  'joist_results.from_offcuts': { pl: 'z odcinków', en: 'from offcuts' },
  'joist_results.reuse': { pl: 'reuse', en: 'reuse' },
  'joist_results.pcs': { pl: 'szt.', en: 'pcs' },
  'joist_results.mb': { pl: 'mb', en: 'rm' },

  // Changelog & Bug report
  'help.changelog_title': { pl: 'Co nowego', en: 'What\'s new' },
  'help.bug_title': { pl: 'Zgłoś błąd', en: 'Report a bug' },
  'help.bug_text': {
    pl: 'Znalazłeś błąd lub masz sugestię? Zgłoś na GitHubie lub wyślij email. Dołącz link do projektu (przycisk udostępnij) — pomoże nam odtworzyć problem.',
    en: 'Found a bug or have a suggestion? Report on GitHub or send email. Include a project link (share button) — it helps us reproduce the issue.',
  },
  'help.bug_github': { pl: 'Zgłoś na GitHubie', en: 'Report on GitHub' },

  // Onboarding
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

  // Help page
  'help.title': { pl: 'Pomoc', en: 'Help' },
  'help.close': { pl: 'Zamknij', en: 'Close' },
  'help.drawing_title': { pl: 'Rysowanie tarasu', en: 'Drawing the terrace' },
  'help.drawing_text': {
    pl: 'Klikaj na canvas aby dodawać punkty wielokąta. Podwójny klik lub kliknięcie na pierwszy punkt zamyka kształt. Włącz „Kąty proste" aby rysować tylko linie poziome i pionowe. „Snap to grid" przyciąga punkty do siatki. Po narysowaniu kliknij na krawędź aby edytować jej długość.',
    en: 'Click on the canvas to add polygon points. Double-click or click the first point to close the shape. Enable "Right angles" to draw only horizontal and vertical lines. "Snap to grid" snaps points to the grid. After drawing, click an edge to edit its length.',
  },
  'help.boards_title': { pl: 'Konfiguracja desek', en: 'Board configuration' },
  'help.boards_text': {
    pl: 'Dodaj rozmiary desek dostępnych w sklepie (szerokość × długość w mm). Algorytm automatycznie wybierze optymalną kombinację desek minimalizując odpad. Ustaw dylatacje (odstępy) między deskami i kąt układania (0° = poziomo, 90° = pionowo).',
    en: 'Add board sizes available in store (width × length in mm). The algorithm automatically picks the optimal board combination minimizing waste. Set expansion gaps between boards and the laying angle (0° = horizontal, 90° = vertical).',
  },
  'help.start_title': { pl: 'Róg startowy', en: 'Start corner' },
  'help.start_text': {
    pl: 'Kliknij „Róg startowy" i wybierz wierzchołek wielokąta. Deski będą układane od tego rogu — pełne deski przy rogu, cięcia na przeciwnej stronie. Punkt startowy wpływa też na kierunek reuse odcinków.',
    en: 'Click "Start corner" and select a polygon vertex. Boards will be laid from that corner — full boards near the corner, cuts on the opposite side. The start point also affects the offcut reuse direction.',
  },
  'help.offcut_title': { pl: 'Odcinki / reuse', en: 'Offcuts / reuse' },
  'help.offcut_text': {
    pl: 'Trzy tryby: „Reuse pasujące" — używa odcinka tylko gdy pokrywa cały potrzebny kawałek. „Reuse agresywny" — składa z wielu kawałków (świetne dla legarów). „Bez reuse" — zawsze świeże deski. Min. długość określa najmniejszy odcinek zachowywany w puli.',
    en: 'Three modes: "Reuse exact" — uses offcut only when it covers the full needed piece. "Reuse aggressive" — assembles from multiple pieces (great for joists). "No reuse" — always fresh boards. Min length sets the smallest offcut kept in the pool.',
  },
  'help.joists_title': { pl: 'Legary', en: 'Joists' },
  'help.joists_text': {
    pl: 'Legary górne leżą bezpośrednio pod deskami, prostopadle do nich. Legary dolne leżą pod górnymi, równolegle do desek. Dla każdej warstwy ustaw rozstaw, wymiary przekroju i dostępne długości. Legary są centrowane w każdym prostokącie tarasu.',
    en: 'Upper joists sit directly under the boards, perpendicular to them. Lower joists sit under the upper ones, parallel to the boards. For each layer, set spacing, cross-section dimensions and available lengths. Joists are centered in each terrace rectangle.',
  },
  'help.results_title': { pl: 'Wyniki', en: 'Results' },
  'help.results_text': {
    pl: '„Do kupienia" = ile fizycznych desek/legarów zamówić w sklepie. Obejmuje pełne i te do cięcia. Odcinki z reuse nie wymagają zakupu. Tabela rozbija wyniki per rozmiar z m². Najedź na deskę na canvas aby zobaczyć szczegóły.',
    en: '"To order" = physical boards/joists to buy in store. Includes full and ones to cut. Reused offcuts don\'t need purchase. The table breaks results per size with m². Hover over a board on canvas to see details.',
  },
  'help.export_title': { pl: 'Eksport i udostępnianie', en: 'Export & sharing' },
  'help.export_text': {
    pl: 'Zapisz projekt jako JSON (przycisk ↓). Wczytaj z pliku (↑). Eksportuj układ jako SVG (obrazek). Udostępnij link (🔗) — konfiguracja jest zakodowana w URL. Wygeneruj QR kod do zeskanowania telefonem.',
    en: 'Save project as JSON (↓ button). Load from file (↑). Export layout as SVG (image). Share link (🔗) — config is encoded in URL. Generate QR code to scan with phone.',
  },
  'help.shortcuts_title': { pl: 'Skróty klawiszowe', en: 'Keyboard shortcuts' },
  'help.shortcuts_text': {
    pl: 'Ctrl+Z = cofnij • Ctrl+Shift+Z = ponów • Esc = anuluj rysowanie / zamknij edycję • Alt+drag = przesuwanie canvas • Scroll = zoom • Double-click = zamknij wielokąt',
    en: 'Ctrl+Z = undo • Ctrl+Shift+Z = redo • Esc = cancel drawing / close edit • Alt+drag = pan canvas • Scroll = zoom • Double-click = close polygon',
  },

  // Theme
  'theme.light': { pl: 'Jasny motyw', en: 'Light theme' },
  'theme.dark': { pl: 'Ciemny motyw', en: 'Dark theme' },
  'theme.system': { pl: 'Motyw systemowy', en: 'System theme' },

  // Footer
  'footer.disclaimer': {
    pl: 'Obliczenia mają charakter poglądowy i nie stanowią oferty handlowej.',
    en: 'Calculations are approximate and do not constitute a commercial offer.',
  },
  'footer.privacy': { pl: 'Polityka prywatności', en: 'Privacy policy' },

  // Privacy policy
  'privacy.title': { pl: 'Polityka prywatności', en: 'Privacy policy' },
  'privacy.close': { pl: 'Zamknij', en: 'Close' },
  'privacy.intro_title': { pl: 'Informacje ogólne', en: 'General information' },
  'privacy.intro_text': {
    pl: 'DeckNinja (deckninja.app) to aplikacja działająca w całości w przeglądarce użytkownika. Nie posiada backendu, nie przesyła danych na serwer i nie wymaga rejestracji ani logowania.',
    en: 'DeckNinja (deckninja.app) is an application running entirely in the user\'s browser. It has no backend, does not send data to a server, and does not require registration or login.',
  },
  'privacy.data_title': { pl: 'Jakie dane przetwarzamy', en: 'What data we process' },
  'privacy.data_text': {
    pl: 'Aplikacja nie zbiera danych osobowych. Wszystkie dane projektu (kształt tarasu, parametry desek, wyniki) są przechowywane wyłącznie w przeglądarce użytkownika (localStorage). Dane nie są przesyłane na żaden serwer.',
    en: 'The application does not collect personal data. All project data (terrace shape, board parameters, results) is stored exclusively in the user\'s browser (localStorage). No data is sent to any server.',
  },
  'privacy.analytics_title': { pl: 'Analityka', en: 'Analytics' },
  'privacy.analytics_text': {
    pl: 'Aplikacja może korzystać z anonimowej analityki (Umami) w celu zbierania zagregowanych statystyk odwiedzin (liczba wizyt, kraj, typ przeglądarki). Umami nie używa plików cookie i nie zbiera danych osobowych. Analityka jest zgodna z RODO bez konieczności zgody użytkownika.',
    en: 'The application may use anonymous analytics (Umami) to collect aggregated visit statistics (visit count, country, browser type). Umami does not use cookies and does not collect personal data. Analytics is GDPR-compliant without requiring user consent.',
  },
  'privacy.localstorage_title': { pl: 'localStorage', en: 'localStorage' },
  'privacy.localstorage_text': {
    pl: 'Aplikacja zapisuje w localStorage: wybrany język (deckninja_lang), motyw kolorystyczny (deckninja_theme), flagę onboardingu oraz zapisane projekty. Dane te nie opuszczają przeglądarki i można je usunąć czyszcząc dane witryny w ustawieniach przeglądarki.',
    en: 'The application stores in localStorage: selected language (deckninja_lang), color theme (deckninja_theme), onboarding flag, and saved projects. This data does not leave the browser and can be removed by clearing site data in browser settings.',
  },
  'privacy.sharing_title': { pl: 'Udostępnianie linków', en: 'Link sharing' },
  'privacy.sharing_text': {
    pl: 'Funkcja „Udostępnij link" koduje konfigurację projektu w adresie URL. Link nie jest wysyłany na serwer — jest kopiowany do schowka użytkownika. Użytkownik sam decyduje komu go udostępni.',
    en: 'The "Share link" feature encodes project configuration in the URL. The link is not sent to a server — it is copied to the user\'s clipboard. The user decides who to share it with.',
  },
  'privacy.contact_title': { pl: 'Kontakt', en: 'Contact' },
  'privacy.contact_text': {
    pl: 'W sprawach dotyczących prywatności: github.com/PiotrRaszkowski/deckninja/issues',
    en: 'For privacy-related matters: github.com/PiotrRaszkowski/deckninja/issues',
  },
}

export type Lang = 'pl' | 'en'

const LANG_KEY = 'deckninja_lang'

function detectLang(): Lang {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null
    if (saved === 'pl' || saved === 'en') return saved
  }
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('pl')) return 'pl'
  return 'en'
}

let currentLang: Lang = detectLang()
let listeners: Array<() => void> = []

export function setLang(lang: Lang) {
  currentLang = lang
  if (typeof localStorage !== 'undefined') localStorage.setItem(LANG_KEY, lang)
  listeners.forEach(fn => fn())
}

export function getLang(): Lang { return currentLang }

export function t(key: string): string {
  const entry = translations[key]
  if (!entry) return key
  return entry[currentLang] || entry.en || key
}

export function useLang() {
  const [, forceUpdate] = useState(0)

  const subscribe = useCallback(() => {
    const fn = () => forceUpdate(n => n + 1)
    listeners.push(fn)
    return () => { listeners = listeners.filter(l => l !== fn) }
  }, [])

  useState(() => { const unsub = subscribe(); return unsub })

  return { lang: currentLang, setLang, t }
}
