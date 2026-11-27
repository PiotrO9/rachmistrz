import type { QuickDraft, QuickResume } from "../persistence/quick-resume";
import type { SavedProgress } from "../domain";
import {
  createState,
  environment,
  interpret,
  applyCommand,
  settle,
  reconcile,
  type TrainingState,
  type Action,
  type Command,
  type Environment,
} from "./engine";
export interface TrainingPort {
  read: () => Promise<SavedProgress>;
  transact: (
    mutate: (saved: SavedProgress) => SavedProgress,
    recover?: boolean,
    receipt?: string,
  ) => Promise<SavedProgress>;
  listen: (callback: () => void) => () => void;
  notify: (revision: number) => void;
  resume?: QuickResume;
}
export type Status = "loading" | "ready" | "saving" | "error";
interface PendingWrite {
  receipt?: string;
  command: Command;
  preview: TrainingState;
}
export interface Snapshot {
  state: TrainingState;
  status: Status;
  error: string;
  initialized: boolean;
}
export function createTrainingController(
  port: TrainingPort,
  env: Environment = environment,
  initial = createState(undefined, env),
) {
  let snapshot: Snapshot = {
    state: initial,
    status: "loading",
    error: "",
    initialized: false,
  };
  const listeners = new Set<() => void>();
  let active = false;
  let generation = 0;
  let unsubscribe: (() => void) | undefined;
  let inFlightWrite: PendingWrite | undefined;
  // Retry reuses the interpreted command; corrections and history are never rebuilt.
  let retryableWrite: PendingWrite | undefined;
  // A committed command may still need to advance the task or settle after reconnect.
  let pendingSettlement: PendingWrite | undefined;
  let completedWrites = 0;
  let failureMessage = "";
  let refreshing = false;
  let refreshRequested = false;
  let bufferedInput: Extract<Action, { type: "input" }> | undefined;
  const emit = (patch: Partial<Snapshot>) => {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener();
  };
  const message = (error: unknown) =>
    error instanceof Error ? error.message : "Nie udało się zapisać postępu.";
  function forgetReceipt(key?: string) {
    if (key) void port.resume?.forgetReceipt(key).catch(() => {});
  }
  function acceptSaved(
    saved: SavedProgress,
    initialRead: boolean,
    draft?: QuickDraft,
    committed = false,
  ) {
    const operation = pendingSettlement;
    let state: TrainingState;
    if (operation) {
      try {
        state = settle(operation.preview, saved, operation.command, env);
        if (operation.preview.quick || state.quick) port.resume?.save(state);
        forgetReceipt(operation.receipt);
      } catch {
        emit({
          state: { ...operation.preview, saved },
          initialized: true,
          status: "error",
          error:
            "Postęp został zapisany. Spróbuj ponownie, aby wznowić trening.",
        });
        return false;
      }
      pendingSettlement = undefined;
    } else if (draft) {
      state = reconcile(
        { ...snapshot.state, ...draft.regular, quick: draft.quick },
        saved,
        { task: "preserve" },
        env,
      );
      if (draft.pending) {
        if (committed) state = settle(state, saved, draft.pending.command, env);
        port.resume?.save(state);
        forgetReceipt(draft.pending.key);
      }
    } else {
      state = reconcile(
        snapshot.state,
        saved,
        { task: initialRead ? "replace" : "preserve" },
        env,
      );
    }
    emit({
      state,
      initialized: true,
      status: retryableWrite ? "error" : "ready",
      error: retryableWrite ? failureMessage : "",
    });
    if (operation && !inFlightWrite) flushBufferedInput(operation);
    return true;
  }
  async function refresh(initialRead = false): Promise<boolean> {
    if (!active) return false;
    if (inFlightWrite || refreshing) {
      refreshRequested = true;
      return false;
    }
    const token = generation;
    const writesAtRead = completedWrites;
    refreshing = true;
    try {
      const draft =
        initialRead && !pendingSettlement ? port.resume?.load() : undefined;
      const saved = await port.read();
      const committed =
        draft?.pending && (await port.resume?.hasReceipt(draft.pending.key));
      if (!active || token !== generation) return false;
      // A recovered record may legitimately have a lower or equal revision.
      if (completedWrites !== writesAtRead) return false;
      // A transaction can start while a read is in flight. Apply external updates after it settles.
      if (inFlightWrite) {
        refreshRequested = true;
        return false;
      }
      return acceptSaved(saved, initialRead, draft, committed);
    } catch (error) {
      if (
        active &&
        token === generation &&
        !inFlightWrite &&
        completedWrites === writesAtRead
      )
        emit({ status: "error", error: message(error) });
      return false;
    } finally {
      if (token === generation) {
        refreshing = false;
        if (active && refreshRequested && !inFlightWrite) {
          refreshRequested = false;
          void refresh(!snapshot.initialized);
        }
      }
    }
  }
  function flushBufferedInput(operation: PendingWrite) {
    const lastInput = bufferedInput;
    bufferedInput = undefined;
    if (lastInput && snapshot.state.task === operation.preview.task)
      void dispatch(lastInput);
  }
  async function commit(operation: PendingWrite): Promise<boolean> {
    const previous = snapshot;
    const importing =
      operation.command.type === "configure" &&
      operation.command.action.type === "import";
    inFlightWrite = operation;
    emit({ state: operation.preview, status: "saving", error: "" });
    try {
      let saved: SavedProgress;
      try {
        if (
          port.resume &&
          operation.command.type === "complete" &&
          operation.command.quick
        ) {
          operation.receipt ??= crypto.randomUUID();
          port.resume.save(previous.state, {
            key: operation.receipt,
            command: operation.command,
          });
        }
        saved = await port.transact(
          (latest) => applyCommand(latest, operation.command),
          importing,
          operation.receipt,
        );
      } catch (error) {
        if (importing) {
          // Only the file preview can retry a replacement. Keep any earlier failed answer.
          if (active) emit({ status: previous.status, error: previous.error });
          if (previous.status === "loading") refreshRequested = true;
        } else {
          retryableWrite = operation;
          failureMessage = message(error);
          if (active) emit({ status: "error", error: failureMessage });
        }
        return false;
      }
      completedWrites++;
      retryableWrite = undefined;
      pendingSettlement = operation;
      // Signaling is best effort and must never report an already committed write as failed.
      try {
        port.notify(saved.revision);
      } catch {
        /* Focus refresh remains available. */
      }
      if (active) acceptSaved(saved, false);
      return true;
    } finally {
      if (inFlightWrite === operation) inFlightWrite = undefined;
      if (active) {
        // Input typed during a settings write still belongs to the same task.
        if (!pendingSettlement && snapshot.status === "ready") {
          flushBufferedInput(operation);
        }
        if (refreshRequested && !inFlightWrite) {
          refreshRequested = false;
          void refresh(!snapshot.initialized);
        }
      }
    }
  }
  async function dispatch(action: Action): Promise<boolean> {
    if (
      !active ||
      (!snapshot.initialized && action.type !== "import") ||
      (snapshot.status === "error" && action.type !== "import")
    )
      return false;
    if (inFlightWrite) {
      // Extra events after a correct answer/skip cannot spill into the next task.
      if (
        inFlightWrite.command.type === "configure" &&
        action.type === "input"
      ) {
        const transition = interpret(snapshot.state, action, env);
        inFlightWrite.preview =
          transition.kind === "local" ? transition.state : transition.preview;
        bufferedInput = action;
        emit({ state: inFlightWrite.preview });
      }
      return false;
    }
    if ((pendingSettlement || retryableWrite) && action.type !== "import")
      return false;
    const transition = interpret(snapshot.state, action, env);
    if (transition.kind === "local") {
      if (transition.state !== snapshot.state) {
        if (transition.state.quick !== snapshot.state.quick) {
          try {
            port.resume?.save(transition.state);
          } catch (error) {
            emit({ status: "error", error: message(error) });
            return false;
          }
        }
        emit({ state: transition.state });
      }
      return true;
    }
    return commit({ command: transition.command, preview: transition.preview });
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect: () => {
      active = true;
      generation++;
      unsubscribe = port.listen(() => {
        void refresh(!snapshot.initialized);
      });
      void refresh(!snapshot.initialized);
      return () => {
        active = false;
        generation++;
        unsubscribe?.();
        unsubscribe = undefined;
        refreshing = false;
        bufferedInput = undefined;
      };
    },
    dispatch,
    retry: () =>
      !active || inFlightWrite
        ? Promise.resolve(false)
        : retryableWrite
          ? commit(retryableWrite)
          : refresh(!snapshot.initialized),
  };
}
