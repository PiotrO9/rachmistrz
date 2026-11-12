import { localDate, type SavedProgress } from "../../domain";
export async function prepareBackup(
  read: () => Promise<SavedProgress>,
  fallback: SavedProgress,
) {
  try {
    return { progress: await read(), stale: false };
  } catch {
    return { progress: fallback, stale: true };
  }
}
export function downloadBackup(current: SavedProgress) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(current, null, 2)], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `rachmistrz-${localDate()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
