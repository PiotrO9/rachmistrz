import { describe, expect, it } from "vitest";
import { explainSolution } from "./solution";
import { generate } from "./generators";
import { operations, type Level } from "./types";
import { seed } from "../testing/seed";

describe("sposób liczenia", () => {
  it("pokazuje skrót dla mnożenia blisko dziesiątki", () => {
    expect(
      explainSolution({ operation: "multiply", a: 19, b: 6, answer: 114 })
        .steps,
    ).toEqual(["20 × 6 = 120", "1 × 6 = 6", "120 − 6 = 114"]);
  });

  it("podaje poprawne kroki dla każdego działania i poziomu", () => {
    const random = seed(71);
    for (const operation of operations) {
      for (const level of [1, 2, 3, 4, 5] as Level[]) {
        for (let i = 0; i < 100; i++) {
          const task = generate(operation, level, random);
          const solution = explainSolution(task);
          expect(solution.steps.length).toBeGreaterThan(0);
          for (const step of solution.steps) {
            if (step.includes("?")) continue;
            const [expression, result] = step.split(" = ");
            const terms = expression.split(" ");
            let value = Number(terms[0]);
            for (let j = 1; j < terms.length; j += 2) {
              const right = Number(terms[j + 1]);
              value =
                terms[j] === "+"
                  ? value + right
                  : terms[j] === "−"
                    ? value - right
                    : terms[j] === "×"
                      ? value * right
                      : value / right;
            }
            expect(value, step).toBe(Number(result));
          }
          expect(solution.steps.at(-1)).toMatch(
            new RegExp(`= ${task.answer}$`),
          );
        }
      }
    }
  });
});
