import { newRule } from "../domain/session";
import { deferred } from "../testing/deferred";
import { createMemoryTrainingPort } from "../testing/training-port";
import { describe, it, expect, vi } from "vitest";
import { defaults, type SavedProgress } from "../domain";
import { seed } from "../testing/seed";
import { createTrainingController } from "./controller";
async function setup() {
  const memory = createMemoryTrainingPort(defaults());
  const { port } = memory;
  const random = vi.fn(seed());
  const controller = createTrainingController(port, {
    random,
    date: () => "2026-11-10",
  });
  const stop = controller.connect();
  await vi.waitFor(() => expect(controller.getSnapshot().status).toBe("ready"));
  random.mockClear();
  return {
    controller,
    answer: String(controller.getSnapshot().state.task.answer),
    random,
    stop,
    ...memory,
  };
}
describe("trening i asynchroniczny zapis", () => {
  it("ponawia wynik szybkiej sesji i kończy ją dopiero po zatwierdzeniu", async () => {
    const { controller, port, stop, random } = await setup();
    await controller.dispatch({
      type: "startQuick",
      config: { rules: [newRule("add")], goal: "tasks", count: 1 },
    });
    const task = controller.getSnapshot().state.quick!.exercise.task;
    const transact = port.transact;
    port.transact = vi
      .fn()
      .mockRejectedValueOnce(Error("Brak miejsca"))
      .mockImplementation(transact);
    random.mockClear();
    expect(
      await controller.dispatch({
        type: "quickInput",
        value: String(task.answer),
        inputType: "insertText",
      }),
    ).toBe(false);
    expect(controller.getSnapshot().state.quick).toMatchObject({
      finished: false,
      solved: 0,
      exercise: { task, input: String(task.answer) },
    });
    expect(await controller.retry()).toBe(true);
    expect(controller.getSnapshot().state.quick).toMatchObject({
      finished: true,
      solved: 1,
    });
    expect(controller.getSnapshot().state.saved.history[0].solved).toBe(1);
    expect(random).not.toHaveBeenCalled();
    stop();
  });
  it("retries a logarithm once and uses the newly selected set for the following task", async () => {
    const { controller, port, random, stop } = await setup();
    await controller.dispatch({ type: "logEnabled", enabled: true });
    await controller.dispatch({ type: "logStart" });
    const task = controller.getSnapshot().state.logPractice!.task;
    await controller.dispatch({ type: "logSet", set: "base" });
    const transact = port.transact;
    port.transact = vi
      .fn()
      .mockRejectedValueOnce(Error("Brak miejsca"))
      .mockImplementation(transact);
    random.mockClear();
    expect(
      await controller.dispatch({
        type: "logInput",
        value: String(task.answer),
      }),
    ).toBe(false);
    expect(controller.getSnapshot().state.logPractice).toMatchObject({
      task,
      input: String(task.answer),
    });
    expect(random).not.toHaveBeenCalled();
    expect(await controller.retry()).toBe(true);
    expect(controller.getSnapshot().state.logPractice?.task.kind).toBe(
      "quotient",
    );
    expect(controller.getSnapshot().state.saved.logarithms.solved).toBe(1);
    stop();
  });
  it("czeka na zapis, generuje zadanie raz i ignoruje dodatkowy Enter", async () => {
    const { controller, port, random, answer } = await setup();
    const gate = deferred<void>();
    const transact = port.transact;
    port.transact = vi.fn(async (mutate, recover) => {
      await gate.promise;
      return transact(mutate, recover);
    });
    const result = controller.dispatch({
      type: "input",
      value: answer,
      inputType: "insertText",
    });
    expect(controller.getSnapshot().status).toBe("saving");
    expect(controller.getSnapshot().state.input).toBe(answer);
    expect(random).not.toHaveBeenCalled();
    expect(await controller.dispatch({ type: "skip" })).toBe(false);
    gate.resolve();
    expect(await result).toBe(true);
    expect(port.transact).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot().state.saved.history[0].solved).toBe(1);
    const calls = random.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    await controller.dispatch({
      type: "input",
      value: "",
      inputType: "deleteContentBackward",
    });
    expect(random).toHaveBeenCalledTimes(calls);
  });
  it("ponawia tę samą odpowiedź po błędzie bez drugiej poprawki ani duplikatu", async () => {
    const { controller, port, answer } = await setup();
    const transact = port.transact;
    port.transact = vi
      .fn()
      .mockRejectedValueOnce(Error("Brak miejsca"))
      .mockImplementation(transact);
    await controller.dispatch({
      type: "input",
      value: answer + "9",
      inputType: "insertText",
    });
    expect(
      await controller.dispatch({
        type: "input",
        value: answer,
        inputType: "insertReplacementText",
      }),
    ).toBe(false);
    expect(controller.getSnapshot().state.corrections).toBe(1);
    expect(controller.getSnapshot().state.input).toBe(answer);
    expect(await controller.dispatch({ type: "skip" })).toBe(false);
    expect(await controller.retry()).toBe(true);
    const day = controller.getSnapshot().state.saved.history[0];
    expect([day.solved, day.skipped, day.corrections]).toEqual([1, 0, 1]);
    expect(controller.getSnapshot().status).toBe("ready");
  });
  it("zachowuje wpisywanie podczas wolnego zapisu ustawień i rozlicza poprawną odpowiedź", async () => {
    const { controller, port, answer } = await setup();
    const gate = deferred<void>();
    const transact = port.transact;
    port.transact = vi.fn(async (mutate, recover) => {
      await gate.promise;
      return transact(mutate, recover);
    });
    const result = controller.dispatch({ type: "theme", theme: "dark" });
    await controller.dispatch({
      type: "input",
      value: "1",
      inputType: "insertText",
    });
    expect(controller.getSnapshot().state.input).toBe("1");
    await controller.dispatch({
      type: "input",
      value: "14",
      inputType: "insertText",
    });
    await controller.dispatch({
      type: "input",
      value: answer,
      inputType: "insertText",
    });
    gate.resolve();
    await result;
    await vi.waitFor(() =>
      expect(controller.getSnapshot().status).toBe("ready"),
    );
    expect(controller.getSnapshot().state.saved.history[0].solved).toBe(1);
    expect(controller.getSnapshot().state.saved.theme).toBe("dark");
  });
  it("odświeża drugą kartę po zakończeniu trwającego zapisu", async () => {
    const { controller, port, external, setSaved } = await setup();
    const gate = deferred<void>();
    const transact = port.transact;
    port.transact = vi.fn(async (mutate, recover) => {
      await gate.promise;
      return transact(mutate, recover);
    });
    const result = controller.dispatch({ type: "skip" });
    const externalSaved = defaults();
    externalSaved.theme = "dark";
    externalSaved.revision = 20;
    setSaved(externalSaved);
    external();
    gate.resolve();
    await result;
    await vi.waitFor(() => expect(port.read).toHaveBeenCalledTimes(2));
    expect(controller.getSnapshot().state.saved.theme).toBe("dark");
    expect(controller.getSnapshot().state.saved.history[0].skipped).toBe(1);
  });
  it("nie aktualizuje odmontowanego widoku, lecz kończy i sygnalizuje zapis", async () => {
    const { controller, port, stop, random } = await setup();
    const gate = deferred<void>();
    const transact = port.transact;
    port.transact = vi.fn(async (mutate, recover) => {
      await gate.promise;
      return transact(mutate, recover);
    });
    const changed = vi.fn();
    controller.subscribe(changed);
    const result = controller.dispatch({ type: "skip" });
    stop();
    changed.mockClear();
    gate.resolve();
    await result;
    expect(changed).not.toHaveBeenCalled();
    expect(random).not.toHaveBeenCalled();
    expect(port.notify).toHaveBeenCalledTimes(1);
    const stopAgain = controller.connect();
    await vi.waitFor(() =>
      expect(controller.getSnapshot().status).toBe("ready"),
    );
    stopAgain();
  });
  it("ponownie montuje się podczas zapisu bez zawieszenia i bez utraty wyniku", async () => {
    const { controller, port, stop } = await setup();
    const gate = deferred<void>();
    const transact = port.transact;
    port.transact = vi.fn(async (mutate, recover) => {
      await gate.promise;
      return transact(mutate, recover);
    });
    const result = controller.dispatch({ type: "skip" });
    stop();
    const stopAgain = controller.connect();
    gate.resolve();
    await result;
    await vi.waitFor(() =>
      expect(controller.getSnapshot().status).toBe("ready"),
    );
    expect(controller.getSnapshot().state.saved.history[0].skipped).toBe(1);
    stopAgain();
  });
  it("awaria powiadomienia nie zmienia udanego zapisu w błąd", async () => {
    const { controller, port } = await setup();
    port.notify = () => {
      throw Error("Kanał zamknięty");
    };
    expect(await controller.dispatch({ type: "skip" })).toBe(true);
    expect(controller.getSnapshot().status).toBe("ready");
  });
  it("po nieudanym odczycie pozwala ponowić otwarcie", async () => {
    const { port } = await setup();
    const read = port.read;
    port.read = vi
      .fn()
      .mockRejectedValueOnce(Error("Zamknij starsze karty"))
      .mockImplementation(read);
    const controller = createTrainingController(port);
    const stop = controller.connect();
    await vi.waitFor(() =>
      expect(controller.getSnapshot().status).toBe("error"),
    );
    expect(controller.getSnapshot().initialized).toBe(false);
    expect(await controller.retry()).toBe(true);
    expect(controller.getSnapshot().initialized).toBe(true);
    stop();
  });
  it("spóźniony odczyt nie nadpisuje nowszej transakcji", async () => {
    const { controller, port, external } = await setup();
    const old = structuredClone(controller.getSnapshot().state.saved);
    const gate = deferred<SavedProgress>();
    port.read = vi.fn(() => gate.promise);
    external();
    await controller.dispatch({ type: "skip" });
    gate.resolve(old);
    await vi.waitFor(() =>
      expect(controller.getSnapshot().status).toBe("ready"),
    );
    expect(controller.getSnapshot().state.saved.history[0].skipped).toBe(1);
  });
  it("buforowany wpis nie przechodzi do innego zadania po wyłączeniu działania", async () => {
    const { controller, port } = await setup();
    const gate = deferred<void>(),
      transact = port.transact;
    port.transact = async (mutate, recover) => {
      await gate.promise;
      return transact(mutate, recover);
    };
    const active =
      controller.getSnapshot().state.task.operation === "add"
        ? "divide"
        : "add";
    const result = controller.dispatch({ type: "preset", active: [active] });
    await controller.dispatch({
      type: "input",
      value: "999",
      inputType: "insertText",
    });
    gate.resolve();
    await result;
    expect(controller.getSnapshot().state.task.operation).toBe(active);
    expect(controller.getSnapshot().state.input).toBe("");
    expect(controller.getSnapshot().state.saved.history).toEqual([]);
  });
  it("jawny import zastępuje także stan z nieudaną operacją", async () => {
    const { controller, port } = await setup();
    const transact = port.transact;
    port.transact = vi
      .fn()
      .mockRejectedValueOnce(Error("Zapis niedostępny"))
      .mockImplementation(transact);
    await controller.dispatch({ type: "skip" });
    const imported = defaults();
    imported.theme = "dark";
    expect(await controller.dispatch({ type: "import", saved: imported })).toBe(
      true,
    );
    expect(controller.getSnapshot().state.saved.theme).toBe("dark");
    expect(controller.getSnapshot().state.saved.history).toEqual([]);
  });
});
