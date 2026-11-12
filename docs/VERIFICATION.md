# Weryfikacja — 10 listopada 2026

## Refaktor granic modułów — 11 listopada 2026

- Jawne kontrakty widoków zamiast zależności od całego hooka; wydzielone połączenie IndexedDB, normalizacja rekordu i błędy; osobne strategie wyjaśniania działań; wspólne fabryki danych i repozytoriów testowych.
- Node 22.23.4: `npm run check` przeszedł — formatowanie, lint, 78 testów w 13 plikach, TypeScript i produkcyjny build PWA.
- `npm run test:e2e` po buildzie: 8 scenariuszy Chromium headless przeszło na uruchomionym przez Playwright preview. Sprawdzono trening, wskazówki, ustawienia, motyw, migrację, synchronizację kart, eksport/import, awarie i ponowienia, odzyskiwanie danych, układ oraz offline.
- Format zapisu v2 zachowany. Fizyczne telefony, klawiatury ekranowe i czytniki ekranu nie były testowane w tej sesji. Publicznego wdrożenia nie wykonywano.

## Audyt i poprawki — 11 listopada 2026

- Odczyt rozpoczęty przed udanym importem nie cofa już widoku ani nie ustawia błędu po zakończeniu nowszej transakcji.
- Automatyczna zmiana poziomu zwiększa epokę. Stare zadania pozostają w historii, ale nie oceniają nowego modelu nawet po powrocie na ten sam poziom.
- Historia jest sortowana przed przycięciem do 365 dni, również przy opóźnionej odpowiedzi ze starszą datą.
- Eksport awaryjny informuje o użyciu danych z bieżącej karty i możliwości ponowienia odczytu. Kontrolki treningu i ustawień są blokowane po błędzie, z zachowaniem importu odzyskującego dane.
- Progi adaptacji współdzielą konfigurację w `src/domain/config.ts`. Format v2 i wartości progów pozostają zgodne z dotychczasowymi zapisami.
- Node 22.23.4: `npm run check` przeszedł (76 testów, lint, format, TypeScript, build PWA). `npm run test:e2e`: 8 scenariuszy Chromium headless, w tym awaryjny eksport, ponowienie eksportu, blokada kontrolek i offline.

## Refaktor kodu

- `npm run check` przeszedł: Prettier, ESLint bez ostrzeżeń, 69 testów, TypeScript i produkcyjny build PWA. Uruchomiono na Node 22.23.4, przez lokalne `npm exec --package=node@22` bez zmiany globalnej instalacji Node. Narzędzia wymagają obecnie Node 22.13+ lub 24+.
- `npm run test:e2e`: 7 scenariuszy Chromium headless przeszło na produkcyjnym preview. Gra i poprawki, Enter/Spacja, ujawnienie rozwiązania, zachowanie zadania po ustawieniach, selecty i fokus, motyw i reload, migracja, dwie karty, eksport/import, błąd zapisu i retry, odzyskanie uszkodzonego rekordu, ponowne uruchomienie offline.
- Testy kontrolera obejmują wolną transakcję, wpisywanie podczas zapisu ustawień, powiadomienie drugiej karty podczas zapisu, spóźniony odczyt, odmontowanie i ponowne podłączenie widoku, awarię kanału oraz ponowienie. Testy IndexedDB używają niezależnych fabryk i sprawdzają zablokowanie otwarcia, spóźnione połączenie, przerwanie transakcji i zachowanie wadliwego rekordu do jawnego importu. Wartości null/false/0/pusty tekst nie są traktowane jako brak zapisu.
- Sprawdzono zrzuty przy 2560×1440 i 360×800: zachowany duży rachunek, ciemny motyw i lista poziomów mieszcząca się w ekranie. Animacje są wyłączane podczas robienia zrzutów. Zrzuty powstają w `test-results/`.
- CI ma skonfigurowane oba zestawy kontroli i publikację artefaktów błędów; zdalny workflow nie był uruchamiany w tej sesji. Format v2 i migracja v1 pozostają zgodne.
- `npm audit --omit=dev`: zero zgłoszeń. Zgłoszenia narzędzi developerskich opisane w TECHNICAL.md.

