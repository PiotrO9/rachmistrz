import { defaults, type SavedProgress } from "../domain";
import { migrateSaved, parseSaved } from "./migrations";
// Called synchronously inside the write transaction. Never read a card snapshot here.
export function readCurrentProgress(
  value: unknown,
  readLegacy: () => string | null,
  recover: boolean,
): SavedProgress {
  try {
    if (value !== undefined) return migrateSaved(value);
    const legacy = readLegacy();
    return legacy ? parseSaved(legacy) : defaults();
  } catch (error) {
    if (!recover) throw error;
    return defaults();
  }
}
