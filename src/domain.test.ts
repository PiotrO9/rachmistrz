import { describe, it, expect } from "vitest";
import {
  adapt,
  correction,
  defaults,
  generate,
  operations,
  record,
  type Level,
} from "./domain";
import { seed } from "./testing/seed";
import { parseSaved } from "./persistence/migrations";
describe("generatory", () => {
  for (const op of operations)
    for (const level of [1, 2, 3, 4, 5] as Level[])
      it(`${op}, poziom ${level}: poprawne zakresy i wyniki`, () => {
        const random = seed();
        for (let i = 0; i < 500; i++) {
          const t = generate(op, level, random);
          expect(Number.isInteger(t.answer)).toBe(true);
          expect(t.answer).toBeGreaterThanOrEqual(0);
          if (op === "add" || op === "subtract") {
            expect(t.a).toBeLessThanOrEqual(
              level === 1 ? 20 : level === 2 ? 99 : 999,
            );
            expect(t.b).toBeLessThanOrEqual(
              level === 1 ? 20 : level === 2 ? 99 : 999,
            );
            expect(t.answer).toBe(op === "add" ? t.a + t.b : t.a - t.b);
          }
          if (op === "multiply") {
            expect(t.a).toBeGreaterThanOrEqual(2);
            expect(t.b).toBeGreaterThanOrEqual(2);
            expect(t.a).toBeLessThanOrEqual(99);
            expect(t.b).toBeLessThanOrEqual(99);
            expect(t.answer).toBe(t.a * t.b);
          }
          if (op === "power") expect(t.answer).toBe(t.a ** t.b);
          if (op === "root") expect(t.answer ** t.b).toBe(t.a);
          if (t.operation === "fraction") {
            const left = t.a / t.denominatorA;
            const right = t.b / t.denominatorB;
            const expected = {
              "+": left + right,
              "−": left - right,
              "×": left * right,
              "÷": left / right,
            };
            expect(t.answer / t.answerDenominator).toBeCloseTo(
              expected[t.operator],
              12,
            );
            expect(t.answerDenominator).toBeGreaterThan(0);
            if (t.materialLevel! < 5)
              expect(t.answer).toBeLessThan(t.answerDenominator);
          }
          if (op === "percent") expect(t.answer * 100).toBe(t.a * t.b);
          if (op === "divide") {
            expect(t.b).toBeGreaterThan(0);
            expect(t.a % t.b).toBe(0);
            expect(t.answer).toBe(t.a / t.b);
            expect(t.b).toBeLessThanOrEqual(99);
            expect(t.answer).toBeLessThanOrEqual(99);
          }
        }
      });
});
describe("adaptacja", () => {
  it("awansuje po dwóch stabilnych blokach i nie zmienia innego działania", () => {
    let s = defaults();
    for (let i = 0; i < 15; i++)
      s = record(s, "add", { corrections: 0, skipped: false });
    expect(s.modules.add.level).toBe(1);
    s = record(s, "add", { corrections: 0, skipped: false });
    expect(s.modules.add.level).toBe(2);
    expect(s.modules.multiply.level).toBe(1);
    expect(s.modules.add.block).toHaveLength(0);
  });
  it("3 pominięcia obniżają poziom", () => {
    let m = { ...defaults().modules.add, level: 3 as Level };
    for (let i = 0; i < 16; i++)
      m = adapt(m, { corrections: 0, skipped: i % 8 < 3 });
    expect(m.level).toBe(2);
  });
  it("4 trudne zadania obniżają poziom", () => {
    let m = { ...defaults().modules.add, level: 3 as Level };
    for (let i = 0; i < 16; i++)
      m = adapt(m, { corrections: i % 8 < 4 ? 2 : 0, skipped: false });
    expect(m.level).toBe(2);
  });
  it("wyłączona adaptacja nie zbiera bloku", () => {
    const m = adapt(
      { ...defaults().modules.add, adaptive: false },
      { corrections: 0, skipped: false },
    );
    expect(m.block).toHaveLength(0);
    expect(m.level).toBe(1);
  });
  it("nie przekracza granic poziomów", () => {
    for (const level of [1, 5] as Level[]) {
      let m = { ...defaults().modules.add, level };
      for (let i = 0; i < 8; i++)
        m = adapt(m, { corrections: 0, skipped: level === 1 });
      expect(m.level).toBe(level);
    }
  });
});
describe("poprawki", () => {
  it("nie traktuje częściowej odpowiedzi jako próby", () => {
    expect(correction("1", "14", false).increment).toBe(0);
    expect(correction("14", "144", false).increment).toBe(0);
  });
  it("grupuje kolejne kasowania i ponowne wpisanie", () => {
    expect(correction("999", "99", false)).toEqual({
      increment: 1,
      editing: true,
    });
    expect(correction("99", "9", true)).toEqual({
      increment: 0,
      editing: true,
    });
    expect(correction("9", "94", true)).toEqual({
      increment: 0,
      editing: false,
    });
    expect(correction("94", "9", false).increment).toBe(1);
  });
  it("liczy zastąpienie zaznaczonego tekstu", () =>
    expect(correction("99", "14", false).increment).toBe(1));
});
describe("zapis i historia", () => {
  it("odrzuca uszkodzone i przyszłe formaty", () => {
    for (const raw of [
      "oops",
      "null",
      "{}",
      '{"version":2}',
      JSON.stringify({ ...defaults(), modules: {} }),
    ])
      expect(() => parseSaved(raw)).toThrow();
  });
  it("odrzuca brak aktywnych działań", () => {
    const s = defaults();
    operations.forEach((op) => (s.modules[op].enabled = false));
    expect(() => parseSaved(JSON.stringify(s))).toThrow();
  });
  it("zapisuje wyniki osobno według dni i nie mutuje poprzedniego stanu", () => {
    const s = defaults();
    const a = record(
      s,
      "divide",
      { corrections: 2, skipped: false },
      "2026-11-10",
    );
    const b = record(a, "add", { corrections: 0, skipped: true }, "2026-11-11");
    expect(s.history).toHaveLength(0);
    expect(a.history).toHaveLength(1);
    expect(b.history).toHaveLength(2);
    expect(b.history[1].solved).toBe(1);
    expect(b.history[1].corrections).toBe(2);
    expect(parseSaved(JSON.stringify(b))).toEqual(b);
  });
});
