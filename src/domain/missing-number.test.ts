import { describe, it, expect } from "vitest";
import { generate } from "./generators";
import { expectedAnswer, withMissingOperand } from "./missing-number";
import { explainSolution } from "./solution";
import { seed } from "../testing/seed";
import { createTestTrainingState } from "../testing/training-state";
import { reducer } from "../training/engine";
import type { Task } from "./types";

const env = { random: seed(), date: () => "2026-11-27" };
describe("missing operands", () => {
  for (const operation of ["add", "subtract", "multiply", "divide"] as const) {
    it(`reconstructs ${operation} at every level on either side`, () => {
      const rng = seed();
      for (const level of [1, 2, 3, 4, 5] as const) {
        for (let n = 0; n < 20; n++) {
          const task = generate(operation, level, rng, true);
          for (const side of ["a", "b"] as const) {
            let draw = 0;
            const variant = withMissingOperand(task, () =>
              draw++ === 0 || side === "a" ? 0 : 0.9,
            );
            expect(variant.missingOperand).toBe(side);
            expect(expectedAnswer(variant)).toBe(task[side]);
            expect(variant).toMatchObject(task);
          }
        }
      }
    });
  }
  it("uses only uniquely solvable positions", () => {
    const hide = (task: Task) =>
      withMissingOperand(task, () => 0).missingOperand;
    expect(hide({ operation: "multiply", a: 0, b: 5, answer: 0 })).toBe("a");
    expect(hide({ operation: "multiply", a: 4, b: 0, answer: 0 })).toBe("b");
    expect(
      hide({ operation: "multiply", a: 0, b: 0, answer: 0 }),
    ).toBeUndefined();
    expect(hide({ operation: "divide", a: 0, b: 5, answer: 0 })).toBe("a");
    expect(
      hide({ operation: "percent", a: 10, b: 90, answer: 9 }),
    ).toBeUndefined();
  });
  it("combines ordinary and inverse exercises in the same adaptive block", () => {
    const base = { operation: "divide", a: 24, b: 4, answer: 6 } as const;
    let state = createTestTrainingState(base);
    for (const skipped of [false, true]) {
      for (let i = 0; i < 16; i++) {
        const task = i % 2 ? { ...base, missingOperand: "b" as const } : base;
        state = reducer(
          {
            ...state,
            task: {
              ...task,
              epoch: state.saved.modules.divide.epoch,
              level: state.saved.modules.divide.level,
            },
          },
          skipped
            ? { type: "skip" }
            : {
                type: "input",
                value: String(expectedAnswer(task)),
                inputType: "insertText",
              },
          env,
        );
      }
      expect(state.saved.modules.divide.level).toBe(skipped ? 1 : 2);
      expect(state.saved.modules.multiply.level).toBe(1);
    }
    expect(state.saved.history[0].details?.divide).toMatchObject({
      solved: 16,
      skipped: 16,
    });
  });
  it("checks and reveals the divisor and explains the correct inverse", () => {
    const task = {
      operation: "divide",
      a: 24,
      b: 4,
      answer: 6,
      missingOperand: "b",
    } as const;
    const state = createTestTrainingState(task);
    state.saved.showSolution = true;
    const pending = reducer(
      state,
      { type: "input", value: "6", inputType: "insertText" },
      env,
    );
    expect(pending.task).toBe(task);
    expect(reducer(pending, { type: "skip" }, env).input).toBe("4");
    expect(explainSolution(task).steps).toEqual(["24 ÷ 6 = 4"]);
    expect(explainSolution({ ...task, missingOperand: "a" }).steps).toEqual([
      "6 × 4 = 24",
    ]);
  });
});
