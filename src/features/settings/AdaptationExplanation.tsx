import { ADAPTATION } from "../../domain/config";
export function AdaptationExplanation() {
  return (
    <details className="explanation">
      <summary>Jak dobieramy poziom?</summary>
      <p>
        Każde działanie oceniamy osobno, w blokach po {ADAPTATION.blockSize}{" "}
        zadań. Liczba kolejnych bloków wymagana do zmiany poziomu:{" "}
        {ADAPTATION.consecutiveBlocks}. Dobry blok to minimum{" "}
        {ADAPTATION.cleanToAdvance} odpowiedzi bez poprawek i zero pominięć.
        Trudny blok to minimum {ADAPTATION.skipsToLower} pominięcia,{" "}
        {ADAPTATION.correctedToLower} poprawianych zadań lub{" "}
        {ADAPTATION.correctionsToLower} poprawek. Czas nie ma znaczenia.
      </p>
      <p>
        Seria kasowania i ponownego wpisywania to jedna poprawka. Dopisywanie
        kolejnych cyfr nie jest błędem. Ręczna zmiana poziomu lub automatycznego
        doboru rozpoczyna nowy blok oceny.
      </p>
    </details>
  );
}
