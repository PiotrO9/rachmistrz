# Plan techniczny i wdrożenie

React + TypeScript + Vite. CSS z lokalnym fontem Manrope. PWA: vite-plugin-pwa, precache zasobów, aktualizacja po decyzji gracza. Aktualny format danych: v11, z migracją v1–v10.

Aktualizacja zależności z 11 listopada 2026: React/React DOM 19.3.1, Vite 8.3.8, TypeScript 6.0.3 i Prettier 3.10.0. Jawny `build.target` zachowuje poprzedni zakres transformacji Vite 7: Chrome/Edge 107, Firefox 104 i Safari 16; nie oznacza to testów na każdej z tych przeglądarek. Plugin React 5.2.0 deklaruje zgodność z Vite 8. Wersja 6.3.0 powodowała konflikt opcjonalnych zależności Babel podczas instalacji, dlatego nie wymuszono jej użycia. TypeScript 7 pozostaje poza zakresem wspieranym przez typescript-eslint (`>=4.8.4 <6.1.0`). Typy Node pozostają w linii 22, zgodnie ze środowiskiem CI.

`e2e/pwa-update.spec.ts` sprawdza aktualizację między dwoma produkcyjnymi buildami na jednym originie. Drugi build zawiera znacznik HTML zmieniający rewizję precache. Test wymusza sprawdzenie aktualizacji przez API service workera, potwierdza brak automatycznego przeładowania, zachowanie całego rekordu IndexedDB po zgodzie oraz nową kartę i zapis offline. Osobny preview używa losowego portu; pliki testowe pozostają w ignorowanym `output/`. `PWA_PREVIOUS_DIST` pozwala podać starszy build zamiast bieżącego `dist`.

- `src/domain/`: typy, generatory, poprawki, historia i adaptacja; `config.ts` definiuje poziomy, opisy i gotowe zestawy. Generator przyjmuje RNG, sterowanie przyjmuje RNG i datę.
- `src/training/engine.ts`: interpretacja akcji, komendy, zmiana zapisanego stanu i przejście do następnego zadania. Te same funkcje obsługują runtime i testy.
- `src/training/controller.ts`: odczyt, zapis, synchronizacja, ponowienia oraz stany `loading`, `ready`, `saving`, `error`. `src/useTraining.ts` jest adapterem React opartym na `useSyncExternalStore`.
- `src/persistence/schema.ts`: walidacja na granicy `unknown`; `migrations.ts`: migracja i odczyt JSON; `database.ts`: fabryka repozytorium i transakcje IndexedDB; `sync.ts`: powiadomienia kart. `src/storage.ts` udostępnia instancję dla aplikacji. Nie ma drugiej ścieżki odczytu z legacy localStorage.
- `src/features/`: osobne widoki treningu, ustawień, historii i kopii danych. `src/App.tsx`: powłoka, nawigacja i komunikaty.
- `src/ui/Select.tsx`: ogólny, typowany select Radix: portal, kolizje, klawiatura i przywracanie fokusu. `src/features/settings/LevelSelect.tsx`: nazwy, wskaźnik i zakresy poziomów z jednej konfiguracji.
- `src/usePwa.ts`: aktualizacja wraz z obsługą błędów obietnic. Instalację obsługuje przeglądarka; aplikacja nie przechwytuje `beforeinstallprompt` i nie pokazuje własnego przycisku ani instrukcji instalacji. Status gotowości offline nie jest wyświetlany w stopce; cache nadal obsługuje service worker.
- `src/theme.ts` i `public/theme-init.js`: jasny/ciemny/systemowy, kolory przeglądarki i cache pierwszego renderu. Pole motywu wprowadzone w v2 domyślnie ma `system`. Źródłem prawdy jest IndexedDB; `rachmistrz:theme-cache` to tylko pochodny cache renderowania.
- `src/styles/`: tokeny, bazowe style, trening, selecty, układ, panele, historia i reguły responsywne. Kolejność importów w `src/styles.css`.
- `e2e/training.spec.ts`, `navigation.spec.ts`, `persistence.spec.ts`, `offline.spec.ts` i `pwa-update.spec.ts`: scenariusze Chromium na produkcyjnym buildzie; `helpers.ts`: wspólne operacje testowe; `playwright.config.ts`: headless i automatyczny preview.
- `.github/workflows/check.yml`: formatowanie, lint, testy, TypeScript, build i testy przeglądarki po push/PR. Artefakty błędów przeglądarki są zachowywane w CI.

