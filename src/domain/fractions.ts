import { expectedAnswer } from "./missing-number";
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
  const candidates: [number, number, number, number][] = [];
  for (let a = 1; a < denominatorA; a++) {
    for (let b = 1; b < denominatorB; b++) {
      const [numerator, denominator] = result(
        a,
        denominatorA,
        operator,
        b,
        denominatorB,
      );
      if (numerator > 0 && (family.improper || numerator < denominator))
        candidates.push([a, b, numerator, denominator]);
    }
  }
  const [a, b, numerator, denominator] = pick(candidates);
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

function result(
  a: number,
  da: number,
  operator: FractionTask["operator"],
  b: number,
  db: number,
): [number, number] {
  switch (operator) {
    case "×":
      return [a * b, da * db];
    case "÷":
      return [a * db, da * b];
    case "+":
      return [a * db + b * da, da * db];
    case "−":
      return [a * db - b * da, da * db];
  }
}

export const formatAnswer = (task: Task) =>
  task.operation === "fraction"
    ? formatRatio(task.answer, task.answerDenominator)
    : String(expectedAnswer(task));

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
  if (operator === "×" || operator === "÷") {
    const [n, d] = result(a, denominatorA, operator, b, denominatorB);
    const factor =
      operator === "÷"
        ? formatRatio(denominatorB, b)
        : formatRatio(b, denominatorB);
    const product = formatRatio(n, d);
    const steps = [
      formatRatio(a, denominatorA) + " × " + factor + " = " + product,
    ];
    if (d !== task.answerDenominator)
      steps.push(product + " = " + formatAnswer(task));
    return {
      explanation:
        operator === "÷"
          ? "Odwróć drugi ułamek i pomnóż. Skróć wynik, jeśli to możliwe."
          : "Pomnóż liczniki przez siebie i mianowniki przez siebie. Skróć wynik, jeśli to możliwe.",
      steps,
    };
  }
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
