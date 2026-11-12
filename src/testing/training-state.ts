import { defaults, type Task } from "../domain";
import type { TrainingState } from "../training/engine";
export function createTestTrainingState(
  task: Task,
  overrides: Partial<TrainingState> = {},
): TrainingState {
  return {
    saved: defaults(),
    task,
    input: "",
    corrections: 0,
    editing: false,
    sequence: 0,
    ...overrides,
  };
}
