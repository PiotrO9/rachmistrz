---
name: rachmistrz-verification
description: Weryfikuj zmiany aplikacji Rachmistrz i dobieraj regresje treningu, IndexedDB oraz PWA. Używaj przy sprawdzaniu implementacji, poprawki błędu lub gotowości do wydania w tym repozytorium; sama edycja dokumentacji nie wymaga pełnej procedury aplikacji.
---

# Weryfikacja Rachmistrza

Wszystkie ścieżki poniżej są względem katalogu głównego repozytorium. Czytaj `AGENTS.md` jako źródło zasad, `package.json` i `playwright.config.ts` jako źródło aktualnych komend. W `docs/TECHNICAL.md` sprawdź mechanizmy dotyczące zmiany, a w `docs/VERIFICATION.md` wcześniejsze regresje i ograniczenia; historyczne wyniki nie zastępują nowego uruchomienia.

## Uruchomienie

1. Sprawdź wersję Node (`node --version`) względem `package.json` oraz zakres zmian. Nie zmieniaj globalnej instalacji Node, jeśli można użyć zgodnego środowiska lokalnego.
2. Uruchom `npm run check` z katalogu repozytorium. Obejmuje formatowanie, lint, testy, typy i produkcyjny build PWA.
3. Po udanym buildzie uruchom `npm run test:e2e`. Jeśli po `check` zmieniono kod aplikacji, najpierw ponów odpowiednie kontrole i build. Jeśli brakuje Chromium, zainstaluj je przez `npx playwright install chromium`.
4. Playwright uruchamia produkcyjny `npm run preview` na porcie 4178. Jeśli korzysta z istniejącego serwera, potwierdź, że obsługuje ten projekt i aktualny build. Nie zatrzymuj obcego procesu tylko po to, aby zwolnić port. Zachowaj tryb headless i brak przejmowania fokusu.

## Dobór regresji

Sprawdź istniejące testy przed dodaniem nowych. Dodatkowe scenariusze dobieraj do zmienionego zachowania; nie uruchamiaj całej poniższej listy ręcznie po każdej zmianie. Testy logiki są przy modułach `src/domain/`, `src/training/` i `src/persistence/`; nowe scenariusze przeglądarki dodawaj w `e2e/`, nie w historycznym `scripts/browser-qa.js`.

| Obszar zmiany          | Zachowanie do zweryfikowania                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Odpowiedzi i trening   | Poprawny wynik przechodzi automatycznie dalej, błędny pozostaje. Enter/Spacja pomijają tylko w polu odpowiedzi. Ujawnienie rozwiązania i wskazówki nie nalicza kolejnego pominięcia.                                                                 |
| Zapis i retry          | Wymuś awarię transakcji: wpis i zadanie pozostają. Ponowienie zapisuje tę samą komendę dokładnie raz, bez ponownego obliczania poprawek. Przy wolnym zapisie dodatkowy Enter lub cyfry nie trafiają do następnego zadania.                           |
| Synchronizacja         | Dwie karty w jednym kontekście przeglądarki zapisują odpowiedzi bez utraty historii. Spóźniony odczyt nie cofa udanego zapisu/importu. Błąd powiadomienia nie unieważnia zatwierdzonej transakcji.                                                   |
| Ustawienia i adaptacja | Zmiana ustawień zachowuje zadanie, jeśli działanie jest nadal włączone. Zadanie ze starszej epoki trafia do historii, ale nie ocenia nowego poziomu, także po powrocie na ten sam poziom. Progi i zakresy sprawdzaj względem `src/domain/config.ts`. |
| Migracja i kopie       | Migracja v1 zachowuje stare sumy i źródłowy localStorage. Eksport/import działa po przeładowaniu; anulowanie lub wadliwy import nie zastępuje danych. Uszkodzony rekord można odzyskać przez potwierdzony import.                                    |
| Widoki i motyw         | Zweryfikuj dotknięte widoki przy małej i dużej szerokości, obsługę klawiatury i powrót fokusu. Dla zmian motywu sprawdź przeładowanie, tryb systemowy i synchronizację kart.                                                                         |

W testach stosuj wstrzykiwane RNG, datę i repozytorium oraz osobną fabrykę/bazę IndexedDB dla każdego testu, zgodnie z `AGENTS.md`. Scenariusze awarii i importu wykonuj na izolowanych danych testowych.

## PWA i offline

Przy zmianie service workera, cache, zasobów lub inicjalizacji aplikacji sprawdź offline na produkcyjnym buildzie przez `npm run preview`, nigdy wyłącznie na serwerze developerskim:

- Otwórz aplikację online w izolowanym kontekście i zaczekaj na aktywnego service workera oraz gotowość offline.
- Wyłącz sieć w kontekście przeglądarki, otwórz nową kartę aplikacji, wykonaj zadanie i przeładuj. Potwierdź dostępność zasobów, zachowanie postępu i brak błędów konsoli.
- Gdy zmiana dotyczy aktualizacji PWA, sprawdź dwa kolejne buildy na tym samym originie: komunikat aktualizacji, brak samoczynnego przeładowania oraz zachowanie danych po zaakceptowaniu aktualizacji.

Instalacja na fizycznym telefonie, klawiatura ekranowa i czytnik ekranu wymagają oddzielnego sprawdzenia na urządzeniu. Wynik Chromium headless nie potwierdza tych zachowań.

## Wynik

Podaj uruchomione komendy, ich rzeczywisty wynik i niewykonane istotne scenariusze. Przy błędzie wykorzystaj trace i zrzuty z `test-results/`; po poprawce ponów nieudane kontrole i zależne od niej sprawdzenia. Zapisuj istotne wyniki w `docs/VERIFICATION.md` zgodnie z mapą dokumentacji w `AGENTS.md`. Nie publikuj aplikacji w ramach samej weryfikacji.
