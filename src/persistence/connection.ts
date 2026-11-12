import { StorageError } from "./errors";
export interface ConnectionOptions {
  factory?: IDBFactory;
  name?: string;
}
export function createDatabaseConnection(options: ConnectionOptions) {
  let connection: Promise<IDBDatabase> | undefined,
    opened: IDBDatabase | undefined;
  function open(): Promise<IDBDatabase> {
    if (connection) return connection;
    let settled = false;
    const attempt = new Promise<IDBDatabase>((resolve, reject) => {
      let request: IDBOpenDBRequest;
      const fail = (error: StorageError) => {
        if (settled) return;
        settled = true;
        connection = undefined;
        reject(error);
      };
      try {
        const factory = options.factory ?? globalThis.indexedDB;
        if (!factory) throw Error("IndexedDB unavailable");
        request = factory.open(options.name ?? "rachmistrz", 1);
      } catch (error) {
        queueMicrotask(() =>
          fail(
            new StorageError(
              "unavailable",
              "Ta przeglądarka nie udostępnia zapisu postępu.",
              error,
            ),
          ),
        );
        return;
      }
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("progress"))
          request.result.createObjectStore("progress");
      };
      request.onerror = () =>
        fail(
          new StorageError(
            "unavailable",
            "Nie udało się otworzyć zapisu. Spróbuj ponownie.",
            request.error,
          ),
        );
      request.onblocked = () =>
        fail(
          new StorageError(
            "blocked",
            "Zamknij starsze karty aplikacji i spróbuj ponownie.",
          ),
        );
      request.onsuccess = () => {
        if (settled) {
          request.result.close();
          return;
        }
        settled = true;
        const db = request.result;
        opened = db;
        db.onversionchange = () => {
          db.close();
          if (opened === db) {
            opened = undefined;
            connection = undefined;
          }
        };
        resolve(opened);
      };
    });
    connection = attempt;
    return attempt;
  }

  return {
    open,
    close: () => {
      opened?.close();
      opened = undefined;
      connection = undefined;
    },
  };
}
