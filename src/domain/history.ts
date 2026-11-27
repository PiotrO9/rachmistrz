import { HISTORY_LIMITS } from "./config";
import {
  operations,
  type SavedProgress,
  type Operation,
  type Outcome,
  type Task,
  type Day,
  type Stats,
} from "./types";
import { adapt } from "./adaptation";
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function record(
  saved: SavedProgress,
  operation: Operation,
  outcome: Outcome,
  date = localDate(),
  task?: Task,
): SavedProgress {
  const history: Day[] = saved.history.slice();
  const index = history.findIndex((x) => x.date === date);
  let day: Day | undefined =
    index < 0
      ? undefined
      : {
          ...history[index],
          modules: { ...history[index].modules },
          details: history[index].details
            ? structuredClone(history[index].details)
            : undefined,
        };
  if (day) history[index] = day;
  if (!day) {
    day = {
      date,
      solved: 0,
      skipped: 0,
      corrections: 0,
      modules: {
        add: 0,
        subtract: 0,
        multiply: 0,
        divide: 0,
        power: 0,
        root: 0,
        percent: 0,
        fraction: 0,
        polynomial: 0,
      },
    };
    history.unshift(day);
  }
  if (outcome.skipped) day.skipped++;
  else day.solved++;
  day.corrections += outcome.corrections;
  day.modules[operation]++;
  day.details ??= Object.fromEntries(
    operations.map((op) => [
      op,
      { solved: 0, skipped: 0, corrections: 0, clean: 0 },
    ]),
  ) as Record<Operation, Stats>;
  const detail = day.details[operation];
  if (outcome.skipped) detail.skipped++;
  else {
    detail.solved++;
    if (outcome.corrections === 0) detail.clean++;
  }
  detail.corrections += outcome.corrections;
  const current = saved.modules[operation];
  // A task started before a manual setting change must not train the new level's model.
  const compatible =
    current.enabled &&
    (!task || task.level === undefined || task.level === current.level) &&
    (!task || (task.epoch ?? 0) === (current.epoch ?? 0));
  const adapted = compatible ? adapt(current, outcome) : current;
  const changes =
    adapted.level === current.level
      ? saved.changes
      : [
          ...saved.changes,
          {
            date,
            operation,
            from: current.level,
            to: adapted.level,
            reason:
              adapted.level > current.level
                ? ("up" as const)
                : ("down" as const),
          },
        ].slice(-HISTORY_LIMITS.levelChanges);
  return {
    ...saved,
    modules: {
      ...saved.modules,
      [operation]: adapted,
    },
    changes,
    history: history
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, HISTORY_LIMITS.days),
  };
}
