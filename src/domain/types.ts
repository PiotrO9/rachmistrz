export const operations = [
  "add",
  "subtract",
  "multiply",
  "divide",
  "power",
  "root",
  "percent",
  "fraction",
  "polynomial",
] as const;
export type Operation = (typeof operations)[number];
export type Level = 1 | 2 | 3 | 4 | 5;
export type Theme = "system" | "light" | "dark";
interface TaskValues {
  signedInput?: boolean;
  materialLevel?: Level;
  familyId?: string;
  a: number;
  b: number;
  answer: number;
  level?: Level;
  epoch?: number;
}
export type FractionTask = TaskValues & {
  operation: "fraction";
  operator: "+" | "−" | "×" | "÷";
  // a, b and answer hold the numerators for these denominators.
  denominatorA: number;
  denominatorB: number;
  answerDenominator: number;
};
// a is the root of the divisor, b is the constant term.
export type PolynomialTask = TaskValues & {
  operation: "polynomial";
  coefficients: number[]; // Descending powers, excluding the constant term.
};
export type BasicOperation = "add" | "subtract" | "multiply" | "divide";
export type MissingNumberTask = TaskValues & {
  operation: BasicOperation;
  missingOperand: "a" | "b";
};
export type Task =
  | MissingNumberTask
  | ((
      | FractionTask
      | PolynomialTask
      | (TaskValues & {
          operation: Exclude<Operation, "fraction" | "polynomial">;
        })
    ) & { missingOperand?: never });
export interface Outcome {
  corrections: number;
  skipped: boolean;
}
export interface OperationProgress {
  enabled: boolean;
  level: Level;
  adaptive: boolean;
  block: Outcome[];
  materialResults?: (boolean | "carry")[];
  checkFirstPromotion?: boolean;
  startPhase?: "opening" | "confirm";
  trend?: number;
  epoch?: number;
}
export interface Stats {
  solved: number;
  skipped: number;
  corrections: number;
  clean: number;
}
export interface LevelChange {
  date: string;
  operation: Operation;
  from: Level;
  to: Level;
  reason: "manual" | "up" | "down";
}
export interface Day {
  date: string;
  solved: number;
  skipped: number;
  corrections: number;
  modules: Record<Operation, number>;
  details?: Record<Operation, Stats>;
}
export const CURRENT_PROGRESS_VERSION = 16 as const;
export interface SavedProgress {
  sessionPresets: import("./session").SessionPreset[];
  version: typeof CURRENT_PROGRESS_VERSION;
  revision: number;
  matches: OperationProgress & {
    history: { date: string; clean: number; helped: number; skipped: number }[];
  };
  missingNumber: boolean;
  negativeNumbers: boolean;
  logarithms: {
    enabled: boolean;
    set: import("./config").LogSet;
    solved: number;
    skipped: number;
  };
  viete: { enabled: boolean; solved: number; skipped: number };
  showSolution: boolean;
  theme?: Theme;
  changes: LevelChange[];
  modules: Record<Operation, OperationProgress>;
  history: Day[];
}
