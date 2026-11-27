# Rachmistrz

Minimalistyczny, nieskończony trening liczenia w pamięci. React + TypeScript + Vite, instalowalna PWA, bez backendu i kont.

Favicon przedstawia znak „r·” z nagłówka na jasnym, zaokrąglonym tle.

## Mapa dokumentacji

- Jak działa trening z perspektywy gracza? [FAQ](docs/FAQ.md)
- Jakie były założenia produktu i które zasady zmieniły się później? [Założenia i późniejsze ustalenia](docs/BRIEF.md)
- Gdzie zmienić obsługę odpowiedzi, zapis postępu lub aktualizację PWA? [Opis techniczny](docs/TECHNICAL.md)
- Jakie scenariusze regresji już sprawdzano i jakie ograniczenia odnotowano? [Historia weryfikacji](docs/VERIFICATION.md)
- Jak porównywano tempo awansu dla różnych profili uczniów? [Badanie adaptacji](docs/ADAPTATION-STUDY.md)

## Uruchomienie

Node.js 22.13+ lub 24+; `npm ci`, następnie `npm run dev`. Weryfikacja: `npm run check`. Produkcja: `npm run build`, potem `npm run preview`.

## Kontrola jakości

- `npm run check` — formatowanie, ESLint (także hooki i nieobsłużone Promise), testy logiki i zapisu, TypeScript oraz build PWA.
- `npm run format` — ujednolicenie formatowania.
- `npx playwright install chromium`, potem `npm run build` i `npm run test:e2e` — testy Chromium bez widocznego okna. Preview uruchamia się automatycznie na porcie 4178, chyba że już działa.

CI wykonuje oba zestawy kontroli. Testy przeglądarki używają osobnych profili; nie zmieniają postępu w Twojej przeglądarce. Trace i zrzuty nieudanych scenariuszy trafiają do `test-results/`.

Test aktualizacji PWA tworzy dodatkowy build i osobny preview na wolnym porcie. Sprawdza oczekiwanie na zgodę użytkownika, zachowanie zapisanych danych i ponowne otwarcie offline. Opcjonalna zmienna `PWA_PREVIOUS_DIST` wskazuje katalog starszego buildu do sprawdzenia migracji; domyślnie test używa bieżącego `dist`. Robocze buildy trafiają do ignorowanego `output/`.

## Działanie

Na ekranach do 650 px przycisk menu w nagłówku wysuwa z prawej strony panel z Treningiem, Ustawieniami i Historią. Panel przyciemnia tło i blokuje jego przewijanie. Zamyka się po wyborze opcji, kliknięciu tła, przyciskiem zamknięcia lub Escape; fokus wraca do przycisku menu. Na większych ekranach zakładki znajdują się w górnym pasku, po prawej stronie logo. Przesuwane podświetlenie wskazuje aktywną zakładkę i respektuje systemowe ograniczenie ruchu.

W widoku treningu wystarczy zacząć wpisywać cyfry: jeśli fokus jest poza odpowiedzią, pierwsza cyfra przenosi go do pola i od razu trafia do wpisu. Pole jest pomijane klawiszem Tab i nie przejmuje fokusu po kliknięciu myszą. Na telefonie dotknięcie pola nadal umożliwia otwarcie klawiatury. Wpisywanie w innych polach i kontrolkach oraz skróty Ctrl/Alt/Meta nie są przechwytywane.

