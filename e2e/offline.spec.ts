import { test, expect } from "@playwright/test";
import { ready, readProgress } from "./helpers";

test("PWA otwiera się i zapisuje postęp po odłączeniu internetu", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await ready(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await ready(page);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  const input = await ready(page);
  await input.press("Enter");
  await ready(page);
  expect((await readProgress(page)).history[0].skipped).toBe(1);
  await page.reload();
  await ready(page);
  expect((await readProgress(page)).history[0].skipped).toBe(1);
});
