import type { Operation } from "../types";
import type { Family } from "../config";
import type { Pair, PickItem } from "./types";
type DigitFamily = Extract<Family, { kind: "digits" }>;

// Include incoming carries/borrows: 199 + 1 and 300 - 1 each regroup twice.
export function regroupCount(a: number, b: number, subtract = false): number {
  let incoming = 0,
    count = 0;
  while (a || b) {
    incoming = subtract
      ? Number((a % 10) - incoming < b % 10)
      : Number((a % 10) + (b % 10) + incoming >= 10);
    count += incoming;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return count;
}
export const hasCarry = (a: number, b: number) => regroupCount(a, b) > 0;
export const hasBorrow = (a: number, b: number) => regroupCount(a, b, true) > 0;
export function digitPair(
  operation: Operation,
  family: DigitFamily,
  pick: PickItem,
): Pair {
  const subtract = operation === "subtract";
  // The first subtraction bridge stays within 20, with a one-digit subtrahend.
  if (subtract && family.bridgeToTwenty) {
    const unit = pick([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const b = pick(Array.from({ length: 9 - unit }, (_, i) => unit + 1 + i));
    return [10 + unit, b];
  }
  const masks = Array.from({ length: 2 ** family.digits }, (_, i) => i).filter(
    (mask) => {
      const flags = Array.from(
        { length: family.digits },
        (_, i) => (mask >> i) & 1,
      );
      return (
        flags.reduce((a, b) => a + b, 0) === family.regroup &&
        (!subtract || flags[family.digits - 1] === 0)
      );
    },
  );
  const mask = pick(masks);
  let a = 0,
    b = 0,
    incoming = 0;
  for (let digit = 0; digit < family.digits; digit++) {
    const outgoing = (mask >> digit) & 1;
    const leading = digit === family.digits - 1;
    const candidates: Pair[] = [];
    for (let x = leading ? 1 : 0; x <= 9; x++)
      for (let y = leading ? 1 : 0; y <= 9; y++) {
        if (digit < (family.trailingZeros ?? 0) && y !== 0) continue;
        if (digit === family.zeroAt && x !== 0) continue;
        const value = subtract ? x - y - incoming : x + y + incoming;
        if (Number(subtract ? value < 0 : value >= 10) !== outgoing) continue;
        if (subtract && leading && value === 0) continue;
        candidates.push([x, y]);
      }
    const [x, y] = pick(candidates);
    a += x * 10 ** digit;
    b += y * 10 ** digit;
    incoming = outgoing;
  }
  return [a, b];
}