## Aktualizacja v2

Kontrolka poziomu: większy numer, nazwa i pięciostopniowy wskaźnik, lista z zakresami oraz nazwami Podstawowy/Łatwy/Średni/Trudny/Ekspercki. 51 testów, TypeScript i build przeszły. W przeglądarce sprawdzono wybór myszą, End/Enter, zapis po odświeżeniu, pozycjonowanie listy przy 320×650 oraz brak nakładania etykiet i kontrolek przy szerokościach 320, 390, 768, 960, 1280, 1920 i 2560 px. Scenariusz regresji dostosowano do nazw opcji.

Większy interfejs: tekst i kontrolki używają jednostek rem przy płynnej bazie 16–22 px. Cyfry w treningu mają 134,4 px przy 1920 px i 176 px przy 2560/3440 px (wcześniej maksimum 76 px); nawigacja odpowiednio 19,68 i 22 px. Sprawdzono trening, ustawienia i historię przy szerokościach 320, 390, 768, 1280, 1920, 2560 i 3440 px, bez poziomego przewijania i nakładania etykiet na poziomy. Krótsze ekrany laptopów mają osobne ograniczenie wysokości rachunku. Powiększono również menu, przełączniki, legendy i szerokość paneli.

Listy wyboru: wszystkie widoczne natywne selecty zastąpione wspólnym komponentem Radix. 51 testów, TypeScript i build przeszły bez ostrzeżeń CSS. Testy przeglądarki: wybór myszą, strzałki/Home/Enter/Spacja, wybór przez wpisywanie liter, Escape, kliknięcie poza listą, powrót fokusu po transakcyjnym zapisie, poziomy, motywy, filtr historii, zachowanie po odświeżeniu oraz pozycjonowanie przy krawędzi viewportu 320×600. Pełny `scripts/browser-qa.js` ponownie przeszedł, w tym migracja, synchronizacja kart, eksport/import i offline. Audyt zależności produkcyjnych: zero zgłoszeń. Fizyczne urządzenia pozostają poza zakresem tej sesji QA.

Motywy: 51 testów i build przeszły po dodaniu trybu ciemnego. W przeglądarce sprawdzono wybór systemowy, reakcję na zmianę motywu systemu, ręczne nadpisanie, zapis po odświeżeniu, synchronizację kart, zachowanie wpisanej odpowiedzi oraz ponowne otwarcie offline. Widoki treningu, ustawień i historii sprawdzone w ciemnym motywie przy 320 i 1280 px. Pomiar kontrastu ciemnego motywu: tekst 13,89:1, tekst pomocniczy 8,54:1, placeholder 6,27:1, operator 8,91:1, tło wyłączonego przełącznika 5,11:1. Konsola bez błędów i ostrzeżeń.

- `npm run check`: 51 testów przeszło, kontrola TypeScript i build produkcyjny poprawne.
- Nowe regresje: 24 jednoczesne transakcje bez utraty odpowiedzi; przerwanie błędnej transakcji; migracja v1; walidacja importu; zachowanie wpisu i zadania po ustawieniach; epoki modelu po zmianach i imporcie; rozwiązanie po pominięciu liczone raz; neutralny blok i pojedyncze poprawki w adaptacji; mieszanie zadań z przegrupowaniem i bez.
- Powtarzalny scenariusz `scripts/browser-qa.js` przeszedł na finalnym buildzie w Chromium: dwie karty, rzeczywista migracja localStorage do IndexedDB, zachowany wpis, eksport/import, anulowanie importu, odrzucenie wadliwego pliku, synchronizacja ustawień oraz nowe otwarcie i przeładowanie offline.
- Układy treningu, ustawień i historii bez poziomego przewijania przy 320, 768 i 1280 px.
- Aktualizacja PWA między kolejnymi lokalnymi buildami produkcyjnymi: komunikat, kliknięcie aktualizacji, faktyczne przeładowanie i zachowane moduły oraz historia.
- Poprawiony kontrast placeholdera i przełączników, status dostępności ogłasza wynik oraz nowe zadanie. Test z fizycznym czytnikiem ekranu pozostaje do wykonania.
- `npm audit --omit=dev`: zero zgłoszeń.

