import { createTestTrainingState } from "./testing/training-state";
import { it, expect } from "vitest";
import {
  reducer as reduceTraining,
  type TrainingState,
  type Action,
} from "./training/engine";
const initial = () =>
  createTestTrainingState({ operation: "multiply", a: 12, b: 12, answer: 144 });
const reducer = (state: TrainingState, action: Action) =>
  reduceTraining(state, action, {
    random: () => 0.5,
    date: () => "2026-11-10",
  });
it("zostawia niepoprawną i częściową odpowiedź, poprawna przechodzi automatycznie", () => {
  let s = reducer(initial(), {
    type: "input",
    value: "1",
    inputType: "insertText",
  });
  expect(s.sequence).toBe(0);
  expect(s.input).toBe("1");
  s = reducer(s, { type: "input", value: "14", inputType: "insertText" });
  expect(s.sequence).toBe(0);
  s = reducer(s, { type: "input", value: "149", inputType: "insertText" });
  expect(s.input).toBe("149");
  s = reducer(s, {
    type: "input",
    value: "14",
    inputType: "deleteContentBackward",
  });
  s = reducer(s, { type: "input", value: "144", inputType: "insertText" });
  expect(s.sequence).toBe(1);
  expect(s.input).toBe("");
  expect(s.saved.history[0].corrections).toBe(1);
  expect(s.saved.history[0].solved).toBe(1);
});
it("pominięcie zapisuje wynik bez fałszywego rozwiązania", () => {
  const s = reducer(initial(), { type: "skip" });
  expect(s.saved.history[0].skipped).toBe(1);
  expect(s.saved.history[0].solved).toBe(0);
});
it("nie przyjmuje znaków innych niż cyfry", () => {
  const s = initial();
  expect(
    reducer(s, { type: "input", value: "-2", inputType: "insertText" }),
  ).toBe(s);
});
it("nie pozwala wyłączyć ostatniego działania", () => {
  let s = reducer(initial(), { type: "preset", active: ["divide"] });
  s = reducer(s, { type: "module", op: "divide", change: { enabled: false } });
  expect(s.saved.modules.divide.enabled).toBe(true);
  expect(s.task.operation).toBe("divide");
});
it("ręczna zmiana poziomu usuwa stary blok oceny", () => {
  const s = initial();
  s.saved.modules.add.block = [{ corrections: 0, skipped: false }];
  const next = reducer(s, { type: "module", op: "add", change: { level: 4 } });
  expect(next.saved.modules.add.level).toBe(4);
  expect(next.saved.modules.add.block).toEqual([]);
});
