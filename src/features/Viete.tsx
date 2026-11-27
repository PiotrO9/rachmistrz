import { useRef, useState } from "react";
import { equationText, hasRoots, nextEquation } from "../domain/viete";
import "../styles/viete.css";

export function Viete({
  sequence,
  disabled,
  finish,
}: {
  sequence: number;
  disabled: boolean;
  finish: (skipped: boolean) => void;
}) {
  const [task, setTask] = useState(() => nextEquation(Math.random));
  const [lastSequence, setLastSequence] = useState(sequence);
  const [roots, setRoots] = useState(["", ""]);
  const firstInput = useRef<HTMLInputElement>(null);
  if (sequence !== lastSequence) {
    setLastSequence(sequence);
    setTask(nextEquation(Math.random, task));
    setRoots(["", ""]);
  }
  function complete(skipped: boolean) {
    firstInput.current?.focus();
    finish(skipped);
  }
  return (
    <section className="viete">
      <h1>Wzory Viète’a</h1>
      <p>Wpisz oba pierwiastki w dowolnej kolejności.</p>
      <h2 aria-live="polite">{equationText(task)}</h2>
      <div className="vieteRoots">
        {roots.map((value, index) => (
          <label key={index}>
            {index === 0 ? "Pierwszy pierwiastek" : "Drugi pierwiastek"}
            <input
              ref={index === 0 ? firstInput : undefined}
              value={value}
              autoComplete="off"
              readOnly={disabled}
              onChange={(event) => {
                const entry = event.target.value.replace("−", "-");
                if (!/^-?\d{0,2}$/.test(entry)) return;
                const next = roots.map((old, i) => (i === index ? entry : old));
                setRoots(next);
                if (hasRoots(task, next[0], next[1])) complete(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (!event.repeat && !disabled) complete(true);
                }
              }}
            />
          </label>
        ))}
      </div>
      <button
        className="skip"
        disabled={disabled}
        onClick={() => complete(true)}
      >
        Pomiń zadanie
      </button>
    </section>
  );
}
