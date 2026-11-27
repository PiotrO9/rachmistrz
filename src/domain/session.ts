import {
  operations,
  type Operation,
  type Level,
  type SavedProgress,
  type OperationProgress,
  type Task,
} from "./types";
import { nextTask } from "./generators";

export interface SessionRule {
  operation: Operation;
  mode: "current" | "start" | "fixed";
  level: Level;
  form: "inherit" | "result" | "mixed" | "missing";
  negatives: "inherit" | "on" | "off";
  frequent: boolean;
}
export interface SessionConfig {
  rules: SessionRule[];
  goal: "tasks" | "solved";
  count: number;
}
export interface SessionPreset extends SessionConfig {
  name: string;
}
export const newRule = (operation: Operation): SessionRule => ({
  operation,
  mode: "current",
  level: 1,
  form: "inherit",
  negatives: "inherit",
  frequent: false,
});
export function validPreset(value: unknown): value is SessionPreset {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<SessionPreset>;
  return (
    typeof p.name === "string" &&
    !!p.name.trim() &&
    (p.goal === "tasks" || p.goal === "solved") &&
    Number.isSafeInteger(p.count) &&
    Number(p.count) > 0 &&
    Array.isArray(p.rules) &&
    p.rules.length > 0 &&
    p.rules.length <= operations.length &&
    p.rules.every(
      (r) =>
        r &&
        operations.includes(r.operation) &&
        ["current", "start", "fixed"].includes(r.mode) &&
        Number.isInteger(r.level) &&
        r.level >= 1 &&
        r.level <= 5 &&
        ["inherit", "result", "mixed", "missing"].includes(r.form) &&
        ["inherit", "on", "off"].includes(r.negatives) &&
        typeof r.frequent === "boolean",
    ) &&
    new Set(p.rules.map((r) => r.operation)).size === p.rules.length
  );
}
export function sessionModule(
  rule: SessionRule,
  saved: SavedProgress,
): OperationProgress {
  const level =
    rule.mode === "current" ? saved.modules[rule.operation].level : rule.level;
  return {
    enabled: true,
    adaptive: rule.mode !== "fixed",
    level,
    block: [],
    startPhase: level === 1 ? "opening" : undefined,
  };
}
export function sessionTask(
  config: SessionConfig,
  modules: SavedProgress["modules"],
  saved: SavedProgress,
  random: () => number,
  previous?: Task,
) {
  const pool = config.rules.flatMap((r) => (r.frequent ? [r, r] : [r]));
  const rule = pool[Math.floor(random() * pool.length)];
  return nextTask(
    modules,
    previous,
    random,
    rule.negatives === "inherit"
      ? saved.negativeNumbers
      : rule.negatives === "on",
    rule.form === "inherit"
      ? saved.missingNumber
      : rule.form === "mixed" || rule.form === "missing",
    {
      operation: rule.operation,
      fixed: rule.mode === "fixed",
      forceMissing: rule.form === "missing",
    },
  );
}
