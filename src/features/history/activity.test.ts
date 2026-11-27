import { expect, it } from "vitest";
import { defaults, record } from "../../domain";
import { recentActivity } from "./activity";

it("liczy 30 lokalnych dni, zachowuje przerwy i uwzględnia pominięcia w mianowniku", () => {
  let saved = defaults();
  for (const [date, skipped] of [
    ["2026-10-28", false],
    ["2026-10-29", false],
    ["2026-11-27", true],
    ["2026-11-28", false],
    ["2026-11-25", false],
  ] as const) {
    saved = record(saved, "add", { skipped, corrections: 0 }, date);
  }
  const legacy = saved.history.find((day) => day.date === "2026-11-25")!;
  delete legacy.details;
  const { rows, dates } = recentActivity(
    saved.history,
    30,
    new Date(2026, 10, 27),
  );
  expect(dates).toHaveLength(30);
  const add = rows.find((row) => row.operation === "add")!;
  expect(add).toMatchObject({ solved: 1, attempts: 2, clean: 1, rate: 0.5 });
  expect(add.days[0]?.rate).toBe(1);
  expect(add.days[27]).toBeNull();
  expect(add.days[29]?.rate).toBe(0);
});

it("liczy dzisiaj i ostatni tydzień względem lokalnej daty także na przełomie roku", () => {
  let saved = defaults();
  for (const date of [
    "2026-12-26",
    "2026-12-27",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
  ]) {
    saved = record(saved, "add", { skipped: false, corrections: 0 }, date);
  }
  const today = new Date(2027, 0, 2, 0, 1);
  const week = recentActivity(saved.history, 7, today);
  expect(week.dates[0]).toBe("2026-12-27");
  expect(week.rows.find((row) => row.operation === "add")?.solved).toBe(3);
  const day = recentActivity(saved.history, 1, today);
  expect(day.dates).toEqual(["2027-01-02"]);
  expect(day.rows.find((row) => row.operation === "add")?.solved).toBe(1);
});
