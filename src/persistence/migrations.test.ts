import { describe, it, expect } from "vitest";
import { defaults, record, operations } from "../domain";
import { parseSaved } from "./migrations";
describe("format danych", () => {
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
    expect(migrated.version).toBe(5);
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
    expect(saved.version).toBe(5);
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
