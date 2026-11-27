import { summarizeDay } from "./summary";
import { recentActivity, type ActivityPeriod } from "./activity";
import { ActivityRankings, ActivityTrend } from "./ActivityCharts";
import { useState } from "react";
import {
  operations,
  labels,
  type SavedProgress,
  type Operation,
} from "../../domain";
import { Select } from "../../ui/Select";
const formatDate = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export function ProgressHistory({ saved }: { saved: SavedProgress }) {
  const [operation, setOperation] = useState<Operation | "all">("all");
  const [period, setPeriod] = useState<ActivityPeriod>(30);
  const { rows, dates } = recentActivity(saved.history, period);
  const selected = rows.find((row) => row.operation === operation);
  const changes = saved.changes
    .filter((change) => operation === "all" || change.operation === operation)
    .slice()
    .reverse();
  return (
    <>
      <ActivityRankings
        period={period}
        onPeriodChange={setPeriod}
        rows={rows}
        selected={operation}
        onSelect={setOperation}
      />
      <div className="preset">
        <label htmlFor="history-operation">Działanie</label>
        <Select<Operation | "all">
          id="history-operation"
          value={operation}
          onChange={setOperation}
          options={[
            { value: "all", label: "Wszystkie działania" },
            ...operations.map((op) => ({ value: op, label: labels[op] })),
          ]}
        />
      </div>
      {selected && <ActivityTrend row={selected} dates={dates} />}
      <div className="historyTable">
        <table>
          <caption className="srOnly">Dzienna historia treningów</caption>
          <thead>
            <tr>
              <th>Dzień</th>
              <th>Rozwiązane</th>
              <th>Bez poprawek</th>
              <th>Pominięte</th>
              <th>Poprawki</th>
            </tr>
          </thead>
          <tbody>
            {saved.history.map((day) => {
              const row = summarizeDay(day, operation);
              return (
                <tr key={day.date}>
                  <th scope="row">{formatDate(day.date)}</th>
                  <td>{row.solved ?? "—"}</td>
                  <td>{row.cleanPercentage}</td>
                  <td>
                    {row.skipped === undefined ? (
                      "—"
                    ) : (
                      <>
                        {row.skipped} <small>({row.skippedPercentage})</small>
                      </>
                    )}
                  </td>
                  <td>{row.corrections ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="smallNote">
        „Bez poprawek” dotyczy rozwiązanych zadań; odsetek pominięć uwzględnia
        wszystkie zadania. Szczegółowe pomiary są dostępne od aktualizacji —
        starszych wyników nie uzupełniamy szacunkami.
      </p>
      <details className="explanation">
        <summary>Zmiany poziomów ({changes.length})</summary>
        {changes.map((c, i) => (
          <p key={i}>
            {formatDate(c.date)} · {labels[c.operation]}: {c.from} → {c.to} ·{" "}
            {c.reason === "manual"
              ? "zmiana ręczna"
              : c.reason === "up"
                ? "stabilna seria odpowiedzi bez poprawek"
                : "powtarzające się poprawki lub pominięcia"}
          </p>
        ))}
        {changes.length === 0 && (
          <p>Nie ma jeszcze zmian poziomu dla tego wyboru.</p>
        )}
      </details>
    </>
  );
}
