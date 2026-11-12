import { vi } from "vitest";
import type { SavedProgress } from "../domain";
import type { TrainingPort } from "../training/controller";
export function createMemoryTrainingPort(initial: SavedProgress) {
  let saved = initial,
    external = () => {};
  const port: TrainingPort = {
    read: vi.fn(async () => saved),
    transact: vi.fn(async (mutate) => {
      saved = { ...mutate(saved), revision: saved.revision + 1 };
      return saved;
    }),
    listen: vi.fn((callback) => {
      external = callback;
      return vi.fn();
    }),
    notify: vi.fn(),
  };
  return {
    port,
    external: () => external(),
    saved: () => saved,
    setSaved: (value: SavedProgress) => {
      saved = value;
    },
  };
}
