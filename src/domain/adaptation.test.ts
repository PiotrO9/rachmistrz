import { describe, it, expect } from "vitest";
import { defaults, record, adapt, type OperationProgress } from "../domain";
describe("stabilna adaptacja", () => {
  it("pojedyncza poprawka w każdym zadaniu obniża poziom po dwóch blokach", () => {
    let m: OperationProgress = { ...defaults().modules.add, level: 3 };
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: 1, skipped: false });
    expect(m.level).toBe(3);
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: 1, skipped: false });
    expect(m.level).toBe(2);
  });
  it("neutralny blok przerywa serię awansową", () => {
    let m: OperationProgress = defaults().modules.add;
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: 0, skipped: false });
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: i < 3 ? 1 : 0, skipped: false });
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: 0, skipped: false });
    expect(m.level).toBe(1);
    expect(m.trend).toBe(1);
  });
  it("stare zadanie nie wpływa na nowy model, ale trafia do historii", () => {
    const s = defaults();
    s.modules.add.epoch = 3;
    const next = record(
      s,
      "add",
      { corrections: 0, skipped: false },
      "2026-11-10",
      { operation: "add", a: 1, b: 2, answer: 3, level: 1, epoch: 2 },
    );
    expect(next.modules.add.block).toEqual([]);
    expect(next.history[0].solved).toBe(1);
  });
});
