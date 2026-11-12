import type { OperationProgress, Outcome, Level } from "./types";
import { ADAPTATION, LEVELS } from "./config";
export function adapt(
  module: OperationProgress,
  outcome: Outcome,
): OperationProgress {
  if (!module.adaptive) return { ...module, block: [], trend: 0 };
  const block = [...module.block, outcome];
  if (block.length < ADAPTATION.blockSize) return { ...module, block };
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
  const delta = Math.abs(trend) >= ADAPTATION.consecutiveBlocks ? direction : 0;
  const level = Math.max(
    LEVELS[0].value,
    Math.min(LEVELS[LEVELS.length - 1].value, module.level + delta),
  ) as Level;
  return {
    ...module,
    level,
    ...(level !== module.level ? { epoch: (module.epoch ?? 0) + 1 } : {}),
    block: [],
    trend: delta ? 0 : trend,
  };
}
