import { expect, it } from "vitest";
import { summarizeDay } from "./summary";
import type { Day } from "../../domain";

const legacyDay: Day = {
  date: "2026-11-11",
  solved: 10,
  skipped: 2,
  corrections: 3,
  modules: { add: 12, subtract: 0, multiply: 0, divide: 0 },
};

it("zachowuje dawne sumy, a brak szczegółów pokazuje jako nieznany", () => {
  expect(summarizeDay(legacyDay, "all")).toEqual({
    solved: 10,
    skipped: 2,
    corrections: 3,
    cleanPercentage: "—",
    skippedPercentage: "17%",
  });
  expect(summarizeDay(legacyDay, "add").solved).toBeUndefined();
});

it("liczy jakość tylko z dostępnych szczegółów i filtruje działania", () => {
  const day = {
    ...legacyDay,
    details: {
      add: { solved: 2, skipped: 1, clean: 1, corrections: 1 },
      subtract: { solved: 0, skipped: 0, clean: 0, corrections: 0 },
      multiply: { solved: 0, skipped: 0, clean: 0, corrections: 0 },
      divide: { solved: 0, skipped: 0, clean: 0, corrections: 0 },
    },
  };
  expect(summarizeDay(day, "all").cleanPercentage).toBe("50%");
  expect(summarizeDay(day, "add")).toEqual({
    solved: 2,
    skipped: 1,
    corrections: 1,
    cleanPercentage: "50%",
    skippedPercentage: "33%",
  });
});
