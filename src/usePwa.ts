import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function usePwa() {
  const [install, setInstall] = useState<InstallPrompt | null>(null),
    [notice, setNotice] = useState("");
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    const installed = () => setInstall(null);
    window.addEventListener("beforeinstallprompt", prompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", prompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  async function installApp() {
    if (!install) {
      setNotice(
        "Na iPhonie: otwórz stronę w Safari, wybierz Udostępnij → Do ekranu początkowego. W innych przeglądarkach poszukaj opcji instalacji w menu.",
      );
      return;
    }
    try {
      await install.prompt();
      await install.userChoice;
      setInstall(null);
    } catch {
      setNotice(
        "Nie udało się uruchomić instalacji. Spróbuj opcji instalacji w menu przeglądarki.",
      );
    }
  }
  async function update(force?: boolean) {
    try {
      await updateServiceWorker(force);
    } catch {
      setNotice(
        "Nie udało się zaktualizować aplikacji. Sprawdź połączenie i spróbuj ponownie.",
      );
    }
  }
  return {
    notice,
    setNotice,
    needRefresh,
    setNeedRefresh,
    installApp,
    updateServiceWorker: update,
  };
}
