import { Matches } from "./features/Matches";
import { useState } from "react";
import { Logarithms } from "./features/Logarithms";
import { Viete } from "./features/Viete";
import type { AppView } from "./app-view";
import { useTraining } from "./useTraining";
import { useTheme } from "./theme";
import { usePwa } from "./usePwa";
import { AppNavigation } from "./ui/AppNavigation";
import { SessionTraining } from "./features/session/SessionTraining";
import { SettingsView } from "./features/settings/SettingsView";
import { HistoryView } from "./features/history/HistoryView";
export default function App() {
  const training = useTraining();
  const { storageOK, error } = training;
  useTheme(training.state.saved.theme ?? "system", training.ready);
  const [requestedView, setView] = useState<AppView>("game");
  const saved = training.state.saved;
  const view =
    (requestedView === "logarithms" && !saved.logarithms.enabled) ||
    (requestedView === "matches" && !saved.matches.enabled) ||
    (requestedView === "viete" && !saved.viete.enabled)
      ? "game"
      : requestedView;
  if (requestedView !== view) setView(view);
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
        logarithms={saved.logarithms.enabled}
        viete={saved.viete.enabled}
        onNavigate={async (next) => {
          if (
            next === "logarithms" &&
            !training.state.logPractice &&
            !(await training.dispatch({ type: "logStart" }))
          )
            return;
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
      <main
        className={
          view === "logarithms" || view === "game" || view === "viete"
            ? "gameMain"
            : "panelMain"
        }
      >
        {view === "game" ? (
          <SessionTraining training={training} />
        ) : view === "matches" ? (
          <Matches
            saved={training.state.saved}
            settled={training.state.settledMatch}
            disabled={!training.canInteract || training.busy}
            dispatch={training.dispatch}
          />
        ) : view === "logarithms" && training.state.logPractice ? (
          <Logarithms
            practice={training.state.logPractice}
            disabled={!training.canInteract || training.busy}
            dispatch={training.dispatch}
          />
        ) : view === "viete" ? (
          <Viete
            sequence={training.state.vieteSequence ?? 0}
            disabled={!training.canInteract || training.busy}
            finish={(skipped) =>
              void training.dispatch({ type: "vieteResult", skipped })
            }
          />
        ) : view === "settings" ? (
          <SettingsView
            saved={training.state.saved}
            controlsDisabled={!training.canInteract || training.busy}
            dataToolsDisabled={
              training.busy || (!training.ready && training.storageOK)
            }
            hasSavedProgress={training.ready}
            onConfigure={training.dispatch}
          />
        ) : (
          <HistoryView saved={saved} onTrain={() => setView("game")} />
        )}
      </main>
    </div>
  );
}
