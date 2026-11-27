import { expect, test } from "@playwright/test";
import { answer, failNextWrite, ready, readProgress } from "./helpers";
for (const width of [320, 1280])
  test("sesja i zapisany zestaw przy " + width + " px", async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const input = await ready(page);
    const equation = await page.locator(".equation").getAttribute("aria-label");
    await page.getByRole("button", { name: "Szybka sesja" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const operationBox = await dialog
      .getByRole("combobox", { name: "Działanie", exact: true })
      .boundingBox();
    const modeBox = await dialog
      .getByRole("combobox", { name: "Trudność", exact: true })
      .boundingBox();
    expect(Math.abs(operationBox!.width - modeBox!.width)).toBeLessThan(1);
    expect(operationBox!.height).toBe(modeBox!.height);
    if (width > 600) expect(operationBox!.y).toBe(modeBox!.y);
    else expect(operationBox!.x).toBe(modeBox!.x);
    const optionsToggle = dialog.getByText("Więcej opcji", { exact: true });
    const form = dialog.getByRole("combobox", { name: "Forma zadania" });
    await expect(form).toBeHidden();
    await optionsToggle.press("Enter");
    await expect(form).toBeVisible();
    await optionsToggle.press("Space");
    await expect(form).toBeHidden();
    await expect(optionsToggle).toBeFocused();
    const example = dialog.locator(".sessionExample");
    await expect(example.locator("mark")).toHaveText(/\d+/);
    await expect(example).not.toContainText("□");
    expect(
      await example.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await dialog.getByRole("combobox", { name: "Działanie" }).click();
    await dialog
      .getByRole("option", { name: "Dzielenie", exact: true })
      .click();
    await dialog.getByRole("combobox", { name: "Trudność" }).click();
    await dialog.getByRole("option", { name: /Stały poziom/ }).click();
    const level = dialog.getByRole("combobox", { name: "Poziom", exact: true });
    await level.press("Enter");
    await expect(
      dialog.getByRole("option", { name: /Ekspercki/ }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("option", { name: /Podstawowy/ }),
    ).toBeFocused();
    await page.keyboard.press("End");
    await expect(
      dialog.getByRole("option", { name: /Ekspercki/ }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(level).toContainText("Ekspercki");
    await expect(level).toBeFocused();
    const mode = dialog.getByRole("combobox", {
      name: "Trudność",
      exact: true,
    });
    await expect(mode).toHaveText("Stały poziom · 5");
    const info = dialog.getByRole("button", {
      name: "Pomoc: Trudność",
      exact: true,
    });
    const help = page.getByRole("dialog", { name: "Trudność", exact: true });
    await info.hover();
    await expect(help).toBeVisible();
    await expect(level).toBeFocused();
    await help.hover();
    await expect(help).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(help).toBeHidden();
    await expect(level).toBeFocused();
    await info.press("Enter");
    await expect(help).toContainText("na poziomie 5");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(help).toBeHidden();
    await expect(info).toBeFocused();
    await dialog.getByRole("combobox", { name: "Liczba zadań" }).click();
    await dialog.getByRole("option", { name: "Inna", exact: true }).click();
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

test("kliknięcie tła zamyka kreator i zachowuje zadanie", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await ready(page);
  const equation = page.locator(".equation");
  const original = await equation.getAttribute("aria-label");
  await page.getByRole("button", { name: "Szybka sesja" }).click();
  const dialog = page.getByRole("dialog", { name: "Szybka sesja" });
  await dialog.getByRole("heading", { name: "Szybka sesja" }).click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(dialog).toBeHidden();
  await expect(equation).toHaveAttribute("aria-label", original!);
});

test("odświeżenie wznawia wpis, odsłonięcie i podsumowanie sesji offline", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  const input = await ready(page);
  const regular = await page.locator(".equation").innerText();
  await page.getByRole("button", { name: "Ustawienia", exact: true }).click();
  await page
    .getByRole("switch", { name: /rozwiązanie po pominięciu/i })
    .click();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await page.getByRole("button", { name: "Szybka sesja" }).click();
  await page.getByRole("button", { name: "Rozpocznij sesję" }).click();
  await input.fill(await answer(page));
  await expect(input).toHaveValue("");
  const exercise = await page.locator(".equation").innerText();
  await input.fill("999999");
  await failNextWrite(page);
  await input.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Nie udało się zapisać");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(input).toHaveValue("999999");
  await expect(page.locator(".equation")).toHaveText(exercise, {
    useInnerText: true,
  });
  await input.press("Enter");
  await expect(input).not.toBeEditable();
  const revealed = await input.inputValue();
  await page.reload();
  await expect(input).toHaveValue(revealed);
  await expect(input).not.toBeEditable();
  await input.press("Space");
  await expect(input).toBeEditable();
  await page.getByRole("button", { name: "Zakończ sesję" }).click();
  await page.reload();
  await expect(page.locator(".sessionSummary dd")).toHaveText(["1", "1"]);
  await page.getByRole("button", { name: "Wróć do treningu" }).click();
  await expect(page.locator(".equation")).toHaveText(regular, {
    useInnerText: true,
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Szybka sesja" }),
  ).toBeEnabled();
  expect((await readProgress(page)).history[0]).toMatchObject({
    solved: 1,
    skipped: 1,
  });
});

test("odtwarza wynik zatwierdzony tuż przed przerwaniem sesji", async ({
  page,
}) => {
  await page.goto("/");
  const input = await ready(page);
  await page.getByRole("button", { name: "Szybka sesja" }).click();
  await page.getByRole("button", { name: "Rozpocznij sesję" }).click();
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    let pending = false;
    Storage.prototype.setItem = function (key, value) {
      if (key === "rachmistrz:quick-session:v1") {
        if (pending) throw Error("Przerwany zapis stanu karty");
        pending = !!JSON.parse(value).pending;
      }
      write.call(this, key, value);
    };
  });
  await input.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Postęp został zapisany");
  await page.reload();
  await ready(page);
  await page.getByRole("button", { name: "Zakończ sesję" }).click();
  await expect(page.locator(".sessionSummary dd")).toHaveText(["0", "1"]);
  expect((await readProgress(page)).history[0].skipped).toBe(1);
});
