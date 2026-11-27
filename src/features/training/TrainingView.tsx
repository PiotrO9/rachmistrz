import { useAnswerInput } from "./useAnswerInput";
import { formatAnswer, formatRatio } from "../../domain/fractions";
import { symbols, type Task } from "../../domain";
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
  percent: "procent z",
};
function spokenEquation(task: Task) {
  if (task.missingOperand)
    return [
      task.missingOperand === "a" ? "brakująca liczba" : task.a,
      spoken[task.operation],
      task.missingOperand === "b" ? "brakująca liczba" : task.b,
      "równa się",
      task.answer,
    ].join(" ");
  if (task.operation === "fraction") {
    const sign = {
      "+": spoken.add,
      "−": spoken.subtract,
      "×": spoken.multiply,
      "÷": spoken.divide,
    }[task.operator];
    return [
      task.a,
      "przez",
      task.denominatorA,
      sign,
      task.b,
      "przez",
      task.denominatorB,
    ].join(" ");
  }
  if (task.operation === "root")
    return ["Pierwiastek stopnia", task.b, "z", task.a].join(" ");
  return [task.a, spoken[task.operation], task.b].join(" ");
}
function Fraction({ n, d }: { n: number; d: number }) {
  return (
    <span className="stackedFraction">
      <span>{n}</span>
      <span>{d}</span>
    </span>
  );
}
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
    signedInput: !!state.task.signedInput,
    sequence: state.sequence,
    revealed: state.revealed,
    canInteract,
    busy,
    onInput,
    onSkip,
  });
  const missing = state.task.missingOperand;
  const instruction = missing ? "Wpisz brakującą liczbę" : "Wpisz wynik";
  const fraction = state.task.operation === "fraction" ? state.task : undefined;
  const fractionLabel =
    fraction &&
    [
      formatRatio(fraction.a, fraction.denominatorA),
      fraction.operator,
      formatRatio(fraction.b, fraction.denominatorB),
    ].join(" ");
  const solution = state.revealed ? explainSolution(state.task) : undefined;
  return (
    <section className="training" aria-label="Trening liczenia">
      <h1 className="srOnly">Trening liczenia w pamięci</h1>
      <p className="srOnly" role="status" aria-live="polite" aria-atomic="true">
        {state.announcement}{" "}
        {state.revealed
          ? `${missing ? "Brakująca liczba" : "Wynik"}: ${formatAnswer(state.task)}. Wybierz następne zadanie.`
          : `${spokenEquation(state.task)}. ${instruction}.`}
      </p>
      <div className="exercise">
        <div
          className={`equation ${state.task.operation === "power" || state.task.operation === "root" ? "unaryEquation" : ""}`}
          aria-label={
            missing
              ? spokenEquation(state.task)
              : (fractionLabel ??
                `${state.task.a} ${state.task.operation === "power" ? "^" : state.task.operation === "percent" ? spoken.percent : symbols[state.task.operation]} ${state.task.b}`)
          }
        >
          {missing ? (
            <>
              <span className="firstOperand">
                {missing === "a" ? "□" : state.task.a}
              </span>
              <span className="operator">{symbols[state.task.operation]}</span>
              <span className="secondOperand">
                {missing === "b" ? "□" : state.task.b}
              </span>
              <span className="equals">=</span>
              <span className="knownResult">{state.task.answer}</span>
            </>
          ) : fraction ? (
            <>
              <span className="firstOperand">
                <Fraction n={fraction.a} d={fraction.denominatorA} />
              </span>
              <span className="operator">{fraction.operator}</span>
              <span className="secondOperand">
                <Fraction n={fraction.b} d={fraction.denominatorB} />
              </span>
            </>
          ) : state.task.operation === "root" ? (
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
              <span className="firstOperand">
                {state.task.a}
                {state.task.operation === "percent" && "%"}
              </span>
              <span className="operator">
                {state.task.operation === "percent"
                  ? "z"
                  : symbols[state.task.operation]}
              </span>
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
            aria-label={missing ? "Brakująca liczba" : "Twoja odpowiedź"}
            aria-describedby="answer-hint"
            readOnly={!canInteract || state.revealed}
            aria-busy={busy}
            name="answer"
            value={state.input}
            placeholder="?"
            type="text"
            inputMode={state.task.signedInput ? "text" : "numeric"}
            pattern={
              fraction
                ? undefined
                : state.task.signedInput
                  ? "-?[0-9]*"
                  : "[0-9]*"
            }
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
      {fraction && !state.revealed && (
        <button
          type="button"
          className="fractionSlash"
          aria-label="Wstaw kreskę ułamkową"
          disabled={!canInteract || busy}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            const field = answerInput.input.current;
            if (!field) return;
            const start = field.selectionStart ?? field.value.length;
            const end = field.selectionEnd ?? start;
            const value =
              field.value.slice(0, start) + "/" + field.value.slice(end);
            field.focus({ preventScroll: true });
            void onInput(value, "insertText");
          }}
        >
          /
        </button>
      )}
      <p className="answerHint" id="answer-hint">
        {!storageOK
          ? "Wznów trening przyciskiem Spróbuj ponownie."
          : !ready
            ? "Odczytujemy postęp…"
            : state.revealed
              ? missing
                ? "Brakująca liczba jest w polu odpowiedzi. Przejdź dalej, gdy będziesz gotowy."
                : "Poprawny wynik. Przejdź dalej, gdy będziesz gotowy."
              : fraction
                ? "Wpisz wynik jako ułamek, np. 3/4, lub liczbę całkowitą."
                : `${instruction}, aby przejść dalej.`}
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
