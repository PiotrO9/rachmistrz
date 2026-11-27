import type { Family } from "./config";
import type { FractionTask, Task } from "./types";

function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

export function generateFraction(
  family: Extract<Family, { kind: "fraction" }>,
  pick: <T>(values: readonly T[]) => T,
): FractionTask {
  const [denominatorA, denominatorB] = pick(family.pairs);
  const operator = pick(family.operators);
  // Enumerate a small, bounded pool so even a constant RNG always terminates.
  const candidates: [number, number, number][] = [];
  const denominator = denominatorA * denominatorB;
  for (let a = 1; a < denominatorA; a++) {
    for (let b = 1; b < denominatorB; b++) {
      const numerator =
        a * denominatorB + (operator === "+" ? b : -b) * denominatorA;
      if (numerator > 0 && (family.improper || numerator < denominator))
        candidates.push([a, b, numerator]);
    }
  }
  const [a, b, numerator] = pick(candidates);
  const divisor = gcd(numerator, denominator);
  return {
    operation: "fraction",
    operator,
    a,
    denominatorA,
    b,
    denominatorB,
    answer: numerator / divisor,
    answerDenominator: denominator / divisor,
  };
}

export const formatRatio = (n: number, d: number) =>
  d === 1 ? String(n) : n + "/" + d;

export const formatAnswer = (task: Task) =>
  task.operation === "fraction"
    ? formatRatio(task.answer, task.answerDenominator)
    : String(task.answer);

export function matchesFraction(value: string, task: FractionTask) {
  const [numerator, denominator = "1"] = value.split("/");
  return (
    numerator !== "" &&
    Number(denominator) > 0 &&
    Number(numerator) * task.answerDenominator ===
      task.answer * Number(denominator)
  );
}

export function explainFraction(task: FractionTask) {
  const { a, b, denominatorA, denominatorB, operator } = task;
  const d = (denominatorA / gcd(denominatorA, denominatorB)) * denominatorB;
  const left = a * (d / denominatorA),
    right = b * (d / denominatorB);
  const sum = operator === "+" ? left + right : left - right;
  const steps: string[] = [];
  if (d !== denominatorA)
    steps.push(formatRatio(a, denominatorA) + " = " + formatRatio(left, d));
  if (d !== denominatorB)
    steps.push(formatRatio(b, denominatorB) + " = " + formatRatio(right, d));
  steps.push(
    formatRatio(left, d) +
      " " +
      operator +
      " " +
      formatRatio(right, d) +
      " = " +
      formatRatio(sum, d),
  );
  if (d !== task.answerDenominator)
    steps.push(formatRatio(sum, d) + " = " + formatAnswer(task));
  return {
    explanation:
      "Sprowadź ułamki do wspólnego mianownika. Wykonaj działanie na licznikach i skróć wynik, jeśli to możliwe.",
    steps,
  };
}
