import { Select } from "../../ui/Select";
import { LevelSelect } from "../settings/LevelSelect";
import {
  labels,
  operations,
  symbols,
  type SavedProgress,
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
import { formatRatio, formatAnswer } from "../../domain/fractions";

function SessionExample({
  rule,
  saved,
}: {
  rule: SessionRule;
  saved: SavedProgress;
}) {
  const task = sessionTask(
    { rules: [rule], count: 1, goal: "tasks" },
    { ...saved.modules, [rule.operation]: sessionModule(rule, saved) },
    saved,
    () => 0.62,
  );
  const answer = <mark>{formatAnswer(task)}</mark>;
  function expression() {
    if (task.operation === "polynomial")
      return (
        "Reszta z dzielenia (" +
        polynomialExpression(task) +
        ") przez (" +
        polynomialDivisor(task.a) +
        ")"
      );
    if (task.operation === "fraction")
      return [
        formatRatio(task.a, task.denominatorA),
        task.operator,
        formatRatio(task.b, task.denominatorB),
      ].join(" ");
    if (task.operation === "root")
      return "Pierwiastek stopnia " + task.b + " z " + task.a;
    if (task.operation === "power")
      return (
        <>
          {task.a}
          <sup>{task.b}</sup>
        </>
      );
    return (
      <>
        {task.missingOperand === "a" ? answer : task.a}{" "}
        {task.operation === "percent" ? "% z" : symbols[task.operation]}{" "}
        {task.missingOperand === "b" ? answer : task.b}
      </>
    );
  }
  return (
    <figure className="sessionExample">
      <figcaption>
        Przykład · {task.missingOperand ? "brakująca liczba" : "wynik"}
      </figcaption>
      <div>
        {expression()}
        {" = "}
        {task.missingOperand ? task.answer : answer}
      </div>
    </figure>
  );
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
        <Select<Operation>
          id={"session-op-" + rule.operation}
          label="Działanie"
          fieldHelp="Każde dodane działanie ma własną regułę trudności. Możesz połączyć kilka działań w jednej sesji."
          value={rule.operation}
          onChange={(op) =>
            update({
              ...newRule(op),
              mode: rule.mode,
              level: rule.level,
              frequent: rule.frequent,
            })
          }
          options={operations
            .filter((op) => op === rule.operation || available.includes(op))
            .map((op) => ({ value: op, label: labels[op] }))}
        />
        <Select<SessionRule["mode"]>
          id={"session-mode-" + rule.operation}
          label="Trudność"
          fieldHelp={
            {
              current:
                "Zaczynasz od swojego aktualnego poziomu (" +
                saved.modules[rule.operation].level +
                "). Trudność dostosowuje się do odpowiedzi tylko w tej sesji.",
              start:
                "Zaczynasz od poziomu " +
                rule.level +
                ". Kolejne zadania mogą być łatwiejsze lub trudniejsze, zależnie od Twoich odpowiedzi.",
              fixed:
                "Każde zadanie z tego działania będzie na poziomie " +
                rule.level +
                ". Odpowiedzi nie zmienią trudności w tej sesji.",
            }[rule.mode]
          }
          value={rule.mode}
          onChange={(mode) => update({ ...rule, mode })}
          options={[
            {
              value: "current",
              icon: "trend",
              label: "Mój poziom",
              shortLabel: "Mój poziom · " + saved.modules[rule.operation].level,
              description: "Start od Twojego poziomu, z adaptacją.",
            },
            {
              value: "start",
              icon: "flag",
              label: "Własny start",
              shortLabel: "Własny start · " + rule.level,
              description: "Trudność dostosuje się do odpowiedzi.",
            },
            {
              value: "fixed",
              icon: "equal",
              label: "Stały poziom",
              shortLabel: "Stały poziom · " + rule.level,
              description: "Każde zadanie będzie na wybranym poziomie.",
            },
          ]}
        />
        {rule.mode !== "current" && (
          <LevelSelect
            id={"session-level-" + rule.operation}
            label="Poziom"
            fieldHelp={
              rule.mode === "fixed"
                ? "Zadania z tego działania pozostaną na wybranym poziomie przez całą sesję."
                : "Pierwsze zadanie ma wybrany poziom startowy. Kolejne mogą zmieniać trudność."
            }
            operation={rule.operation}
            value={rule.level}
            onChange={(level) => update({ ...rule, level })}
          />
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
      <SessionExample rule={rule} saved={saved} />
      {(basic || multiple) && (
        <details>
          <summary>Więcej opcji</summary>
          {basic && (
            <>
              <Select<SessionRule["form"]>
                id={"session-form-" + rule.operation}
                label="Forma zadania"
                fieldHelp="Wybierz, czy wpisujesz wynik działania, czy brakującą liczbę, np. 7 × □ = 56."
                value={rule.form}
                onChange={(form) => update({ ...rule, form })}
                options={[
                  { value: "inherit", label: "Jak w ustawieniach" },
                  { value: "result", label: "Oblicz wynik" },
                  {
                    value: "mixed",
                    label: "Wymieszaj z brakującą liczbą",
                    shortLabel: "Forma mieszana",
                  },
                  { value: "missing", label: "Tylko brakująca liczba" },
                ]}
              />

              <Select<SessionRule["negatives"]>
                id={"session-negatives-" + rule.operation}
                label="Ujemne wyniki"
                fieldHelp="Opcja „Dopuść” pozwala losować także zadania z wynikiem poniżej zera. Wybór dotyczy tego działania w tej sesji."
                value={rule.negatives}
                onChange={(negatives) => update({ ...rule, negatives })}
                options={[
                  { value: "inherit", label: "Jak w ustawieniach" },
                  { value: "on", label: "Dopuść" },
                  { value: "off", label: "Wyłącz" },
                ]}
              />
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