## Pierwsza wersja (zapis historyczny)

- `npm run check`: 36 testów, wszystkie przeszły; kontrola TypeScript i build produkcyjny zakończone powodzeniem.
- Generatory: 500 zadań dla każdej pary działanie/poziom (20 kombinacji), kontrola zakresów i wyników całkowitych.
- Adaptacja: awans, spadek przez pominięcia i poprawki, granice poziomów, wyłączanie adaptacji i niezależność działań.
- Reducer: częściowy i błędny wpis, poprawna odpowiedź, poprawki, pomijanie, ostatnie aktywne działanie, zmiana poziomu.
- Zapis: uszkodzone dane, wersjonowanie, historia dzienna, niemutowanie poprzedniego stanu.
- Chromium headless na produkcyjnym preview: błędna odpowiedź pozostaje w polu; poprawna zmienia zadanie i zachowuje fokus; Enter i Spacja pomijają; ustawienia oraz historia zachowane po przeładowaniu.
- Offline: po aktywacji service workera otwarto nową kartę z wyłączoną siecią, wykonano pominięcie i przeładowano aplikację bez internetu — pomyślnie.
- Responsywność: gra i ustawienia sprawdzone przy szerokości 390 px; desktop 1280 px. Brak poziomego przewijania. Zrzuty w `output/playwright/`.
- Brak błędów i ostrzeżeń JavaScript w sesji QA.
- `npm audit --omit=dev`: zero zgłoszeń. Pozostałe zgłoszenia narzędzi developerskich opisane w TECHNICAL.md.

## Pozostałe sprawdzenia

Fizyczna instalacja PWA i zachowanie systemowej klawiatury na Androidzie/iOS wymagają docelowych urządzeń. Aktualizacja została sprawdzona między lokalnymi buildami produkcyjnymi; wdrożenie i zachowanie na docelowej domenie pozostają do sprawdzenia. Adaptacja wymaga oceny wygody podczas rzeczywistego treningu.

## Publikacja

Cloudflare Wrangler sprawdzony: brak zalogowanego konta. Wdrożenie publiczne nie zostało wykonane. Lokalny build i instrukcja wdrożenia są gotowe.

## Gotowość do pierwszego hostingu — 11 listopada 2026

- Ponownie uruchomiono `npm run check` przez lokalne `npm exec --yes --package=node@22`: Node 22.23.4, formatowanie i lint poprawne, 78 testów w 13 plikach przeszło, TypeScript i produkcyjny build PWA zakończone powodzeniem. Globalny Node 22.12.0 jest poniżej wymagań projektu.
- `npm run test:e2e` na tym samym środowisku po buildzie: 8/8 scenariuszy Chromium headless przeszło na nowym preview uruchomionym przez Playwright (port 4178 był wolny), w tym zapis i ponowne otwarcie offline, migracja, synchronizacja, kopie danych oraz obsługa awarii.
- `npm audit --omit=dev`: zero zgłoszeń. Nie wykonywano pełnego audytu zależności developerskich.
- Sprawdzono konfigurację PWA, ikony, lokalne fonty, nagłówki cache service workera i manifestu oraz konfigurację CI. Build do hostingu znajduje się w `dist`; aplikacja nie wymaga backendu ani sekretów. Obecna konfiguracja zakłada publikację w korzeniu domeny.
- Nie wykonywano publikacji, zdalnego CI, testu aktualizacji między dwoma buildami ani testów na fizycznych telefonach i z czytnikiem ekranu. Instalację PWA i offline na docelowej domenie należy sprawdzić po wdrożeniu. Git nie ma skonfigurowanego remote, a pliki projektu pozostają nieśledzone.

## Aktualizacja zależności — 11 listopada 2026

