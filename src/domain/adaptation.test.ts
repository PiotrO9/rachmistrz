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
    let m: OperationProgress = {
      ...defaults().modules.add,
      startPhase: undefined,
    };
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: 0, skipped: false });
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: i < 3 ? 1 : 0, skipped: false });
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: 0, skipped: false });
    expect(m.level).toBe(1);
    expect(m.trend).toBe(1);
  });
  it("po poprawce zachowuje blok i wymaga bezbłędnego potwierdzenia pierwszego awansu", () => {
    let m = defaults().modules.add;
    for (let i = 0; i < 16; i++)
      m = adapt(m, { corrections: i % 8 === 0 ? 1 : 0, skipped: false });
    expect(m).toMatchObject({ level: 1, trend: 1, startPhase: "confirm" });
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: 0, skipped: false });
    expect(m.level).toBe(2);
    expect(m.startPhase).toBeUndefined();
    for (let i = 0; i < 8; i++)
      m = adapt(m, { corrections: 0, skipped: false });
    expect(m.level).toBe(2);
  });
  it("pomija powtórki i przyspiesza na obu poziomach po serii z bieżącego materiału", () => {
    let m: OperationProgress = {
      ...defaults().modules.add,
      level: 2,
      startPhase: undefined,
    };
    const clean = { skipped: false, corrections: 0 };
    for (const [level, limit] of [
      [2, 6],
      [3, 9],
    ] as const) {
      m = adapt(m, clean, undefined, 1);
      for (let i = 1; i < limit; i++) m = adapt(m, clean, undefined, level);
      expect(m.level).toBe(level);
      m = adapt(m, clean, undefined, level);
      expect(m.level).toBe(level + 1);
      expect(m.block).toEqual([]);
      expect(m.epoch).toBe(level - 1);
    }
  });
  it("po pierwszym awansie liczy trudności tylko na nowym materiale", () => {
    const clean = { skipped: false, corrections: 0 };
    const miss = { skipped: true, corrections: 0 };
    let m = defaults().modules.add;
    for (let i = 0; i < 8; i++) m = adapt(m, clean, undefined, 1);
    expect(m.checkFirstPromotion).toBe(true);
    for (let i = 0; i < 3; i++) m = adapt(m, miss, undefined, 1);
    expect(m.level).toBe(2);
    for (let i = 0; i < 3; i++) m = adapt(m, miss, undefined, 2);
    expect(m.level).toBe(1);
    expect(m.startPhase).toBeUndefined();
    expect(m.checkFirstPromotion).toBeUndefined();
  });
  it("kończy sprawdzanie po sześciu nowych zadaniach i pamięta czystą końcówkę serii", () => {
    const clean = { skipped: false, corrections: 0 };
    const correction = { skipped: false, corrections: 1 };
    let m: OperationProgress = {
      ...defaults().modules.add,
      level: 2,
      startPhase: undefined,
      checkFirstPromotion: true,
    };
    for (const outcome of [correction, correction, clean, clean, clean, clean])
      m = adapt(m, outcome, undefined, 2);
    expect(m.checkFirstPromotion).toBeUndefined();
    expect(m.materialResults).toEqual([true, true, true, true]);
    m = adapt(m, correction, undefined, 2);
    expect(m.level).toBe(2);
    expect(m.materialResults).toEqual([]);
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
