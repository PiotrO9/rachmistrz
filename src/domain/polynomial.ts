import type { Family } from "./config";
import type { PolynomialTask } from "./types";

export function generatePolynomial(
  family: Extract<Family, { kind: "polynomial" }>,
  pick: (points: readonly number[]) => number,
  int: (lo: number, hi: number) => number,
): PolynomialTask {
  const a = pick(family.points);
  const min = family.signedTerms ? -family.coefficientMax : 0;
  const coefficients = [int(1, family.coefficientMax)];
  while (coefficients.length < family.degree)
    coefficients.push(int(min, family.coefficientMax));
  const b = int(family.signedTerms ? -9 : 1, 9);
  const answer =
    coefficients.reduce((sum, coefficient) => (sum + coefficient) * a, 0) + b;
  return {
    operation: "polynomial",
    a,
    b,
    coefficients,
    signedInput: family.signedTerms,
    answer,
  };
}

export function polynomialExpression(task: PolynomialTask, substitute = false) {
  const variable = substitute
    ? task.a < 0
      ? `(${task.a})`
      : String(task.a)
    : "x";
  return [...task.coefficients, task.b].reduce(
    (expression, coefficient, index) => {
      if (!coefficient) return expression;
      const power = task.coefficients.length - index;
      const magnitude = Math.abs(coefficient);
      const factor =
        magnitude === 1 ? "" : String(magnitude) + (substitute ? " × " : "");
      const term = power
        ? factor + variable + ["", "", "²", "³"][power]
        : String(magnitude);
      const sign = coefficient < 0 ? " − " : expression ? " + " : "";
      return expression + sign + term;
    },
    "",
  );
}

export const polynomialDivisor = (point: number) =>
  point < 0 ? `x + ${-point}` : `x − ${point}`;
