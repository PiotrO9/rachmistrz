import {
  CURRENT_PROGRESS_VERSION,
  operations,
  type SavedProgress,
  type Operation,
  type OperationProgress,
  type Outcome,
  type Day,
  type Stats,
  type LevelChange,
  type Level,
} from "../domain/types";
import { defaults } from "../domain/defaults";
import { LOG_SETS, ADAPTATION } from "../domain/config";
export type PreviousSaved = Omit<SavedProgress, "version"> & {
  version: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
};
export interface LegacySaved {
  version: 1;
  modules: SavedProgress["modules"];
  history: Day[];
}
export class SavedDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SavedDataError";
  }
}
const isRecord = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const isNonNegativeInteger = (x: unknown): x is number =>
  Number.isSafeInteger(x) && (x as number) >= 0;
const isLevel = (x: unknown): x is Level =>
  Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 5;
const isDate = (s: unknown): s is string =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(new Date(s + "T00:00:00Z").getTime()) &&
  new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
const isList = <T>(x: unknown, check: (v: unknown) => v is T): x is T[] =>
  Array.isArray(x) && x.every(check);
const isOperationRecord = <T>(
  x: unknown,
  check: (v: unknown) => v is T,
): x is Record<(typeof operations)[number], T> =>
  isRecord(x) && operations.every((op) => check(x[op]));
const isOutcome = (x: unknown): x is Outcome =>
  isRecord(x) &&
  isNonNegativeInteger(x.corrections) &&
  typeof x.skipped === "boolean";
const isOperationProgress = (x: unknown): x is OperationProgress =>
  isRecord(x) &&
  typeof x.enabled === "boolean" &&
  typeof x.adaptive === "boolean" &&
  isLevel(x.level) &&
  isList(x.block, isOutcome) &&
  x.block.length < ADAPTATION.blockSize &&
  (x.trend === undefined || x.trend === -1 || x.trend === 0 || x.trend === 1) &&
  (x.epoch === undefined || isNonNegativeInteger(x.epoch));
const isStats = (x: unknown): x is Stats =>
  isRecord(x) &&
  isNonNegativeInteger(x.solved) &&
  isNonNegativeInteger(x.skipped) &&
  isNonNegativeInteger(x.corrections) &&
  isNonNegativeInteger(x.clean) &&
  x.clean <= x.solved;
const isMatchDay = (
  x: unknown,
): x is SavedProgress["matches"]["history"][number] =>
  isRecord(x) &&
  isDate(x.date) &&
  isNonNegativeInteger(x.clean) &&
  isNonNegativeInteger(x.helped) &&
  isNonNegativeInteger(x.skipped);
const isSavedDay = (x: unknown): x is Day =>
  isRecord(x) &&
  isDate(x.date) &&
  isNonNegativeInteger(x.solved) &&
  isNonNegativeInteger(x.skipped) &&
  isNonNegativeInteger(x.corrections) &&
  isOperationRecord(x.modules, isNonNegativeInteger) &&
  (x.details === undefined || isOperationRecord(x.details, isStats));
const isLevelChange = (x: unknown): x is LevelChange =>
  isRecord(x) &&
  isDate(x.date) &&
  typeof x.operation === "string" &&
  operations.some((op) => op === x.operation) &&
  isLevel(x.from) &&
  isLevel(x.to) &&
  (x.reason === "manual" || x.reason === "up" || x.reason === "down");
