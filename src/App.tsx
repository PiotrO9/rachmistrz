import { Matches } from "./features/Matches";
import { useState } from "react";
import type { AppView } from "./app-view";
import { useTraining } from "./useTraining";
import { useTheme } from "./theme";
import { usePwa } from "./usePwa";
import { AppNavigation } from "./ui/AppNavigation";
import { TrainingView } from "./features/training/TrainingView";
import { SettingsView } from "./features/settings/SettingsView";
import { HistoryView } from "./features/history/HistoryView";
export default function App() {
  const training = useTraining();
  const { storageOK, error } = training;
  useTheme(training.state.saved.theme ?? "system", training.ready);
  const [requestedView, setView] = useState<AppView>("game");
  const view =
    requestedView === "matches" && !training.state.saved.matches.enabled
      ? "game"
      : requestedView;
  const {
    notice,
    setNotice,
    needRefresh,
    setNeedRefresh,
    updateServiceWorker,
  } = usePwa();

  return (
    <div className="app">
      <AppNavigation
        matches={training.state.saved.matches.enabled}
        view={view}
        onNavigate={(next) => {
          setView(next);
          setNotice("");
        }}
      />
      {!storageOK && (
        <div className="notice" role="alert">
          {error}
          <button onClick={() => void training.retry()}>
            Spróbuj ponownie
          </button>
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Zamknij informację">
            ×
          </button>
        </div>
      )}
      {needRefresh && (
        <div className="notice" role="status">
          Nowa wersja jest gotowa.
          <button onClick={() => void updateServiceWorker(true)}>
            Aktualizuj
          </button>
          <button onClick={() => setNeedRefresh(false)}>Później</button>
        </div>
      )}
      <main className={view === "game" ? "gameMain" : "panelMain"}>
        {view === "game" ? (
          <TrainingView
            state={training.state}
            ready={training.ready}
            busy={training.busy}
            canInteract={training.canInteract}
            storageOK={training.storageOK}
            onInput={(value, inputType) =>
              training.dispatch({ type: "input", value, inputType })
            }
            onSkip={() => training.dispatch({ type: "skip" })}
          />
        ) : view === "matches" ? (
          <Matches
            saved={training.state.saved}
            settled={training.state.settledMatch}
            disabled={!training.canInteract || training.busy}
            dispatch={training.dispatch}
          />
        ) : view === "settings" ? (
          <SettingsView
            saved={training.state.saved}
            controlsDisabled={!training.canInteract || training.busy}
            dataToolsDisabled={
              training.busy || (!training.ready && training.storageOK)
            }
            onConfigure={training.dispatch}
          />
        ) : (
          <>
            {" "}
            <HistoryView
              saved={training.state.saved}
              onTrain={() => setView("game")}
            />
            {training.state.saved.matches.history.length > 0 && (
              <section>
                <h2>Zapałki</h2>
                {training.state.saved.matches.history.map((d) => (
                  <p key={d.date}>
                    {d.date} · Samodzielnie {d.clean} · Z pomocą {d.helped} ·
                    Pominięte {d.skipped}
                  </p>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
