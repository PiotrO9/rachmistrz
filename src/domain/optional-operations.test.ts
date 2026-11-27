import { expect, it } from "vitest";
import { defaults, nextTask, record } from "../domain";
import { parseSaved } from "../persistence/migrations";
import { seed } from "../testing/seed";

it("nie losuje opcjonalnych działań bez włączenia", () => {
  const saved = defaults();
  const random = seed(42);
  for (let i = 0; i < 500; i++) {
    expect([
      "power",
      "root",
      "percent",
      "fraction",
      "polynomial",
    ]).not.toContain(nextTask(saved.modules, undefined, random).operation);
  }
});

it("migruje prawdziwy rekord v3 bez zmiany starej adaptacji i historii", () => {
  const saved = record(
    defaults(),
    "add",
    { skipped: false, corrections: 1 },
    "2026-11-12",
  );
  saved.modules.add.epoch = 12;
  const old = JSON.parse(JSON.stringify({ ...saved, version: 3 }));
  for (const op of ["power", "root", "percent", "fraction", "polynomial"]) {
    delete old.modules[op];
    delete old.history[0].modules[op];
    delete old.history[0].details[op];
  }
  const migrated = parseSaved(JSON.stringify(old));
  expect(migrated).toEqual(saved);
  expect(migrated.modules.power.enabled).toBe(false);
  expect(migrated.modules.root.enabled).toBe(false);
  migrated.modules.root.enabled = true;
  expect(parseSaved(JSON.stringify(migrated))).toEqual(migrated);
});

it("dodaje wyłączone procenty do v4, zachowując historię i adaptację pierwiastków", () => {
  const initial = defaults();
  initial.modules.root.enabled = true;
  initial.modules.root.level = 3;
  const saved = record(
    initial,
    "root",
    { skipped: false, corrections: 1 },
    "2026-11-27",
  );
  const old = JSON.parse(JSON.stringify(saved));
  delete old.modules.percent;
  delete old.history[0].modules.percent;
  delete old.history[0].details.percent;
  expect(() => parseSaved(JSON.stringify(old))).toThrow();
  old.version = 4;
  expect(parseSaved(JSON.stringify(old))).toEqual(saved);
});

it("wymaga kompletu modułów w aktualnym zapisie", () => {
  const saved = defaults();
  const { root: _root, ...modules } = saved.modules;
  expect(_root.enabled).toBe(false);
  expect(() => parseSaved(JSON.stringify({ ...saved, modules }))).toThrow();
});

it("adds disabled fractions to v6 while preserving signed input, history and adaptation", () => {
  const saved = record(
    defaults(),
    "percent",
    { skipped: false, corrections: 1 },
    "2026-11-27",
  );
  saved.negativeNumbers = true;
  saved.modules.percent.enabled = true;
  const old = JSON.parse(JSON.stringify(saved));
  delete old.modules.fraction;
  delete old.history[0].modules.fraction;
  delete old.history[0].details.fraction;
  expect(() => parseSaved(JSON.stringify(old))).toThrow();
  old.version = 6;
  expect(parseSaved(JSON.stringify(old))).toEqual(saved);
});

it("migrates a v11 backup with history and preserves other modules", () => {
  const saved = record(
    defaults(),
    "fraction",
    { corrections: 1, skipped: false },
    "2026-11-27",
  );
  saved.logarithms.solved = 3;
  const old = JSON.parse(JSON.stringify(saved));
  delete old.modules.polynomial;
  delete old.history[0].modules.polynomial;
  delete old.history[0].details.polynomial;
  expect(() => parseSaved(JSON.stringify(old))).toThrow();
  old.version = 11;
  expect(parseSaved(JSON.stringify(old))).toEqual(saved);
});
