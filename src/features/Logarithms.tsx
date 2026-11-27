import { useRef } from "react";
import { logHint } from "../domain/logarithms";
import type { Action, TrainingState } from "../training/engine";
import "../styles/logarithms.css";

export function Logarithms({
  practice,
  disabled,
  dispatch,
}: {
  practice: NonNullable<TrainingState["logPractice"]>;
  disabled: boolean;
  dispatch: (action: Action) => Promise<boolean>;
}) {
  const { task, input, revealed } = practice;
  const field = useRef<HTMLInputElement>(null);
  const operator = { basic: "", sum: "+", difference: "−", quotient: "÷" }[
    task.kind
  ];
  const spoken = {
    basic: "",
    sum: "plus",
    difference: "minus",
    quotient: "podzielony przez",
  }[task.kind];
  const term = (n: number) => (
    <>
      log<sub>{task.base}</sub> {n}
    </>
  );
  const describe = (n: number) => `logarytm o podstawie ${task.base} z ${n}`;
  const next = () => {
    if (!disabled) {
      field.current?.focus();
      void dispatch({ type: revealed ? "logContinue" : "logSkip" });
    }
  };
  return (
    <section className="logarithms">
      <h1>Logarytmy</h1>
      <h2
        aria-live="polite"
        aria-label={
          describe(task.left) +
          (task.kind === "basic" ? "" : ` ${spoken} ${describe(task.right)}`)
        }
      >
        {term(task.left)}
        {task.kind !== "basic" && (
          <>
            {" "}
            {operator} {term(task.right)}
          </>
        )}
      </h2>
      <label>
        Twój wynik
        <input
          ref={field}
          inputMode="numeric"
          autoComplete="off"
          value={revealed ? task.answer : input}
          readOnly={disabled || revealed}
          onChange={(e) =>
            void dispatch({ type: "logInput", value: e.target.value })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!e.repeat) next();
            }
          }}
        />
      </label>
      {revealed && <p role="status">{logHint(task)}</p>}
      <button className="skip" disabled={disabled} onClick={next}>
        {revealed ? "Następne zadanie" : "Pomiń zadanie"}
      </button>
    </section>
  );
}