Poprawny wynik automatycznie zmienia zadanie. Błędny pozostaje do ręcznej korekty. Enter i Spacja w polu odpowiedzi pomijają zadanie. Na desktopie „Pomiń zadanie” jest nieklikalną podpowiedzią skrótów; na ekranach do 650 px i urządzeniach ze wskaźnikiem dotykowym jest przyciskiem. Opcjonalne rozwiązanie po pominięciu czeka na kolejne potwierdzenie, bez podwójnego liczenia pominięć. Domyślnie cztery podstawowe działania, poziom 1, adaptacja włączona, rozwiązania wyłączone. Pięć poziomów, wyniki całkowite, domyślnie bez liczb ujemnych. Przełącznik „Liczby ujemne” pozwala uzyskać ujemny wynik w około jednej czwartej nowych zadań z dodawania, odejmowania, mnożenia i dzielenia. Pierwsze osiem zadań danego działania bez poprawek i pominięć daje awans na poziom 2. Po poprawce lub pominięciu pierwszy awans wymaga dobrego bloku i bezbłędnego następnego bloku. Przeładowanie zachowuje próbę. Każde zadanie liczy się do poziomu swojego działania. Generator wybiera rodziny zadań o określonych umiejętnościach: około 80% bieżącego poziomu i 20% powtórek z poprzedniego. Na poziomie 1 nie ma powtórek. Dodawanie i odejmowanie przechodzą od liczb do 20 przez dwucyfrowe do trzycyfrowych z wieloma przeniesieniami i pożyczkami. Mnożenie przechodzi od mnożników 2, 5 i 10 do tabliczki, mnożenia przez jedną cyfrę, wygodnych mnożników 11/12/15/25 i pełnych działań dwucyfrowych. Dzielenie ma osobną drabinkę: od tabliczki do dzielników dwucyfrowych; dzielna nie przekracza 999. Opisy w ustawieniach pokazują przykłady.

Każde działanie oceniamy osobno w blokach po 8 zadań. Po pierwszym awansie na poziom 2 trzy poprawiane lub pominięte zadania wśród pierwszych sześciu z nowego materiału powodują powrót na poziom 1. Na poziomie 2 sześć kolejnych czystych odpowiedzi z bieżącego materiału daje awans na poziom 3. Na poziomie 3 taka seria liczy dziewięć odpowiedzi. Powtórki nie zasilają ani nie przerywają tych serii. Po zakończeniu etapu startowego dwa kolejne dobre bloki (minimum 7 odpowiedzi bez poprawek i zero pominięć) podnoszą poziom. Dwa kolejne trudne bloki (minimum 3 pominięcia, 5 poprawianych zadań lub 8 poprawek) obniżają go. Neutralny blok przerywa serię. Granice 1–5. Czas nie wpływa na poziom. Seria kasowania i ponownego wpisywania liczy się jako jedna poprawka; dopisywanie cyfr nie jest błędem. To przybliżenie obejmujące literówki.

W kreatorze, ustawieniach i historii najedź na znak zapytania obok nazwy pola, aby przeczytać podpowiedź. Możesz też otworzyć ją kliknięciem, dotykiem lub klawiszem Enter i zamknąć klawiszem Escape.

Na ekranie treningu przycisk **Szybka sesja** otwiera kreator. Dodaj działania, dobierz poziom każdego z nich i wybierz cel (liczba zadań lub poprawnych rozwiązań). W „Więcej opcji” ustawisz formę zadań podstawowych, ujemne wyniki i częstotliwość działania. Nazwany zestaw uruchomisz ponownie z „Moje zestawy”. Wyniki wchodzą do historii. Adaptacja i ręcznie dobrana trudność dotyczą bieżącej sesji. Po jej zakończeniu możesz powtórzyć zestaw albo wrócić do rozpoczętego zadania zwykłego treningu. Przeładowanie zamyka bieżącą sesję.

