import type { Task, Operation } from "./types";
import type { Solution } from "./solutions/types";
import { explainAddition, explainSubtraction } from "./solutions/additive";
import { explainDivision } from "./solutions/division";
import { explainMultiplication } from "./solutions/multiplication";
export type { Solution } from "./solutions/types";
const strategies: Record<Operation, (task: Task) => Solution> = {
  add: explainAddition,
  subtract: explainSubtraction,
  multiply: explainMultiplication,
  divide: explainDivision,
};
export function explainSolution(task: Task): Solution {
  return strategies[task.operation](task);
}
