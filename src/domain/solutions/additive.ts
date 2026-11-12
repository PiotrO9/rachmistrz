import type { Task } from "../types";
import type { Solution } from "./types";
export function explainAddition(task: Task): Solution {
  return explainPlaceValues(task, "+");
}
export function explainSubtraction(task: Task): Solution {
  return explainPlaceValues(task, "−");
}
function explainPlaceValues({ a, b, answer }: Task, sign: "+" | "−"): Solution {
  const parts = String(b)
    .split("")
    .map((digit, i, digits) => Number(digit) * 10 ** (digits.length - i - 1))
    .filter((part) => part > 0);
  let value = a;
  return {
    explanation: "Rozbij drugą liczbę na części i licz po kolei.",
    steps: parts.length
      ? parts.map((part) => {
          const next = sign === "+" ? value + part : value - part;
          const step = `${value} ${sign} ${part} = ${next}`;
          value = next;
          return step;
        })
      : [`${a} ${sign} 0 = ${answer}`],
  };
}
