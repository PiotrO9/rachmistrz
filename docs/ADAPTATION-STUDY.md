# Balans adaptacji — 27 listopada 2026

**Zachować szybki pierwszy awans. Kolejny eksperyment powinien sprawdzić wynik na nowym materiale po awansie oraz reakcję na poprawę umiejętności od poziomu 3.** Przy niezależnych odpowiedziach reguła v13 rozpoznaje biegłych i spełnia limit przedwczesnych awansów początkujących. Przy seriach dobrych i słabych odpowiedzi ten sam limit zostaje wyraźnie przekroczony.

## Wynik względem ustalonych celów

Każda komórka badania obejmuje 100 000 treningów. Poziomy 2–4 w pierwszych trzech wierszach mierzono od rozpoczęcia treningu na poziomie 1, w zadaniach jednego działania. Zakres obejmuje sześć stylów odpowiedzi.

| Kryterium                                                                              |  Cel | Wdrożona reguła v13 | Ocena      |
| -------------------------------------------------------------------------------------- | ---: | ------------------: | ---------- |
| Biegły na poziomie 2 do 8. zadania                                                     | ≥90% |        92,10–95,59% | 6/6 stylów |
| Biegły na poziomie 3 do 24. zadania                                                    | ≥90% |        72,90–86,06% | 0/6        |
| Biegły na poziomie 4 do 48. zadania                                                    | ≥90% |        56,40–83,58% | 0/6        |
| Solidne podstawy, pierwszy awans do 16. zadania                                        | ≥80% |        70,03–83,38% | 2/6        |
| Początkujący awansuje do 24. zadania                                                   | ≤15% |        11,87–40,21% | 5/6        |
| Uczeń po poprawie umiejętności osiąga lub utrzymuje poziom ≥4 w kolejnych 24 zadaniach | ≥75% |        31,04–65,46% | 0/6        |

### Początkujący na poziomie 1

Uczeń rozwiązuje samodzielnie 75% materiału poziomu 1 i 50% poziomu 2. Tabela podaje pierwszy awans do 24. zadania, również jeśli później nastąpił spadek. Przedziały 95% obliczono metodą Wilsonа dla pojedynczego stylu.

| Styl odpowiedzi                 | Poprzednia reguła | Reguła v13 | Przedział 95% dla v13 |
| ------------------------------- | ----------------: | ---------: | --------------------: |
| Zwykle poprawia                 |            16,63% |     14,64% |          14,42–14,86% |
| Zwykle pomija                   |             4,27% |     11,87% |          11,67–12,07% |
| Równie często poprawia i pomija |             9,72% |     13,22% |          13,01–13,43% |
| Kilka poprawek                  |             9,85% |     13,44% |          13,23–13,66% |
| Błędy seriami                   |            26,42% | **40,21%** |      **39,90–40,51%** |
| Słaba rodzina zadań             |             9,50% |     13,19% |          12,98–13,40% |

Przy błędach seriami różnica między regułami wynosi 13,79 punktu procentowego. Częstość takich serii wśród rzeczywistych uczniów pozostaje do zmierzenia.

### Co dzieje się po awansie

- **Nowy materiał.** U początkującego, który zwykle poprawia, 59 620 ze 100 000 treningów zakończyło się bez awansu przez 120 zadań. W 36 643 treningach udało się zaobserwować 10 zadań z materiału pierwszego osiągniętego poziomu. W 13 872 z nich (37,86%) uczeń rozwiązał samodzielnie mniej niż połowę. Wśród biegłych o tym samym stylu obserwacja była kompletna w 99 851 treningach i w żadnym wynik nie spadł poniżej połowy.
- **Powrót na łatwiejszy poziom.** W ciągu 24 zadań po pierwszym awansie spadek poniżej uzyskanego poziomu dotyczył 4,02% początkujących zwykle poprawiających odpowiedź oraz 49,95% zwykle pomijających. Obie grupy miały identyczną założoną skuteczność na poszczególnych poziomach. Uwzględniono pełne okna obserwacji.
- **Pomyłka na granicy bloku.** Dla biegłego jedna poprawka w zadaniu 1., 4. lub 8. opóźniła pierwszy awans o 8 zadań zarówno w medianie, jak i w 90. percentylu, we wszystkich stylach. W zadaniu 9. koszt dla pierwszego awansu wyniósł zero. Przy solidnych podstawach i przewadze poprawek koszt ósmego zadania wynosił 8 w medianie i 24 w 90. percentylu; 4 pary na 100 000 nie osiągnęły awansu w obu przebiegach i zostały wyłączone z kwantyli.
- **Trening mieszany.** Po 20, 40 i 60 zadaniach uczeń z solidnymi podstawami, mocnym mnożeniem i słabym dzieleniem, zwykle poprawiający odpowiedzi, osiągał w mnożeniu średnio poziomy 1,10 / 1,76 / 1,94. Poprzednio było to 1,00 / 1,03 / 1,42. Dzielenie po 60 zadaniach osiągnęło średnio 1,11 wobec wcześniejszych 1,04.
- **Za trudny start.** Po ustawieniu początkującego na poziomie 5 spadek poniżej poziomu startowego w ciągu 24 zadań następował w 87,93–99,25% treningów. Biegły zwykle poprawiający odpowiedzi spadał w tym czasie w 0,079% treningów. Próba 8/8 działa wyłącznie od poziomu 1.
- **Uczenie się.** Przy starcie na poziomie 3 i zmianie skuteczności z 60% do 90% po 30 ekspozycjach na ten materiał oba algorytmy dały identyczne wyniki dla sparowanych przebiegów. Zwykle poprawiający osiągali cel w 63 625 z 97 190 pełnych okien (65,46%), a zwykle pomijający w 28 556 z 92 000 (31,04%). Brakujące okna wynikały z ograniczenia treningu do 120 zadań.

