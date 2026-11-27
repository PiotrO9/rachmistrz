import { expect, test } from "@playwright/test";
import { ready, readProgress } from "./helpers";
for (const width of [320, 1280])
  test("sesja i zapisany zestaw przy " + width + " px", async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const input = await ready(page);
    const equation = await page.locator(".equation").getAttribute("aria-label");
    await page.getByRole("button", { name: "Szybka sesja" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog
      .getByLabel("Działanie", { exact: true })
      .selectOption("divide");
    await dialog.getByLabel("Trudność").selectOption("fixed");
    await dialog.getByLabel("Poziom", { exact: true }).selectOption("5");
    await dialog
      .getByLabel("Liczba zadań", { exact: true })
      .selectOption("custom");
    await dialog.getByLabel("Własna liczba zadań").fill("1");
    await dialog.getByRole("button", { name: "Zapisz jako zestaw" }).click();
    await dialog.getByLabel("Nazwa zestawu").fill("Dzielenie na 5");
    await dialog.getByRole("button", { name: "Zapisz zestaw" }).click();
    await expect(dialog.getByText("Moje zestawy (1)")).toBeVisible();
    await dialog.getByRole("button", { name: "Rozpocznij sesję" }).click();
    await input.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Sesja zakończona" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Powtórz sesję" }).click();
    await page.getByRole("button", { name: "Zakończ sesję" }).click();
    await page.getByRole("button", { name: "Wróć do treningu" }).click();
    await expect(page.locator(".equation")).toHaveAttribute(
      "aria-label",
      equation!,
    );
    expect((await readProgress(page)).history[0].skipped).toBe(1);
    await page.reload();
    await ready(page);
    await page.getByRole("button", { name: "Szybka sesja" }).click();
    await dialog.getByText("Moje zestawy (1)").click();
    await dialog.getByRole("button", { name: "Dzielenie na 5" }).click();
    await expect(
      page.getByRole("button", { name: "Zakończ sesję" }),
    ).toBeVisible();
  });
