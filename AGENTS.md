# Rachmistrz

- Stack: React, TypeScript, Vite, CSS, vite-plugin-pwa. Hosting docelowy: Cloudflare Pages.
- Zachowuj nieskończoną pętlę gry i automatyczne sprawdzanie poprawnego wyniku. Enter i Spacja pomijają zadanie tylko w polu odpowiedzi.
- Nie dodawaj zegara, punktacji ani statystyk do widoku treningu.
- Logika matematyczna i adaptacja w `src/domain/`; wspólne definicje poziomów w `src/domain/config.ts`.
- Czyste przejścia treningu w `src/training/engine.ts`, obsługa efektów w `src/training/controller.ts`, adapter React w `src/useTraining.ts`.
- Zapis w `src/persistence/`: schema, migrations, database, sync. `src/storage.ts` udostępnia repozytorium aplikacji.
- Widoki w `src/features/`, komponenty wspólne w `src/ui/`, style w `src/styles/`. `Select` jest ogólny i typowany, `LevelSelect` zawiera prezentację poziomów.
- Interpretuj odpowiedź raz; zapisuj komendę względem najnowszego stanu. Generuj kolejne zadanie po udanym zapisie. Retry nie może ponownie obliczać poprawek ani dublować historii.
- W testach wstrzykuj RNG, datę i repozytorium. Każdy test IndexedDB ma osobną fabrykę/bazę.
- Zmiany formatu zapisu wymagają wersjonowania i obsługi starszych danych.
- Zapis v3 jest w IndexedDB (z migracją v1/v2). Wszystkie zmiany trwałe wykonuj przez transakcję opartą na najnowszym stanie; nie zapisuj snapshotów z pamięci karty. Legacy localStorage jest tylko źródłem migracji.
- Rozpoczętego zadania nie zmieniaj po ustawieniach, jeśli jego działanie pozostaje włączone. Nie oceniaj nowego poziomu zadaniem ze starszej epoki.
- Weryfikacja: `npm run check` oraz `npm run test:e2e` po buildzie. Node 22.13+ lub 24+. Offline weryfikuj na buildzie produkcyjnym przez `npm run preview`.
- Nie otwieraj automatycznie widocznego podglądu. Testy przeglądarki wykonuj bez przejmowania fokusu.
- Komunikaty commitów pisz po angielsku zgodnie z Conventional Commits: `type(scope): description` (scope opcjonalny). Przy proponowaniu lub tworzeniu commitów używaj skilla `conventional-commits`; dobieraj typ do rzeczywistej zmiany, np. `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

## Dokumentacja i skille

- `README.md`: uruchomienie, funkcje i wdrożenie; aktualizuj przy zmianie komend, wymagań środowiska lub zachowania widocznego dla użytkownika.
- `docs/BRIEF.md`: założenia pierwszej wersji; czytaj przy zmianach zakresu produktu i zasad treningu. Zachowuj historyczny kontekst, a nowe ustalenia oznaczaj jako późniejsze zmiany.
- `docs/TECHNICAL.md`: architektura, przepływ danych i obsługa błędów; czytaj przed zmianami treningu, zapisu lub PWA i aktualizuj, gdy zmienia się opisany mechanizm.
- `docs/VERIFICATION.md`: historia wykonanych sprawdzeń i pozostałe ograniczenia; zaglądaj przy planowaniu regresji. Po istotnej weryfikacji dopisuj datę, zakres, rzeczywiste wyniki oraz niewykonane sprawdzenia, bez zastępowania wcześniejszych wpisów i bez przedstawiania ich jako aktualnego wyniku.
- `.agents/skills/rachmistrz-verification/SKILL.md`: projektowa procedura weryfikacji zmian i doboru scenariuszy regresji. Używaj przy weryfikacji aplikacji lub na żądanie `$rachmistrz-verification`; stałe zasady projektu pozostają w tym pliku `AGENTS.md`.
