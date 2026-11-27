import { expect, it } from "vitest";
import { defaults, generate, operations, type Level } from "../domain";
import { seed } from "../testing/seed";
import { createState, reducer } from "../training/engine";
import { parseSaved } from "../persistence/migrations";
import { explainSolution } from "./solution";

it("generates signed integer results at every basic operation level", () => {
  for (const op of operations) {
    for (const level of [1, 2, 3, 4, 5] as Level[]) {
      const random = seed(27);
      const comparisonRandom = seed(27);
      let negatives = 0;
      for (let i = 0; i < 500; i++) {
        const task = generate(op, level, random, true);
        if (op === "polynomial") {
          expect(task).toEqual(generate(op, level, comparisonRandom, false));
          continue;
        }
        const { a, b, answer } = task;
        if (answer >= 0) continue;
        negatives++;
        expect(answer).toBe(
          { add: a + b, subtract: a - b, multiply: a * b, divide: a / b }[
            op as "add" | "subtract" | "multiply" | "divide"
          ],
        );
        expect(Number.isInteger(answer)).toBe(true);
        expect(explainSolution(task).steps.at(-1)).toMatch(
          new RegExp(`= ${answer}$`),
        );
      }
      if (["add", "subtract", "multiply", "divide"].includes(op)) {
        expect(negatives).toBeGreaterThan(75);
        expect(negatives).toBeLessThan(175);
      } else expect(negatives).toBe(0);
    }
  }
});

it("completes the current signed task after disabling the setting and updates its operation", () => {
  const saved = defaults();
  saved.negativeNumbers = true;
  for (const op of operations) saved.modules[op].enabled = op === "multiply";
  const env = { random: () => 0, date: () => "2026-11-27" };
  const start = createState(saved, env);
  expect(start.task.answer).toBeLessThan(0);
  const prefix = reducer(
    start,
    { type: "input", value: "−", inputType: "insertText" },
    env,
  );
  expect(prefix.input).toBe("-");
  const disabled = reducer(
    prefix,
    { type: "negativeNumbers", enabled: false },
    env,
  );
  expect(disabled.task).toBe(start.task);
  expect(disabled.input).toBe("-");
  const done = reducer(
    disabled,
    {
      type: "input",
      value: String(start.task.answer),
      inputType: "insertText",
    },
    env,
  );
  expect(done.task.answer).toBeGreaterThan(0);
  expect(done.saved.modules.multiply.block).toEqual([
    { skipped: false, corrections: 0 },
  ]);
  expect(done.saved.history[0].details?.multiply.clean).toBe(1);
});

it("migrates v5 with signed training off and validates the new preference in backups", () => {
  const saved = defaults();
  saved.modules.add.block.push({ skipped: true, corrections: 1 });
  const old = { ...saved, version: 5, negativeNumbers: undefined };
  expect(parseSaved(JSON.stringify(old))).toEqual(saved);
  saved.negativeNumbers = true;
  expect(parseSaved(JSON.stringify(saved))).toEqual(saved);
  expect(() =>
    parseSaved(JSON.stringify({ ...saved, negativeNumbers: "true" })),
  ).toThrow();
});
