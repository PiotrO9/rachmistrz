import { createDatabaseConnection } from "./connection";
import { readCurrentProgress } from "./record";
import { type SavedProgress } from "../domain";
import { migrateSaved, migrateStored } from "./migrations";
export const STORAGE_KEY = "rachmistrz:v1";
export { StorageError } from "./errors";
import { storageFailure } from "./errors";
export interface ProgressRepository {
  read: () => Promise<SavedProgress>;
  transact: (
    mutate: (saved: SavedProgress) => SavedProgress,
    recover?: boolean,
  ) => Promise<SavedProgress>;
  close: () => void;
}
interface Options {
  factory?: IDBFactory;
  name?: string;
  readLegacy?: () => string | null;
}
export function createProgressRepository(
  options: Options = {},
): ProgressRepository {
  const connection = createDatabaseConnection(options);
  const readLegacy =
    options.readLegacy ??
    (() => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    });
  async function transact(
    mutate: (saved: SavedProgress) => SavedProgress,
    recover = false,
  ): Promise<SavedProgress> {
    const db = await connection.open();
    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction("progress", "readwrite");
      } catch (error) {
        reject(storageFailure(error, "write"));
        return;
      }
      const store = tx.objectStore("progress");
      let result: SavedProgress;
      let error: unknown;
      store.get("state").onsuccess = (e) => {
        try {
          const value: unknown = (e.target as IDBRequest<unknown>).result;
          const current = readCurrentProgress(value, readLegacy, recover);
          result = migrateSaved({
            ...mutate(current),
            revision: current.revision + 1,
          });
          store.put(result, "state");
        } catch (cause) {
          error = cause;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => {
        error = tx.error;
      };
      tx.onabort = () => reject(storageFailure(error ?? tx.error, "write"));
    });
  }
  async function read(): Promise<SavedProgress> {
    const db = await connection.open();
    let value: unknown;
    try {
      value = await new Promise<unknown>((resolve, reject) => {
        const tx = db.transaction("progress", "readonly");
        const req = tx.objectStore("progress").get("state");
        req.onsuccess = () => resolve(req.result as unknown);
        req.onerror = () => reject(req.error);
        tx.onabort = () => reject(tx.error);
      });
      const record = value === undefined ? undefined : migrateStored(value);
      // Persist an upgrade once, re-reading the latest state inside the transaction.
      return record && !record.upgraded
        ? record.saved
        : await transact((s) => s);
    } catch (error) {
      throw storageFailure(error, "read");
    }
  }
  return {
    read,
    transact,
    close: connection.close,
  };
}
