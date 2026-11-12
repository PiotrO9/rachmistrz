import { deferred } from "../testing/deferred";
import { createMemoryTrainingPort } from "../testing/training-port";
import { expect, it } from "vitest";
import { defaults } from "../domain";
import { createTrainingController } from "./controller";

it.each([false, true])(
  "ignoruje spóźniony odczyt lub błąd po imporcie: %s",
  async (rejectRead) => {
    const {
      promise: reading,
      resolve,
      reject,
    } = deferred<ReturnType<typeof defaults>>();
    const { port } = createMemoryTrainingPort(defaults());
    port.read = () => reading;
    const controller = createTrainingController(port, {
      random: () => 0.5,
      date: () => "2026-11-11",
    });
    const stop = controller.connect();
    try {
      await controller.dispatch({
        type: "import",
        saved: { ...defaults(), theme: "dark" },
      });
      const state = controller.getSnapshot().state;
      if (rejectRead) reject(Error("old failure"));
      else resolve(defaults());
      await reading.catch(() => {});
      expect(controller.getSnapshot().state).toBe(state);
      expect(controller.getSnapshot().status).toBe("ready");
      expect(controller.getSnapshot().state.saved.theme).toBe("dark");
    } finally {
      stop();
    }
  },
);