Historia obejmuje podsumowania dzienne, a nie każde zdarzenie, co ogranicza rozmiar zapisu. Błąd zapisu jest sygnalizowany graczowi. Brak przechowywania danych osobowych i sekretów.

IndexedDB: baza `rachmistrz`, magazyn `progress`, rekord `state`. Każda odpowiedź i zmiana ustawień odczytuje najnowszy stan wewnątrz transakcji readwrite. Powiadomienia BroadcastChannel oraz storage/focus odświeżają widoki; poprawność zapisu nie zależy od dostarczenia powiadomień. Rewizje chronią widok przed spóźnionym odczytem. Poprzedni localStorage `rachmistrz:v1` jest źródłem migracji i nie jest modyfikowany. Import, po zatwierdzeniu, zastępuje rekord transakcyjnie. Limit pliku importu: 2 MB.

Zmiana poziomu/adaptacji zwiększa epokę modułu: rozpoczęte wcześniej zadania trafiają do historii, lecz nie zmieniają nowego modelu. Dane szczegółowe sprzed migracji pozostają nieznane; zachowujemy sumy i wyświetlamy „—” zamiast szacunków. Adaptacja wymaga dwóch kolejnych bloków o tym samym kierunku. Czas nie jest sygnałem adaptacji.

## Publikacja

Repozytorium lokalne jest zainicjalizowane. Do publikacji wymagane są docelowe repozytorium GitHub i konto Cloudflare. W Pages wybierz build `npm run build` i katalog `dist`. Alternatywnie po zalogowaniu Wrangler: `npx wrangler pages deploy dist --project-name rachmistrz` (projekt musi istnieć na koncie). Nazwa może wymagać zmiany zależnie od dostępności.

## Zachowanie przy zapisie i błędach

`useAnswerInput`, używany przez `TrainingView`, nasłuchuje cyfr z klawiatury tylko podczas wyświetlania treningu. Poza polem odpowiedzi przenosi fokus i wysyła pojedyncze `onInput` z typem `insertText`, zachowując pierwszą cyfrę. Pomija zdarzenia obsłużone, kompozycję IME, skróty Ctrl/Alt/Meta, inne pola i kontrolki edycyjne, menu oraz dialogi; nie przechwytuje cyfr podczas zapisu, błędu lub ujawnionego rozwiązania. Dalsza edycja działa natywnie w polu. `tabIndex=-1` usuwa pole z kolejności Tab, a anulowanie domyślnego pointerdown myszy zapobiega fokusowi po kliknięciu; dotyk i fokus programowy nadal działają. Enter/Spacja pozostają obsługiwane wyłącznie przez pole odpowiedzi.

Odpowiedź interpretujemy raz. Komenda zawiera zadanie, poprawki i datę, a transakcja stosuje ją do najnowszych danych. Nowe zadanie jest losowane po powodzeniu transakcji. Dodatkowe cyfry/Enter po rozpoczęciu zatwierdzania nie przechodzą do następnego zadania. Podczas zapisu ustawień wpis nadal się aktualizuje; ostatni wpis jest sprawdzany po zapisie, jeśli zadanie pozostało to samo.

Przycisk „Spróbuj ponownie” ponawia tę samą nieudaną komendę bez ponownego naliczania poprawek. Import może zastąpić uszkodzony zapis po podglądzie i potwierdzeniu. Zablokowane otwarcie bazy nie zatruwa przyszłych prób; spóźnione połączenie jest zamykane. Błąd BroadcastChannel nie zmienia zatwierdzonego zapisu w pozorną awarię. Odmontowany widok nie otrzymuje aktualizacji, ale rozpoczęta transakcja może się zakończyć.

## Weryfikacja