Historia dzienna (maks. 365 dni aktywności), ustawienia i adaptacja zapisują się transakcyjnie w IndexedDB, format v15. Zapis zawiera również nazwane zestawy szybkiej sesji. Migracja zachowuje rozpoczęte bloki i udostępnia próbę startową działaniom bez śladów wcześniejszego treningu. Migracja v11 dodaje wyłączony moduł wielomianów. Migracja v10 dodaje domyślnie wyłączone logarytmy. Migracja v9 dodaje wyłączoną opcję „Brakująca liczba”. Migracja v8 dodaje wyłączoną grę „Wzory Viète’a”. Migracja v7 dodaje domyślnie wyłączone Zapałki. Migracja v6 dodaje wyłączone ułamki. Migracja v5 zachowuje postęp i wyłącza liczby ujemne. Format v4 jest migrowany z dodaniem wyłączonych procentów. Format v3 jest migrowany z zachowaniem dotychczasowej adaptacji i dodaniem wyłączonych modułów potęgowania i pierwiastkowania. Formaty v1 i v2 są migrowane automatycznie: historia, motyw i numery poziomów pozostają zachowane, a bloki i trendy adaptacji są jednorazowo zerowane. Starsze karty po migracji wymagają aktualizacji. Zapis v1 z localStorage jest migrowany automatycznie i pozostaje nietknięty jako źródło migracji. Karty tej samej przeglądarki synchronizują się, a transakcje zapobiegają utracie równoczesnych odpowiedzi. Brak synchronizacji między urządzeniami — służą do tego eksport/import pliku JSON w ustawieniach. Import wymaga podglądu i potwierdzenia zastąpienia danych.

W Historii dwa rankingi porównują działania treningowe z wybranego okresu (dzisiaj, ostatnie 7 dni lub domyślnie ostatnie 30 dni) według liczby rozwiązanych zadań i odsetka rozwiązań bez poprawek wśród wszystkich prób. Podświetlenie przełącznika płynnie przesuwa się do wybranego okresu. Przy włączonym systemowym ograniczeniu ruchu zmienia pozycję od razu. Wybranie działania pokazuje wynik za dziś lub wykres dzienny dla dłuższego okresu. Wyniki z jednej lub dwóch prób są oznaczone i umieszczone na końcu rankingu skuteczności. Wykresy korzystają z dostępnych szczegółów dziennych.

Historia pokazuje wyniki według działań, udział rozwiązań bez poprawek, pominięcia i zmiany poziomów (maks. 500). Szczegóły są liczone dopiero od v2; starsze sumy pozostają zachowane bez szacowania brakujących danych. Zmiana ustawień nie usuwa bieżącego zadania, dopóki jego działanie jest włączone. Zakończenie zadania rozpoczętego przed ręczną zmianą poziomu trafia do historii, lecz nie ocenia nowego modelu adaptacji. Aktualnego zadania i wpisu nie zachowujemy po przeładowaniu. Nieudana transakcja zachowuje wpis w otwartej karcie i udostępnia przycisk ponowienia. Kopię można zaimportować również po błędzie odczytu; uszkodzone dane nie są automatycznie zerowane.

### Sposób liczenia i postęp adaptacji

Po włączeniu rozwiązania po pominięciu można rozwinąć „Pokaż sposób liczenia”. Dodawanie i odejmowanie rozbijamy według wartości pozycyjnych, mnożenie wykorzystuje rozkład lub zaokrąglenie do dziesiątki, a dzielenie sprawdzamy mnożeniem. Rozwinięcie nie nalicza kolejnego pominięcia. Następne zadanie zamyka wskazówkę.

Ustawienia pokazują postęp bieżącego bloku i kierunek poprzedniej oceny. Progi adaptacji pozostają bez zmian i wymagają dalszej oceny podczas rzeczywistego treningu. Historię wykonanych sprawdzeń zawiera `docs/VERIFICATION.md`.

## Motyw

Ustawienia → Motyw: jasny, ciemny lub zgodny z systemem (domyślnie). Wybór zapisuje się razem z postępem, jest uwzględniany w eksporcie/importach i synchronizuje się między kartami. Tryb systemowy reaguje na zmianę ustawień systemu bez przeładowania. Oba motywy działają offline.

## Instalacja i offline

Pierwsze otwarcie wymaga internetu. Po pobraniu zasobów przez service workera można uruchamiać grę offline; status gotowości nie jest wyświetlany w stopce. Zasoby są lokalne, bez zewnętrznych fontów. Aktualizacja wymaga decyzji użytkownika i nie przeładowuje gry automatycznie. Instalacja zależy od przeglądarki; iOS: Safari → Udostępnij → Do ekranu początkowego. Po aktualizacji zamknij lub zaktualizuj wszystkie starsze karty.

## Cloudflare Pages

Utwórz repozytorium z zawartości tego katalogu i połącz je z Cloudflare Pages:

