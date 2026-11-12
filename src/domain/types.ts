export const operations = ["add", "subtract", "multiply", "divide"] as const;
export type Operation = (typeof operations)[number];
export type Level = 1 | 2 | 3 | 4 | 5;
export type Theme = "system" | "light" | "dark";
export interface Task {
  materialLevel?: Level;
  familyId?: string;
  operation: Operation;
  a: number;
  b: number;
  answer: number;
  level?: Level;
  epoch?: number;
}
export interface Outcome {
  corrections: number;
  skipped: boolean;
}
export interface OperationProgress {
  enabled: boolean;
  level: Level;
  adaptive: boolean;
  block: Outcome[];
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
export const CURRENT_PROGRESS_VERSION = 3 as const;
export interface SavedProgress {
  version: typeof CURRENT_PROGRESS_VERSION;
  revision: number;
  showSolution: boolean;
  theme?: Theme;
  changes: LevelChange[];
  modules: Record<Operation, OperationProgress>;
  history: Day[];
}
