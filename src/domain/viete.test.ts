import { expect, it } from "vitest";
import { nextEquation, hasRoots, equationText } from "./viete";
import { defaults } from "./defaults";
import { migrateSaved } from "../persistence/migrations";
it("uses distinct integer roots and formats signed coefficients", () => {
  const equation = { linear: 1, constant: -6 };
  expect(equationText(equation)).toBe("x² + x − 6 = 0");
  expect(hasRoots(equation, "2", "-3")).toBe(true);
  expect(hasRoots(equation, "-3", "2")).toBe(true);
  expect(hasRoots({ linear: 1, constant: 0 }, "", "-1")).toBe(false);
  const first = nextEquation(() => 0);
  expect(nextEquation(() => 0, first)).not.toEqual(first);
});
it("upgrades v8 with Viète disabled and preserves matchstick progress", () => {
  const { viete, ...old } = defaults();
  old.matches.enabled = true;
  expect(migrateSaved({ ...old, version: 8 })).toEqual({ ...old, viete });
  expect(() =>
    migrateSaved({ ...old, viete: { ...viete, solved: -1 } }),
  ).toThrow();
});
