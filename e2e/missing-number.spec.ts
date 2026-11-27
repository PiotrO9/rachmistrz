import { expect, test } from "@playwright/test";
import { ready, readProgress, settings } from "./helpers";

test("missing operands persist offline and a setting change preserves the active equation", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Math.random = () => 0.1;
  });
  await page.goto("/");
  await ready(page);
  await settings(page);
  const toggle = page.getByRole("switch", {
    name: "Brakująca liczba",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect
    .poll(async () => (await readProgress(page)).missingNumber)
    .toBe(true);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  const training = await context.newPage();
  await training.setViewportSize({ width: 320, height: 640 });
  await training.goto("/");
  const field = training.getByRole("textbox", { name: "Brakująca liczba" });
  await expect(field).toBeEditable();
  const equation = training.locator(".equation");
  await expect(equation).toHaveAccessibleName(/brakująca liczba plus/);
  const total = Number(await equation.locator(".knownResult").textContent());
  const known = Number(await equation.locator(".secondOperand").textContent());
  expect(
    await equation.evaluate((el) => el.getBoundingClientRect().right),
  ).toBeLessThanOrEqual(320);
  await field.fill("999");
  await toggle.click();
  await expect
    .poll(async () => (await readProgress(page)).missingNumber)
    .toBe(false);
  await expect(field).toHaveValue("999");
  await field.fill(String(total - known));
  await ready(training);
  await expect
    .poll(
      async () =>
        (await readProgress(training)).history[0]?.details?.add.solved,
    )
    .toBe(1);
  await expect(training.locator(".knownResult")).toHaveCount(0);
});
