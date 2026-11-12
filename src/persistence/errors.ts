import { SavedDataError } from "./schema";
export type StorageErrorCode =
  "blocked" | "unavailable" | "read" | "write" | "validation";
export class StorageError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "StorageError";
  }
}
export function storageFailure(
  error: unknown,
  operation: "read" | "write",
): Error {
  if (error instanceof StorageError) return error;
  if (error instanceof SavedDataError)
    return new StorageError("validation", error.message, error);
  return new StorageError(
    operation,
    operation === "read"
      ? "Nie udało się odczytać postępu. Spróbuj ponownie."
      : "Nie udało się zapisać postępu. Spróbuj ponownie.",
    error,
  );
}
