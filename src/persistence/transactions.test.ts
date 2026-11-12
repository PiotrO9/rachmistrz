import { createTestRepository } from "../testing/repository";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defaults, record } from "../domain";
import { STORAGE_KEY, type ProgressRepository } from "./database";
describe("transakcyjny zapis", () => {
  let repository: ProgressRepository;
  let transact: ProgressRepository["transact"];
  let readSaved: ProgressRepository["read"];
  beforeEach(() => {
    vi.stubGlobal("localStorage", { getItem: () => null });
    repository = createTestRepository(() =>
      localStorage.getItem(STORAGE_KEY),
    ).repository;
    transact = repository.transact;
    readSaved = repository.read;
  });
  afterEach(() => {
    repository.close();
    vi.unstubAllGlobals();
  });
  it("migruje legacy i sumuje jednoczesne odpowiedzi bez utraty danych", async () => {
    const legacy = { ...defaults(), version: 1 };
    const raw = JSON.stringify(legacy);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === STORAGE_KEY ? raw : null),
    });
    await transact(() => defaults(), true);
    await Promise.all(
      Array.from({ length: 24 }, () =>
        transact((s) =>
          record(s, "add", { corrections: 0, skipped: true }, "2026-11-10"),
        ),
      ),
    );
    const saved = await readSaved();
    expect(saved.history[0].skipped).toBe(24);
    expect(saved.history[0].details?.add.skipped).toBe(24);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });
  it("wyjątek przerywa transakcję i zachowuje poprzednią historię", async () => {
    const before = await readSaved();
    await expect(
      transact(() => {
        throw Error("test importu");
      }),
    ).rejects.toMatchObject({
      code: "write",
      cause: expect.objectContaining({ message: "test importu" }),
    });
    expect(await readSaved()).toEqual(before);
  });
  it("import jest zastąpieniem wewnątrz transakcji z nową rewizją", async () => {
    const before = await readSaved();
    const imported = defaults();
    imported.modules.divide.level = 5;
    const result = await transact(() => imported, true);
    expect(result.revision).toBe(before.revision + 1);
    expect((await readSaved()).modules.divide.level).toBe(5);
  });
});
