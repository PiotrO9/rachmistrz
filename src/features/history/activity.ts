import { localDate, operations, type Day } from "../../domain";

export type ActivityPeriod = 1 | 7 | 30;

export function recentActivity(
  history: Day[],
  period: ActivityPeriod,
  today = new Date(),
) {
  const byDate = new Map(history.map((day) => [day.date, day]));
  const dates = Array.from({ length: period }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - period + 1 + i);
    return localDate(date);
  });
  const rows = operations.map((operation) => {
    let solved = 0,
      attempts = 0,
      clean = 0;
    const days = dates.map((date) => {
      const stats = byDate.get(date)?.details?.[operation];
      if (!stats) return null;
      const count = stats.solved + stats.skipped;
      solved += stats.solved;
      attempts += count;
      clean += stats.clean;
      return count
        ? { date, clean: stats.clean, count, rate: stats.clean / count }
        : null;
    });
    return {
      operation,
      solved,
      attempts,
      clean,
      rate: attempts ? clean / attempts : 0,
      days,
    };
  });
  return { dates, rows };
}
export type ActivityRow = ReturnType<typeof recentActivity>["rows"][number];
