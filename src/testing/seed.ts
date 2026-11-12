export function seed(initial = 123456789) {
  let n = initial;
  return () => {
    n = (1664525 * n + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