export function validateStored(
  x: unknown,
): SavedProgress | PreviousSaved | LegacySaved {
  if (
    isRecord(x) &&
    (x.version === 1 ||
      x.version === 2 ||
      x.version === 3 ||
      x.version === 4 ||
      x.version === 5 ||
      x.version === 6)
  ) {
    const initial = defaults();
    const added: Operation[] = ["fraction"];
    if (x.version <= 4) added.push("percent");
    if (x.version <= 3) added.push("power", "root");
    const newModules = Object.fromEntries(
      added.map((op) => [op, initial.modules[op]]),
    );
    const newCounts = Object.fromEntries(added.map((op) => [op, 0]));
    const newStats = Object.fromEntries(
      added.map((op) => [
        op,
        { solved: 0, skipped: 0, corrections: 0, clean: 0 },
      ]),
    );
    x = {
      ...x,
      modules: isRecord(x.modules)
        ? {
            ...x.modules,
            ...newModules,
          }
        : x.modules,
      history: Array.isArray(x.history)
        ? x.history.map((day: unknown) =>
            isRecord(day)
              ? {
                  ...day,
                  modules: isRecord(day.modules)
                    ? { ...day.modules, ...newCounts }
                    : day.modules,
                  details: isRecord(day.details)
                    ? {
                        ...day.details,
                        ...newStats,
                      }
                    : day.details,
                }
              : day,
          )
        : x.history,
    };
  }
  if (
    !isRecord(x) ||
    (x.version !== 1 &&
      x.version !== 2 &&
      x.version !== 3 &&
      x.version !== 4 &&
      x.version !== 5 &&
      x.version !== 6 &&
      x.version !== 7 &&
      x.version !== 8 &&
      x.version !== 9 &&
      x.version !== 10 &&
      x.version !== CURRENT_PROGRESS_VERSION)
  )
    throw new SavedDataError("Nieobsługiwany format danych.");
  if (!isOperationRecord(x.modules, isOperationProgress))
    throw new SavedDataError("Niepoprawne ustawienia działań.");
  const modules = x.modules;
  if (!operations.some((op) => modules[op].enabled))
    throw new SavedDataError("Włącz co najmniej jedno działanie.");
  if (!isList(x.history, isSavedDay))
    throw new SavedDataError("Niepoprawna historia treningu.");
  if (new Set(x.history.map((d) => d.date)).size !== x.history.length)
    throw new SavedDataError("Powtórzone dni w historii.");
  if (!x.history.every(hasConsistentDailyTotals))
    throw new SavedDataError("Szczegóły historii nie zgadzają się z sumami.");
  if (x.version === 1)
    return { version: 1, modules: x.modules, history: x.history };
  const matches = x.version < 8 ? defaults().matches : x.matches;
  if (
    !isOperationProgress(matches) ||
    matches.level > 2 ||
    !("history" in matches) ||
    !isList(matches.history, isMatchDay)
  )
    throw new SavedDataError("Niepoprawny postęp zapałek.");
  const missingNumber = x.version >= 10 ? x.missingNumber : false;
  const negativeNumbers = x.version >= 6 ? x.negativeNumbers : false;
  if (
    typeof missingNumber !== "boolean" ||
    typeof negativeNumbers !== "boolean" ||
    !isNonNegativeInteger(x.revision) ||
    typeof x.showSolution !== "boolean" ||
    (x.theme !== undefined &&
      x.theme !== "system" &&
      x.theme !== "light" &&
      x.theme !== "dark") ||
    !isList(x.changes, isLevelChange)
  )
    throw new SavedDataError("Niepoprawne dane postępu.");
  const log = x.version >= 11 ? x.logarithms : defaults().logarithms;
  const set =
    isRecord(log) && LOG_SETS.find((option) => option.value === log.set)?.value;
  if (
    !set ||
    !isRecord(log) ||
    typeof log.enabled !== "boolean" ||
    !isNonNegativeInteger(log.solved) ||
    !isNonNegativeInteger(log.skipped)
  )
    throw new SavedDataError("Niepoprawny postęp logarytmów.");
  const viete = x.version >= 9 ? x.viete : defaults().viete;
  if (
    !isRecord(viete) ||
    typeof viete.enabled !== "boolean" ||
    !isNonNegativeInteger(viete.solved) ||
    !isNonNegativeInteger(viete.skipped)
  )
    throw new SavedDataError("Niepoprawny postęp gry Wzory Viète’a.");
  return {
    logarithms: {
      set,
      enabled: log.enabled,
      solved: log.solved,
      skipped: log.skipped,
    },
    viete: {
      enabled: viete.enabled,
      solved: viete.solved,
      skipped: viete.skipped,
    },
    version: x.version,
    revision: x.revision,
    modules: x.modules,
    history: x.history,
    matches: { ...matches, history: matches.history },
    missingNumber,
    negativeNumbers,
    showSolution: x.showSolution,
    theme: x.theme ?? "system",
    changes: x.changes,
  };
}
export function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new SavedDataError(
      "Plik nie zawiera poprawnego JSON. Wybierz kopię wyeksportowaną z Rachmistrza.",
    );
  }
}

function hasConsistentDailyTotals(d: Day): boolean {
  const details = d.details;
  if (!details) return true;
  const totals = operations.reduce(
    (s, op) => {
      const v = details[op];
      return {
        solved: s.solved + v.solved,
        skipped: s.skipped + v.skipped,
        corrections: s.corrections + v.corrections,
      };
    },
    { solved: 0, skipped: 0, corrections: 0 },
  );
  return (
    totals.solved <= d.solved &&
    totals.skipped <= d.skipped &&
    totals.corrections <= d.corrections &&
    operations.every(
      (op) => details[op].solved + details[op].skipped <= d.modules[op],
    )
  );
}
