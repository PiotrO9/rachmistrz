import { ADAPTATION } from "./config";
import { hasCarry } from "./generation/additive";
import type { OperationProgress, Task } from "./types";

export function demonstratesCarry(task: Task): boolean {
  return (
    task.operation === "add" &&
    task.materialLevel === 2 &&
    !task.missingOperand &&
    task.a >= 10 &&
    task.a <= 99 &&
    task.b >= 10 &&
    task.b <= 99 &&
    hasCarry(task.a, task.b)
  );
}

export function needsCarryTask(module: OperationProgress): boolean {
  if (!module.adaptive || module.level !== 2) return false;
  const results = module.materialResults ?? [];
  const streak = results.slice(results.lastIndexOf(false) + 1);
  const missing =
    ADAPTATION.requiredAdditionCarries -
    streak.filter((value) => value === "carry").length;
  return missing > 0 && ADAPTATION.levelTwoCleanRun - streak.length <= missing;
}
