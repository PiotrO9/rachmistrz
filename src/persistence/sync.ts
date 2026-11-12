const SIGNAL = "rachmistrz:revision";
export function broadcast(revision: number) {
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("rachmistrz");
      try {
        channel.postMessage(revision);
      } finally {
        channel.close();
      }
    }
  } catch {
    /* Notifications must never turn a committed write into an apparent failure. */
  }
  try {
    localStorage.setItem(SIGNAL, String(revision));
  } catch {
    /* Focus refresh is an independent fallback. */
  }
}
export function subscribe(callback: () => void) {
  let channel: BroadcastChannel | undefined;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("rachmistrz");
      channel.onmessage = callback;
    }
  } catch {
    /* Storage/focus events remain available. */
  }
  const storage = (e: StorageEvent) => {
    if (e.key === SIGNAL) callback();
  };
  window.addEventListener("storage", storage);
  window.addEventListener("focus", callback);
  return () => {
    channel?.close();
    window.removeEventListener("storage", storage);
    window.removeEventListener("focus", callback);
  };
}
