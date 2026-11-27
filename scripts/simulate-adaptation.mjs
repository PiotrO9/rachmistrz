import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, ws: false },
  appType: "custom",
});
const { adapt } = await server.ssrLoadModule("/src/domain/adaptation.ts");
const { REVIEW_SHARE, ADAPTATION } = await server.ssrLoadModule(
  "/src/domain/config.ts",
);
await server.close();

const runs = 10000;
const skilled = [0.99, 0.98, 0.95, 0.85, 0.7];
const solid = [0.95, 0.9, 0.8, 0.6, 0.4];
const beginner = [0.75, 0.5, 0.3, 0.2, 0.1];
const profiles = {
  skilled: [skilled],
  solid: [solid],
  beginner: [beginner],
  mixed: [solid, solid, skilled, beginner],
  learning: [[0.95, 0.9, 0.6, 0.75, 0.5]],
  review: [[0.98, 0.95, 0.55, 0.35, 0.2]],
};

function generator(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function simulate(
  profile,
  correctionShare,
  fastThrough,
  openingOnly = false,
  production = false,
) {
  const skills = profiles[profile];
  const duration = 120 * skills.length;
  const initial = ["review", "learning"].includes(profile) ? 3 : 1;
  const counts = {
    level2by8: 0,
    singleOpeningError: 0,
    recoveredBy16: 0,
    level2by16: 0,
    level2by24: 0,
    level3by24: 0,
    level4by48: 0,
    level4by32: 0,
    learnedWithin24: 0,
    learningWindows: 0,
  };
  const lateLevels = [0, 0, 0, 0, 0];
  const snapshots = {};
  for (let run = 0; run < runs; run++) {
    const random = generator(Math.imul(run + 1, 2654435761) >>> 0);
    const states = skills.map(() => ({
      enabled: true,
      adaptive: true,
      level: initial,
      startPhase: production && initial === 1 ? "opening" : undefined,
      block: [],
      trend: 0,
    }));
    const opening = skills.map(() => initial === 1);
    const first = {};
    let openingErrors = 0;
    let exposures = 0,
      learnedAt = null,
      reachedAfterLearning = false;
    for (let step = 1; step <= duration; step++) {
      const op = Math.floor(random() * skills.length);
      const state = states[op];
      const review = random() < REVIEW_SHARE && state.level > 1;
      const material = state.level - Number(review);
      const learned =
        profile === "learning" && material === 3 && exposures >= 30;
      const clean = random() < (learned ? 0.9 : skills[op][material - 1]);
      if (step <= 8 && !clean) openingErrors++;
      const correctable = random() < correctionShare;
      const outcome = {
        skipped: !clean && !correctable,
        corrections: Number(!clean && correctable),
      };
      if (step > 60) lateLevels[state.level - 1]++;
      const next = adapt(state, outcome);
      if (!clean) opening[op] = false;
      if (
        (!openingOnly || opening[op]) &&
        state.level <= fastThrough &&
        clean &&
        state.block.length === ADAPTATION.blockSize - 1 &&
        state.block.every((x) => !x.skipped && x.corrections === 0)
      ) {
        next.level = state.level + 1;
        next.epoch = (state.epoch ?? 0) + 1;
        next.trend = 0;
      }
      states[op] = next;
      if (next.level > state.level) first[next.level] ??= step;
      if (learnedAt !== null && step - learnedAt <= 24 && next.level >= 4)
        reachedAfterLearning = true;
      if (material === 3 && ++exposures === 30 && profile === "learning")
        learnedAt = step;
      if (profile === "mixed" && [20, 40, 60, 480].includes(step)) {
        snapshots[step] ??= [0, 0, 0, 0];
        states.forEach((s, i) => {
          snapshots[step][i] += s.level;
        });
      }
    }
    if (profile === "skilled" && openingErrors === 1) {
      counts.singleOpeningError++;
      if (first[2] <= 16) counts.recoveredBy16++;
    }
    for (const [level, deadline] of [
      [2, 8],
      [2, 16],
      [2, 24],
      [3, 24],
      [4, 48],
      [4, 32],
    ]) {
      if (first[level] <= deadline) counts["level" + level + "by" + deadline]++;
    }
    if (learnedAt !== null && learnedAt + 24 <= duration) {
      counts.learningWindows++;
      counts.learnedWithin24 += Number(reachedAfterLearning);
    }
  }
  for (const levels of Object.values(snapshots))
    levels.forEach((x, i) => {
      levels[i] = x / runs;
    });
  return {
    profile,
    correctionShare,
    fastThrough,
    openingOnly,
    production,
    runs,
    counts,
    lateLevels,
    meanLevels: snapshots,
  };
}

const results = [];
for (const profile of Object.keys(profiles))
  for (const share of [0.8, 0.2]) {
    for (const fast of [0, 1, 2]) results.push(simulate(profile, share, fast));
    results.push(simulate(profile, share, 1, true));
    results.push(simulate(profile, share, 0, false, true));
    results.push(simulate(profile, share, 2, true));
    results.push(simulate(profile, share, 4, true));
  }
await mkdir("output", { recursive: true });
await writeFile(
  "output/adaptation-simulation.json",
  JSON.stringify(results, null, 2) + "\n",
);
