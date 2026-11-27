import type { Task, Operation } from "./types";
import type { Solution } from "./solutions/types";
import { explainAddition, explainSubtraction } from "./solutions/additive";
import { explainDivision } from "./solutions/division";
import { explainMultiplication } from "./solutions/multiplication";
export type { Solution } from "./solutions/types";
const strategies: Record<Operation, (task: Task) => Solution> = {
  percent: ({ a, b, answer }) => ({
    explanation:
      "Procent to jedna setna. Pomnóż liczbę przez podaną stawkę procentową i podziel wynik przez 100.",
    steps: [`${b} × ${a} = ${b * a}`, `${b * a} ÷ 100 = ${answer}`],
  }),
  add: explainAddition,
  subtract: explainSubtraction,
  multiply: explainMultiplication,
  divide: explainDivision,
  power: (task) => ({
    explanation: "Potęga to mnożenie tej samej liczby przez siebie.",
    steps: [`${Array(task.b).fill(task.a).join(" × ")} = ${task.answer}`],
  }),
  root: (task) => ({
    explanation: `Szukamy liczby, której potęga ${task.b} daje ${task.a}.`,
    steps: [
      `${Array(task.b).fill(task.answer).join(" × ")} = ${task.a}`,
      `√[${task.b}](${task.a}) = ${task.answer}`,
    ],
  }),
};
export function explainSolution(task: Task): Solution {
  if (task.operation === "multiply" && task.a < 0) {
    const positive = explainMultiplication({
      ...task,
      a: -task.a,
      answer: -task.answer,
    });
    return {
      explanation:
        "Pomnóż wartości bezwzględne. Czynniki mają różne znaki, więc wynik jest ujemny.",
      steps: [...positive.steps, `(${task.a}) × ${task.b} = ${task.answer}`],
    };
  }
  return strategies[task.operation](task);
}
