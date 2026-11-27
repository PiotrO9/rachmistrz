import { createTestTrainingState } from "../testing/training-state";
import { describe, it, expect } from "vitest";
import { defaults, record } from "../domain";
import {
  settle,
  reducer as reduceTraining,
  type TrainingState,
  type Action,
} from "./engine";
const initial = () =>
  createTestTrainingState(
    { operation: "multiply", a: 12, b: 12, answer: 144, level: 1, epoch: 0 },
    { input: "99", corrections: 1 },
  );
const reducer = (state: TrainingState, action: Action) =>
  reduceTraining(state, action, {
    random: () => 0.5,
    date: () => "2026-11-10",
  });
describe("zachowanie zadania", () => {
  it.each([true, false])(
    "po rundzie Zapałek uzgadnia zadanie z ustawieniami: %s",
    (enabled) => {
      const state = initial();
      const latest = defaults();
      latest.modules.multiply.enabled = enabled;
      const next = settle(
        state,
        latest,
        {
          type: "configure",
          date: "2026-11-27",
          action: {
            type: "matchResult",
            id: "runda",
            epoch: 0,
            outcome: { skipped: true, corrections: 0 },
          },
        },
        { random: () => 0, date: () => "2026-11-27" },
      );
      expect(next.settledMatch).toBe("runda");
      if (enabled) {
        expect(next.task).toBe(state.task);
        expect(next.input).toBe(state.input);
      } else {
        expect(next.task.operation).toBe("add");
        expect(next.input).toBe("");
      }
    },
  );
  it("import unieważnia model dla zadań otwartych w pozostałych kartach", () => {
    const s = initial();
    const next = reducer(s, { type: "import", saved: defaults() });
    expect(next.saved.modules.multiply.epoch).toBe(1);
    const result = record(
      next.saved,
      "multiply",
      { corrections: 0, skipped: false },
      "2026-11-10",
      s.task,
    );
    expect(result.modules.multiply.block).toEqual([]);
    expect(result.history[0].solved).toBe(1);
  });
  it("zmiana innego modułu i poziomu bieżącego nie kasuje zadania ani wpisu", () => {
    let s = initial();
    const task = s.task;
    s = reducer(s, { type: "module", op: "add", change: { adaptive: false } });
    expect(s.task).toBe(task);
    expect(s.input).toBe("99");
    s = reducer(s, { type: "module", op: "multiply", change: { level: 4 } });
    expect(s.task).toBe(task);
    expect(s.input).toBe("99");
    const completed = reducer(s, {
      type: "input",
      value: "144",
      inputType: "insertText",
    });
    expect(completed.saved.modules.multiply.level).toBe(4);
    expect(completed.saved.modules.multiply.block).toHaveLength(0);
  });
  it("wyłączenie bieżącego działania przełącza na aktywny moduł", () => {
    const s = reducer(initial(), { type: "preset", active: ["divide"] });
    expect(s.task.operation).toBe("divide");
    expect(s.input).toBe("");
  });
  it("ujawnienie rozwiązania liczy pominięcie tylko raz", () => {
    const s = initial();
    s.saved.showSolution = true;
    const revealed = reducer(s, { type: "skip" });
    expect(revealed.revealed).toBe(true);
    expect(revealed.input).toBe("144");
    expect(revealed.saved.history[0].skipped).toBe(1);
    const next = reducer(revealed, { type: "skip" });
    expect(next.revealed).toBe(false);
    expect(next.saved.history[0].skipped).toBe(1);
  });
});