Wymagany Node 22.13+ lub 24+. `npm run check`: Prettier, ESLint, testy logiki i zapisu, kontrola typów, build i service worker. `npm run test:e2e` po buildzie: Chromium headless, automatyczny preview na 4178. Pierwszy raz wykonaj `npx playwright install chromium`. W CI instalowane są także zależności systemowe Chromium. Każdy test IndexedDB ma osobną fabrykę i zamyka połączenie; losowe generatory testowane są ze stałym ziarnem.

Testy przeglądarki obejmują automatyczne odpowiedzi, poprawki, skróty, zachowanie zadania, selecty i fokus, motyw, migrację, dwie karty, eksport/import, awarię i ponowienie zapisu, odzyskanie uszkodzonego rekordu oraz przeładowanie offline. Układ trzech widoków sprawdzany jest przy 320, 360, 650, 651, 1280 i 2560 px, wraz z przejściem otwartego panelu mobilnego na desktop. Trace/zrzuty błędów zapisują się w `test-results/`.

Starszy, rozszerzony scenariusz ręcznie uruchamiany przez Playwright CLI pozostaje w `scripts/browser-qa.js`. Plik jest celowo wyłączony z formatowania i lintu, ponieważ CLI wymaga pojedynczego wyrażenia funkcji bez końcowego średnika. Nowe scenariusze dodawaj do `e2e/`.

Fizyczną instalację, czytnik ekranu i klawiaturę ekranową należy dodatkowo sprawdzić na docelowych telefonach. Wdrożenie na Cloudflare nie jest częścią lokalnego refaktoru.

Audyt z 10 listopada 2026: zero zgłoszeń w zależnościach produkcyjnych; pełny audyt zgłasza 15 pozycji w narzędziach developerskich (2 low, 13 moderate), dotyczących pośrednich zależności Workbox i ESLint/TypeScript ESLint. Brak high/critical. Zastosowano dostępne zgodne poprawki; nie wymuszano zmian głównych wersji ani niezgodnych override.

## Czytelność kodu

Typy `SavedProgress`, `OperationProgress` i `TrainingState` rozróżniają zapisany postęp, model działania i stan treningu. `reconcile` przyjmuje jawną opcję zachowania lub zastąpienia zadania. Kontroler oddziela przyjęcie odczytu, zatwierdzenie zapisu i przetworzenie buforowanego wpisu.

Ustawienia składają się z `OperationSettings` i `AdaptationExplanation`; `backup.ts` przygotowuje oraz pobiera kopię. Historia korzysta z czystej funkcji `summarizeDay`, zachowującej rozróżnienie między dawnymi sumami a dostępnymi szczegółami. Limity historii definiuje `HISTORY_LIMITS`. Testy regresji są pogrupowane według modułów w `domain/`, `training/` i `persistence/`.

## Granice modułów

Widoki treningu i ustawień mają jawne kontrakty danych oraz akcji; nie importują hooka `useTraining`. `App` łączy te kontrakty z adapterem React.

Repozytorium deleguje cykl połączenia do `persistence/connection.ts`, interpretację rekordu do `persistence/record.ts`, a komunikaty błędów do `persistence/errors.ts`. Odczyt najnowszego stanu, modyfikacja i zapis pozostają w jednej transakcji `readwrite` w `database.ts`.

`domain/solution.ts` wybiera strategię z `domain/solutions/`; dodawanie i odejmowanie współdzielą rozkład na wartości pozycyjne. Narzędzia w `testing/` tworzą odroczone obietnice, port w pamięci, izolowane repozytoria IndexedDB i stany treningu. Testy jawnie podają dane wejściowe, RNG i datę.

## Balans poziomów — 12 listopada 2026

`CURRICULUM` w `src/domain/config.ts` określa rodziny, zakresy, wagi i opisy osobno dla każdego działania i poziomu. Generator wybiera 80% bieżącego poziomu i 20% poprzedniego (na poziomie 1 tylko bieżący materiał). Metadane `materialLevel` i `familyId` istnieją wyłącznie w zadaniu w pamięci. Wszystkie odpowiedzi, również powtórki, oceniają wybrany poziom według dotychczasowych progów.

