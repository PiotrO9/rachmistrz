import { test, expect } from "@playwright/test";
import { defaults } from "../src/domain";
import { migrateSaved } from "../src/persistence/migrations";
import {
  ready,
  readProgress,
  readRawProgress,
  answer,
  settings,
  upload,
} from "./helpers";

test("migracja v2 zachowuje postęp i pozwala trenować po przeładowaniu", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const previous = defaults();
  previous.modules.multiply.level = 5;
  previous.modules.multiply.epoch = 7;
  previous.modules.multiply.trend = 1;
  previous.modules.multiply.block = [{ skipped: false, corrections: 0 }];
  for (const op of ["add", "subtract", "divide"] as const)
    previous.modules[op].enabled = false;
  await page.evaluate(async (saved) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("rachmistrz", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("progress", "readwrite");
        tx.objectStore("progress").put({ ...saved, version: 2 }, "state");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
  }, previous);
  await page.reload();
  const input = await ready(page);
  expect(await readRawProgress(page)).toMatchObject({ version: 8 });
  const migrated = await readProgress(page);
  expect(migrated.modules.multiply).toMatchObject({
    level: 5,
    epoch: 8,
    trend: 0,
    block: [],
  });
  await input.fill(await answer(page));
  await ready(page);
  await expect
    .poll(async () => (await readProgress(page)).modules.multiply.block.length)
    .toBe(1);
  await page.reload();
  await ready(page);
  const current = await readProgress(page);
  expect(current.modules.multiply.epoch).toBe(8);
  expect(current.modules.multiply.block).toHaveLength(1);
  expect(current.history[0].solved).toBe(1);
  await settings(page);
  await page.getByLabel("Poziom: Mnożenie", { exact: true }).click();
  await expect(
    page
      .getByRole("listbox", { name: "Poziom: Mnożenie" })
      .getByText("Dwie cyfry przez dwie · np. 73 × 28", { exact: true }),
  ).toBeVisible();
});

test("migracja, dwie karty oraz eksport i import", async ({
  page,
  context,
}) => {
  const legacy = {
    ...defaults(),
    version: 1,
    history: [
      {
        date: "2000-01-01",
        solved: 3,
        skipped: 1,
        corrections: 2,
        modules: { add: 4, subtract: 0, multiply: 0, divide: 0 },
      },
    ],
  };
  await context.addInitScript((value) => {
    if (!localStorage.getItem("rachmistrz:v1"))
      localStorage.setItem("rachmistrz:v1", JSON.stringify(value));
  }, legacy);
  await page.goto("/");
  const first = await ready(page);
  expect((await readProgress(page)).history[0].solved).toBe(3);
  const other = await context.newPage();
  await other.goto("/");
  const second = await ready(other);
  await Promise.all([first.press("Enter"), second.press("Enter")]);
  await ready(page);
  await ready(other);
  await expect
    .poll(async () =>
      (await readProgress(page)).history.reduce(
        (sum, day) => sum + day.skipped,
        0,
      ),
    )
    .toBe(3);
  await settings(page);
  await page.getByLabel("Motyw", { exact: true }).click();
  await page.getByRole("option", { name: "Ciemny", exact: true }).click();
  await expect(other.locator("html")).toHaveAttribute("data-theme", "dark");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj postęp" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^rachmistrz-.*\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const backup = migrateSaved(
    JSON.parse(Buffer.concat(chunks).toString()) as unknown,
  );
  expect(backup.theme).toBe("dark");
  backup.modules.divide.level = 5;
  backup.theme = "light";
  const oldRevision = (await readProgress(page)).revision;
  await upload(page, backup);
  await expect(page.getByText(/Import zastąpi/)).toBeVisible();
  await page.getByRole("button", { name: "Zastąp obecny postęp" }).click();
  await expect(page.getByText("Postęp został zaimportowany.")).toBeVisible();
  expect((await readProgress(page)).revision).toBeGreaterThan(oldRevision);
  expect((await readProgress(page)).modules.divide.level).toBe(5);
  await expect(other.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("rachmistrz:v1")!) as unknown,
    ),
  ).toEqual(legacy);
});

test("błąd zapisu zachowuje odpowiedź i pozwala zatwierdzić ją ponownie", async ({
  page,
}) => {
  await page.goto("/");
  const input = await ready(page);
  const result = await answer(page);
  await input.fill("999999");
  await page.evaluate(() => {
    const transaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (
      ...args: Parameters<typeof transaction>
    ) {
      if (args[1] === "readwrite") {
        IDBDatabase.prototype.transaction = transaction;
        throw new DOMException("Test quota", "QuotaExceededError");
      }
      return transaction.apply(this, args);
    };
  });
  await input.fill(result);
  await expect(page.getByRole("alert")).toContainText("Nie udało się zapisać");
  await expect(input).toHaveValue(result);
  await expect(input).not.toBeEditable();
  await expect(
    page.getByRole("button", { name: /Pomiń zadanie/ }),
  ).toBeHidden();
  await settings(page);
  await expect(
    page.getByLabel("Poziom: Dodawanie", { exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await page.getByRole("button", { name: "Spróbuj ponownie" }).click();
  await expect(input).toBeEditable();
  await expect(input).toHaveValue("");
  await expect(page.getByRole("alert")).toBeHidden();
  const day = (await readProgress(page)).history[0];
  expect([day.solved, day.corrections]).toEqual([1, 1]);
});

test("eksport ostrzega o kopii awaryjnej i pozwala ponowić odczyt", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await settings(page);
  await page.evaluate(() => {
    const transaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (
      ...args: Parameters<typeof transaction>
    ) {
      if (args[1] === "readonly") {
        IDBDatabase.prototype.transaction = transaction;
        throw new DOMException("Test read failure", "InvalidStateError");
      }
      return transaction.apply(this, args);
    };
  });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj postęp" }).click();
  await download;
  await expect(
    page.getByRole("region", { name: "Kopia postępu" }),
  ).toContainText("Pobrano kopię awaryjną");
  const retry = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj postęp" }).click();
  await retry;
  await expect(
    page.getByRole("region", { name: "Kopia postępu" }),
  ).toContainText("Kopia postępu została przygotowana");
});

test("uszkodzony zapis nie jest zerowany i można odzyskać dane z kopii", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("rachmistrz", 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction("progress", "readwrite");
          tx.objectStore("progress").put({ version: 999 }, "state");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("Nieobsługiwany format");
  await expect(
    page.getByRole("textbox", { name: "Twoja odpowiedź" }),
  ).not.toBeEditable();
  await settings(page);
  await expect(
    page.getByRole("button", { name: "Importuj postęp" }),
  ).toBeEnabled();
  const backup = defaults();
  backup.modules.multiply.level = 4;
  await upload(page, backup);
  await page.getByRole("button", { name: "Zastąp obecny postęp" }).click();
  await expect(page.getByRole("alert")).toBeHidden();
  expect((await readProgress(page)).modules.multiply.level).toBe(4);
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await ready(page);
});
