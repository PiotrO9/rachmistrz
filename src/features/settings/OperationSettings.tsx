import { useState } from "react";
import { Select } from "../../ui/Select";
import { FieldLabel } from "../../ui/FieldLabel";
import {
  labels,
  symbols,
  getLevel,
  levelDescription,
  ADAPTATION,
  type Operation,
  type OperationProgress,
} from "../../domain";
import type { SettingsAction } from "../../training/engine";
import { LevelSelect } from "./LevelSelect";
import { Switch } from "../../ui/Switch";

function describeAdaptation(
  op: Operation,
  progress: OperationProgress,
): string {
  if (progress.startPhase === "opening")
    return `Rozwiąż pierwsze ${ADAPTATION.blockSize} zadań bez poprawek i pominięć, aby awansować.`;
  if (progress.startPhase === "confirm")
    return "Awans wymaga dobrego bloku i kolejnego bloku bez poprawek ani pominięć.";
  if (progress.level === 2 || progress.level === 3) {
    const required =
      progress.level === 2
        ? ADAPTATION.levelTwoCleanRun
        : ADAPTATION.levelThreeCleanRun;
    const sentences = [
      `Aby awansować szybciej, rozwiąż samodzielnie ${required} kolejnych zadań z materiału tego poziomu.`,
    ];
    if (op === "add" && progress.level === 2)
      sentences.push(
        `W tej serii rozwiąż pełne sumy dwóch liczb dwucyfrowych z przeniesieniem. Wymagane minimum to ${ADAPTATION.requiredAdditionCarries}.`,
      );
    if (progress.checkFirstPromotion)
      sentences.push(
        `W pierwszych ${ADAPTATION.firstPromotionWindow} zadaniach z nowego materiału ${ADAPTATION.firstPromotionErrors} odpowiedzi z poprawką lub pominięciem oznaczają powrót na poziom 1.`,
      );
    return sentences.join(" ");
  }
  if (progress.trend === 1)
    return "Poprzedni blok był łatwy. Kolejny dobry blok może podnieść poziom.";
  if (progress.trend === -1)
    return "Poprzedni blok był trudny. Kolejny trudny blok może obniżyć poziom.";
  return `Liczba kolejnych bloków o tym samym kierunku potrzebna do zmiany poziomu wynosi ${ADAPTATION.consecutiveBlocks}.`;
}

export function OperationSettings({
  operation: op,
  progress: m,
  last,
  controlsDisabled,
  dispatch,
}: {
  operation: Operation;
  progress: OperationProgress;
  last: boolean;
  controlsDisabled: boolean;
  dispatch: (action: SettingsAction) => Promise<boolean>;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`module ${!m.enabled ? "muted" : ""}`}>
      <div className="moduleHeading">
        <span className="operationBadge">{symbols[op]}</span>
        <div className="moduleTitle">
          <h2>{labels[op]}</h2>
          {m.enabled && (
            <p>
              Poziom {m.level} · {getLevel(m.level).name} ·{" "}
              {m.adaptive ? "Automatyczny" : "Stały"}
            </p>
          )}
        </div>
        <Switch
          checked={m.enabled}
          disabled={last || controlsDisabled}
          label={`Włącz ${op === "polynomial" ? "resztę z dzielenia wielomianu" : labels[op].toLowerCase()}`}
          onChange={() =>
            void dispatch({
              type: "module",
              op,
              change: { enabled: !m.enabled },
            })
          }
        />
        <button
          type="button"
          className="moduleCustomize"
          aria-label={`Dostosuj: ${labels[op]}`}
          aria-expanded={expanded}
          aria-controls={`options-${op}`}
          onClick={() => setExpanded(!expanded)}
        >
          Dostosuj <span aria-hidden="true" />
        </button>
      </div>
      <div
        className="moduleOptions"
        id={`options-${op}`}
        inert={!expanded}
        data-open={expanded}
      >
        <div className="moduleClip">
          <div className="moduleFields">
            <div className="levelRow">
              <div>
                <FieldLabel
                  htmlFor={`level-${op}`}
                  label="Poziom trudności"
                  help={
                    labels[op] +
                    ": ręczna zmiana poziomu rozpoczyna nowy blok adaptacji. Opisy na liście pokazują zakres zadań."
                  }
                />
              </div>
              <LevelSelect
                id={`level-${op}`}
                disabled={controlsDisabled}
                label={`Poziom: ${labels[op]}`}
                operation={op}
                value={m.level}
                onChange={(level) =>
                  void dispatch({ type: "module", op, change: { level } })
                }
              />
              <p>{levelDescription(op, m.level)}</p>
            </div>
            <div className="moduleMode">
              <FieldLabel
                htmlFor={`mode-${op}`}
                label="Tryb poziomu"
                help={
                  "W trybie stałym wybrany poziom pozostaje bez zmian. W trybie automatycznym poziom zależy od odpowiedzi. " +
                  describeAdaptation(op, m)
                }
              />
              <Select
                id={`mode-${op}`}
                label={`Tryb poziomu: ${labels[op]}`}
                value={m.adaptive ? "auto" : "fixed"}
                disabled={controlsDisabled}
                options={[
                  { value: "auto", label: "Automatyczny" },
                  { value: "fixed", label: "Stały" },
                ]}
                onChange={(mode) =>
                  void dispatch({
                    type: "module",
                    op,
                    change: { adaptive: mode === "auto" },
                  })
                }
              />
              {m.adaptive && m.enabled && (
                <p>
                  {m.block.length} z {ADAPTATION.blockSize} zadań w bieżącym
                  bloku
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
