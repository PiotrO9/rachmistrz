import { expect, test } from "@playwright/test";
import { answer, ready } from "./helpers";

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
