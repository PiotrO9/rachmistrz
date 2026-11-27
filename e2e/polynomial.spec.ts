import { test, expect } from "@playwright/test";
import { ready, settings, readProgress } from "./helpers";

test("polynomial remainder is opt-in and accepts a negative remainder", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.25;
  });
  await page.goto("/");
  await ready(page);
  await settings(page);
  const toggle = page.getByRole("switch", {
    name: "Włącz resztę z dzielenia wielomianu",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  for (const name of ["dodawanie", "odejmowanie", "mnożenie", "dzielenie"]) {
    await page
      .getByRole("switch", { name: "Włącz " + name, exact: true })
      .click();
  }
  await page
    .getByRole("button", {
      name: "Dostosuj: Reszta z dzielenia wielomianu",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Poziom: Reszta z dzielenia wielomianu", { exact: true })
    .click();
  await page.getByRole("option", { name: "Trudny", exact: true }).click();
  await page
    .getByRole("switch", { name: "Pokazuj rozwiązanie po pominięciu" })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  const input = await ready(page);
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(page.locator(".equation")).toHaveAttribute(
    "aria-label",
    "Reszta z dzielenia x³ − x² − x − 5 przez x − 1",
  );
  await input.fill("-3");
  await expect(input).toHaveValue("-3");
  await input.fill("-6");
  await expect(input).toHaveValue("");
  await input.press("Enter");
  await page.getByText("Pokaż sposób liczenia").click();
  await expect(page.locator(".solutionMethod ol")).toContainText(
    "W(1) = 1³ − 1² − 1 − 5 = -6",
  );
  expect(
    (await readProgress(page)).history[0].details?.polynomial,
  ).toMatchObject({ solved: 1, skipped: 1 });
});
