import { expect, it } from "vitest";
import { defaults, nextTask, record } from "../domain";
import { parseSaved } from "../persistence/migrations";
import { seed } from "../testing/seed";

it("nie losuje opcjonalnych działań bez włączenia", () => {
  const saved = defaults();
  const random = seed(42);
  for (let i = 0; i < 500; i++) {
    expect(["power", "root"]).not.toContain(
      nextTask(saved.modules, undefined, random).operation,
    );
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
  for (const op of ["power", "root"]) {
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

it("wymaga nowych modułów w v4 zamiast cicho naprawiać uszkodzony zapis", () => {
  const saved = defaults();
  const { root: _root, ...modules } = saved.modules;
  expect(_root.enabled).toBe(false);
  expect(() => parseSaved(JSON.stringify({ ...saved, modules }))).toThrow();
});
