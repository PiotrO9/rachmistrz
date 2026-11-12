import { IDBFactory } from "fake-indexeddb";
import { createProgressRepository } from "../persistence/database";
export function createTestRepository(readLegacy: () => string | null) {
  const factory = new IDBFactory();
  return {
    factory,
    repository: createProgressRepository({ factory, readLegacy }),
  };
}
