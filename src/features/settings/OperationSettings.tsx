import { FieldLabel } from "../../ui/FieldLabel";
import {
  labels,
  symbols,
  levelDescription,
  ADAPTATION,
  type Operation,
  type OperationProgress,
} from "../../domain";
import type { SettingsAction } from "../../training/engine";
import { LevelSelect } from "./LevelSelect";
import { Switch } from "../../ui/Switch";

function describeAdaptation(progress: OperationProgress): string {
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
  return (
    <div className={`module ${!m.enabled ? "muted" : ""}`} key={op}>
      <div className="moduleHeading">
        <span className="operationBadge">{symbols[op]}</span>
        <h2>{labels[op]}</h2>
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
      </div>
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
          <p>{levelDescription(op, m.level)}</p>
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
      </div>
      <div className="adaptive">
        <span>Automatyczny poziom</span>
        <Switch
          checked={m.adaptive}
          disabled={controlsDisabled}
          label={`Automatyczny poziom: ${labels[op]}`}
          onChange={() =>
            void dispatch({
              type: "module",
              op,
              change: { adaptive: !m.adaptive },
            })
          }
        />
      </div>
      {m.adaptive && m.enabled && (
        <p className="smallNote">
          Ocena poziomu: {m.block.length} / {ADAPTATION.blockSize} zadań w
          bieżącym bloku. {describeAdaptation(m)}
        </p>
      )}
    </div>
  );
}
