import { describe, it, expect } from "vitest";
import { puzzle, encode, step, target, solved } from "./matches";
import { defaults } from "./defaults";
import { configure } from "../training/engine";
import { migrateStored } from "../persistence/migrations";

describe("matchstick puzzles", () => {
  it("moves the upright of plus onto five", () => {
    expect(solved(encode(5, true, 7, 2))).toBe(false);
    expect(solved(encode(9, false, 7, 2))).toBe(true);
    expect(step(encode(5, true, 7, 2), encode(9, false, 7, 2))).toBe(
      encode(9, false, 7, 2),
    );
  });
  it.each([1, 2])("requires exactly %i moves", (level) => {
    for (let i = 0; i < 100; i++) {
      let board = puzzle(level, () => i / 100);
      expect(target(board, level - 1)).toBeUndefined();
      const goal = target(board, level)!;
      for (let n = 0; n < level; n++) board = step(board, goal);
      expect(solved(board)).toBe(true);
    }
  });
  it("promotes independent solves and lowers after repeated hints", () => {
    let saved = defaults();
    for (let i = 0; i < 32; i++)
      saved = configure(
        saved,
        {
          type: "matchResult",
          id: String(i),
          epoch: saved.matches.epoch ?? 0,
          outcome: { skipped: false, corrections: i < 16 ? 0 : 1 },
        },
        "2026-11-27",
      );
    expect(saved.matches.epoch).toBe(2);
    expect(saved.matches.level).toBe(1);
    expect(saved.matches.history[0]).toMatchObject({ clean: 16, helped: 16 });
  });
  it("adds disabled matches to v7 without resetting other progress", () => {
    const old = defaults();
    old.modules.fraction.level = 3;
    const saved = migrateStored({
      ...old,
      version: 7,
      matches: undefined,
    }).saved;
    expect(saved.matches.enabled).toBe(false);
    expect(saved.modules).toEqual(old.modules);
  });
});
