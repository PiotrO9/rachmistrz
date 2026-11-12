import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
export function usePwa() {
  const [notice, setNotice] = useState("");
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
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
    updateServiceWorker: update,
  };
}