Dodawanie i odejmowanie są konstruowane cyfra po cyfrze z zadaną liczbą przeniesień/pożyczek, uwzględniając przeniesienie przychodzące. Poziom 5 odejmowania preferuje pożyczki przez zero; poziom 3 zawiera odejmowanie liczb bliskich setkom. Nie ma pętli odrzucającej losowe zadania. Mnożenie i dzielenie używają niezależnych rodzin, z małymi buforowanymi pulami poprawnych par. Dzielenie ma wynik całkowity i dzielną do 999. Generowanie przyjmuje RNG i kończy się również przy stałym RNG.

Migracja do v3 zachowuje numery poziomów, historię, zmiany poziomu i ustawienia, zeruje blok/trend oraz podnosi epokę każdego działania. Odczyt starszego rekordu uruchamia transakcję, która ponownie czyta najnowszy stan i utrwala migrację; kolejne odczyty jej nie powtarzają. Import v1/v2 przechodzi tę samą migrację, a istniejący mechanizm importu dodatkowo unieważnia rozpoczęte zadania. Numer bazy IndexedDB pozostaje 1 (nie zmienia się struktura magazynu); wersja rekordu/eksportu wynosi 3. Starszy kod v2 odrzuca nowy format zamiast nadpisywać go po odpowiedzi — stare karty trzeba zaktualizować.

## Refaktor po rozbudowie — 12 listopada 2026

Rodziny w `config.ts` mają jawne ograniczenia (`bridgeToTwenty`, `zeroAt`, `excludeMultiplesOfTen`, `excludeSquares`); identyfikator służy do opisu zadania, a nie wyboru algorytmu. Zakres i lista operandów są osobnymi wariantami typu. Każde działanie ma dokładnie pięć poziomów wymuszonych krotką TypeScript. `generation/additive.ts` konstruuje pary cyfr, a `generation/product.ts` tworzy pule iloczynów. Cache jest przypisany do obiektu definicji rodziny i działania. Definicje należy traktować jako stałe, a zmienioną rodzinę tworzyć jako nowy obiekt. Wagi i kolejność losowań pozostają zachowane.

`features/training/useAnswerInput.ts` obsługuje fokus, przejmowanie cyfr i skróty pola. `ui/useNavigationDrawer.ts` obsługuje otwieranie dialogu, zamykanie, pętlę fokusu, blokadę przewijania i breakpoint. `App` oraz `AppNavigation` współdzielą typ `AppView`. Poprawka dotyku i przywracania fokusu pozostaje we wspólnym `Select`. Style nawigacji są w `navigation.css`; responsywne reguły treningu, ustawień i historii znajdują się po regułach bazowych w odpowiadających im plikach. `responsive.css` zawiera reguły powłoki.

`CURRENT_PROGRESS_VERSION` określa aktualną wersję zapisu. Migracje mają osobne kroki v1 → v2 i v2 → v3, po których wykonywana jest normalizacja kopii danych. `migrateStored` zwraca stan i informację o zmianie wersji; repozytorium używa jej do utrwalenia migracji w transakcji czytającej najnowszy rekord. Normalizacja v3 nie resetuje adaptacji ani epok. Usunięto testowy helper `decode`, który ukrywał błędy danych — `parseSaved` zgłasza błędny format. Format rekordu nadal wynosi v3, a wersja bazy IndexedDB pozostaje 1.

Testowy `readRawProgress` zwraca rzeczywisty rekord bez konwersji. `readProgress` waliduje go i wymaga utrwalonego v3, nie uruchamia migracji. Test aktualizacji PWA porównuje surowe rekordy.

## Procenty i zapis v5 — 27 listopada 2026

Rodziny procentów dobierają stawkę i wielokrotność podstawy tak, aby wynik był całkowity. Moduł korzysta ze wspólnej adaptacji i powtórek. Migracja v4 dodaje wyłączony moduł oraz zerowe liczniki procentów, zachowując ustawienia i postęp sześciu wcześniejszych działań. Starsze formaty przechodzą dotychczasową migrację z uzupełnieniem procentów.

## Opcjonalne działania i zapis v4 — 12 listopada 2026