- Zaktualizowano Vite z 7.3.8 do 8.3.8, TypeScript z 5.9.3 do 6.0.3 oraz Prettier z 3.9.10 do 3.10.0. React/React DOM 19.3.1 i ich typy 19.3.0 były już obecne w lockfile i pozostały bez zmiany wersji. Odświeżono zależności pośrednie i lockfile. Kopia poprzednich plików zależności i buildu znajduje się lokalnie w ignorowanym `output/dependency-backup/`.
- Sprawdzono deklaracje peer dependencies: PWA 2.0.0 oraz plugin React 5.2.0 wspierają Vite 8; typescript-eslint 8.72.2 wspiera TypeScript poniżej 6.1. TypeScript 7 i typy Node 26 nie zostały wprowadzone. Instalacja pluginu React 6.3.0 zwróciła ERESOLVE dla opcjonalnego łańcucha Babel 7/8; pozostawiono zgodną wersję 5.2.0 bez force i legacy-peer-deps.
- Node 22.23.4 przez lokalne `npm exec --yes --package=node@22`: `npm run check` przeszedł (format, lint, 78 testów w 13 plikach, TypeScript 6 i build Vite 8/PWA).
- Po buildzie `npm run test:e2e` z `PWA_PREVIOUS_DIST=output/dependency-backup/dist-before`: 9/9 scenariuszy Chromium headless przeszło. Nowy scenariusz aktualizacji użył faktycznego buildu sprzed zmiany zależności i nowego buildu na tym samym originie. Potwierdzono komunikat aktualizacji, zachowanie wpisu i zadania przed zgodą, brak samoczynnego przeładowania, przeładowanie po zgodzie, identyczny rekord IndexedDB i motyw oraz nową kartę, zapis i reload offline bez błędów konsoli.
- Zachowano wcześniejszy target przeglądarek w konfiguracji Vite. Nie wykonano testów fizycznej instalacji PWA, klawiatury ekranowej, czytnika ekranu, starszych wersji przeglądarek ani publicznego wdrożenia.
- Czysta instalacja `npm ci --no-audit` na Node 22.23.4 zakończyła się powodzeniem; `npm ls --depth=0` bez błędów zależności. Po niej ponowiono `npm run check` (78/78) oraz standardowe `npm run test:e2e` bez zmiennej starszego buildu (9/9).
- Końcowy `npm audit --omit=dev`: zero zgłoszeń. Pełny audyt: nadal 15 pozycji (2 low, 13 moderate), zero high/critical, w narzędziach developerskich. Nie stosowano wymuszonych obniżeń wersji ani override; npm ostrzega o przestarzałym pośrednim glob 11.1.0. Raport lokalny: `output/dependency-audit.json`.

## Favicon zgodny z nagłówkiem — 12 listopada 2026

- `public/icon.svg`: zastąpiono symbole działań znakiem „r·” z nagłówka, w kolorach ciemnego motywu z przekazanego zrzutu. Kontur litery jest zapisany wektorowo, bez zależności od dostępności fontu na urządzeniu.
- Sprawdzono wygląd w Chromium headless w rozmiarach 16, 32 i 40 px; podgląd lokalny: `output/favicon-preview.png`.
- Node 22.23.4: `npm run check` przeszedł (78 testów, formatowanie, lint, typy i build PWA), następnie `npm run test:e2e`: 9/9, w tym offline oraz aktualizacja PWA z zachowaniem danych.
- Zmiana dotyczy faviconu przeglądarki. Ikony instalowanej PWA i Apple Touch pozostają dotychczasowe. Nie wykonywano publikacji ani sprawdzeń na fizycznym telefonie.

## Nazwa w nagłówku — 12 listopada 2026

- Usunięto końcową kropkę po nazwie „rachmistrz” oraz nieużywany selektor `.brandDot`.
- Node 22.23.4: `npm run check` przeszedł (78 testów, format, lint, typy i build), następnie `npm run test:e2e`: 9/9 Chromium headless. Fizycznych urządzeń nie testowano.

## Usunięcie statusu offline ze stopki — 12 listopada 2026

