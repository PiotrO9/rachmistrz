import { operations, type Task } from "../domain";
import { validPreset } from "../domain/session";
import { isOperationProgress } from "./schema";
import type { Command, Exercise, TrainingState } from "../training/engine";

export interface QuickDraft {
  regular: Exercise;
  quick: NonNullable<TrainingState["quick"]>;
  pending?: { key: string; command: Extract<Command, { type: "complete" }> };
}
export interface QuickResume {
  load(): QuickDraft | undefined;
  save(state: TrainingState, pending?: QuickDraft["pending"]): void;
  hasReceipt(key: string): Promise<boolean>;
  forgetReceipt(key: string): Promise<void>;
}
const key = "rachmistrz:quick-session:v1";
const count = (value: unknown) =>
  Number.isSafeInteger(value) && Number(value) >= 0;
function validTask(task: Task | undefined) {
  return (
    !!task &&
    operations.includes(task.operation) &&
    [task.a, task.b, task.answer].every(Number.isSafeInteger) &&
    (task.operation !== "polynomial" ||
      (Array.isArray(task.coefficients) &&
        task.coefficients.every(Number.isSafeInteger))) &&
    (task.operation !== "fraction" ||
      ([task.denominatorA, task.denominatorB, task.answerDenominator].every(
        (d) => count(d) && d > 0,
      ) &&
        ["+", "−", "×", "÷"].includes(task.operator)))
  );
}
function validExercise(exercise?: Exercise) {
  return (
    !!exercise &&
    validTask(exercise.task) &&
    typeof exercise.input === "string" &&
    (exercise.announcement === undefined ||
      typeof exercise.announcement === "string") &&
    (exercise.revealed === undefined ||
      typeof exercise.revealed === "boolean") &&
    typeof exercise.editing === "boolean" &&
    count(exercise.corrections) &&
    count(exercise.sequence)
  );
}
export function loadQuickDraft(): QuickDraft | undefined {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(key);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const draft = JSON.parse(raw) as QuickDraft;
    const q = draft.quick;
    if (
      validExercise(draft.regular) &&
      validExercise(q.exercise) &&
      validPreset({ ...q.config, name: "Sesja" }) &&
      operations.every((op) => isOperationProgress(q.modules[op])) &&
      count(q.solved) &&
      count(q.skipped) &&
      typeof q.finished === "boolean" &&
      (!draft.pending ||
        (typeof draft.pending.key === "string" &&
          draft.pending.command.type === "complete" &&
          draft.pending.command.quick === true &&
          validTask(draft.pending.command.task) &&
          count(draft.pending.command.outcome.corrections) &&
          typeof draft.pending.command.outcome.skipped === "boolean"))
    )
      return draft;
  } catch {
    // An unreadable tab draft must not prevent access to saved history.
  }
  sessionStorage.removeItem(key);
}
export function saveQuickDraft(
  state: TrainingState,
  pending?: QuickDraft["pending"],
) {
  if (!state.quick) {
    sessionStorage.removeItem(key);
    return;
  }
  const {
    task,
    input,
    corrections,
    editing,
    sequence,
    revealed,
    announcement,
    quick,
  } = state;
  const regular = {
    task,
    input,
    corrections,
    editing,
    sequence,
    revealed,
    announcement,
  };
  sessionStorage.setItem(
    key,
    JSON.stringify({ regular, quick, pending } satisfies QuickDraft),
  );
}
