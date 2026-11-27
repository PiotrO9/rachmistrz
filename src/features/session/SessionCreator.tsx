import { useEffect, useRef, useState } from "react";
import { operations, type SavedProgress } from "../../domain";
import {
  newRule,
  type SessionConfig,
  type SessionPreset,
} from "../../domain/session";
import { SessionRuleEditor } from "./SessionRuleEditor";
export function SessionCreator({
  saved,
  onClose,
  onStart,
  onSave,
  disabled,
  error,
  retry,
}: {
  saved: SavedProgress;
  onClose: () => void;
  onStart: (c: SessionConfig) => void;
  onSave: (p: SessionPreset) => Promise<boolean>;
  disabled: boolean;
  error: string;
  retry: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  const [rules, setRules] = useState([newRule("add")]);
  const [goal, setGoal] = useState<SessionConfig["goal"]>("tasks");
  const [count, setCount] = useState("10");
  const [custom, setCustom] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const available = operations.filter(
    (op) => !rules.some((r) => r.operation === op),
  );
  const config = { rules, goal, count: Number(count) };
  const valid =
    !disabled && Number.isSafeInteger(config.count) && config.count > 0;
  const duplicate = saved.sessionPresets.some((p) => p.name === name.trim());
  return (
    <dialog
      ref={dialog}
      className="sessionDialog"
      aria-labelledby="sessionTitle"
      onCancel={onClose}
    >
      <header>
        <h1 id="sessionTitle">Szybka sesja</h1>
        <button aria-label="Zamknij kreator" onClick={onClose}>
          ×
        </button>
      </header>
      {saved.sessionPresets.length > 0 && (
        <details className="sessionPresets">
          <summary>Moje zestawy ({saved.sessionPresets.length})</summary>
          {saved.sessionPresets.map((p) => (
            <button key={p.name} disabled={disabled} onClick={() => onStart(p)}>
              {p.name} →
            </button>
          ))}
        </details>
      )}
      <h2>Co chcesz ćwiczyć?</h2>
      {rules.map((rule, i) => (
        <SessionRuleEditor
          key={rule.operation}
          rule={rule}
          saved={saved}
          available={available}
          multiple={rules.length > 1}
          remove={() => setRules(rules.filter((r) => r !== rule))}
          update={(r) =>
            setRules(rules.map((old, index) => (index === i ? r : old)))
          }
        />
      ))}
      {available.length > 0 && (
        <button
          className="sessionAdd"
          onClick={() => setRules([...rules, newRule(available[0])])}
        >
          + Dodaj działanie
        </button>
      )}
      <h2>Kiedy kończymy?</h2>
      <div className="sessionRow">
        <select
          aria-label="Cel sesji"
          value={goal}
          onChange={(e) => setGoal(e.target.value as SessionConfig["goal"])}
        >
          <option value="tasks">Po określonej liczbie zadań</option>
          <option value="solved">Po poprawnych rozwiązaniach</option>
        </select>
        <select
          aria-label="Liczba zadań"
          value={custom ? "custom" : count}
          onChange={(e) => {
            setCustom(e.target.value === "custom");
            if (e.target.value !== "custom") setCount(e.target.value);
          }}
        >
          {[10, 25, 50].map((n) => (
            <option key={n}>{n}</option>
          ))}
          <option value="custom">Inna</option>
        </select>
        {custom && (
          <input
            aria-label="Własna liczba zadań"
            type="number"
            min="1"
            step="1"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        )}
      </div>
      {naming && (
        <label>
          Nazwa zestawu
          <input value={name} onChange={(e) => setName(e.target.value)} />
          {duplicate && <small>Wybierz inną nazwę zestawu.</small>}
        </label>
      )}
      {error && (
        <p role="alert">
          {error} <button onClick={retry}>Spróbuj ponownie</button>
        </p>
      )}
      <footer>
        <button
          className="sessionPrimary"
          disabled={!valid}
          onClick={() => onStart(config)}
        >
          Rozpocznij sesję
        </button>
        <button
          disabled={!valid || (naming && (!name.trim() || duplicate))}
          onClick={async () => {
            if (!naming) {
              setNaming(true);
              return;
            }
            if (await onSave({ ...config, name: name.trim() })) {
              setNaming(false);
              setName("");
            }
          }}
        >
          {naming ? "Zapisz zestaw" : "Zapisz jako zestaw"}
        </button>
      </footer>
    </dialog>
  );
}
