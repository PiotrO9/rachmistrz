import { createProgressRepository } from "./persistence/database";
export { parseSaved } from "./persistence/migrations";
export {
  createProgressRepository,
  StorageError,
  STORAGE_KEY,
} from "./persistence/database";
export { broadcast, subscribe } from "./persistence/sync";
const repository = createProgressRepository();
export const readSaved = repository.read;
export const transact = repository.transact;
