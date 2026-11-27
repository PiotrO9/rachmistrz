import { expect, test } from "@playwright/test";
import { ready, settings, readProgress } from "./helpers";
import { target, firstBit } from "../src/domain/matches";

test("enable matches, drag a hinted stick and continue offline", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await ready(page);
  const nav = page.getByRole("button", { name: "Zapałki", exact: true });
  await expect(nav).toHaveCount(0);
  await settings(page);
  await page.getByRole("switch", { name: "Zapałki" }).click();
  await nav.click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.getByRole("button", { name: "Podpowiedz" }).click();
  const board = await page
    .locator(".occupied")
    .evaluateAll((nodes) =>
      nodes.reduce(
        (mask, node) => mask | (1 << Number(node.getAttribute("data-bit"))),
        0,
      ),
    );
  const goal = target(board, 1)!;
  const from = page.locator('[data-bit="' + firstBit(board & ~goal) + '"]');
  const to = page.locator('[data-bit="' + firstBit(goal & ~board) + '"]');
  const a = (await from.boundingBox())!,
    b = (await to.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => (await readProgress(page)).matches.history[0]?.helped)
    .toBe(1);
  await page.getByRole("button", { name: "Pomiń" }).click();
  await expect
    .poll(async () => (await readProgress(page)).matches.history[0]?.skipped)
    .toBe(1);
  await page.reload();
  await ready(page);
  await expect(nav).toBeVisible();
});

test.describe("two-stick boards", () => {
  test.use({ hasTouch: true, viewport: { width: 320, height: 650 } });
  test("solve with touch and keyboard, then reveal both moves", async ({
    page,
  }) => {
    const { defaults } = await import("../src/domain/defaults");
    const saved = defaults();
    saved.matches.enabled = true;
    saved.matches.level = 2;
    saved.showSolution = true;
    await page.addInitScript(
      (value) => localStorage.setItem("rachmistrz:v1", JSON.stringify(value)),
      saved,
    );
    await page.goto("/");
    await ready(page);
    await page.getByRole("button", { name: "Otwórz menu" }).tap();
    await page.getByRole("button", { name: "Zapałki", exact: true }).tap();
    await expect(page.getByText(/Przełóż dwie zapałki/)).toBeVisible();
    for (let i = 0; i < 2; i++) {
      const board = await page
        .locator(".occupied")
        .evaluateAll((nodes) =>
          nodes.reduce(
            (mask, node) => mask | (1 << Number(node.getAttribute("data-bit"))),
            0,
          ),
        );
      const goal = target(board, 2 - i)!;
      const from = page.locator('[data-bit="' + firstBit(board & ~goal) + '"]');
      const to = page.locator('[data-bit="' + firstBit(goal & ~board) + '"]');
      if (i === 0) {
        await from.tap();
        await to.tap();
      } else {
        await from.press("Enter");
        await to.press("Space");
      }
    }
    await expect
      .poll(async () => (await readProgress(page)).matches.history[0]?.clean)
      .toBe(1);
    await page.getByRole("button", { name: "Pomiń" }).tap();
    const show = page.getByRole("button", { name: "Pokaż ruch" });
    await show.tap();
    await show.tap();
    await page.getByRole("button", { name: "Dalej" }).tap();
    await expect(
      page.getByRole("button", { name: "Podpowiedz" }),
    ).toBeEnabled();
  });
});
