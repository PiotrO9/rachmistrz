import { useEffect, useState, useSyncExternalStore } from "react";
import { readSaved, transact, broadcast, subscribe } from "./storage";
import { createTrainingController } from "./training/controller";
export function useTraining() {
  const [controller] = useState(() =>
    createTrainingController({
      read: readSaved,
      transact,
      notify: broadcast,
      listen: subscribe,
    }),
  );
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  useEffect(() => controller.connect(), [controller]);
  return {
    state: snapshot.state,
    dispatch: controller.dispatch,
    retry: controller.retry,
    ready: snapshot.initialized,
    canInteract: snapshot.initialized && snapshot.status !== "error",
    busy: snapshot.status === "saving",
    storageOK: snapshot.status !== "error",
    error: snapshot.error,
    status: snapshot.status,
  };
}
