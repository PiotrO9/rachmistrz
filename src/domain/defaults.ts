import {
  CURRENT_PROGRESS_VERSION,
  type SavedProgress,
  type OperationProgress,
} from "./types";
export function defaults(): SavedProgress {
  const module = (): OperationProgress => ({
    enabled: true,
    level: 1,
    adaptive: true,
    block: [],
  });
  return {
    version: CURRENT_PROGRESS_VERSION,
    revision: 0,
    showSolution: false,
    theme: "system",
    changes: [],
    modules: {
      add: module(),
      subtract: module(),
      multiply: module(),
      divide: module(),
    },
    history: [],
  };
}
