import { expect, test } from "@playwright/test";
import { ready, settings, readProgress } from "./helpers";

test("logarithm practice preserves the current answer across settings and runs offline", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await ready(page);
  const tab = page.getByRole("button", { name: "Logarytmy", exact: true });
  await expect(tab).toHaveCount(0);
  await settings(page);
  await page.getByRole("switch", { name: "Logarytmy", exact: true }).click();
  await page
    .getByRole("switch", { name: "Pokazuj rozwiązanie po pominięciu" })
    .click();
  await tab.click();
  const prompt = page.locator(".logarithms h2");
  const label = await prompt.getAttribute("aria-label");
  const [base, arg] = label!.match(/\d+/g)!.map(Number);
  const input = page.getByRole("textbox", { name: "Twój wynik" });
  await input.fill("99");
  await settings(page);
  await page
    .getByRole("combobox", { name: "Zestaw logarytmów", exact: true })
    .click();
  await page.getByRole("option", { name: "Zmiana podstawy" }).click();
  await tab.click();
  await expect(prompt).toHaveAttribute("aria-label", label!);
  await expect(input).toHaveValue("99");
  await input.fill(String(Math.round(Math.log(arg) / Math.log(base))));
  await expect(prompt).toHaveAttribute("aria-label", /podzielony przez/);
  await input.press("Space");
  await expect(page.getByRole("status")).toContainText("Po zmianie podstawy");
  await page.getByRole("button", { name: "Następne zadanie" }).click();
  await expect(input).toBeEditable();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await page.setViewportSize({ width: 320, height: 660 });
  await page.getByRole("button", { name: "Otwórz menu" }).click();
  await tab.click();
  await input.press("Enter");
  await expect(page.getByRole("status")).toContainText("Po zmianie podstawy");
  expect((await readProgress(page)).logarithms).toEqual({
    enabled: true,
    set: "base",
    solved: 1,
    skipped: 2,
  });
});