- Usunięto wskaźnik i tekst statusu offline ze stopki, jego style oraz stan i nasłuchiwanie sieci służące wyłącznie temu wskaźnikowi. Rejestracja service workera, instalacja i aktualizacje PWA pozostają aktywne. Uaktualniono README i opis techniczny.
- Node 22.23.4: `npm run check` przeszedł (78 testów, format, lint, typy i build), następnie `npm run test:e2e`: 9/9, w tym offline i aktualizacja PWA. Testy Chromium headless; fizycznych urządzeń nie sprawdzano.

## Wyśrodkowanie opisu nagłówka — 12 listopada 2026

- Nagłówek ma trzy kolumny z równymi bokami; opis jest na wspólnej osi z menu. Do 650 px pozostaje układ dwóch elementów z ukrytym opisem.
- Pomiar Chromium headless na produkcyjnym preview przy 320, 360, 650, 651, 768, 1080, 1280, 1920 i 2560 px: brak kolizji i poziomego przewijania. Różnica osi opisu i menu wynosi 0–0,008 px tam, gdzie opis jest widoczny.
- Node 22.23.4: `npm run check` przeszedł (78 testów, format, lint, typy i build); `npm run test:e2e`: 9/9. Fizycznych urządzeń nie testowano.

## Usunięcie stopki — 12 listopada 2026

- Usunięto całą stopkę, linię oddzielającą i powiązane reguły CSS dla desktopu oraz telefonu.
- Node 22.23.4: `npm run check` przeszedł (78 testów, format, lint, typy i build); `npm run test:e2e`: 9/9 Chromium headless. Fizycznych urządzeń nie testowano.

## Pomijanie na desktopie — 12 listopada 2026

- Na desktopie opis pomijania i przejścia do następnego zadania jest zwykłą podpowiedzią Enter/Spacja, bez obsługi kliknięcia i bez miejsca w kolejności Tab. Na ekranach do 650 px lub z głównym wskaźnikiem coarse pozostaje przycisk.
- Rozszerzono istniejący test przeglądarkowy: kliknięcie podpowiedzi nie zmienia rachunku ani zapisu. Potwierdzono działanie Enter/Spacji w polu odpowiedzi oraz przycisku przy szerokości 360 px.
- Node 22.23.4: `npm run check` przeszedł (78 testów, format, lint, typy i build); `npm run test:e2e`: 9/9 Chromium headless. Fizycznych urządzeń dotykowych nie testowano.

## Automatyczne przejęcie wpisywania — 12 listopada 2026

- Cyfry wpisane poza odpowiedzią w widoku treningu przenoszą fokus i dopisują pierwszą cyfrę przez istniejące `onInput`. Pole ma `tabIndex=-1`; kliknięcie myszy nie przejmuje fokusu, dotyk nadal działa. Enter/Spacja poza polem nie pomijają zadania.
- Nowy scenariusz Chromium: kliknięcie bez fokusu, Tab między przyciskami, pierwsza cyfra bez zgubienia lub zdublowania, Backspace, brak przechwycenia Ctrl+1, Spacja na nawigacji bez pominięcia, automatyczne zatwierdzenie odpowiedzi, brak przejęcia wpisu w ustawieniach oraz fokus po tapnięciu w kontekście emulującym telefon.
- Node 22.23.4: `npm run check` przeszedł (78 testów, format, lint, typy i build); `npm run test:e2e`: 10/10, w tym offline i aktualizacja PWA. Nie sprawdzano systemowej klawiatury na fizycznym telefonie ani czytnika ekranu.

## Mobilne menu nawigacji — 12 listopada 2026

- Do 650 px przycisk hamburgera rozwija Trening, Ustawienia, Historię i instalację. Menu zamyka się po wyborze, Escape, kliknięciu poza nim, wyjściu fokusu i zmianie breakpointu. Desktop zachowuje zakładki. Nawigację wydzielono do `src/ui/AppNavigation.tsx`.
- Node 22.23.4: ostatnie `npm run check` przeszło (101 testów, format, lint, typy, build). Wcześniejszy przebieg zgłosił test różnorodności mnożenia; w trakcie pracy równolegle zmieniały się pliki domeny, zapisu i testy.
- Pełne `npm run test:e2e`: 7/12 przeszło, w tym menu, układ i aktualizacja PWA. Błędy dotyczyły migracji v2, przejmowania cyfr, offline, ponawiania zapisu i eksportu; nie stanowi to potwierdzenia pełnej regresji aktualnego repozytorium.
- Oddzielnie ponowiono scenariusze menu i układu na produkcyjnym preview: 2/2 przeszło. Sprawdzono wybór widoków i instalacji, Escape i powrót fokusu, Tab, kliknięcie poza menu, zachowanie rachunku oraz wpisu, szerokości 320/360/1280/2560 px. Obejrzano zrzut rozwiniętego menu przy 360 px. Artefakty: `output/menu-verification/`.
- Testy Chromium headless; nie sprawdzano fizycznego telefonu ani czytnika ekranu.

