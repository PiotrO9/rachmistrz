import type { OperationProgress, Outcome, Level, Task } from "./types";
import { ADAPTATION, LEVELS } from "./config";
import { demonstratesCarry } from "./addition-evidence";
/** The material-specific rules apply only to regular training tasks with known material. */
export function adapt(
  module: OperationProgress,
  outcome: Outcome,
  maxLevel: Level = LEVELS[LEVELS.length - 1].value,
  materialLevel?: Level,
  task?: Task,
): OperationProgress {
  const next = adaptBlock(module, outcome, maxLevel);
  if (!module.adaptive || maxLevel <= 2) return next;
  let level = next.level;
  let results = module.materialResults;
  let checking = module.checkFirstPromotion;
  if (
    materialLevel === module.level &&
    (materialLevel === 2 || materialLevel === 3)
  ) {
    const clean = !outcome.skipped && outcome.corrections === 0;
    const limit =
      materialLevel === 2
        ? ADAPTATION.levelTwoCleanRun
        : ADAPTATION.levelThreeCleanRun;
    const checkCarries = materialLevel === 2 && task?.operation === "add";
    const result =
      clean && checkCarries && demonstratesCarry(task) ? "carry" : clean;
    results = (results ?? []).concat(result).slice(-limit);
    if (
      checking &&
      results.filter((ok) => !ok).length >= ADAPTATION.firstPromotionErrors
    ) {
      level = 1;
    } else if (
      results.length === limit &&
      results.every(Boolean) &&
      (!checkCarries ||
        results.filter((value) => value === "carry").length >=
          ADAPTATION.requiredAdditionCarries)
    ) {
      level = Math.min(maxLevel, materialLevel + 1) as Level;
    }
    if (checking && results.length >= ADAPTATION.firstPromotionWindow)
      checking = undefined;
    if (!checking) {
      const lastError = results.lastIndexOf(false);
      if (lastError >= 0) results = results.slice(lastError + 1);
      if (results.length === limit && level === module.level)
        results = results.slice(1);
    }
  }
  if (level !== module.level) {
    return {
      ...next,
      level,
      epoch: (module.epoch ?? 0) + 1,
      block: [],
      trend: 0,
      startPhase: undefined,
      materialResults: undefined,
      checkFirstPromotion:
        module.level === 1 && level === 2 && module.startPhase
          ? true
          : undefined,
    };
  }
  return { ...next, materialResults: results, checkFirstPromotion: checking };
}

function adaptBlock(
  module: OperationProgress,
  outcome: Outcome,
  maxLevel: Level = LEVELS[LEVELS.length - 1].value,
): OperationProgress {
  if (!module.adaptive) return { ...module, block: [], trend: 0 };
  const cleanAnswer = !outcome.skipped && outcome.corrections === 0;
  const phase = module.level === 1 ? module.startPhase : undefined;
  const startPhase = phase === "opening" && !cleanAnswer ? "confirm" : phase;
  const block = [...module.block, outcome];
  if (block.length < ADAPTATION.blockSize)
    return { ...module, block, startPhase };
  const skips = block.filter((x) => x.skipped).length;
  const clean = block.filter((x) => !x.skipped && x.corrections === 0).length;
  const corrected = block.filter((x) => x.corrections > 0).length;
  const edits = block.reduce((sum, x) => sum + x.corrections, 0);
  const direction =
    skips >= ADAPTATION.skipsToLower ||
    corrected >= ADAPTATION.correctedToLower ||
    edits >= ADAPTATION.correctionsToLower
      ? -1
      : clean >= ADAPTATION.cleanToAdvance && skips === 0
        ? 1
        : 0;
  const previous = module.trend ?? 0;
  const trend =
    direction === 0
      ? 0
      : Math.sign(previous) === direction
        ? previous + direction
        : direction;
  const perfect = clean === ADAPTATION.blockSize;
  const ready = Math.abs(trend) >= ADAPTATION.consecutiveBlocks;
  const promote =
    direction === 1 &&
    (startPhase === "opening" || ready) &&
    (!startPhase || perfect);
  const delta = promote ? 1 : ready && direction === -1 ? -1 : 0;
  const level = Math.max(
    LEVELS[0].value,
    Math.min(maxLevel, module.level + delta),
  ) as Level;
  return {
    ...module,
    level,
    ...(level !== module.level ? { epoch: (module.epoch ?? 0) + 1 } : {}),
    block: [],
    startPhase: level === 1 ? startPhase : undefined,
    trend: delta ? 0 : Math.sign(trend),
  };
}
