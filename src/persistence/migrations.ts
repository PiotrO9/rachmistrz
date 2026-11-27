import { HISTORY_LIMITS } from "../domain/config";
import {
  defaults,
  operations,
  CURRENT_PROGRESS_VERSION,
  type SavedProgress,
} from "../domain";
import {
  parseJson,
  validateStored,
  type LegacySaved,
  type PreviousSaved,
} from "./schema";

function upgradeV1(saved: LegacySaved): PreviousSaved {
  return {
    ...defaults(),
    version: 2,
    modules: saved.modules,
    history: saved.history,
  };
}

function upgradeV2(saved: PreviousSaved): SavedProgress {
  const modules = structuredClone(saved.modules);
  for (const op of operations) {
    modules[op] = {
      ...modules[op],
      block: [],
      trend: 0,
      epoch: (modules[op].epoch ?? 0) + 1,
    };
  }
  return { ...saved, version: CURRENT_PROGRESS_VERSION, modules };
}

// Normalization never changes the curriculum epoch or resets adaptation.
function normalizeProgress(saved: SavedProgress): SavedProgress {
  return {
    ...saved,
    modules: structuredClone(saved.modules),
    changes: structuredClone(saved.changes).slice(-HISTORY_LIMITS.levelChanges),
    history: structuredClone(saved.history)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, HISTORY_LIMITS.days),
  };
}

export function migrateStored(value: unknown): {
  saved: SavedProgress;
  upgraded: boolean;
} {
  const checked = validateStored(value);
  let current: SavedProgress;
  switch (checked.version) {
    case 1:
      current = upgradeV2(upgradeV1(checked));
      break;
    case 2:
      current = upgradeV2(checked);
      break;
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
      current = { ...checked, version: CURRENT_PROGRESS_VERSION };
      break;
    case CURRENT_PROGRESS_VERSION:
      current = checked;
      break;
  }
  if (checked.version < 13) {
    const modules = { ...current.modules };
    for (const op of operations) {
      const old = checked.modules[op];
      const untouched =
        old.level === 1 &&
        old.adaptive &&
        !old.epoch &&
        !old.trend &&
        old.block.length === 0 &&
        !checked.history.some((day) => day.modules[op] > 0) &&
        (checked.version === 1 ||
          !checked.changes.some((change) => change.operation === op));
      modules[op] = {
        ...modules[op],
        startPhase: untouched ? "opening" : undefined,
      };
    }
    current = { ...current, modules };
  }
  return {
    saved: normalizeProgress(current),
    upgraded: checked.version !== CURRENT_PROGRESS_VERSION,
  };
}

export function migrateSaved(value: unknown): SavedProgress {
  return migrateStored(value).saved;
}

export const parseSaved = (raw: string): SavedProgress =>
  migrateSaved(parseJson(raw));
