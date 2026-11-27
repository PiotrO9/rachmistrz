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
          bieżącym bloku.
          {m.startPhase === "opening"
            ? " Osiem pierwszych zadań bez poprawek i pominięć daje awans."
            : m.startPhase === "confirm"
              ? " Awans wymaga dobrego bloku i kolejnego bloku bez poprawek ani pominięć."
              : m.level === 2 || m.level === 3
                ? ` Seria ${m.level === 2 ? ADAPTATION.levelTwoCleanRun : ADAPTATION.levelThreeCleanRun} samodzielnych odpowiedzi na materiale tego poziomu daje awans.${m.checkFirstPromotion ? " Trzy zadania z poprawką lub pominięciem w pierwszych sześciu z nowego materiału oznaczają powrót na poziom 1." : ""}`
                : m.trend === 1
                  ? " Poprzedni blok był łatwy. Kolejny dobry blok może podnieść poziom."
                  : m.trend === -1
                    ? " Poprzedni blok był trudny. Kolejny trudny blok może obniżyć poziom."
                    : " Do zmiany poziomu potrzebne są dwa kolejne bloki o tym samym kierunku."}
        </p>
      )}
    </div>
  );
}
