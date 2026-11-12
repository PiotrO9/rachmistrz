import { expect, type Page } from "@playwright/test";
import type { SavedProgress } from "../src/domain";
import { validateStored } from "../src/persistence/schema";

export async function ready(page: Page) {
  const input = page.getByRole("textbox", { name: "Twoja odpowiedź" });
  await expect(input).toBeEditable();
  await expect(input).toHaveAttribute("aria-busy", "false");
  return input;
}
export async function readRawProgress(page: Page): Promise<unknown> {
  return page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open("rachmistrz", 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const req = db
            .transaction("progress")
            .objectStore("progress")
            .get("state");
          req.onsuccess = () => {
            resolve(req.result as unknown);
            db.close();
          };
          req.onerror = () => {
            reject(req.error);
            db.close();
          };
        };
      }),
  );
}
export async function readProgress(page: Page): Promise<SavedProgress> {
  const raw = await readRawProgress(page);
  const checked = validateStored(raw);
  if (checked.version !== 3) throw new Error("Expected persisted v3 progress");
  return checked;
}
export async function answer(page: Page) {
  const equation = await page.locator(".equation").getAttribute("aria-label");
  const [left, operator, right] = equation!.split(" "),
    a = Number(left),
    b = Number(right);
  return String(
    operator === "+"
      ? a + b
      : operator === "−"
        ? a - b
        : operator === "×"
          ? a * b
          : a / b,
  );
}
export async function settings(page: Page) {
  const menu = page.getByRole("button", { name: "Otwórz menu" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Ustawienia", exact: true }).click();
}
export async function upload(page: Page, saved: SavedProgress) {
  await page.getByLabel("Plik z kopią postępu").setInputFiles({
    name: "progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
}
