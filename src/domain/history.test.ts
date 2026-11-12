import { expect, it } from "vitest";
import { defaults, record } from "../domain";
it("nie ocenia nowej epoki starym zadaniem po automatycznym powrocie na poziom", () => {
  let saved = defaults();
  saved.modules.add.level = 2;
  for (let i = 0; i < 16; i++)
    saved = record(
      saved,
      "add",
      { corrections: 0, skipped: false },
      "2026-11-11",
    );
  expect(saved.modules.add.level).toBe(3);
  for (let i = 0; i < 16; i++)
    saved = record(
      saved,
      "add",
      { corrections: 0, skipped: true },
      "2026-11-11",
    );
  expect(saved.modules.add.level).toBe(2);
  const before = saved;
  saved = record(
    saved,
    "add",
    { corrections: 0, skipped: false },
    "2026-11-11",
    { operation: "add", a: 20, b: 20, answer: 40, level: 2, epoch: 0 },
  );
  expect(saved.modules.add.block).toHaveLength(0);
  expect(saved.history[0].solved).toBe(before.history[0].solved + 1);
});

it("zachowuje najnowsze 365 dni po opóźnionym zapisie starszej odpowiedzi", () => {
  let saved = defaults();
  for (let i = 0; i < 365; i++) {
    const date = new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
    saved = record(saved, "add", { corrections: 0, skipped: false }, date);
  }
  const before = saved.history;
  saved = record(
    saved,
    "add",
    { corrections: 0, skipped: false },
    "2024-01-01",
  );
  expect(saved.history).toEqual(before);
});
