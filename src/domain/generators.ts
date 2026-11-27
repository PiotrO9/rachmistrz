import {
  operations,
  type Operation,
  type Level,
  type Task,
  type SavedProgress,
} from "./types";
import { withMissingOperand } from "./missing-number";
import { CURRICULUM, REVIEW_SHARE } from "./config";

import { generateFraction } from "./fractions";
import { generatePolynomial } from "./polynomial";
import { digitPair } from "./generation/additive";
import { productPool } from "./generation/product";
export { regroupCount, hasCarry, hasBorrow } from "./generation/additive";

export function generate(
  operation: Operation,
  level: Level,
  random = Math.random,
  negativeNumbers = false,
): Task {
  const int = (lo: number, hi: number) =>
    Math.floor(random() * (hi - lo + 1)) + lo;
  const pick = <T>(items: readonly T[]): T => {
    if (!items.length) throw new Error("Empty task family");
    return items[int(0, items.length - 1)];
  };
  const materialLevel = (
    level > 1 && random() < REVIEW_SHARE ? level - 1 : level
  ) as Level;
  const families = CURRICULUM[operation][materialLevel - 1].families;
  let weight =
    random() * families.reduce((sum, family) => sum + family.weight, 0);
  const family =
    families.find((item) => (weight -= item.weight) < 0) ??
    families[families.length - 1];
  if (operation === "polynomial") {
    if (family.kind !== "polynomial")
      throw new Error("Invalid polynomial curriculum");
    return {
      ...generatePolynomial(family, pick, int),
      level,
      materialLevel,
      familyId: family.id,
    };
  }
  if (family.kind === "polynomial")
    throw new Error("Unexpected polynomial family");
  if (operation === "fraction") {
    if (family.kind !== "fraction")
      throw new Error("Invalid fraction curriculum");
    return {
      ...generateFraction(family, pick),
      level,
      materialLevel,
      familyId: family.id,
    };
  }
  if (family.kind === "fraction") throw new Error("Unexpected fraction family");
  let a: number, b: number;
  if (family.kind === "percent") {
    a = pick(family.rates);
    b = family.baseStep * int(...family.multiples);
    return {
      operation,
      level,
      materialLevel,
      familyId: family.id,
      a,
      b,
      answer: (a * b) / 100,
    };
  }
  if (family.kind === "power") {
    const base = int(...family.base);
    b = family.exponent;
    a = operation === "root" ? base ** b : base;
    return {
      operation,
      level,
      materialLevel,
      familyId: family.id,
      a,
      b,
      answer: operation === "root" ? base : base ** b,
    };
  } else if (family.kind === "digits")
    [a, b] = digitPair(operation, family, pick);
  else if (family.kind === "nearHundred") {
    a = int(200, 999);
    b = int(1, Math.floor(a / 100)) * 100 - pick([1, 2]);
  } else {
    [a, b] = pick(productPool(operation, family));
    if (operation === "divide") a *= b;
  }
  if (negativeNumbers && random() < 0.25) {
    if (operation === "subtract") [a, b] = [b, a];
    else if (operation === "add") [a, b] = [-Math.max(a, b), Math.min(a, b)];
    else a = -a;
  }
  return {
    signedInput: negativeNumbers,
    operation,
    level,
    materialLevel,
    familyId: family.id,
    a,
    b,
    answer:
      operation === "add"
        ? a + b
        : operation === "subtract"
          ? a - b
          : operation === "multiply"
            ? a * b
            : a / b,
  };
}
export function nextTask(
  modules: SavedProgress["modules"],
  previous?: Task,
  random = Math.random,
  negativeNumbers = false,
  missingNumber = false,
): Task {
  const active = operations.filter((op) => modules[op].enabled);
  const op = active[Math.floor(random() * active.length)] ?? "add";
  let task = generate(op, modules[op].level, random, negativeNumbers);
  for (
    let i = 0;
    i < 10 &&
    previous &&
    task.operation === previous.operation &&
    task.a === previous.a &&
    task.b === previous.b &&
    (task.operation !== "polynomial" ||
      previous.operation !== "polynomial" ||
      task.coefficients.join(",") === previous.coefficients.join(",")) &&
    (task.operation !== "fraction" ||
      previous.operation !== "fraction" ||
      (task.operator === previous.operator &&
        task.denominatorA === previous.denominatorA &&
        task.denominatorB === previous.denominatorB));
    i++
  )
    task = generate(op, modules[op].level, random, negativeNumbers);
  if (missingNumber) task = withMissingOperand(task, random);
  return { ...task, epoch: modules[op].epoch ?? 0 };
}