Aktualna wersja rekordu i eksportu to v4. Dodano moduły `power` i `root`, domyślnie wyłączone. Starsze rekordy v1–v3 dostają wyłączone moduły oraz zerowe liczniki nowych działań w historii przed walidacją pełnej struktury. Migracja v3 zachowuje bloki, trendy i epoki istniejących działań; v1/v2 zachowują dotychczasowy reset związany ze zmianą programu nauki. Repozytorium utrwala migrację w transakcji na najnowszym rekordzie, bez zmiany wersji bazy IndexedDB. Starszy klient odrzuca v4.

Rodzina `power` w `CURRICULUM` określa zakres podstaw i wykładnik. Pierwiastki generujemy od całkowitego wyniku przez potęgowanie, bez zaokrągleń. Renderowanie używa indeksu górnego i symbolu pierwiastka, a komunikat czytnika podaje stopień pierwiastka i liczbę pod nim. Preset „Podstawowe działania” nie włącza nowych modułów.

## Liczby ujemne i zapis v6 — 27 listopada 2026

Migracja dodaje wyłączoną preferencję `negativeNumbers`. Generator czterech podstawowych działań po dobraniu rodziny i operandów losuje wariant ze zmianą znaku z prawdopodobieństwem 25%. Rozpoczęte zadanie pamięta, czy dopuszcza wpis z minusem. Zmiana preferencji zachowuje wpis, epokę i blok adaptacji.

## Ułamki i zapis v7 — 27 listopada 2026

Generator dobiera dwa dodatnie ułamki właściwe oraz znak działania z rodziny poziomu. W zadaniu przechowuje liczniki i mianowniki obu składników oraz skrócony wynik. Przy mnożeniu generator mnoży liczniki i mianowniki, a przy dzieleniu mnoży przez odwrotność drugiego ułamka. Wszystkie cztery działania współdzielą poziom, adaptację i historię modułu. Pole przyjmuje zapis a/b lub liczbę całkowitą. Silnik sprawdza równość przez mnożenie krzyżowe na liczbach całkowitych. Częściowy wpis i mianownik zero nie kończą zadania. Zapis v7 dodaje wyłączony moduł i zerowe liczniki do starszych rekordów, zachowując istniejące ustawienia, historię i zasady migracji adaptacji.

## Wzory Viète’a i zapis v9

Generator wybiera dwa różne pierwiastki całkowite od −9 do 9. Obie kolejności odpowiedzi sprawdzamy przez sumę i iloczyn. Komenda wyniku aktualizuje liczniki Viète’a w transakcji. Dopiero zatwierdzenie zapisu lub udane ponowienie zmienia zadanie. Migracja v8 zachowuje Zapałki i dodaje wyłączoną minigrę z zerowymi licznikami.

## Brakująca liczba i zapis v10

Preferencja `missingNumber` startuje wyłączona. Po losowaniu działania, rodziny i liczb generator może ukryć jeden operand w zadaniu podstawowym (udział ⅓). Dopuszcza tylko luki z jednoznacznym rozwiązaniem. Zadanie w pamięci przechowuje pozycję luki, oba operandy i wynik równania. Sprawdzenie wpisu i ujawnienie rozwiązania korzystają z wartości ukrytego operandu. Historia, poziom i epoka należą do bazowego działania. Migracja v9 dodaje preferencję i zachowuje postęp.

## Zapałki i zapis v8

Plansza zapisuje zajęte segmenty trzech cyfr oraz pionową zapałkę operatora w masce bitowej. Generator porównuje błędne równania z poprawnymi układami o tej samej liczbie zapałek. Liczba brakujących segmentów wyznacza minimalną liczbę przełożeń do danego celu. Wynik trafia przez kontroler treningu do transakcji IndexedDB. Osobny postęp przechowuje blok adaptacji, epokę i historię dzienną z podziałem na samodzielne rozwiązania, pomoc oraz pominięcia.

## Logarytmy i zapis v11

Generator w `domain/logarithms.ts` buduje pule z dokładnych potęg i czynników. Silnik przechowuje bieżące wyrażenie, wpis i stan odsłonięcia w pamięci karty. Zmiana zestawu obowiązuje przy następnym losowaniu. Komenda wyniku modyfikuje licznik w najnowszym rekordzie, a zatwierdzenie transakcji odsłania wskazówkę lub losuje zadanie. Migracja v10 dodaje wyłączony tryb z zestawem „Podstawy” i zerowymi licznikami.
