import { test, expect } from "@playwright/test";
import { ready, settings, readProgress, answer } from "./helpers";

test("opcjonalne działania: włączenie, odpowiedź, trwałość i wyłączenie", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await settings(page);
  for (const name of ["potęgowanie", "pierwiastkowanie"]) {
    await expect(
      page.getByRole("switch", { name: `Włącz ${name}`, exact: true }),
    ).not.toBeChecked();
  }
  for (const [name, op, symbol] of [
    ["potęgowanie", "power", "^"],
    ["pierwiastkowanie", "root", "√"],
  ] as const) {
    await page
      .getByRole("switch", { name: `Włącz ${name}`, exact: true })
      .click();
    for (const other of ["dodawanie", "odejmowanie", "mnożenie", "dzielenie"]) {
      const control = page.getByRole("switch", {
        name: `Włącz ${other}`,
        exact: true,
      });
      if (await control.isChecked()) await control.click();
    }
    if (op === "root")
      await page
        .getByRole("switch", { name: "Włącz potęgowanie", exact: true })
        .click();
    await page.getByRole("button", { name: "Trening", exact: true }).click();
    const input = await ready(page);
    await expect(page.locator(".equation")).toHaveAttribute(
      "aria-label",
      new RegExp(` ${symbol === "^" ? "\\^" : symbol} `),
    );
    await input.fill(await answer(page));
    await expect
      .poll(
        async () => (await readProgress(page)).history[0].details?.[op].solved,
      )
      .toBe(1);
    await page.reload();
    await ready(page);
    expect((await readProgress(page)).modules[op].enabled).toBe(true);
    await settings(page);
  }
  await page.getByLabel("Poziom: Pierwiastkowanie", { exact: true }).click();
  await page.getByRole("option", { name: "Ekspercki", exact: true }).click();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  const input = await ready(page);
  await input.focus();
  await input.press("Enter");
  await ready(page);
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `output/optional-root-${width}.png` });
  }
  await settings(page);
  await page
    .getByRole("switch", { name: "Włącz dodawanie", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "Włącz pierwiastkowanie", exact: true })
    .click();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await ready(page);
  await expect(page.locator(".equation")).toHaveAttribute("aria-label", / \+ /);
});
