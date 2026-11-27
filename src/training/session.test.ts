import { expect, it } from "vitest";
import { defaults } from "../domain";
import { newRule, type SessionConfig } from "../domain/session";
import { createState, reducer } from "./engine";
import { migrateSaved } from "../persistence/migrations";
const env = { random: () => 0.04, date: () => "2026-11-27" };
const fixed: SessionConfig = {
  rules: [{ ...newRule("divide"), mode: "fixed", level: 5 }],
  count: 2,
  goal: "solved",
};
it("counts committed answers and trains only the session", () => {
  const initial = createState(defaults(), env);
  let state = reducer(initial, { type: "startQuick", config: fixed }, env);
  expect(state.quick!.exercise.task.materialLevel).toBe(5);
  state = reducer(state, { type: "quickSkip" }, env);
  for (let i = 0; i < 2; i++)
    state = reducer(
      state,
      {
        type: "quickInput",
        value: String(state.quick!.exercise.task.answer),
        inputType: "insertText",
      },
      env,
    );
  expect(state.quick).toMatchObject({ finished: true, solved: 2, skipped: 1 });
  expect(state.saved.history[0]).toMatchObject({ solved: 2, skipped: 1 });
  expect(state.saved.modules).toEqual(initial.saved.modules);
  expect(state.task).toBe(initial.task);
});
it("keeps a revealed skip single and resolves the current level on restart", () => {
  const saved = defaults();
  saved.showSolution = true;
  saved.modules.add.level = 3;
  const config: SessionConfig = {
    rules: [newRule("add")],
    count: 2,
    goal: "tasks",
  };
  let s = reducer(createState(saved, env), { type: "startQuick", config }, env);
  s = reducer(s, { type: "quickSkip" }, env);
  expect(s.quick!.exercise.revealed).toBe(true);
  s = reducer(s, { type: "quickSkip" }, env);
  expect(s.quick!.skipped).toBe(1);
  s = reducer(s, { type: "quickSkip" }, env);
  expect(s.quick!.finished).toBe(true);
  s = reducer(s, { type: "module", op: "add", change: { level: 4 } }, env);
  s = reducer(s, { type: "startQuick", config }, env);
  expect(s.quick!.exercise.task.level).toBe(4);
});
it("trains a missing-number rule locally and weights it independently of a fixed rule", () => {
  const saved = defaults();
  const config: SessionConfig = {
    count: 25,
    goal: "solved",
    rules: [
      {
        ...newRule("subtract"),
        frequent: true,
        form: "missing",
        negatives: "on",
      },
      fixed.rules[0],
    ],
  };
  const weighted = { ...env, random: () => 0.55 };
  let s = reducer(
    createState(saved, weighted),
    { type: "startQuick", config },
    weighted,
  );
  for (let i = 0; i < 8; i++) {
    const task = s.quick!.exercise.task;
    expect(task.operation).toBe("subtract");
    expect(task.missingOperand).toBeTruthy();
    s = reducer(
      s,
      {
        type: "quickInput",
        inputType: "insertText",
        value: String(task[task.missingOperand!]),
      },
      weighted,
    );
  }
  expect(s.quick!.modules.subtract.level).toBe(2);
  expect(s.saved.modules.subtract.level).toBe(1);
  s = reducer(s, { type: "quickSkip" }, { ...env, random: () => 0.9 });
  expect(s.quick!.exercise.task).toMatchObject({
    operation: "divide",
    materialLevel: 5,
  });
});
it("preserves v13 adaptation and rejects malformed imported sets", () => {
  const saved = defaults();
  saved.modules.add.startPhase = "confirm";
  expect(
    migrateSaved({ ...saved, version: 13, sessionPresets: undefined }),
  ).toEqual(saved);
  expect(() =>
    migrateSaved({
      ...saved,
      sessionPresets: [{ ...fixed, count: 0, name: "A" }],
    }),
  ).toThrow();
});
