import { createTestRepository } from "../testing/repository";
import { IDBFactory } from "fake-indexeddb";
import { describe, it, expect, vi } from "vitest";
import { defaults, record } from "../domain";
import { createProgressRepository } from "./database";
describe("repozytorium postępu", () => {
  it("dwie karty migrują v2 tylko raz i zapisują odpowiedzi na najnowszym stanie", async () => {
    const factory = new IDBFactory();
    const repo = createProgressRepository({ factory, readLegacy: () => null });
    const second = createProgressRepository({
      factory,
      readLegacy: () => null,
    });
    await repo.read();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open("rachmistrz", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const old = defaults();
    old.modules.add.epoch = 4;
    old.modules.add.trend = 1;
    old.modules.add.block = [{ skipped: false, corrections: 0 }];
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("progress", "readwrite");
      tx.objectStore("progress").put({ ...old, version: 2 }, "state");
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    await Promise.all([repo.read(), second.read()]);
    await Promise.all(
      [repo, second].map((repository) =>
        repository.transact((s) =>
          record(s, "add", { skipped: false, corrections: 0 }, "2026-11-12"),
        ),
      ),
    );
    const current = await repo.read();
    expect(current.version).toBe(15);
    expect(current.modules.add.epoch).toBe(5);
    expect(current.modules.add.block).toHaveLength(2);
    expect(current.modules.add.trend).toBe(0);
    expect(current.history[0].solved).toBe(2);
    const raw = await new Promise<unknown>((resolve, reject) => {
      const request = db
        .transaction("progress")
        .objectStore("progress")
        .get("state");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    expect(raw).toEqual(current);
    repo.close();
    second.close();
    db.close();
  });
  it("migrates a v10 record without changing its existing counters", async () => {
    const { factory, repository } = createTestRepository(() => null);
    await repository.read();
    const previous = defaults();
    previous.viete.solved = 12;
    previous.missingNumber = true;
    await new Promise<void>((resolve, reject) => {
      const open = factory.open("rachmistrz", 1);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("progress", "readwrite");
        tx.objectStore("progress").put(
          { ...previous, version: 10, logarithms: undefined },
          "state",
        );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
    const migrated = await repository.read();
    expect(migrated).toEqual({ ...previous, revision: migrated.revision });
    expect(await repository.read()).toEqual(migrated);
    repository.close();
  });
  it.each([null, false, 0, ""])(
    "nie traktuje uszkodzonej wartości %j jako braku zapisu",
    async (value) => {
      const { factory, repository: repo } = createTestRepository(() => null);
      await repo.read();
      repo.close();
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = factory.open("rachmistrz", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("progress", "readwrite");
        tx.objectStore("progress").put(value, "state");
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
      });
      await expect(repo.read()).rejects.toMatchObject({ code: "validation" });
      await expect(repo.transact((s) => s)).rejects.toMatchObject({
        code: "validation",
      });
      repo.close();
      db.close();
    },
  );
  it("ponawia otwarcie po zablokowaniu i zamyka spóźnione połączenie", async () => {
    const factory = new IDBFactory();
    const original = factory.open.bind(factory);
    const request = {} as IDBOpenDBRequest;
    const open = vi
      .spyOn(factory, "open")
      .mockReturnValueOnce(request)
      .mockImplementation(original);
    const repo = createProgressRepository({ factory, readLegacy: () => null });
    const first = repo.read();
    const rejected = expect(first).rejects.toMatchObject({ code: "blocked" });
    request.onblocked?.(new Event("blocked") as IDBVersionChangeEvent);
    await rejected;
    expect((await repo.read()).version).toBe(15);
    expect(open).toHaveBeenCalledTimes(2);
    const close = vi.fn();
    Object.defineProperty(request, "result", { value: { close } });
    request.onsuccess?.(new Event("success"));
    expect(close).toHaveBeenCalledOnce();
    await repo.read();
    expect(open).toHaveBeenCalledTimes(2);
    repo.close();
  });
  it("uszkodzony rekord pozostaje nietknięty do jawnego importu", async () => {
    const { factory, repository: repo } = createTestRepository(() => null);
    await repo.read();
    repo.close();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = factory.open("rachmistrz", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("progress", "readwrite");
      tx.objectStore("progress").put({ version: 999 }, "state");
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    await expect(repo.read()).rejects.toMatchObject({ code: "validation" });
    await expect(
      repo.transact((s) =>
        record(s, "add", { skipped: false, corrections: 0 }, "2026-11-10"),
      ),
    ).rejects.toMatchObject({ code: "validation" });
    const raw = await new Promise<unknown>((resolve, reject) => {
      const req = db
        .transaction("progress")
        .objectStore("progress")
        .get("state");
      req.onsuccess = () => resolve(req.result as unknown);
      req.onerror = () => reject(req.error);
    });
    expect(raw).toEqual({ version: 999 });
    await repo.transact(() => defaults(), true);
    expect((await repo.read()).version).toBe(15);
    repo.close();
    db.close();
  });
  it("naprawdę migruje lokalne v1 i zachowuje oryginał", async () => {
    const old = { ...defaults(), version: 1 };
    old.modules.add.level = 4;
    const legacy = JSON.stringify(old),
      readLegacy = vi.fn(() => legacy);
    const repo = createProgressRepository({
      factory: new IDBFactory(),
      readLegacy,
    });
    const migrated = await repo.read();
    expect(migrated.modules.add.level).toBe(4);
    expect(migrated.theme).toBe("system");
    expect(migrated.revision).toBe(1);
    expect(readLegacy).toHaveBeenCalledOnce();
    await repo.read();
    expect(readLegacy).toHaveBeenCalledOnce();
    repo.close();
  });
});
