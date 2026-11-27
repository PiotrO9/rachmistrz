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
    matches: { ...module(), enabled: false, history: [] },
    revision: 0,
    negativeNumbers: false,
    showSolution: false,
    theme: "system",
    changes: [],
    modules: {
      add: module(),
      subtract: module(),
      multiply: module(),
      divide: module(),
      power: { ...module(), enabled: false },
      root: { ...module(), enabled: false },
      percent: { ...module(), enabled: false },
      fraction: { ...module(), enabled: false },
    },
    history: [],
  };
}