## Balans poziomów i migracja v3 — 12 listopada 2026

- Wprowadzono osobne rodziny i wagi dla czterech działań, pięć poziomów umiejętności oraz 20% powtórek poprzedniego poziomu. Testy balansu obejmują 40 000 zadań ze stałym RNG: proporcje rodzin/powtórek, zakresy, różnorodność, liczbę przeniesień i pożyczek, pożyczki przez zero oraz całkowite dzielenie. Dodatkowo sprawdzono stałe RNG na krańcach, brak natychmiastowych powtórzeń i poprawność kroków rozwiązania.
- Migracja v1/v2 do v3 zachowuje historię, numery poziomów i ustawienia, resetuje blok/trend i zwiększa epoki. Test IndexedDB z osobną fabryką sprawdza równoczesną migrację dwóch repozytoriów, jednorazowe zwiększenie epoki, utrwalenie v3 i brak utraty dwóch odpowiedzi. Test domeny potwierdza zapis starego zadania do historii bez wpływu na nową adaptację.
- Node 22.23.4 przez lokalne npm exec --yes --package=node@22: npm run check przeszedł (101/101 testów w 13 plikach, formatowanie, lint, typy, build Vite/PWA). Globalny Node 22.12.0 nie był zmieniany.
- Pierwszy przebieg E2E: 7/12; nowy test miał niejednoznaczny selektor opisu (tekst w panelu i menu), pozostałe cztery błędy dotyczyły brakujących plików trace/ENOENT przy zamykaniu kontekstu. Zawężono selektor do listbox i odizolowano katalog artefaktów.
- Ponowione npm run test:e2e -- --output=output/balance-e2e-20261112 --workers=4: 12/12 Chromium headless. Produkcyjny preview; migracja v2, trening po migracji/reload, opisy poziomów, automatyczne odpowiedzi, skróty, retry, dwie karty, import/eksport, układ, offline i aktualizacja PWA przeszły. Test PWA używał dwóch bieżących buildów; nie uruchamiano historycznego klienta v2 równolegle z v3. Zabezpieczenie starego klienta opiera się na jego walidacji obsługiwanych wersji; starsze karty wymagają aktualizacji.
- Nie wykonano publikacji, fizycznej instalacji PWA, testów systemowej klawiatury telefonu ani czytnika ekranu. Subiektywny balans i tempo awansów wymagają oceny w rzeczywistych sesjach graczy; testy automatyczne potwierdzają strukturę zadań, nie ich odczuwaną trudność.

## Boczny panel nawigacji — 12 listopada 2026

- Zastąpiono mobilną listę pod nagłówkiem panelem wysuwanym z prawej strony, na całą wysokość ekranu. Natywny modalny dialog przyciemnia i wyłącza tło; blokuje przewijanie strony, utrzymuje Tab/Shift+Tab w panelu i oddaje fokus po zamknięciu. Animacja respektuje ograniczenie ruchu w systemie.
- Node 22.23.4: `npm run check` przeszedł (101 testów, format, lint, typy i build PWA). Po buildzie `npm run test:e2e`: 12/12 Chromium headless, w tym menu, układ, zapis, migracja, offline i aktualizacja PWA.
- Test menu obejmuje przycisk zamknięcia, tło, Escape, pętlę fokusu, blokadę przewijania, nawigację z zachowaniem wpisu oraz zmianę szerokości. Obejrzano zrzut panelu przy 360 px. Nie sprawdzano fizycznego telefonu ani czytnika ekranu.

