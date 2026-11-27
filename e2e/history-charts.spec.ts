import { expect, test } from "@playwright/test";
import { answer, ready, settings } from "./helpers";

test("wybór działania z rankingu otwiera dzienny wynik także na telefonie", async ({
  page,
}) => {
  await page.goto("/");
  const input = await ready(page);
  await input.fill(await answer(page));
  await expect(input).toHaveValue("");
  await page.getByRole("button", { name: "Historia", exact: true }).click();
  const rankings = page.locator(".rankingGrid");
  await expect(rankings.getByRole("button")).toHaveCount(2);
  await expect(rankings.getByRole("button").last()).toContainText("1 z 1");
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await rankings.getByRole("button").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".trend circle")).toHaveCount(1);
    await expect(page.locator(".trend")).toContainText("100% (1 z 1)");
    const period = page.getByRole("group", { name: "Zakres wykresów" });
    await page.emulateMedia({
      reducedMotion: width === 320 ? "reduce" : "no-preference",
    });
    const indicator = await period.evaluate((group) => {
      const style = getComputedStyle(group, "::before");
      return {
        duration: style.transitionDuration,
        width: parseFloat(style.width),
      };
    });
    expect(parseFloat(indicator.duration) > 0).toBe(width !== 320);
    await period.getByRole("button", { name: "7 dni" }).press("Enter");
    await expect
      .poll(() =>
        period.evaluate(
          (group) =>
            new DOMMatrix(getComputedStyle(group, "::before").transform).m41,
        ),
      )
      .toBeCloseTo(indicator.width, 1);
    await expect(page.locator(".trend h3")).toContainText("ostatnie 7 dni");
    await period.getByRole("button", { name: "Dzisiaj" }).click();
    await expect(page.locator(".trend")).toContainText("100% (1 z 1)");
    await expect(page.locator(".trend svg")).toHaveCount(0);
    await period.getByRole("button", { name: "30 dni" }).click();
    await expect(page.locator(".trend circle")).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
});

test("ranking zmienia liczby od aktualnie wyświetlonej wartości", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-10T12:00:00Z"));
  await page.goto("/");
  await ready(page);
  await settings(page);
  for (const op of ["odejmowanie", "mnożenie", "dzielenie"]) {
    await page
      .getByRole("switch", { name: "Włącz " + op, exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await page.reload();
  const input = await ready(page);
  for (let i = 0; i < 11; i++) {
    if (i === 10)
      await page.clock.setFixedTime(new Date("2026-11-27T12:00:00Z"));
    await input.fill(await answer(page));
    await expect(input).toHaveValue("");
  }
  await page.getByRole("button", { name: "Historia", exact: true }).click();
  const count = page.locator(".rankingRow strong").first();
  await expect(count).toHaveText("11");
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 60000));
  const period = page.getByRole("group", { name: "Zakres wykresów" });
  const select = (days: number) =>
    period.getByRole("button", { name: days + " dni" }).press("Enter");
  await select(7);
  await page.clock.runFor(100);
  const between = Number(await count.innerText());
  expect(between).toBeGreaterThan(1);
  expect(between).toBeLessThan(11);
  await select(30);
  expect(Number(await count.innerText())).toBe(between);
  await page.clock.runFor(500);
  await expect(count).toHaveText("11");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await select(7);
  expect(await count.innerText()).toBe("1");
});
