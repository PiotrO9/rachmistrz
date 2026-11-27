import { test, expect } from "@playwright/test";
import { ready, readProgress, answer, settings } from "./helpers";

test("automatyczna odpowiedź, poprawki, zachowanie rachunku i skróty", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const input = await ready(page);
  const equation = await page.locator(".equation").getAttribute("aria-label");
  await expect(
    page.getByRole("button", { name: "Pomiń zadanie" }),
  ).toBeHidden();
  const beforeHintClick = await readProgress(page);
  await page.locator(".skipHint").click();
  expect(await readProgress(page)).toEqual(beforeHintClick);
  await expect(page.locator(".equation")).toHaveAttribute(
    "aria-label",
    equation!,
  );
  const result = await answer(page);
  await input.fill("999999");
  await expect(input).toHaveValue("999999");
  await settings(page);
  await page.getByLabel("Poziom: Dodawanie", { exact: true }).click();
  await page.getByRole("option", { name: "Trudny", exact: true }).click();
  await expect(
    page.getByLabel("Poziom: Dodawanie", { exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await ready(page);
  await expect(input).toHaveValue("999999");
  await expect(page.locator(".equation")).toHaveAttribute(
    "aria-label",
    equation!,
  );
  await input.fill(result);
  await expect(input).toHaveValue("");
  await expect
    .poll(async () => (await readProgress(page)).history[0]?.solved)
    .toBe(1);
  expect((await readProgress(page)).history[0].corrections).toBe(1);
  await input.press("Enter");
  await ready(page);
  await input.press("Space");
  await ready(page);
  await expect
    .poll(async () => (await readProgress(page)).history[0]?.skipped)
    .toBe(2);
  await settings(page);
  await page
    .getByRole("switch", { name: "Pokazuj rozwiązanie po pominięciu" })
    .click();
  await expect(
    page.getByRole("switch", { name: "Pokazuj rozwiązanie po pominięciu" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await ready(page);
  const revealed = await answer(page);
  await input.press("Enter");
  await expect(input).toHaveValue(revealed);
  await expect(input).not.toBeEditable();
  await page.getByText("Pokaż sposób liczenia", { exact: true }).click();
  await expect(page.locator(".solutionMethod ol")).toBeVisible();
  expect((await readProgress(page)).history[0].skipped).toBe(3);
  await input.press("Enter");
  await ready(page);
  await expect(input).toHaveValue("");
  await expect(page.locator(".solutionMethod")).toHaveCount(0);
  expect((await readProgress(page)).history[0].skipped).toBe(3);
  expect(errors).toEqual([]);
});

test("cyfry poza polem trafiają do odpowiedzi bez przejmowania innych kontrolek", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/");
  const input = await ready(page);
  const trainingTab = page.getByRole("button", {
    name: "Trening",
    exact: true,
  });
  await input.fill("999");
  await trainingTab.focus();
  await input.click();
  await expect(input).not.toBeFocused();
  await trainingTab.focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Ustawienia", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("8");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("9998");
  await page.keyboard.press("Backspace");
  await expect(input).toHaveValue("999");
  await trainingTab.focus();
  await page.keyboard.press("Control+1");
  await expect(input).toHaveValue("999");
  await expect(trainingTab).toBeFocused();
  const before = await readProgress(page);
  await page.keyboard.press("Space");
  expect(await readProgress(page)).toEqual(before);
  await expect(input).toHaveValue("999");
  const result = await answer(page);
  await input.fill("");
  await trainingTab.focus();
  await page.keyboard.type(result);
  await expect(input).toHaveValue("");
  await expect
    .poll(async () => (await readProgress(page)).history[0]?.solved)
    .toBe(1);
  await settings(page);
  const level = page.getByLabel("Poziom: Dodawanie", { exact: true });
  await level.click();
  await page.keyboard.press("2");
  await expect(page.getByRole("listbox")).toBeVisible();
  expect((await readProgress(page)).history[0].solved).toBe(1);

  const touch = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 667 },
  });
  try {
    const mobile = await touch.newPage();
    await mobile.goto("/");
    const mobileInput = await ready(mobile);
    await expect(mobileInput).not.toBeFocused();
    await mobileInput.tap();
    await expect(mobileInput).toBeFocused();
    await mobileInput.fill("999");
    await expect(mobileInput).toHaveValue("999");
  } finally {
    await touch.close();
  }
});
