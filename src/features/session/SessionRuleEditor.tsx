import {
  labels,
  operations,
  LEVELS,
  symbols,
  type SavedProgress,
  type Level,
  type Operation,
} from "../../domain";
import {
  sessionTask,
  sessionModule,
  newRule,
  type SessionRule,
} from "../../domain/session";
import {
  polynomialExpression,
  polynomialDivisor,
} from "../../domain/polynomial";
import { formatRatio } from "../../domain/fractions";

function example(rule: SessionRule, saved: SavedProgress) {
  const task = sessionTask(
    { rules: [rule], count: 1, goal: "tasks" },
    { ...saved.modules, [rule.operation]: sessionModule(rule, saved) },
    saved,
    () => 0.62,
  );
  if (task.operation === "polynomial")
    return (
      "Reszta z (" +
      polynomialExpression(task) +
      ") ÷ (" +
      polynomialDivisor(task.a) +
      ")"
    );
  if (task.operation === "fraction")
    return [
      formatRatio(task.a, task.denominatorA),
      task.operator,
      formatRatio(task.b, task.denominatorB),
      "= □",
    ].join(" ");
  if (task.operation === "root")
    return "Pierwiastek stopnia " + task.b + " z " + task.a;
  return [
    task.missingOperand === "a" ? "□" : task.a,
    task.operation === "power"
      ? "^"
      : task.operation === "percent"
        ? "% z"
        : symbols[task.operation],
    task.missingOperand === "b" ? "□" : task.b,
    "=",
    task.missingOperand ? task.answer : "□",
  ].join(" ");
}
export function SessionRuleEditor({
  rule,
  saved,
  available,
  update,
  remove,
  multiple,
}: {
  rule: SessionRule;
  saved: SavedProgress;
  available: Operation[];
  update: (r: SessionRule) => void;
  remove: () => void;
  multiple: boolean;
}) {
  const basic = ["add", "subtract", "multiply", "divide"].includes(
    rule.operation,
  );
  return (
    <fieldset className="sessionRule">
      <legend className="srOnly">{labels[rule.operation]}</legend>
      <div className="sessionRow">
        <select
          aria-label="Działanie"
          value={rule.operation}
          onChange={(e) =>
            update({
              ...newRule(e.target.value as Operation),
              mode: rule.mode,
              level: rule.level,
              frequent: rule.frequent,
            })
          }
        >
          {operations
            .filter((op) => op === rule.operation || available.includes(op))
            .map((op) => (
              <option key={op} value={op}>
                {labels[op]}
              </option>
            ))}
        </select>
        <select
          aria-label="Trudność"
          value={rule.mode}
          onChange={(e) =>
            update({ ...rule, mode: e.target.value as SessionRule["mode"] })
          }
        >
          <option value="current">
            Mój poziom ({saved.modules[rule.operation].level}) · adaptacyjnie
          </option>
          <option value="start">Zacznij od poziomu…</option>
          <option value="fixed">Trzymaj poziom…</option>
        </select>
        {rule.mode !== "current" && (
          <select
            aria-label="Poziom"
            value={rule.level}
            onChange={(e) =>
              update({ ...rule, level: Number(e.target.value) as Level })
            }
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.value}
              </option>
            ))}
          </select>
        )}
        {multiple && (
          <button
            type="button"
            aria-label={"Usuń " + labels[rule.operation]}
            onClick={remove}
          >
            ×
          </button>
        )}
      </div>
      <p className="sessionExample">Przykład · {example(rule, saved)}</p>
      {(basic || multiple) && (
        <details>
          <summary>Więcej opcji</summary>
          {basic && (
            <>
              <label>
                Forma zadania
                <select
                  value={rule.form}
                  onChange={(e) =>
                    update({
                      ...rule,
                      form: e.target.value as SessionRule["form"],
                    })
                  }
                >
                  <option value="inherit">Jak w ustawieniach</option>
                  <option value="result">Oblicz wynik</option>
                  <option value="mixed">Wymieszaj z brakującą liczbą</option>
                  <option value="missing">Tylko brakująca liczba</option>
                </select>
              </label>
              <label>
                Ujemne wyniki
                <select
                  value={rule.negatives}
                  onChange={(e) =>
                    update({
                      ...rule,
                      negatives: e.target.value as SessionRule["negatives"],
                    })
                  }
                >
                  <option value="inherit">Jak w ustawieniach</option>
                  <option value="on">Dopuść</option>
                  <option value="off">Wyłącz</option>
                </select>
              </label>
            </>
          )}
          {multiple && (
            <label>
              <input
                type="checkbox"
                checked={rule.frequent}
                onChange={(e) =>
                  update({ ...rule, frequent: e.target.checked })
                }
              />{" "}
              Ćwicz częściej
            </label>
          )}
        </details>
      )}
    </fieldset>
  );
}
