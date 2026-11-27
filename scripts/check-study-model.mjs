import process from "node:process";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, watch: null, ws: false },
  appType: "custom",
});
const { adapt } = await server.ssrLoadModule("/src/domain/adaptation.ts");
await server.close();
const phases = [undefined, "opening", "confirm"];
const input = [],
  expected = [];
for (let level = 1; level <= 5; level++) {
  for (const trend of [-1, 0, 1]) {
    for (const phase of level === 1 ? phases : [undefined]) {
      for (let skipped = 0; skipped <= 8; skipped++) {
        for (let corrected = 0; corrected <= 8 - skipped; corrected++) {
          for (let triple = 0; triple <= corrected; triple++) {
            const clean = 8 - skipped - corrected;
            let state = {
              level,
              trend,
              startPhase: phase,
              block: [],
              adaptive: true,
            };
            for (let i = 0; i < 8; i++) {
              state = adapt(state, {
                skipped: i < skipped,
                corrections:
                  i < skipped || i >= skipped + corrected
                    ? 0
                    : i < skipped + triple
                      ? 3
                      : 1,
              });
            }
            const endPhase =
              phase === "opening" && clean < 8 ? "confirm" : phase;
            input.push(
              [
                level,
                trend,
                phases.indexOf(endPhase),
                clean,
                skipped,
                corrected + 2 * triple,
                corrected,
              ].join(" "),
            );
            expected.push(
              [state.level, state.trend, phases.indexOf(state.startPhase)].join(
                " ",
              ),
            );
          }
        }
      }
    }
  }
}
const actual = execFileSync(process.argv[2] ?? "output/study.exe", ["audit"], {
  input: input.join("\n") + "\n",
  encoding: "utf8",
})
  .trim()
  .split(/\r?\n/);
assert.deepEqual(actual, expected);
process.stdout.write(expected.length + " block transitions matched\n");

const trace = [],
  states = [];
let seed = 71215;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
for (let run = 0; run < 250; run++) {
  const start = 1 + (run % 5);
  let state = {
    level: start,
    adaptive: true,
    block: [],
    startPhase: start === 1 ? "opening" : undefined,
  };
  for (let step = 0; step < 120; step++) {
    const material =
      state.level > 1 && random() < 0.2 ? state.level - 1 : state.level;
    const clean = random() < [0.98, 0.84, 0.6, 0.45][run % 4];
    const skipped = !clean && random() < 0.5;
    const corrections = clean || skipped ? 0 : 1;
    trace.push(
      [step ? 0 : start, material, Number(skipped), corrections].join(" "),
    );
    state = adapt(state, { skipped, corrections }, 5, material);
    states.push(
      [
        state.level,
        state.trend ?? 0,
        Number(!!state.checkFirstPromotion),
        state.block.length,
      ].join(" "),
    );
  }
}
const traceResult = execFileSync(
  process.argv[2] ?? "output/study.exe",
  ["trace"],
  { input: trace.join("\n") + "\n", encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/);
assert.deepEqual(traceResult, states);
process.stdout.write(states.length + " material-aware steps matched\n");
