import {
  LEVELS,
  operations,
  labels,
  symbols,
  type SavedProgress,
} from "../../domain";
import { Icon } from "../../ui/Icon";
import { SectionTitle } from "../../ui/SectionTitle";
import { ProgressHistory } from "./ProgressHistory";
export function HistoryView({
  saved,
  onTrain,
}: {
  saved: SavedProgress;
  onTrain: () => void;
}) {
  return (
    <section>
      <SectionTitle title="Historia treningu">
        Aktualne poziomy i dzienne podsumowania.
      </SectionTitle>
      <ul className="levelSummary" aria-label="Aktualne poziomy działań">
        {operations.map((op) => (
          <li key={op} className="levelCard">
            <span className="levelCardSymbol" aria-hidden="true">
              {symbols[op]}
            </span>
            <div className="levelCardDetails">
              <strong>{labels[op]}</strong>
              <span className="levelCardValue">
                <span className="srOnly">Poziom </span>
                {saved.modules[op].level} / {LEVELS.length}
              </span>
              <span className="levelCardScale" aria-hidden="true">
                {LEVELS.map(({ value }) => (
                  <span
                    key={value}
                    data-filled={value <= saved.modules[op].level}
                  />
                ))}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {saved.history.length === 0 ? (
        <div className="empty">
          <h2>Jeszcze bez wyników</h2>
          <p>Rozwiąż pierwsze zadanie, aby rozpocząć historię treningu.</p>
          <button className="primary" onClick={() => onTrain()}>
            Zacznij liczyć <Icon name="arrow" />
          </button>
        </div>
      ) : (
        <ProgressHistory saved={saved} />
      )}
      <p className="smallNote">
        Historia obejmuje ostatnie 365 dni aktywności. Dane pozostają w tej
        przeglądarce; nie synchronizują się między urządzeniami.
      </p>
    </section>
  );
}
