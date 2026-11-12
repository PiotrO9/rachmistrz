# Ustalenia pierwszej wersji

Cel: poprawa sprawności rachunkowej poprzez nieskończony trening bez limitu czasu. Odbiorcy: osoby ćwiczące liczenie w pamięci, w tym maturzyści i olimpijczycy.

## Interakcja

Duże działanie i pole odpowiedzi, bez statystyk na ekranie treningu. Poprawny wynik automatycznie zmienia zadanie; niepoprawny zostaje do ręcznej edycji. Enter i Spacja w polu odpowiedzi pomijają zadanie. Przycisk pomijania dostępny także na telefonie. Bez przycisku zakończenia i podsumowania rundy. Zadanie po pominięciu nie pokazuje rozwiązania (przyjęte domyślnie).

## Działania

Dodawanie, odejmowanie, mnożenie, dzielenie. Wyłącznie nieujemne liczby i całkowite wyniki. Dzielenie bez reszty, dzielnik dodatni. Domyślnie wszystkie działania. Presety: wszystkie; dodawanie i odejmowanie; mnożenie i dzielenie; każde działanie osobno. Dodatkowo można ręcznie włączać działania; przynajmniej jedno aktywne.

| Poziom | Dodawanie i odejmowanie | Mnożenie       |
| ------ | ----------------------- | -------------- |
| 1      | składniki 0–20          | czynniki 2–5   |
| 2      | składniki 0–100         | czynniki 2–10  |
| 3      | składniki 0–500         | czynniki 2–12  |
| 4      | składniki 0–1000        | czynniki 2–25  |
| 5      | składniki 0–10 000      | czynniki 2–100 |

W odejmowaniu większa liczba pierwsza; dzielenie jest odwrotnością mnożenia na danym poziomie.

## Adaptacja

Osobny poziom i przełącznik adaptacji dla każdego działania. Start: poziom 1 i adaptacja włączona. Liczymy poprawki oraz pominięcia, bez wpływu czasu. Jedna seria kasowania i ponownego wpisywania to jedna poprawka. Zastąpienie zaznaczonego tekstu również jest poprawką.

Zaktualizowane progi: blok 8 zadań na aktualnym poziomie. Dwa kolejne bloki z minimum 7 odpowiedziami bez poprawek i bez pominięć dają awans. Dwa kolejne bloki z minimum 3 pominięciami, 5 poprawianymi zadaniami lub 8 poprawkami dają spadek. Neutralny blok przerywa serię. Poziom w granicach 1–5. Ręczna zmiana poziomu lub adaptacji zeruje blok oraz trend. Te progi wymagają oceny podczas używania gry.

## Dane i wygląd

Lokalny, transakcyjny zapis IndexedDB z migracją starych danych i synchronizacją kart tej samej przeglądarki. Historia do 365 dni aktywności, z podziałem na działania, udziałem rozwiązań bez poprawek i pominięć oraz listą zmian poziomów. Eksport/import JSON z potwierdzeniem zastąpienia. Bez kont i automatycznej synchronizacji między urządzeniami. Przeładowanie losuje nowe zadanie. Opcjonalne pokazanie rozwiązania po pominięciu czeka na ręczne przejście dalej; domyślnie wyłączone.

Jasny, minimalistyczny interfejs, dużo pustej przestrzeni, duże cyfry. Robocza nazwa: Rachmistrz. Responsywność, lokalne fonty i instalowalna PWA z offline po pierwszym pobraniu zasobów.

## Później

Późniejsze ustalenie — 12 listopada 2026: cyfry wpisane poza polem w widoku treningu automatycznie kierują fokus i wpis do odpowiedzi. Pole jest pomijane przez Tab i nie fokusuje się kliknięciem myszy; dotyk nadal otwiera klawiaturę. Enter/Spacja pomijają zadanie tylko w polu odpowiedzi.

Ułamki, procenty, potęgi i liczby ujemne. Poza zakresem pierwszej wersji: konta, ranking publiczny, backend, płatności.

## Późniejsza zmiana: balans poziomów — 12 listopada 2026

Historyczna tabela powyżej opisuje pierwszy zakres. Zastępujemy go pięcioma poziomami opartymi na umiejętnościach, inspirowanymi grą Matura z Lewusem. Nie kopiujemy zamkniętej puli przykładów: generujemy własne działania z rodzin określonych w `src/domain/config.ts`.

| Poziom | Dodawanie i odejmowanie                       | Mnożenie                                        | Dzielenie                        |
| ------ | --------------------------------------------- | ----------------------------------------------- | -------------------------------- |
| 1      | Do 20, np. 8 + 7, 15 − 6                      | Przez 2, 5, 10                                  | Odwrotności łatwych mnożeń       |
| 2      | Dwie cyfry, pojedyncze przeniesienie/pożyczka | Tabliczka i proste rozszerzenia                 | Tabliczka i proste rozkłady      |
| 3      | Trzy cyfry i prosty rozkład lub zaokrąglanie  | Dwie cyfry przez jedną                          | Większe liczby przez jedną cyfrę |
| 4      | Więcej przeniesień i pożyczek                 | Mnożniki 11, 12, 15, 25 oraz okolice dziesiątek | Wygodne dzielniki dwucyfrowe     |
| 5      | Łańcuchy przeniesień i pożyczki przez zero    | Ogólne iloczyny dwucyfrowe                      | Trudniejsze dzielniki dwucyfrowe |

Składniki dodawania/odejmowania nie przekraczają 999, podobnie dzielna. Około 20% zadań na poziomach 2–5 stanowią powtórki poprzedniego poziomu. Progi adaptacji i zasady treningu pozostają zachowane. Zapis v3 migruje historię i ustawienia v1/v2 oraz jednorazowo resetuje bloki/trendy i zwiększa epoki. Odczucie balansu wymaga dalszej oceny podczas gry.
