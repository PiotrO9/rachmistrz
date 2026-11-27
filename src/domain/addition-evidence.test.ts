import { expect, it } from "vitest";
import { defaults } from "./defaults";
import { nextTask } from "./generators";
import { record } from "./history";
import { demonstratesCarry } from "./addition-evidence";
import { parseSaved } from "../persistence/migrations";
import type { Task } from "./types";

const task = {
  operation: "add",
  a: 47,
  b: 28,
  answer: 75,
  level: 2,
  materialLevel: 2,
} as const satisfies Task;
it("rozpoznaje przeniesienie z liczb i formy zadania", () => {
  expect(demonstratesCarry(task)).toBe(true);
  for (const other of [
    { ...task, a: 42, b: 17, answer: 59 },
    { ...task, a: -47 },
    { ...task, a: 8, b: 7 },
    { ...task, materialLevel: 1 as const },
    { ...task, missingOperand: "a" as const },
  ])
    expect(demonstratesCarry(other)).toBe(false);
});
it("dobiera dwa brakujące przykłady i wznawia serię po imporcie v15 i v16", () => {
  let saved = defaults();
  for (const m of Object.values(saved.modules)) m.enabled = false;
  saved.modules.add = {
    enabled: true,
    adaptive: true,
    level: 2,
    block: [],
    materialResults: [true, true, true, true],
  };
  saved = parseSaved(JSON.stringify({ ...saved, version: 15 }));
  for (let i = 0; i < 2; i++) {
    const next = nextTask(saved.modules, undefined, () => 0, true, true);
    expect(demonstratesCarry(next)).toBe(true);
    saved = record(
      saved,
      "add",
      { corrections: 0, skipped: false },
      "2026-11-27",
      next,
    );
    if (i === 0)
      expect(saved.modules.add.materialResults).toEqual([
        true,
        true,
        true,
        true,
        "carry",
      ]);
    saved = parseSaved(JSON.stringify(saved));
  }
  expect(saved.modules.add.level).toBe(3);
});
it("sześć łatwych sum nie daje szybkiego awansu, a poprawka zeruje dowody", () => {
  let saved = defaults();
  saved.modules.add = { enabled: true, adaptive: true, level: 2, block: [] };
  for (let i = 0; i < 6; i++)
    saved = record(
      saved,
      "add",
      { corrections: 0, skipped: false },
      "2026-11-27",
      { ...task, a: 31, b: 42, answer: 73 },
    );
  expect(saved.modules.add.level).toBe(2);
  expect(
    parseSaved(JSON.stringify(saved)).modules.add.materialResults,
  ).toHaveLength(5);
  saved = record(
    saved,
    "add",
    { corrections: 0, skipped: false },
    "2026-11-27",
    task,
  );
  expect(saved.modules.add.level).toBe(2);
  saved = record(
    saved,
    "add",
    { corrections: 1, skipped: false },
    "2026-11-27",
    task,
  );
  expect(saved.modules.add.materialResults).toEqual([]);
});
