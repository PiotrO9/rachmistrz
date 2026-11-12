import { prepareBackup, downloadBackup } from "./backup";
import { useRef, useState, type ChangeEvent } from "react";
import { type SavedProgress } from "../../domain";
import { parseSaved, readSaved } from "../../storage";
export function DataTools({
  saved,
  onImport,
  disabled,
}: {
  saved: SavedProgress;
  onImport: (data: SavedProgress) => Promise<boolean>;
  disabled: boolean;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<SavedProgress | null>(null),
    [message, setMessage] = useState(""),
    [working, setWorking] = useState(false);
  async function download() {
    setWorking(true);
    setMessage("");
    try {
      const backup = await prepareBackup(readSaved, saved);
      downloadBackup(backup.progress);
      setMessage(
        backup.stale
          ? "Pobrano kopię awaryjną z tej karty. Nie udało się odczytać najnowszego postępu; kopia może nie zawierać zmian z innych kart. Spróbuj ponownie wyeksportować postęp."
          : "Kopia postępu została przygotowana do pobrania.",
      );
    } catch {
      setMessage(
        "Nie udało się przygotować pliku. Spróbuj ponownie wyeksportować postęp.",
      );
    } finally {
      setWorking(false);
    }
  }
  async function select(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = "";
    setMessage("");
    setPending(null);
    if (!selected) return;
    try {
      if (selected.size > 2_000_000)
        throw Error("Plik może mieć maksymalnie 2 MB.");
      setPending(parseSaved(await selected.text()));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nie można odczytać pliku.",
      );
    }
  }
  return (
    <section className="dataTools" aria-label="Kopia postępu">
      <h2>Kopia postępu</h2>
      <p>
        Zapisz plik, aby przenieść wyniki do innej przeglądarki lub zachować
        kopię.
      </p>
      <div className="dataActions">
        <button
          className="secondary"
          disabled={disabled || working}
          onClick={() => void download()}
        >
          Eksportuj postęp
        </button>
        <button
          className="secondary"
          disabled={disabled || working}
          onClick={() => file.current?.click()}
        >
          Importuj postęp
        </button>
      </div>
      <input
        className="srOnly"
        ref={file}
        type="file"
        accept="application/json,.json"
        aria-label="Plik z kopią postępu"
        onChange={(e) => void select(e)}
      />
      {pending && (
        <div className="importPreview">
          <p>
            Plik zawiera {pending.history.length} dni historii. Import zastąpi
            obecne ustawienia i historię we wszystkich otwartych kartach.
            Najpierw możesz wyeksportować obecną kopię.
          </p>
          <button
            className="secondary"
            disabled={working || disabled}
            onClick={async () => {
              setWorking(true);
              try {
                if (await onImport(pending)) {
                  setPending(null);
                  setMessage("Postęp został zaimportowany.");
                } else
                  setMessage(
                    "Import nie został zapisany. Obecne dane pozostają bez zmian.",
                  );
              } finally {
                setWorking(false);
              }
            }}
          >
            Zastąp obecny postęp
          </button>
          <button
            className="secondary"
            disabled={working}
            onClick={() => setPending(null)}
          >
            Anuluj import
          </button>
        </div>
      )}
      <p className="smallNote" role="status">
        {message}
      </p>
    </section>
  );
}
