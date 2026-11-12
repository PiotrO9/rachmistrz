import { useAnswerInput } from "./useAnswerInput";
import { symbols } from "../../domain";
import type { TrainingState } from "../../training/engine";
import { Icon } from "../../ui/Icon";
import { explainSolution } from "../../domain/solution";
const spoken = {
  add: "plus",
  subtract: "minus",
  multiply: "razy",
  divide: "podzielić przez",
  power: "do potęgi",
  root: "pierwiastek stopnia",
};
interface TrainingViewProps {
  state: Pick<
    TrainingState,
    "task" | "input" | "sequence" | "revealed" | "announcement"
  >;
  ready: boolean;
  busy: boolean;
  canInteract: boolean;
  storageOK: boolean;
  onInput: (value: string, inputType: string) => Promise<boolean>;
  onSkip: () => Promise<boolean>;
}
export function TrainingView({
  state,
  ready,
  busy,
  canInteract,
  storageOK,
  onInput,
  onSkip,
}: TrainingViewProps) {
  const answerInput = useAnswerInput({
    sequence: state.sequence,
    revealed: state.revealed,
    canInteract,
    busy,
    onInput,
    onSkip,
  });
  const solution = state.revealed ? explainSolution(state.task) : undefined;
  return (
    <section className="training" aria-label="Trening liczenia">
      <h1 className="srOnly">Trening liczenia w pamięci</h1>
      <p className="srOnly" role="status" aria-live="polite" aria-atomic="true">
        {state.announcement}{" "}
        {state.revealed
          ? `Wynik: ${state.task.answer}. Wybierz następne zadanie.`
          : `${state.task.operation === "root" ? `Pierwiastek stopnia ${state.task.b} z ${state.task.a}` : `${state.task.a} ${spoken[state.task.operation]} ${state.task.b}`}. Wpisz wynik.`}
      </p>
      <div className="exercise">
        <div
          className={`equation ${state.task.operation === "power" || state.task.operation === "root" ? "unaryEquation" : ""}`}
          aria-label={`${state.task.a} ${state.task.operation === "power" ? "^" : symbols[state.task.operation]} ${state.task.b}`}
        >
          {state.task.operation === "root" ? (
            <span className="radical">
              <sup>{state.task.b === 2 ? "" : state.task.b}</sup>√
              <span>{state.task.a}</span>
            </span>
          ) : state.task.operation === "power" ? (
            <span>
              {state.task.a}
              <sup>{state.task.b}</sup>
            </span>
          ) : (
            <>
              <span className="firstOperand">{state.task.a}</span>
              <span className="operator">{symbols[state.task.operation]}</span>
              <span className="secondOperand">{state.task.b}</span>
            </>
          )}
        </div>
        <div className="answerWrap">
          <span className="srOnly">Twoja odpowiedź</span>
          <input
            ref={answerInput.input}
            tabIndex={-1}
            onPointerDown={answerInput.onPointerDown}
            aria-label="Twoja odpowiedź"
            aria-describedby="answer-hint"
            readOnly={!canInteract || state.revealed}
            aria-busy={busy}
            name="answer"
            value={state.input}
            placeholder="?"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) =>
              void onInput(
                e.target.value,
                (e.nativeEvent as InputEvent).inputType ?? "",
              )
            }
            onKeyDown={answerInput.onKeyDown}
          />
          <span className="inputLine" />
        </div>
      </div>
      <p className="answerHint" id="answer-hint">
        {!storageOK
          ? "Wznów trening przyciskiem Spróbuj ponownie."
          : !ready
            ? "Odczytujemy postęp…"
            : state.revealed
              ? "Poprawny wynik. Przejdź dalej, gdy będziesz gotowy."
              : "Wpisz wynik, aby przejść dalej."}
      </p>
      {solution && (
        <details className="solutionMethod" key={state.sequence}>
          <summary>Pokaż sposób liczenia</summary>
          <p>{solution.explanation}</p>
          <ol>
            {solution.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </details>
      )}
      <span className="skip skipHint">
        {state.revealed ? "Następne zadanie" : "Pomiń zadanie"}{" "}
        <span className="keys">
          <kbd>enter</kbd>
          <span>/</span>
          <kbd>spacja</kbd>
        </span>
        <Icon name="arrow" />
      </span>
      <button
        className="skip skipButton"
        disabled={!canInteract || busy}
        onClick={answerInput.skipAndFocus}
      >
        {state.revealed ? "Następne zadanie" : "Pomiń zadanie"}{" "}
        <Icon name="arrow" />
      </button>
    </section>
  );
}
