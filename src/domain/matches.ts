// Each digit occupies seven bits (top, upper right, lower right, bottom,
// lower left, upper left, middle). The topmost bit is the upright of +.
const digits = [63, 6, 91, 79, 102, 109, 125, 7, 127, 111];
export const plusBit = 21;
export function encode(a: number, plus: boolean, b: number, c: number) {
  return (
    digits[a] | (digits[b] << 7) | (digits[c] << 14) | (Number(plus) << plusBit)
  );
}
function count(bits: number) {
  let n = 0;
  while (bits) {
    bits &= bits - 1;
    n++;
  }
  return n;
}
const correct = new Set<number>();
const candidates: number[] = [];
for (let a = 0; a < 10; a++)
  for (let b = 0; b < 10; b++)
    for (let c = 0; c < 10; c++)
      for (const plus of [false, true]) {
        const board = encode(a, plus, b, c);
        if ((plus ? a + b : a - b) === c) correct.add(board);
        else candidates.push(board);
      }
export const solved = (board: number) => correct.has(board);
export function target(board: number, budget: number) {
  for (const goal of correct) {
    const missing = count(goal & ~board);
    if (missing <= budget && missing === count(board & ~goal)) return goal;
  }
}
const pools = new Map<number, number[]>();
export function puzzle(level: number, random: () => number, previous?: number) {
  let pool = pools.get(level);
  if (!pool) {
    pool = candidates.filter(
      (board) =>
        target(board, level) !== undefined &&
        (level === 1 || target(board, 1) === undefined),
    );
    pools.set(level, pool);
  }
  const index = Math.floor(random() * pool.length);
  return pool[index] === previous
    ? pool[(index + 1) % pool.length]
    : pool[index];
}
export function firstBit(bits: number) {
  return 31 - Math.clz32(bits & -bits);
}
export function step(board: number, goal: number) {
  return (
    board ^ (1 << firstBit(board & ~goal)) ^ (1 << firstBit(goal & ~board))
  );
}
