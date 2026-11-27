import { useState } from "react";
import type { useTraining } from "../../useTraining";
import { labels } from "../../domain";
import type { SessionConfig } from "../../domain/session";
import { TrainingView } from "../training/TrainingView";
import { SessionCreator } from "./SessionCreator";
import "../../styles/session.css";

export function SessionTraining({
  training,
}: {
  training: ReturnType<typeof useTraining>;
}) {
  const [open, setOpen] = useState(false);
  const { state, dispatch, canInteract, busy } = training;
  const q = state.quick;
  async function start(config: SessionConfig) {
    if (await dispatch({ type: "startQuick", config })) setOpen(false);
  }
  if (q?.finished)
    return (
      <section className="sessionSummary">
        <h1>Sesja zakończona</h1>
        {q.config.rules.map((r) => (
          <p key={r.operation}>
            {labels[r.operation]} ·{" "}
            {r.mode === "fixed" ? "stały poziom " : "poziom "}
            {q.modules[r.operation].level}
          </p>
        ))}
        <dl>
          <div>
            <dt>Rozwiązane</dt>
            <dd>{q.solved}</dd>
          </div>
          <div>
            <dt>Pominięte</dt>
            <dd>{q.skipped}</dd>
          </div>
        </dl>
        <footer>
          <button
            className="sessionPrimary"
            disabled={!canInteract || busy}
            onClick={() => void start(q.config)}
          >
            Powtórz sesję
          </button>
          <button
            disabled={!canInteract || busy}
            onClick={() => void dispatch({ type: "exitQuick" })}
          >
            Wróć do treningu
          </button>
        </footer>
      </section>
    );
  return (
    <>
      <button
        className="sessionEntry"
        disabled={!canInteract || busy}
        onClick={() =>
          q ? void dispatch({ type: "endQuick" }) : setOpen(true)
        }
      >
        {q ? "Zakończ sesję" : "Szybka sesja"}
      </button>
      <TrainingView
        key={q ? "quick" : "regular"}
        {...training}
        state={q?.exercise ?? state}
        onInput={(value, inputType) =>
          dispatch({ type: q ? "quickInput" : "input", value, inputType })
        }
        onSkip={() => dispatch({ type: q ? "quickSkip" : "skip" })}
      />
      {open && (
        <SessionCreator
          saved={state.saved}
          onClose={() => setOpen(false)}
          onStart={(config) => void start(config)}
          onSave={(preset) => dispatch({ type: "saveSessionPreset", preset })}
          disabled={!canInteract || busy}
          error={training.error}
          retry={() => void training.retry()}
        />
      )}
    </>
  );
}
