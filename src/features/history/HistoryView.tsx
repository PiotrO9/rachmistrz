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
  const games = [
    { title: "Logarytmy", result: saved.logarithms },
    { title: "Wzory Viète’a", result: saved.viete },
  ].filter(({ result }) => result.solved + result.skipped > 0);
  const empty =
    !saved.history.length && !saved.matches.history.length && !games.length;
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
      {empty && (
        <div className="empty">
          <h2>Jeszcze bez wyników</h2>
          <p>Rozwiąż pierwsze zadanie, aby rozpocząć historię treningu.</p>
          <button className="primary" onClick={() => onTrain()}>
            Zacznij liczyć <Icon name="arrow" />
          </button>
        </div>
      )}
      {saved.history.length > 0 && <ProgressHistory saved={saved} />}
      {saved.matches.history.length > 0 && (
        <section>
          <h2>Zapałki</h2>
          {saved.matches.history.map((day) => (
            <p key={day.date}>
              {day.date} · Samodzielnie {day.clean} · Z pomocą {day.helped} ·
              Pominięte {day.skipped}
            </p>
          ))}
        </section>
      )}
      {games.map(({ title, result }) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>
            Rozwiązane: {result.solved} · Pominięte: {result.skipped}
          </p>
        </section>
      ))}
      <p className="smallNote">
        Historia obejmuje ostatnie 365 dni aktywności. Dane pozostają w tej
        przeglądarce; nie synchronizują się między urządzeniami.
      </p>
    </section>
  );
}
