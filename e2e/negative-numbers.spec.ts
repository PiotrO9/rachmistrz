import { test, expect } from "@playwright/test";
import { answer, ready, readProgress, settings } from "./helpers";

test("signed answers keep the current task and count towards multiplication", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.1;
  });
  await page.goto("/");
  await ready(page);
  await settings(page);
  const option = page.getByRole("switch", {
    name: "Liczby ujemne",
    exact: true,
  });
  await expect(option).not.toBeChecked();
  await option.click();
  for (const name of ["dodawanie", "odejmowanie", "dzielenie"]) {
    await page
      .getByRole("switch", { name: `Włącz ${name}`, exact: true })
      .click();
  }
  await page.reload();
  await ready(page);
  const result = await answer(page);
  expect(Number(result)).toBeLessThan(0);
  await settings(page);
  await expect(option).toBeChecked();
  await option.click();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  const input = await ready(page);
  await input.evaluate((field) => field.blur());
  await page.keyboard.type("-");
  await expect(input).toHaveValue("-");
  await page.keyboard.type(result.slice(1));
  await expect(input).toHaveValue("");
  expect((await readProgress(page)).history[0].details?.multiply.clean).toBe(1);
  expect(Number(await answer(page))).toBeGreaterThan(0);
});
