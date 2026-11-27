import { expect, it } from "vitest";
import { LOG_SETS } from "./config";
import { nextLog } from "./logarithms";
import { seed } from "../testing/seed";
it.each(LOG_SETS)(
  "constructs exact integer answers for $label",
  ({ value }) => {
    const random = seed();
    const kinds = new Set<string>();
    const answers = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const task = nextLog(value, random);
      kinds.add(task.kind);
      answers.add(task.answer);
      expect(task.base).toBeGreaterThan(1);
      expect(task.left).toBeGreaterThan(0);
      if (task.kind !== "basic") expect(task.right).toBeGreaterThan(0);
      if (task.kind === "quotient") expect(task.right).toBeGreaterThan(1);
      const left = Math.log(task.left) / Math.log(task.base);
      const right =
        task.kind === "basic" ? 0 : Math.log(task.right) / Math.log(task.base);
      const result = {
        basic: left,
        sum: left + right,
        difference: left - right,
        quotient: left / right,
      }[task.kind];
      expect(result).toBeCloseTo(task.answer);
      expect(nextLog(value, random, task)).not.toEqual(task);
    }
    expect([...kinds].sort()).toEqual(
      value === "basic"
        ? ["basic"]
        : value === "combine"
          ? ["difference", "sum"]
          : ["quotient"],
    );
    if (value === "basic") expect(answers.has(0)).toBe(true);
  },
);
