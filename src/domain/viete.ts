export interface VieteEquation {
  linear: number;
  constant: number;
}

// Distinct pairs in [-9, 9], including zero and roots of opposite signs.
const equations: VieteEquation[] = [];
for (let first = -9; first <= 9; first++) {
  for (let second = first + 1; second <= 9; second++) {
    equations.push({ linear: -(first + second), constant: first * second });
  }
}

export function nextEquation(random: () => number, previous?: VieteEquation) {
  const candidates = previous
    ? equations.filter((eq) => eq !== previous)
    : equations;
  return candidates[Math.floor(random() * candidates.length)];
}

export function hasRoots(eq: VieteEquation, first: string, second: string) {
  if (![first, second].every((value) => /^-?\d+$/.test(value))) return false;
  const a = Number(first),
    b = Number(second);
  return a + b === -eq.linear && a * b === eq.constant;
}

export function equationText({ linear, constant }: VieteEquation) {
  function term(value: number, variable = "") {
    if (value === 0) return "";
    const magnitude = variable && Math.abs(value) === 1 ? "" : Math.abs(value);
    return ` ${value < 0 ? "−" : "+"} ${magnitude}${variable}`;
  }
  return `x²${term(linear, "x")}${term(constant)} = 0`;
}
