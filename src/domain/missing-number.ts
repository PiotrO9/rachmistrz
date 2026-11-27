import { MISSING_NUMBER_SHARE } from "./config";
import type { Task, MissingNumberTask } from "./types";
import type { Solution } from "./solutions/types";

export function withMissingOperand(
  task: Task,
  random: () => number,
  force = false,
): Task {
  const { operation, a, b, answer } = task;
  if (
    operation !== "add" &&
    operation !== "subtract" &&
    operation !== "multiply" &&
    operation !== "divide"
  )
    return task;
  if (!force && random() >= MISSING_NUMBER_SHARE) return task;
  const allowA = operation !== "multiply" || b !== 0;
  const allowB =
    (operation !== "multiply" || a !== 0) &&
    (operation !== "divide" || answer !== 0);
  if (!allowA && !allowB) return task;
  const missingOperand = allowA && (!allowB || random() < 0.5) ? "a" : "b";
  return { ...task, operation, missingOperand };
}

export const expectedAnswer = (task: Task) =>
  task.missingOperand ? task[task.missingOperand] : task.answer;

export function explainMissingNumber(task: MissingNumberTask): Solution {
  const { operation, a, b, answer, missingOperand } = task;
  const left = missingOperand === "a";
  const known = left ? b : a;
  const expr = {
    add: `${answer} − ${known}`,
    subtract: left ? `${answer} + ${b}` : `${a} − ${answer}`,
    multiply: `${answer} ÷ ${known}`,
    divide: left ? `${answer} × ${b}` : `${a} ÷ ${answer}`,
  }[operation];
  return {
    explanation:
      "Oblicz brakującą liczbę, korzystając ze znanych liczb w równaniu.",
    steps: [`${expr} = ${expectedAnswer(task)}`],
  };
}
