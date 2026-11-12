import { test, expect } from "@playwright/test";
import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
import { build, preview } from "vite";
import { readRawProgress as progress } from "./helpers";

test("aktualizacja PWA czeka na zgodę i zachowuje dane oraz offline", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  await mkdir("output", { recursive: true });
  const directory = await mkdtemp(resolve("output/pwa-update-"));
  const served = resolve(directory, "served");
  const next = resolve(directory, "next");
  await cp(process.env.PWA_PREVIOUS_DIST || "dist", served, {
    recursive: true,
  });
  // A real second production build with a changed precache revision.
  await build({
    build: { outDir: next },
    plugins: [
      {
        name: "update-test-marker",
        transformIndexHtml: () => [
          {
            tag: "meta",
            attrs: { name: "pwa-update-test", content: "next" },
            injectTo: "head",
          },
        ],
      },
    ],
  });
  const server = await preview({
    build: { outDir: served },
    preview: { host: "127.0.0.1", port: 0, open: false },
  });
  const address = server.httpServer.address();
  if (!address || typeof address === "string")
    throw new Error("Missing preview address");
  const url = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    context.on("page", (p) => {
      p.on("pageerror", (error) => errors.push(error.message));
      p.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(url);
    const input = page.getByRole("textbox", { name: "Twoja odpowiedź" });
    await expect(input).toBeEditable();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await expect(input).toBeEditable();
    await input.press("Enter");
    await expect(input).toHaveAttribute("aria-busy", "false");
    await page.getByRole("button", { name: "Ustawienia", exact: true }).click();
    await page.getByLabel("Motyw", { exact: true }).click();
    await page.getByRole("option", { name: "Ciemny", exact: true }).click();
    await expect(page.getByLabel("Motyw", { exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Trening", exact: true }).click();
    await input.fill("999999");
    const saved = await progress(page);
    const equation = await page.locator(".equation").getAttribute("aria-label");
    const loadedAt = await page.evaluate(() => performance.timeOrigin);
    await cp(next, served, { recursive: true });
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.ready).update();
    });
    await expect(page.getByText("Nowa wersja jest gotowa.")).toBeVisible();
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(loadedAt);
    await expect(input).toHaveValue("999999");
    await expect(page.locator(".equation")).toHaveAttribute(
      "aria-label",
      equation!,
    );
    await page.getByRole("button", { name: "Aktualizuj", exact: true }).click();
    await page.waitForFunction(
      (previous) => performance.timeOrigin !== previous,
      loadedAt,
    );
    await expect(input).toBeEditable();
    await expect(page.locator('meta[name="pwa-update-test"]')).toHaveAttribute(
      "content",
      "next",
    );
    expect(await progress(page)).toEqual(saved);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await context.setOffline(true);
    const offline = await context.newPage();
    await offline.goto(url);
    const offlineInput = offline.getByRole("textbox", {
      name: "Twoja odpowiedź",
    });
    await expect(offlineInput).toBeEditable();
    expect(await progress(offline)).toEqual(saved);
    await offlineInput.press("Enter");
    await expect(offlineInput).toHaveAttribute("aria-busy", "false");
    const offlineSaved = await progress(offline);
    expect(offlineSaved).not.toEqual(saved);
    await offline.reload();
    await expect(offlineInput).toBeEditable();
    expect(await progress(offline)).toEqual(offlineSaved);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await new Promise<void>((resolve, reject) =>
      server.httpServer.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
