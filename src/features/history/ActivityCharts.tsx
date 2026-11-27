import { labels, type Operation } from "../../domain";
import type { ActivityPeriod, ActivityRow } from "./activity";
import type { HistoryFilter } from "./summary";

const percent = (rate: number) => Math.round(rate * 100) + "%";
const shortDate = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });

export function ActivityRankings({
  period,
  onPeriodChange,
  rows,
  selected,
  onSelect,
}: {
  period: ActivityPeriod;
  onPeriodChange: (period: ActivityPeriod) => void;
  rows: ActivityRow[];
  selected: HistoryFilter;
  onSelect: (operation: Operation) => void;
}) {
  const active = rows.filter((row) => row.attempts > 0);
  const solved = active
    .filter((row) => row.solved > 0)
    .sort((a, b) => b.solved - a.solved);
  const rates = active.sort(
    (a, b) =>
      Number(b.attempts >= 3) - Number(a.attempts >= 3) ||
      b.rate - a.rate ||
      b.attempts - a.attempts,
  );
  return (
    <section className="activityCharts">
      <div className="activityHeader">
        <h2>Wyniki według działań</h2>
        <div
          className="activityPeriod segmentedControl"
          data-period={period}
          role="group"
          aria-label="Zakres wykresów"
        >
          {([1, 7, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              aria-pressed={period === days}
              onClick={() => onPeriodChange(days)}
            >
              {days === 1 ? "Dzisiaj" : days + " dni"}
            </button>
          ))}
        </div>
      </div>
      {active.length === 0 ? (
        <p>Brak szczegółowych wyników z tego okresu.</p>
      ) : (
        <>
          <p>Wybierz działanie, aby zobaczyć szczegóły.</p>
          <div className="rankingGrid">
            {(["solved", "rate"] as const).map((metric) => (
              <section key={metric}>
                <h3>
                  {metric === "solved"
                    ? "Najwięcej rozwiązanych"
                    : "Najlepiej bez poprawek"}
                </h3>
                {metric === "rate" && (
                  <p>Udział we wszystkich próbach, łącznie z pominięciami.</p>
                )}
                {metric === "solved" && solved.length === 0 && (
                  <p>Dotychczas wszystkie zadania pominięto.</p>
                )}
                {(metric === "solved" ? solved : rates).map((row) => (
                  <button
                    type="button"
                    className="rankingRow"
                    key={row.operation}
                    aria-pressed={selected === row.operation}
                    onClick={() => onSelect(row.operation)}
                  >
                    <span>{labels[row.operation]}</span>
                    <strong>
                      {metric === "solved" ? row.solved : percent(row.rate)}
                    </strong>
                    <span className="rankingTrack" aria-hidden="true">
                      <i
                        style={{
                          width: percent(
                            metric === "solved"
                              ? row.solved / solved[0].solved
                              : row.rate,
                          ),
                        }}
                      />
                    </span>
                    {metric === "rate" && (
                      <small>
                        {row.clean} z {row.attempts}
                        {row.attempts < 3 && " · mało prób"}
                      </small>
                    )}
                  </button>
                ))}
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function ActivityTrend({
  row,
  dates,
}: {
  row: ActivityRow;
  dates: string[];
}) {
  const x = (index: number) => (index / (dates.length - 1)) * 100 + "%";
  const y = (rate: number) => (1 - rate) * 100 + "%";
  return (
    <section className="activityCharts trend">
      <h3>
        {labels[row.operation]} ·{" "}
        {dates.length === 1 ? "dzisiaj" : `ostatnie ${dates.length} dni`}
      </h3>
      {row.attempts === 0 ? (
        <p>Brak szczegółowych wyników tego działania w tym okresie.</p>
      ) : dates.length === 1 ? (
        <p>
          Bez poprawek: <strong>{percent(row.rate)}</strong> ({row.clean} z{" "}
          {row.attempts}).
        </p>
      ) : (
        <>
          <p>Rozwiązane bez poprawek spośród wszystkich prób</p>
          <div className="trendPlot">
            <div className="trendScale" aria-hidden="true">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <svg
              role="img"
              aria-label={`Dzienne wyniki: ${labels[row.operation]}. Wartości dostępne pod wykresem.`}
            >
              {[0, 50, 100].map((tick) => (
                <line
                  className="trendGrid"
                  key={tick}
                  x1="0"
                  x2="100%"
                  y1={tick + "%"}
                  y2={tick + "%"}
                />
              ))}
              {row.days.map((day, i) => {
                if (!day) return null;
                const previous = row.days[i - 1];
                return (
                  <g key={day.date}>
                    {previous && (
                      <line
                        x1={x(i - 1)}
                        y1={y(previous.rate)}
                        x2={x(i)}
                        y2={y(day.rate)}
                      />
                    )}
                    <circle cx={x(i)} cy={y(day.rate)} r="3.5">
                      <title>
                        {shortDate(day.date)} · {day.clean} z {day.count}
                      </title>
                    </circle>
                  </g>
                );
              })}
            </svg>
            <div className="trendDates">
              <span>{shortDate(dates[0])}</span>
              <span>{shortDate(dates[dates.length - 1])}</span>
            </div>
          </div>
          <details>
            <summary>Dzienne wartości</summary>
            {row.days.map(
              (day) =>
                day && (
                  <p key={day.date}>
                    {shortDate(day.date)} · {percent(day.rate)} ({day.clean} z{" "}
                    {day.count})
                  </p>
                ),
            )}
          </details>
        </>
      )}
    </section>
  );
}
