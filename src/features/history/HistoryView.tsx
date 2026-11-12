import { operations, labels, symbols, type SavedProgress } from "../../domain";
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
      <div className="levelSummary">
        {operations.map((op) => (
          <div key={op}>
            <span>
              {symbols[op]} <span>{labels[op]}</span>
            </span>
            <strong>
              {saved.modules[op].level}
              <small> / 5</small>
            </strong>
          </div>
        ))}
      </div>
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
