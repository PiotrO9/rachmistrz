import type { Task } from "../types";
import type { Solution } from "./types";
export function explainMultiplication({ a, b, answer }: Task): Solution {
  const rounded = Math.round(a / 10) * 10;
  if (rounded > 0 && rounded !== a && Math.abs(rounded - a) <= 2) {
    const difference = Math.abs(rounded - a);
    return {
      explanation:
        "Zaokrąglij pierwszy czynnik do dziesiątki, a potem skoryguj wynik.",
      steps: [
        `${rounded} × ${b} = ${rounded * b}`,
        `${difference} × ${b} = ${difference * b}`,
        `${rounded * b} ${rounded > a ? "−" : "+"} ${difference * b} = ${answer}`,
      ],
    };
  }
  const tens = Math.floor(a / 10) * 10;
  const units = a % 10;
  if (tens && !units) {
    return {
      explanation:
        "Pomnóż bez końcowego zera, a następnie pomnóż wynik przez 10.",
      steps: [
        `${a / 10} × ${b} = ${(a / 10) * b}`,
        `${(a / 10) * b} × 10 = ${answer}`,
      ],
    };
  }
  return {
    explanation:
      tens && units
        ? "Pomnóż osobno dziesiątki i jedności, potem dodaj wyniki."
        : "Mnożenie możesz zapisać jako sumę równych składników.",
    steps:
      tens && units
        ? [
            `${tens} × ${b} = ${tens * b}`,
            `${units} × ${b} = ${units * b}`,
            `${tens * b} + ${units * b} = ${answer}`,
          ]
        : [
            `${Array.from({ length: Math.min(a, b) }, () => Math.max(a, b)).join(" + ")} = ${answer}`,
          ],
  };
}
