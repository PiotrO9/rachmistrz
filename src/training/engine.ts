import { HISTORY_LIMITS } from "../domain/config";
import {
  defaults,
  correction,
  nextTask,
  record,
  localDate,
  operations,
  type SavedProgress,
  type Task,
  type Operation,
  type Level,
  type Theme,
  type Outcome,
} from "../domain";

export interface TrainingState {
  saved: SavedProgress;
  task: Task;
  input: string;
  corrections: number;
  editing: boolean;
  sequence: number;
  revealed?: boolean;
  announcement?: string;
}
export type SettingsAction =
  | { type: "preset"; active: Operation[] }
  | { type: "solution"; enabled: boolean }
  | { type: "theme"; theme: Theme }
  | { type: "import"; saved: SavedProgress }
  | {
      type: "module";
      op: Operation;
      change: Partial<{ enabled: boolean; level: Level; adaptive: boolean }>;
    };
export type Action =
  | SettingsAction
  | { type: "input"; value: string; inputType: string }
  | { type: "skip" }
  | { type: "continue" };
export interface Environment {
  random: () => number;
  date: () => string;
}
export const environment: Environment = {
  random: Math.random,
  date: localDate,
};
export type Command =
  | { type: "complete"; task: Task; outcome: Outcome; date: string }
  | { type: "configure"; action: SettingsAction; date: string };
export type Transition =
  | { kind: "local"; state: TrainingState }
  | { kind: "commit"; preview: TrainingState; command: Command };

export function createState(
  saved = defaults(),
  env = environment,
): TrainingState {
  return {
    saved,
    task: nextTask(saved.modules, undefined, env.random),
    input: "",
    corrections: 0,
    editing: false,
    sequence: 0,
  };
}
export function configure(
  saved: SavedProgress,
  action: SettingsAction,
  date: string,
): SavedProgress {
  if (action.type === "import") return importProgress(saved, action.saved);
  if (action.type === "solution")
    return { ...saved, showSolution: action.enabled };
  if (action.type === "theme") return { ...saved, theme: action.theme };
  return configureOperations(saved, action, date);
}

function configureOperations(
  saved: SavedProgress,
  action: Extract<SettingsAction, { type: "module" | "preset" }>,
  date: string,
): SavedProgress {
  const modules = { ...saved.modules };
  let changes = saved.changes;
  if (action.type === "preset") {
    for (const op of operations)
      modules[op] = { ...modules[op], enabled: action.active.includes(op) };
  } else {
    const old = modules[action.op];
    modules[action.op] = { ...old, ...action.change };
    if (
      action.change.level !== undefined ||
      action.change.adaptive !== undefined
    )
      modules[action.op] = {
        ...modules[action.op],
        block: [],
        trend: 0,
        epoch: (old.epoch ?? 0) + 1,
      };
    if (action.change.level !== undefined && action.change.level !== old.level)
      changes = [
        ...changes,
        {
          date,
          operation: action.op,
          from: old.level,
          to: action.change.level,
          reason: "manual",
        } as const,
      ].slice(-HISTORY_LIMITS.levelChanges);
  }
  return operations.some((op) => modules[op].enabled)
    ? { ...saved, modules, changes }
    : saved;
}
export function reconcile(
  state: TrainingState,
  saved: SavedProgress,
  options: { task: "preserve" | "replace" } = { task: "preserve" },
  env = environment,
): TrainingState {
  if (
    options.task === "preserve" &&
    saved.modules[state.task.operation].enabled
  )
    return { ...state, saved };
  return {
    ...state,
    saved,
    task: nextTask(saved.modules, state.task, env.random),
    input: "",
    corrections: 0,
    editing: false,
    revealed: false,
    sequence: state.sequence + 1,
  };
}
// Interpret input once. Neither persistence nor random task generation runs here on completion.
export function interpret(
  state: TrainingState,
  action: Action,
  env = environment,
): Transition {
  if (action.type === "continue" || (action.type === "skip" && state.revealed))
    return {
      kind: "local",
      state: state.revealed
        ? reconcile(state, state.saved, { task: "replace" }, env)
        : state,
    };
  if (action.type === "input") {
    if (state.revealed || !/^\d{0,9}$/.test(action.value))
      return { kind: "local", state };
    const change = correction(
      state.input,
      action.value,
      state.editing,
      action.inputType,
    );
    const preview = {
      ...state,
      input: action.value,
      corrections: state.corrections + change.increment,
      editing: change.editing,
    };
    if (action.value !== "" && Number(action.value) === state.task.answer)
      return {
        kind: "commit",
        preview,
        command: {
          type: "complete",
          task: state.task,
          outcome: { skipped: false, corrections: preview.corrections },
          date: env.date(),
        },
      };
    return { kind: "local", state: preview };
  }
  if (action.type === "skip")
    return {
      kind: "commit",
      preview: state,
      command: {
        type: "complete",
        task: state.task,
        outcome: { skipped: true, corrections: state.corrections },
        date: env.date(),
      },
    };
  return {
    kind: "commit",
    preview: state,
    command: { type: "configure", action, date: env.date() },
  };
}
export function applyCommand(
  latest: SavedProgress,
  command: Command,
): SavedProgress {
  return command.type === "complete"
    ? record(
        latest,
        command.task.operation,
        command.outcome,
        command.date,
        command.task,
      )
    : configure(latest, command.action, command.date);
}
export function settle(
  preview: TrainingState,
  saved: SavedProgress,
  command: Command,
  env = environment,
): TrainingState {
  if (command.type === "configure")
    return reconcile(
      preview,
      saved,
      { task: command.action.type === "import" ? "replace" : "preserve" },
      env,
    );
  if (command.outcome.skipped && saved.showSolution)
    return {
      ...preview,
      saved,
      revealed: true,
      input: String(command.task.answer),
      announcement: `Pominięto. Poprawny wynik: ${command.task.answer}.`,
    };
  return {
    ...reconcile(preview, saved, { task: "replace" }, env),
    announcement: command.outcome.skipped
      ? "Pominięto zadanie."
      : "Poprawna odpowiedź.",
  };
}
// Pure adapter retained for domain tests; the runtime uses these same transitions and commands.
export function reducer(
  state: TrainingState,
  action: Action,
  env = environment,
): TrainingState {
  const transition = interpret(state, action, env);
  return transition.kind === "local"
    ? transition.state
    : settle(
        transition.preview,
        applyCommand(state.saved, transition.command),
        transition.command,
        env,
      );
}

function importProgress(
  saved: SavedProgress,
  imported: SavedProgress,
): SavedProgress {
  const modules = { ...imported.modules };
  for (const op of operations)
    modules[op] = {
      ...modules[op],
      epoch: Math.max(saved.modules[op].epoch ?? 0, modules[op].epoch ?? 0) + 1,
    };
  return { ...imported, modules, revision: saved.revision };
}
