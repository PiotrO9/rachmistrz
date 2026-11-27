import type { LogSet } from "./config";

export type LogTask = { base: number; left: number; answer: number } & (
  { kind: "basic" } | { kind: "sum" | "difference" | "quotient"; right: number }
);

// Construct finite pools from exact powers. Sampling skips the previous task without retries.
function buildPools() {
  const pools: Record<LogSet, LogTask[]> = { basic: [], combine: [], base: [] };
  for (const base of [2, 3, 4, 5, 6, 10]) {
    for (let answer = 0; base ** answer <= 125; answer++) {
      const power = base ** answer;
      pools.basic.push({ kind: "basic", base, left: power, answer });
      for (let factor = 2; factor <= 6; factor++) {
        if (power > 1 && power * factor <= 200)
          pools.combine.push({
            kind: "difference",
            base,
            left: power * factor,
            right: factor,
            answer,
          });
        if (power % factor === 0 && power / factor >= factor)
          pools.combine.push({
            kind: "sum",
            base,
            left: power / factor,
            right: factor,
            answer,
          });
        if (factor !== base && answer >= 2 && factor ** answer <= 125)
          pools.base.push({
            kind: "quotient",
            base,
            left: factor ** answer,
            right: factor,
            answer,
          });
      }
    }
  }
  return pools;
}
const pools = buildPools();
export function nextLog(set: LogSet, random: () => number, previous?: LogTask) {
  const pool = pools[set];
  const last = previous ? pool.indexOf(previous) : -1;
  const index = Math.floor(random() * (pool.length - Number(last >= 0)));
  return pool[last >= 0 && index >= last ? index + 1 : index];
}
export function logHint(task: LogTask) {
  const { base, left, answer } = task;
  if (task.kind === "basic") return `${base}^${answer} = ${left}`;
  if (task.kind === "quotient")
    return `Po zmianie podstawy szukasz wykładnika: ${task.right}^${answer} = ${left}.`;
  const sum = task.kind === "sum";
  const power = sum ? left * task.right : left / task.right;
  return `${left} ${sum ? "×" : "÷"} ${task.right} = ${power}, czyli ${base}^${answer} = ${power}.`;
}
