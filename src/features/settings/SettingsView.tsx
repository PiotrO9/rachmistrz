import { operations, labels, PRESETS, type Theme } from "../../domain";
import type { SavedProgress } from "../../domain";
import type { SettingsAction } from "../../training/engine";
import { Select } from "../../ui/Select";
import { OperationSettings } from "./OperationSettings";
import { AdaptationExplanation } from "./AdaptationExplanation";
import { Switch } from "../../ui/Switch";
import { SectionTitle } from "../../ui/SectionTitle";
import { DataTools } from "./DataTools";
interface SettingsViewProps {
  saved: SavedProgress;
  controlsDisabled: boolean;
  dataToolsDisabled: boolean;
  onConfigure: (action: SettingsAction) => Promise<boolean>;
}
export function SettingsView({
  saved,
  controlsDisabled,
  dataToolsDisabled,
  onConfigure,
}: SettingsViewProps) {
  const lastChange = saved.changes.at(-1);
  const enabledCount = operations.filter(
    (op) => saved.modules[op].enabled,
  ).length;
  const selected =
    PRESETS.find((p) =>
      operations.every(
        (op) => saved.modules[op].enabled === p.active.includes(op),
      ),
    )?.name ?? "Własny zestaw";
  return (
    <section>
      <SectionTitle title="Ustawienia treningu">
        Wybierz działania i ich trudność. Zmiany zapisują się od razu.
      </SectionTitle>
      <div className="preset themeSetting">
        <label htmlFor="theme">Motyw</label>
        <Select<Theme>
          id="theme"
          disabled={controlsDisabled}
          value={saved.theme ?? "system"}
          onChange={(value) =>
            void onConfigure({
              type: "theme",
              theme: value,
            })
          }
          options={[
            { value: "system", label: "Zgodny z systemem" },
            { value: "light", label: "Jasny" },
            { value: "dark", label: "Ciemny" },
          ]}
        />
      </div>
      <div className="preset">
        <label htmlFor="preset">Zestaw treningowy</label>
        <Select
          id="preset"
          disabled={controlsDisabled}
          value={selected}
          onChange={(value) => {
            const p = PRESETS.find((p) => p.name === value);
            if (p) void onConfigure({ type: "preset", active: p.active });
          }}
          options={[
            ...(selected === "Własny zestaw"
              ? [{ value: "Własny zestaw", label: "Własny zestaw" }]
              : []),
            ...PRESETS.map((p) => ({ value: p.name, label: p.name })),
          ]}
        />
      </div>
      <div className="modules">
        {operations.map((op) => (
          <OperationSettings
            key={op}
            operation={op}
            progress={saved.modules[op]}
            last={saved.modules[op].enabled && enabledCount === 1}
            controlsDisabled={controlsDisabled}
            dispatch={onConfigure}
          />
        ))}{" "}
      </div>
      <AdaptationExplanation />
      <p className="smallNote">
        Co najmniej jedno działanie pozostaje włączone. Zmiany zapisujemy
        automatycznie.
      </p>
      <div className="solutionSetting">
        <div>
          <h2>Rozwiązanie po pominięciu</h2>
          <p>
            Pokaż wynik, udostępnij sposób liczenia i zaczekaj na przejście do
            następnego zadania.
          </p>
        </div>
        <Switch
          checked={saved.showSolution}
          disabled={controlsDisabled}
          label="Pokazuj rozwiązanie po pominięciu"
          onChange={() =>
            void onConfigure({
              type: "solution",
              enabled: !saved.showSolution,
            })
          }
        />
      </div>
      <p className="smallNote">
        Zmiana poziomu dotyczy kolejnych zadań. Rozpoczęty rachunek pozostaje,
        dopóki jego działanie jest włączone. Generatory mieszają aktualny
        materiał z powtórkami i zadaniami z przekroczeniem dziesiątki.
      </p>
      {lastChange && (
        <p className="smallNote">
          Ostatnia zmiana: {labels[lastChange.operation]} {lastChange.from} →{" "}
          {lastChange.to} (
          {lastChange.reason === "manual" ? "ręcznie" : "automatycznie"}
          ).
        </p>
      )}
      <DataTools
        saved={saved}
        disabled={dataToolsDisabled}
        onImport={(saved) => onConfigure({ type: "import", saved })}
      />
    </section>
  );
}
