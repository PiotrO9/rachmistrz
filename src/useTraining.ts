import { useEffect, useState, useSyncExternalStore } from "react";
import { loadQuickDraft, saveQuickDraft } from "./persistence/quick-resume";
import {
  readSaved,
  transact,
  broadcast,
  subscribe,
  hasReceipt,
  forgetReceipt,
} from "./storage";
import { createTrainingController } from "./training/controller";
export function useTraining() {
  const [controller] = useState(() =>
    createTrainingController({
      read: readSaved,
      resume: {
        load: loadQuickDraft,
        save: saveQuickDraft,
        hasReceipt,
        forgetReceipt,
      },
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