## Zamykanie selektora dotykiem — 12 listopada 2026

- Odtworzono ponowne otwarcie selektora poziomu po drugim dotknięciu przycisku: Radix zamyka listę na zewnętrznym pointerdown, po czym click z tego samego gestu trafia do odblokowanego przycisku i otwiera listę ponownie. Przed poprawką test dotyku nie przechodził, a wariant myszy przechodził.
- Wspólny `Select` ignoruje click po dotykowym zamknięciu listy; nowe naciśnięcie lub klawisz resetuje tę ochronę. Zachowano obsługę wyboru wartości i przywracanie fokusu.
- Node 22.23.4: `npm run check` przeszedł (101 testów, format, lint, typy i produkcyjny build). Po buildzie `npm run test:e2e`: 14/14 Chromium headless. Nowe scenariusze myszy i emulowanego dotyku sprawdzają otwarcie, zamknięcie tym samym przyciskiem, fokus, kolejne otwarcie i wybór poziomu. Istniejący test klawiatury również przeszedł.
- Nie wykonano sprawdzenia na fizycznym telefonie ani w Safari.

## Refaktor po rozbudowie — 12 listopada 2026

- Podzielono E2E na trening, nawigację, zapis/migracje i offline; wspólny odczyt danych nie wykonuje migracji w teście. Test migracji potwierdza surowy rekord v3. Test aktualizacji PWA korzysta ze wspólnego odczytu surowego rekordu.
- Wydzielono generowanie par cyfr i iloczynów, zastąpiono warunki zależne od nazw rodzin jawną konfiguracją oraz rozróżniono zakresy i listy operandów. Typ konfiguracji wymusza pięć poziomów. Trzy nowe testy sprawdzają niezależność reguł od nazw oraz rozdzielenie cache między definicjami i działaniami. Dotychczasowe testy balansu obejmujące 40 000 zadań pozostają aktywne.
- Wydzielono hooki pola odpowiedzi i mobilnego panelu; ujednolicono typ widoku. Rozdzielono kroki migracji od normalizacji, zachowując transakcje, format v3 i epoki. Usunięto helper `decode` maskujący błędy; stare testy sprawdzają teraz rzeczywiste odrzucenie danych przez `parseSaved`.
- Style nawigacji przeniesiono do `navigation.css`, a reguły responsywne treningu, ustawień i historii do ich plików. Nowy scenariusz sprawdza trzy widoki przy 320, 360, 650, 651, 1280 i 2560 px, brak poziomego przewijania i kolizji nagłówka oraz zamknięcie dialogu przy przejściu z 650 na 651 px.
- Środowisko: Node 22.23.5 przez `npm exec --yes --package=node@22`, bez zmiany globalnego Node 22.12.0. Stan bazowy: `npm run check` przeszedł (101/101 testów), następnie E2E 14/14. Po etapach testów, generatorów, interakcji i migracji ponawiano `check` oraz E2E; każdy etap zakończył się powodzeniem.
- Podczas wydzielania hooka kontrola składni wykryła pozostawioną w widoku końcówkę efektu; przeniesiono ją do hooka i ponowiono kontrole. Pierwszy rozszerzony przebieg po przeniesieniu CSS: 14/15 E2E. Nowy test wykrył nadpisanie mobilnych reguł historii przez później importowany styl bazowy. Reguły umieszczono po bazowych w `history.css`.
- Końcowy `npm run check`: formatowanie, lint, 104/104 testów w 14 plikach, TypeScript i produkcyjny build PWA przeszły. Następnie `npm run test:e2e -- --output=output/refactor-verified-e2e --workers=4`: 15/15 Chromium headless, w tym retry, migracje, dwie karty, kopie danych, klawiatura, dotyk, offline i aktualizacja między dwoma bieżącymi buildami.
- Obejrzano zrzuty panelu mobilnego i selektora poziomów przy 360 px. Artefakty końcowego przebiegu: `output/refactor-verified-e2e/`. Lokalna kopia plików sprzed zmian: `output/refactor-before-20261112/` (repozytorium nie miało commitów).
- Nie wykonano publikacji, zdalnego CI, uruchomienia historycznego klienta v2, testów Safari, fizycznej instalacji PWA, klawiatury ekranowej ani czytnika ekranu. Nie zmieniano zależności ani zachowania produktu.

