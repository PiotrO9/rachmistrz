import { describe, it, expect } from "vitest";
import { generate, regroupCount, nextTask } from "./generators";
import { CURRICULUM, LEVELS } from "./config";
import { defaults, operations } from "../domain";
import { seed } from "../testing/seed";

describe("balans rodzin zadań", () => {
  for (const op of operations)
    for (const { value: level } of LEVELS) {
      it(
        op + " poziom " + level + ": proporcje, różnorodność i zakresy",
        () => {
          const rng = seed(71),
            counts = new Map<string, number>(),
            unique = new Set<string>();
          let reviews = 0;
          for (let i = 0; i < 2000; i++) {
            const t = generate(op, level, rng);
            unique.add(
              t.operation === "fraction"
                ? [t.a, t.denominatorA, t.operator, t.b, t.denominatorB].join(
                    ":",
                  )
                : t.a + ":" + t.b,
            );
            expect(t.level).toBe(level);
            if (t.materialLevel !== level) {
              reviews++;
              expect(t.materialLevel).toBe(level - 1);
            } else counts.set(t.familyId!, (counts.get(t.familyId!) ?? 0) + 1);
            expect(t.answer).toBeGreaterThan(0);
            expect(Number.isInteger(t.answer)).toBe(true);
            if (op === "add" || op === "subtract") {
              expect(Math.max(t.a, t.b)).toBeLessThanOrEqual(
                t.materialLevel === 1 ? 20 : t.materialLevel === 2 ? 99 : 999,
              );
              const f = CURRICULUM[op][t.materialLevel! - 1].families.find(
                (f) => f.id === t.familyId,
              )!;
              if (f.kind === "digits")
                expect(regroupCount(t.a, t.b, op === "subtract")).toBe(
                  f.regroup,
                );
              if (t.familyId === "through-zero")
                expect(Math.floor(t.a / 10) % 10).toBe(0);
            }
            if (op === "divide") {
              expect(t.a).toBeLessThanOrEqual(999);
              expect(t.a % t.b).toBe(0);
            }
            if (
              t.materialLevel === 5 &&
              (op === "multiply" || op === "divide")
            ) {
              expect(t.b).toBeGreaterThanOrEqual(13);
              expect(op === "multiply" ? t.a : t.answer).toBeGreaterThanOrEqual(
                13,
              );
              expect(t.b % 10).not.toBe(0);
            }
          }
          if (level === 1) expect(reviews).toBe(0);
          else {
            expect(reviews).toBeGreaterThan(320);
            expect(reviews).toBeLessThan(480);
          }
          const families = CURRICULUM[op][level - 1].families;
          const total = families.reduce((sum, f) => sum + f.weight, 0);
          for (const f of families)
            expect((counts.get(f.id) ?? 0) / (2000 - reviews)).toBeCloseTo(
              f.weight / total,
              1,
            );
          expect(unique.size).toBeGreaterThan(
            op === "power" || op === "root" || op === "fraction"
              ? 4
              : level === 1
                ? 20
                : level === 2
                  ? 70
                  : 100,
          );
        },
      );
    }
  it("uwzględnia przeniesienia i pożyczki wywołane poprzednią cyfrą", () => {
    expect(regroupCount(199, 1)).toBe(2);
    expect(regroupCount(999, 1)).toBe(3);
    expect(regroupCount(300, 1, true)).toBe(2);
    expect(regroupCount(902, 487, true)).toBe(2);
    expect(regroupCount(472, 305)).toBe(0);
  });
  it("kończy losowanie również przy stałym RNG na krańcach", () => {
    for (const value of [0, 0.19, 0.2, 0.5, 0.999999])
      for (const op of operations)
        for (const { value: level } of LEVELS) {
          const task = generate(op, level, () => value);
          expect(Number.isSafeInteger(task.answer)).toBe(true);
          expect(task.answer).toBeGreaterThan(0);
        }
  });
  it("unika kolejnego identycznego działania i zachowuje epokę", () => {
    const saved = defaults();
    const rng = seed(17);
    saved.modules.add.epoch = 7;
    for (const op of operations) saved.modules[op].enabled = op === "add";
    let previous = nextTask(saved.modules, undefined, rng);
    for (let i = 0; i < 100; i++) {
      const task = nextTask(saved.modules, previous, rng);
      expect([task.a, task.b]).not.toEqual([previous.a, previous.b]);
      expect(task.epoch).toBe(7);
      previous = task;
    }
  });
});
