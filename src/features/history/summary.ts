import { operations, type Day, type Operation, type Stats } from "../../domain";
export type HistoryFilter = Operation | "all";
export function summarizeDay(day: Day, operation: HistoryFilter) {
  const details = day.details;
  const entries = details
    ? (operation === "all" ? operations : [operation]).map((op) => details[op])
    : [];
  const total = entries.reduce<Stats>(
    (sum, entry) => ({
      solved: sum.solved + entry.solved,
      skipped: sum.skipped + entry.skipped,
      clean: sum.clean + entry.clean,
      corrections: sum.corrections + entry.corrections,
    }),
    { solved: 0, skipped: 0, clean: 0, corrections: 0 },
  );
  const counts = operation === "all" ? day : details ? total : undefined;
  return {
    solved: counts?.solved,
    skipped: counts?.skipped,
    corrections: counts?.corrections,
    cleanPercentage: percentage(total.clean, total.solved),
    skippedPercentage: counts
      ? percentage(counts.skipped, counts.solved + counts.skipped)
      : "—",
  };
}
const percentage = (value: number, total: number) =>
  total ? Math.round((value / total) * 100) + "%" : "—";