## Pomiar czasu buildu — 12 listopada 2026

- Lokalny Node 22.23.5, zainstalowane zależności i rozgrzany cache systemu plików. Trzy sekwencyjne pomiary osobnych procesów: `tsc --noEmit` 1,603 / 1,639 / 1,597 s; `vite build` wraz z PWA 1,430 / 1,379 / 1,405 s. Wszystkie zakończyły się kodem 0.
- Dodatkowy pomiar pełnego `npm run build`: 3,183 s. Sam komunikat Vite wskazał 131 ms; nie obejmuje wcześniejszego sprawdzania typów ani późniejszego generowania service workera. W osobnych przebiegach od komunikatu o bundlu do zakończenia procesu upłynęło 1,089–1,122 s (etap PWA i zamknięcie procesu).
- Build: główny JS 355,49 kB / 114,96 kB gzip, CSS 21,53 kB / 8,02 kB gzip, precache 480,64 KiB. Dane pomiaru: `output/build-timings.json`; skrypt: `output/measure-build.cjs`.
- Nie zmieniano kodu ani konfiguracji aplikacji. Nie powtarzano testów funkcjonalnych; pomiar dotyczył wyłącznie czasu i powodzenia buildu. Nie obejmuje instalacji zależności, zimnego cache, infrastruktury CI ani publikacji na Cloudflare.

## Opcjonalne potęgowanie i pierwiastkowanie — 12 listopada 2026

- Dodano domyślnie wyłączone działania, pięć poziomów, wyjaśnienia, zapis v4 i migrację v1–v3. Test v3 usuwa nowe pola z wejścia i potwierdza zachowanie starej historii, bloków i epok; zapis v4 wymaga kompletu nowych pól.
- `npm exec --yes --package=node@22 -- npm run check`: formatowanie, lint, 127/127 testów, TypeScript i produkcyjny build PWA przeszły. Pierwszy przebieg wykrył brak równania końcowego w wyjaśnieniu pierwiastka; poprawiono wyjaśnienie i rozszerzono parser testowy o matematyczną weryfikację pierwiastków.
- `npm exec --yes --package=node@22 -- npm run test:e2e -- --workers=4`: końcowo 16/16 scenariuszy Chromium headless. Nowy scenariusz obejmuje domyślne wyłączenie, ręczne włączenie, poprawną odpowiedź, zapis po przeładowaniu, zmianę poziomu i wyłączenie. Dotychczasowe regresje obejmują migracje, retry, kopie, dwie karty, offline i aktualizację PWA.
- Sprawdzono brak poziomego przewijania dla nowego zadania przy 320 i 1280 px; obejrzano zrzut pierwiastka przy 320 px. Zrzuty: `output/optional-root-320.png` i `output/optional-root-1280.png`. Nie otwierano widocznego podglądu.
- Nie wykonano testów na fizycznym telefonie, w Safari ani z czytnikiem ekranu. Nie publikowano aplikacji.

## Usunięcie interfejsu instalacji — 12 listopada 2026

- Usunięto przycisk instalacji z nagłówka i menu mobilnego, instrukcję instalacji oraz przechwytywanie `beforeinstallprompt`. Instalacja pozostaje po stronie przeglądarki. Obsługa aktualizacji PWA pozostaje aktywna. Dostosowano test pętli fokusu do trzech pozycji menu.
- `npm run check` przez `npm exec --yes --package=node@22`: formatowanie, lint, 127/127 testów, TypeScript i build PWA przeszły. Następnie `npm run test:e2e -- --workers=4` w tym samym środowisku: 16/16 testów Chromium headless, w tym nawigacja, układy mobilne, offline i aktualizacja PWA.
- Nie sprawdzano instalacji na fizycznym urządzeniu ani w Safari. Nie publikowano aplikacji.