- Framework: React (Vite)
- Build: `npm run build`
- Output directory: `dist`
- Node: najnowsza wersja 22 LTS lub 24 LTS

Nie wymaga sekretów ani bazy danych. Hosting dostarcza HTTPS potrzebne do PWA. Po wdrożeniu sprawdź instalację i ponowne uruchomienie offline na docelowym urządzeniu.

## Reszta z dzielenia wielomianu

W ustawieniach włącz **Resztę z dzielenia wielomianu**, aby dodać te zadania do treningu. Wpisz wartość wielomianu w miejscu zerowym dzielnika. Dla `x³ + 2x + 5` i dzielnika `x − 2` odpowiedzią jest `17`. Moduł ma pięć poziomów i własną adaptację.

Generator oraz reguły poziomów dodawaj niezależnie od widoku gry. Reguły adaptacji są punktem wyjścia do oceny w praktyce.

## Opcjonalne działania

**Ułamki** włączysz w ustawieniach. Moduł jest domyślnie wyłączony i ma pięć wspólnych poziomów. Na pierwszym ćwiczysz dodawanie i mnożenie, na drugim dochodzą odejmowanie i dzielenie. Od trzeciego poziomu losowane są wszystkie cztery działania. Wpisz odpowiedź jako ułamek (np. 2/4) lub liczbę całkowitą. Aplikacja uznaje równoważne wyniki i pokazuje rozwiązanie w postaci skróconej. Przycisk / pozwala wpisać kreskę ułamkową również na telefonie.

W ustawieniach można włączyć **Procenty**. Gracz oblicza procent danej liczby (np. 15% z 80) i wpisuje wynik całkowity. Moduł startuje wyłączony, również po migracji. Ma pięć poziomów i własną adaptację: od połowy i dziesiątej części liczby przez ćwiartki i wielokrotności 5% po mniej typowe stawki, np. 28% z 175.

W ustawieniach można osobno włączyć potęgowanie i pierwiastkowanie. Domyślnie są wyłączone, również po aktualizacji. Zestaw „Podstawowe działania” obejmuje cztery dotychczasowe działania. Nowe działania mają własne poziomy i adaptację; pierwiastki zawsze mają całkowity wynik. Poziomy obejmują kwadraty podstaw 2–10, kwadraty 11–20, sześciany 2–10, kwadraty 21–30 oraz czwarte potęgi 2–6 (dla pierwiastków są to zakresy wyników).

Instalacja PWA jest dostępna przez menu przeglądarki. Aplikacja nie wyświetla własnego przycisku ani instrukcji instalacji.

## Logarytmy

W ustawieniach włącz **Logarytmy**, wybierz zestaw i otwórz tryb z menu. „Podstawy” ćwiczą odczytywanie wykładnika, „Suma i różnica” łączenie logarytmów, a „Zmiana podstawy” upraszczanie ich ilorazu. Wpisanie wyniku otwiera następne zadanie. Po włączeniu rozwiązania po pominięciu zobaczysz krok obliczenia. Historia sumuje rozwiązania i pominięcia osobno dla tego trybu.

## Wzory Viète’a

W Ustawieniach w sekcji Minigry włącz **Wzory Viète’a**, aby otworzyć grę z menu. Wpisz dwa całkowite pierwiastki w dowolnej kolejności. Poprawna para automatycznie otwiera kolejne równanie. W polu odpowiedzi Enter i Spacja pomijają zadanie. Historia osobno sumuje rozwiązane i pominięte równania. Wyłączenie gry zachowuje wyniki.

## Zapałki

Włącz **Zapałki** w ustawieniach i wybierz je w menu. Przeciągnij zapałkę lub wybierz kolejno zapałkę i wolne miejsce. Poziom pierwszy wymaga jednego ruchu, drugi dwóch. Możesz zmieniać cyfry i znak działania. Podpowiedź wskazuje zapałkę i oznacza rozwiązanie jako ukończone z pomocą. Przycisk Cofnij pozwala ponowić próbę.
