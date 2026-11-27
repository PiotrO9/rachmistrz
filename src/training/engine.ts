import { nextLog, type LogTask } from "../domain/logarithms";
import type { LogSet } from "../domain/config";
import { expectedAnswer } from "../domain/missing-number";
import { adapt } from "../domain/adaptation";
import { formatAnswer, matchesFraction } from "../domain/fractions";
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

import {
  sessionModule,
  sessionTask,
  type SessionConfig,
  type SessionPreset,
} from "../domain/session";

type Exercise = Pick<
  TrainingState,
  | "task"
  | "input"
  | "editing"
  | "corrections"
  | "sequence"
  | "revealed"
  | "announcement"
>;
interface QuickSession {
  config: SessionConfig;
  modules: SavedProgress["modules"];
  exercise: Exercise;
  solved: number;
  skipped: number;
  finished: boolean;
}
export interface TrainingState {
  quick?: QuickSession;
  saved: SavedProgress;
  task: Task;
  input: string;
  corrections: number;
  editing: boolean;
  sequence: number;
  settledMatch?: string;
  logPractice?: { task: LogTask; input: string; revealed: boolean };
  vieteSequence?: number;
  revealed?: boolean;
  announcement?: string;
}
export type SettingsAction =
  | { type: "saveSessionPreset"; preset: SessionPreset }
  | { type: "matches"; enabled: boolean }
  | { type: "matchResult"; id: string; epoch: number; outcome: Outcome }
  | { type: "preset"; active: Operation[] }
  | { type: "missingNumber"; enabled: boolean }
  | { type: "negativeNumbers"; enabled: boolean }
  | { type: "solution"; enabled: boolean }
  | { type: "logEnabled"; enabled: boolean }
  | { type: "logSet"; set: LogSet }
  | { type: "viete"; enabled: boolean }
  | { type: "vieteResult"; skipped: boolean }
  | { type: "theme"; theme: Theme }
  | { type: "import"; saved: SavedProgress }
  | {
      type: "module";
      op: Operation;
      change: Partial<{ enabled: boolean; level: Level; adaptive: boolean }>;
    };
export type Action =
  | SettingsAction
  | { type: "startQuick"; config: SessionConfig }
  | { type: "endQuick" }
  | { type: "exitQuick" }
  | { type: "quickSkip" }
  | { type: "quickInput"; value: string; inputType: string }
  | { type: "logInput"; value: string }
  | { type: "logStart" }
  | { type: "logSkip" }
  | { type: "logContinue" }
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
  | { type: "logResult"; skipped: boolean }
  | {
      type: "complete";
      quick?: boolean;
      task: Task;
      outcome: Outcome;
      date: string;
    }
  | { type: "configure"; action: SettingsAction; date: string };
export type Transition =
  | { kind: "local"; state: TrainingState }
  | { kind: "commit"; preview: TrainingState; command: Command };