## Zakres i odtwarzalność

- Pilot wykorzystał 1000 oddzielnych ziaren na kombinację (1 152 000 treningów). Pełne badanie obejmowało 48 profili × 12 scenariuszy × 2 reguły × 100 000, czyli **115 200 000 treningów i 20 736 000 000 odpowiedzi**, bez doliczania pilota. Czas samego pełnego przebiegu wyniósł około 54 sekund na tej maszynie przy 12 wątkach. Symulator operuje na wyniku zadania i poziomie materiału w pamięci. Nie wykonuje dla każdej odpowiedzi renderowania ani transakcji IndexedDB.
- Osiem profili umiejętności, w kolejności identyfikatorów 0–7, to początkujący, na granicy awansu, gotowy na poziom 2, solidne podstawy, gotowy na poziom 4, biegły, duży skok trudności na poziomie 3 oraz uczący się. Dokładne prawdopodobieństwa dla poziomów 1–5 zawiera macierz `skill` w skrypcie. Style 0–5 odpowiadają wierszom tabeli początkujących.
- Po błędzie style 0–2 stosują odpowiednio 80%, 20% lub 50% szans na poprawkę. W stylu 3 połowa rozwiązanych po poprawce błędów wymaga trzech edycji. W stylu 4 próg losowy odpowiedzi danego działania ma 50% szans na zachowanie poprzedniej wartości, co tworzy serie przy zachowaniu brzegowej skuteczności na ustalonym materiale. W stylu 5 losowane są dwie równie prawdopodobne rodziny syntetyczne; różnica względem średniej wynosi do ±20 punktów procentowych, z ograniczeniem do zakresu 0–100%. Przy niezależnym wyborze rodzin ten model daje ten sam oczekiwany wynik zbiorczy co styl 2. Nie mierzy umiejętności w konkretnych rodzinach generatora aplikacji.
- Scenariusze 0–4 to start od poziomów 1–5, po 120 zadań. Scenariusze 5–6 to po 480 zadań z czterech działań. W scenariuszu 6 mnożenie ma profil biegły, dzielenie początkujący, pozostałe dwa działania mają profil badanego ucznia. Scenariusze 7–11 to kontrolowana seria dziewięciu czystych odpowiedzi oraz jej cztery warianty z dokładnie jedną poprawką w pozycji 1, 4, 8 lub 9. Od zadania 10 wraca zwykły model ucznia. Kwantyle opóźnienia dotyczą par, w których wystąpiły oba awanse.
- Te same losowania obsługują obie reguły oraz porównywane scenariusze w obrębie profilu. Po zmianie poziomu to samo losowanie może przynieść inny materiał i wynik. Materiał powtórkowy ma udział 20% od poziomu 2. Po pierwszym awansie liczone są pierwsze 10 ekspozycji dokładnie na materiał osiągniętego poziomu, także jeśli w dalszej części treningu występuje jako powtórka. Brakujące okna nie są zaliczane jako sukces. Nie generowano treści równań.
- Wyniki opisują wrażliwość algorytmu na przyjęte założenia. Przedziały ufności mierzą błąd losowania w danym modelu. Nie określają częstości stylów odpowiedzi wśród maturzystów ani wpływu aplikacji na wynik egzaminu.

## Uruchomienie i dane

Z katalogu projektu, przy istniejącym katalogu `output`, na Windows z g++ i OpenMP:

```powershell
g++ -O3 -march=native -std=c++17 -fopenmp scripts/adaptation-study.cpp -o output/study.exe
node scripts/check-study-model.mjs
cmd /c "output\study.exe 1000 100000 > output\study-pilot.csv"
cmd /c "output\study.exe 100000 > output\study-full.csv"
```

Kontrola modelu sprawdziła 3465 przejść końca bloku względem funkcji produkcyjnej `adapt`. Zweryfikowano kompletność 1152 unikalnych komórek i liczbę zadań w każdej. W pliku wynikowym `rule=0` oznacza poprzednią regułę, `rule=1` wersję v13. Kolumny z licznikami mają mianownik `runs`, z wyjątkiem wyników warunkowych (`learningWindows`, `postWindows`, `fallWindows`). `postCorrect` to suma czystych odpowiedzi w pełnych oknach, `op*at*` sumuje poziomy, a `late*` liczy zadania po 60. kroku. W treningu mieszanym okna liczone są osobno dla każdego działania. Wartość −999 oznacza brak kwantyla opóźnienia.

Późniejsza wersja symulatora dodaje porównanie z regułą v15 (rule=2). Tabele powyżej opisują pierwotne porównanie dwóch reguł.
