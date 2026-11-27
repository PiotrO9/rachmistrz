import { describe, it, expect } from "vitest";
import { defaults, record, operations } from "../domain";
import { parseSaved } from "./migrations";
describe("format danych", () => {
  it("wznawia serię nowego materiału po imporcie i zachowuje blok v14", () => {
    const old = defaults();
    old.modules.add = {
      enabled: true,
      adaptive: true,
      level: 2,
      block: [{ corrections: 1, skipped: false }],
      trend: 1,
      epoch: 7,
    };
    const saved = parseSaved(JSON.stringify({ ...old, version: 14 }));
    expect(saved.modules.add).toEqual(old.modules.add);
    const task = {
      operation: "add",
      level: 2,
      materialLevel: 2,
      epoch: 7,
      a: 47,
      b: 28,
      answer: 75,
    } as const;
    let state = saved;
    for (let i = 0; i < 5; i++)
      state = record(
        state,
        "add",
        { corrections: 0, skipped: false },
        "2026-11-27",
        task,
      );
    state = parseSaved(JSON.stringify(state));
    const promoted = record(
      state,
      "add",
      { corrections: 0, skipped: false },
      "2026-11-27",
      task,
    );
    expect(promoted.modules.add).toMatchObject({
      level: 3,
      epoch: 8,
      block: [],
    });
    expect(promoted.changes).toHaveLength(1);
    const stale = record(
      promoted,
      "add",
      { corrections: 0, skipped: false },
      "2026-11-27",
      task,
    );
    expect(stale.modules.add).toEqual(promoted.modules.add);
    state.modules.add.materialResults = Array(6).fill(true);
    expect(() => parseSaved(JSON.stringify(state))).toThrow();
  });
  it("preserves v10 progress and validates logarithm backups", () => {
    const saved = defaults();
    saved.missingNumber = true;
    saved.viete.solved = 7;
    expect(
      parseSaved(
        JSON.stringify({ ...saved, version: 10, logarithms: undefined }),
      ),
    ).toEqual(saved);
    saved.logarithms = { enabled: true, set: "combine", solved: 2, skipped: 1 };
    expect(parseSaved(JSON.stringify(saved))).toEqual(saved);
    for (const invalid of [
      { set: "unknown" },
      { enabled: 1 },
      { solved: -1 },
      { skipped: 0.5 },
    ])
      expect(() =>
        parseSaved(
          JSON.stringify({
            ...saved,
            logarithms: { ...saved.logarithms, ...invalid },
          }),
        ),
      ).toThrow();
  });
  it("preserves v9 progress and round-trips the missing-number preference", () => {
    const saved = record(
      defaults(),
      "add",
      { corrections: 1, skipped: false },
      "2026-11-27",
    );
    saved.viete.solved = 3;
    delete saved.modules.add.startPhase;
    const legacy = { ...saved, missingNumber: undefined, version: 9 };
    expect(parseSaved(JSON.stringify(legacy))).toEqual(saved);
    saved.missingNumber = true;
    expect(parseSaved(JSON.stringify(saved))).toEqual(saved);
    expect(() =>
      parseSaved(JSON.stringify({ ...saved, missingNumber: "true" })),
    ).toThrow();
  });
  it("migruje v2 raz, zachowuje historię i odcina zadanie starej epoki", () => {
    const previous = record(
      defaults(),
      "add",
      { skipped: false, corrections: 0 },
      "2026-11-12",
    );
    previous.modules.add.level = 4;
    previous.modules.add.epoch = 8;
    previous.modules.add.trend = 1;
    previous.theme = "dark";
    const raw = JSON.stringify({ ...previous, version: 2 });
    const migrated = parseSaved(raw);
    expect(migrated.version).toBe(16);
    expect(migrated.history).toEqual(previous.history);
    expect(migrated.changes).toEqual(previous.changes);
    expect(migrated.theme).toBe("dark");
    expect(migrated.modules.add.level).toBe(4);
    for (const op of operations) {
      expect(migrated.modules[op].block).toEqual([]);
      expect(migrated.modules[op].trend).toBe(0);
      expect(migrated.modules[op].epoch).toBe(
        (previous.modules[op].epoch ?? 0) + 1,
      );
    }
    expect(parseSaved(JSON.stringify(migrated))).toEqual(migrated);
    const stale = record(
      migrated,
      "add",
      { skipped: false, corrections: 0 },
      "2026-11-12",
      { operation: "add", a: 5, b: 5, answer: 10, level: 4, epoch: 8 },
    );
    expect(stale.modules.add).toEqual(migrated.modules.add);
    expect(stale.history[0].solved).toBe(previous.history[0].solved + 1);
  });
  it("odrzuca szczegóły przekraczające dzienne sumy", () => {
    const s = record(
      defaults(),
      "add",
      { corrections: 0, skipped: false },
      "2026-11-10",
    );
    s.history[0].details!.add.solved = 99;
    expect(() => parseSaved(JSON.stringify(s))).toThrow("Szczegóły");
  });
  it("migruje v1 bez wymyślania brakujących statystyk", () => {
    const old = {
      ...defaults(),
      version: 1,
      history: [
        {
          date: "2026-11-10",
          solved: 7,
          skipped: 2,
          corrections: 3,
          modules: {
            add: 9,
            subtract: 0,
            multiply: 0,
            divide: 0,
            power: 0,
            root: 0,
          },
        },
      ],
    };
    const saved = parseSaved(JSON.stringify(old));
    expect(saved.version).toBe(16);
    expect(saved.history[0].solved).toBe(7);
    expect(saved.history[0].details).toBeUndefined();
    expect(saved.changes).toEqual([]);
  });
  it("nowe wyniki nie usuwają dziennych sum sprzed aktualizacji", () => {
    const s = defaults();
    s.history = [
      {
        date: "2026-11-10",
        solved: 7,
        skipped: 0,
        corrections: 0,
        modules: {
          add: 7,
          subtract: 0,
          multiply: 0,
          divide: 0,
          power: 0,
          root: 0,
          percent: 0,
          fraction: 0,
          polynomial: 0,
        },
      },
    ];
    const next = record(
      s,
      "add",
      { corrections: 0, skipped: false },
      "2026-11-10",
    );
    expect(next.history[0].solved).toBe(8);
    expect(next.history[0].details?.add.clean).toBe(1);
  });
  it("odrzuca zły format, datę, statystyki i przyszłą wersję", () => {
    for (const edit of [
      (s: ReturnType<typeof defaults>) => ({ ...s, version: 99 }),
      (s: ReturnType<typeof defaults>) => ({
        ...s,
        history: [
          {
            date: "2026-02-31",
            solved: 0,
            skipped: 0,
            corrections: 0,
            modules: {
              add: 0,
              subtract: 0,
              multiply: 0,
              divide: 0,
              power: 0,
              root: 0,
            },
          },
        ],
      }),
    ])
      expect(() => parseSaved(JSON.stringify(edit(defaults())))).toThrow();
  });
});