function newLog(saved: SavedProgress, env: Environment, previous?: LogTask) {
  return {
    task: nextLog(saved.logarithms.set, env.random, previous),
    input: "",
    revealed: false,
  };
}
export function createState(
  saved = defaults(),
  env = environment,
): TrainingState {
  return {
    saved,
    task: nextTask(
      saved.modules,
      undefined,
      env.random,
      saved.negativeNumbers,
      saved.missingNumber,
    ),
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
  if (action.type === "saveSessionPreset") {
    const existing = new Set(saved.sessionPresets.map((p) => p.name));
    let name = action.preset.name;
    for (let suffix = 2; existing.has(name); suffix++)
      name = action.preset.name + " (" + suffix + ")";
    return {
      ...saved,
      sessionPresets: [...saved.sessionPresets, { ...action.preset, name }],
    };
  }
  if (action.type === "import") return importProgress(saved, action.saved);
  if (action.type === "matches")
    return { ...saved, matches: { ...saved.matches, enabled: action.enabled } };
  if (action.type === "matchResult") {
    const current = saved.matches;
    const day = {
      ...(current.history.find((d) => d.date === date) ?? {
        date,
        clean: 0,
        helped: 0,
        skipped: 0,
      }),
    };
    day[
      action.outcome.skipped
        ? "skipped"
        : action.outcome.corrections
          ? "helped"
          : "clean"
    ]++;
    const history = [day, ...current.history.filter((d) => d.date !== date)]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, HISTORY_LIMITS.days);
    const progress =
      (current.epoch ?? 0) === action.epoch
        ? adapt(current, action.outcome, 2)
        : current;
    return { ...saved, matches: { ...progress, history } };
  }
  if (action.type === "missingNumber")
    return { ...saved, missingNumber: action.enabled };
  if (action.type === "negativeNumbers")
    return { ...saved, negativeNumbers: action.enabled };
  if (action.type === "logEnabled")
    return {
      ...saved,
      logarithms: { ...saved.logarithms, enabled: action.enabled },
    };
  if (action.type === "logSet")
    return { ...saved, logarithms: { ...saved.logarithms, set: action.set } };
  if (action.type === "viete")
    return { ...saved, viete: { ...saved.viete, enabled: action.enabled } };
  if (action.type === "vieteResult") {
    if (!saved.viete.enabled) return saved;
    const counter = action.skipped ? "skipped" : "solved";
    return {
      ...saved,
      viete: { ...saved.viete, [counter]: saved.viete[counter] + 1 },
    };
  }
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
        materialResults: undefined,
        checkFirstPromotion: undefined,
        startPhase: undefined,
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
  if (!saved.logarithms.enabled && state.logPractice)
    state = { ...state, logPractice: undefined };
  if (
    options.task === "preserve" &&
    saved.modules[state.task.operation].enabled
  )
    return { ...state, saved };
  return {
    ...state,
    saved,
    task: nextTask(
      saved.modules,
      state.task,
      env.random,
      saved.negativeNumbers,
      saved.missingNumber,
    ),
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
  if (action.type === "startQuick") {
    const modules = { ...state.saved.modules };
    for (const rule of action.config.rules)
      modules[rule.operation] = sessionModule(rule, state.saved);
    const task = sessionTask(action.config, modules, state.saved, env.random);
    return {
      kind: "local",
      state: {
        ...state,
        quick: {
          config: action.config,
          modules,
          exercise: {
            task,
            input: "",
            editing: false,
            corrections: 0,
            sequence: 0,
          },
          solved: 0,
          skipped: 0,
          finished: false,
        },
      },
    };
  }
  if (action.type === "exitQuick")
    return { kind: "local", state: { ...state, quick: undefined } };
  if (
    action.type === "endQuick" ||
    action.type === "quickInput" ||
    action.type === "quickSkip"
  ) {
    const q = state.quick;
    if (!q || q.finished) return { kind: "local", state };
    if (action.type === "endQuick")
      return {
        kind: "local",
        state: { ...state, quick: { ...q, finished: true } },
      };
    if (q.exercise.revealed && action.type === "quickSkip")
      return {
        kind: "local",
        state: { ...state, quick: advanceQuick(q, state.saved, env) },
      };
    return interpretExercise(state, action, env);
  }
  if (action.type === "logStart")
    return {
      kind: "local",
      state:
        state.saved.logarithms.enabled && !state.logPractice
          ? { ...state, logPractice: newLog(state.saved, env) }
          : state,
    };
  if (
    action.type === "logInput" ||
    action.type === "logSkip" ||
    action.type === "logContinue"
  ) {
    const practice = state.logPractice;
    if (!practice) return { kind: "local", state };
    if (practice.revealed)
      return {
        kind: "local",
        state:
          action.type === "logContinue"
            ? { ...state, logPractice: newLog(state.saved, env, practice.task) }
            : state,
      };
    if (action.type === "logContinue") return { kind: "local", state };
    if (action.type === "logSkip")
      return {
        kind: "commit",
        preview: state,
        command: { type: "logResult", skipped: true },
      };
    if (!/^\d{0,9}$/.test(action.value)) return { kind: "local", state };
    const preview = {
      ...state,
      logPractice: { ...practice, input: action.value },
    };
    return action.value !== "" && Number(action.value) === practice.task.answer
      ? {
          kind: "commit",
          preview,
          command: { type: "logResult", skipped: false },
        }
      : { kind: "local", state: preview };
  }
  if (action.type === "continue" || (action.type === "skip" && state.revealed))
    return {
      kind: "local",
      state: state.revealed
        ? reconcile(state, state.saved, { task: "replace" }, env)
        : state,
    };
  if (action.type === "input" || action.type === "skip")
    return interpretExercise(state, action, env);
  return {
    kind: "commit",
    preview: state,
    command: { type: "configure", action, date: env.date() },
  };
}
function interpretExercise(
  state: TrainingState,
  action: Extract<
    Action,
    { type: "input" | "quickInput" | "skip" | "quickSkip" }
  >,
  env: Environment,
): Transition {
  const quick =
    action.type === "quickInput" || action.type === "quickSkip"
      ? state.quick
      : undefined;
  const exercise = quick?.exercise ?? state;
  const task = exercise.task;
  let preview = state;
  let corrections = exercise.corrections;
  const skipped = action.type === "skip" || action.type === "quickSkip";
  if (!skipped) {
    const value = action.value.replace(/^−/, "-");
    const valid =
      task.operation === "fraction"
        ? /^(?:\d{1,9}(?:\/\d{0,9})?)?$/
        : task.signedInput
          ? /^-?\d{0,9}$/
          : /^\d{0,9}$/;
    if (exercise.revealed || !valid.test(value))
      return { kind: "local", state };
    const change = correction(
      exercise.input,
      value,
      exercise.editing,
      action.inputType,
    );
    corrections += change.increment;
    const edit = { input: value, corrections, editing: change.editing };
    preview = quick
      ? {
          ...state,
          quick: { ...quick, exercise: { ...quick.exercise, ...edit } },
        }
      : { ...state, ...edit };
    const solved =
      task.operation === "fraction"
        ? matchesFraction(value, task)
        : value !== "" && Number(value) === expectedAnswer(task);
    if (!solved) return { kind: "local", state: preview };
  }
  return {
    kind: "commit",
    preview,
    command: {
      type: "complete",
      ...(quick ? { quick: true } : {}),
      task,
      outcome: { skipped, corrections },
      date: env.date(),
    },
  };
}
export function applyCommand(
  latest: SavedProgress,
  command: Command,
): SavedProgress {
  if (command.type === "logResult") {
    if (!latest.logarithms.enabled) return latest;
    const counter = command.skipped ? "skipped" : "solved";
    return {
      ...latest,
      logarithms: {
        ...latest.logarithms,
        [counter]: latest.logarithms[counter] + 1,
      },
    };
  }
  return command.type === "complete"
    ? record(
        latest,
        command.task.operation,
        command.outcome,
        command.date,
        command.task,
        !command.quick,
      )
    : configure(latest, command.action, command.date);
}
function advanceQuick(
  q: QuickSession,
  saved: SavedProgress,
  env: Environment,
): QuickSession {
  return {
    ...q,
    exercise: {
      task: sessionTask(
        q.config,
        q.modules,
        saved,
        env.random,
        q.exercise.task,
      ),
      sequence: q.exercise.sequence + 1,
      input: "",
      editing: false,
      corrections: 0,
    },
  };
}
export function settle(
  preview: TrainingState,
  saved: SavedProgress,
  command: Command,
  env = environment,
): TrainingState {
  if (command.type === "complete" && command.quick && preview.quick) {
    const next = reconcile(preview, saved, { task: "preserve" }, env);
    const q = { ...preview.quick };
    const op = command.task.operation;
    q.modules = { ...q.modules, [op]: adapt(q.modules[op], command.outcome) };
    if (command.outcome.skipped) q.skipped++;
    else q.solved++;
    q.finished =
      q.solved + (q.config.goal === "tasks" ? q.skipped : 0) >= q.config.count;
    if (q.finished) return { ...next, quick: q };
    if (command.outcome.skipped && saved.showSolution) {
      q.exercise = {
        ...q.exercise,
        revealed: true,
        input: formatAnswer(command.task),
      };
      return { ...next, quick: q };
    }
    return { ...next, quick: advanceQuick(q, saved, env) };
  }
  if (command.type === "logResult") {
    const next = reconcile(preview, saved, { task: "preserve" }, env);
    if (!next.logPractice) return next;
    next.logPractice =
      command.skipped && saved.showSolution
        ? { ...next.logPractice, revealed: true }
        : newLog(saved, env, next.logPractice.task);
    return next;
  }
  if (command.type === "configure" && command.action.type === "matchResult")
    return { ...preview, saved, settledMatch: command.action.id };
  if (command.type === "configure" && command.action.type === "vieteResult")
    return {
      ...reconcile(preview, saved, { task: "preserve" }, env),
      vieteSequence: (preview.vieteSequence ?? 0) + 1,
    };
  if (command.type === "configure")
    return reconcile(
      command.action.type === "import"
        ? { ...preview, quick: undefined }
        : preview,
      saved,
      { task: command.action.type === "import" ? "replace" : "preserve" },
      env,
    );
  if (command.outcome.skipped && saved.showSolution)
    return {
      ...preview,
      saved,
      revealed: true,
      input: formatAnswer(command.task),
      announcement: command.task.missingOperand
        ? `Pominięto. Brakująca liczba to ${formatAnswer(command.task)}.`
        : `Pominięto. Poprawny wynik: ${formatAnswer(command.task)}.`,
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
  return {
    ...imported,
    matches: {
      ...imported.matches,
      epoch:
        Math.max(saved.matches.epoch ?? 0, imported.matches.epoch ?? 0) + 1,
    },
    modules,
    revision: saved.revision,
  };
}
