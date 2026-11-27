import console from "node:console";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "vite";
const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null, ws: false },
  appType: "custom",
});
const { defaults } = await server.ssrLoadModule("/src/domain/defaults.ts");
const { generate, nextTask, hasCarry } = await server.ssrLoadModule(
  "/src/domain/generators.ts",
);
const { adapt } = await server.ssrLoadModule("/src/domain/adaptation.ts");
await server.close();
const profiles = {
  carryWeak: { simple: 0.99, carry: 0.67, third: [0.93, 0.5] },
  balanced: { simple: 0.75, carry: 0.75, third: [0.87, 0.84] },
  fluent: { simple: 0.98, carry: 0.98, third: [0.97, 0.95] },
};
const runs = 100000;
function rng(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const results = [];
for (const [name, p] of Object.entries(profiles)) {
  for (const gated of [false, true]) {
    const stats = {
      name,
      gated,
      runs,
      by6: 0,
      by16: 0,
      by24: 0,
      firstCarryStepSum: 0,
      observedFirstCarry: 0,
      materialTasks: 0,
      carryTasks: 0,
      postCorrect: 0,
      postBelowHalf: 0,
    };
    const modules = defaults().modules;
    for (const m of Object.values(modules)) m.enabled = false;
    for (let run = 0; run < runs; run++) {
      const seed = Math.imul(run + 1, 2654435761);
      const response = rng(seed ^ 0x4a7590cc);
      let state = { enabled: true, adaptive: true, level: 2, block: [] },
        previous,
        seenCarry = false;
      for (let step = 1; step <= 24; step++) {
        modules.add = gated ? state : { ...state, adaptive: false }; // Disable targeting in the v15 generator only.
        const random = rng(seed ^ Math.imul(step, 2246822519));
        const task = nextTask(modules, previous, random);
        previous = task;
        const carry = hasCarry(task.a, task.b);
        const prob =
          task.materialLevel === 1 ? 0.96 : carry ? p.carry : p.simple;
        const clean = response() < prob;
        const correctable = response() < 0.5;
        if (task.materialLevel === 2 && carry && !seenCarry) {
          stats.firstCarryStepSum += step;
          stats.observedFirstCarry++;
          seenCarry = true;
        }
        if (task.materialLevel === 2) {
          stats.materialTasks++;
          stats.carryTasks += Number(carry);
        }
        state = adapt(
          state,
          {
            skipped: !clean && !correctable,
            corrections: Number(!clean && correctable),
          },
          5,
          task.materialLevel,
          gated ? task : undefined,
        );
        if (state.level < 2) break;
        if (state.level !== 3) continue;
        stats.by6 += Number(step <= 6);
        stats.by16 += Number(step <= 16);
        stats.by24++;
        // Paired independent unseen level-three items, generated from the real curriculum.
        const transfer = rng(seed ^ 0x74dad12f),
          transferResponse = rng(seed ^ 0x497c22db),
          seen = new Set();
        let score = 0;
        while (seen.size < 10) {
          const item = generate("add", 3, transfer, false, true);
          const key = [item.a, item.b].sort((a, b) => a - b).join("+");
          if (seen.has(key)) continue;
          seen.add(key);
          score += Number(
            transferResponse() < p.third[Number(hasCarry(item.a, item.b))],
          );
        }
        stats.postCorrect += score;
        stats.postBelowHalf += Number(score < 5);
        break;
      }
    }
    assert.ok(stats.by24 > 0 && stats.by24 <= runs);
    results.push(stats);
  }
}
await mkdir("output", { recursive: true });
await writeFile(
  "output/addition-carries.json",
  JSON.stringify(results, null, 2) + "\n",
);
console.table(results);
