import { test, expect } from "@playwright/test";
import { ready, readProgress, settings } from "./helpers";

test("układ i menu zachowują granicę 650/651 px", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const toggle = page.getByRole("button", { name: "Otwórz menu" });
  const dialog = page.getByRole("dialog", { name: "Menu" });
  for (const width of [320, 360, 650, 651, 1280, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    if (width <= 650) await expect(toggle).toBeVisible();
    else {
      await expect(toggle).toBeHidden();
      await expect(dialog).toBeHidden();
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    }
    for (const name of ["Trening", "Ustawienia", "Historia"]) {
      if (width <= 650) await toggle.click();
      await page.getByRole("button", { name, exact: true }).click();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    const headerHasNoOverlap = await page
      .locator(".header")
      .evaluate((header) => {
        const boxes = Array.from(header.children)
          .map((element) => element.getBoundingClientRect())
          .filter((box) => box.width > 0 && box.height > 0)
          .sort((a, b) => a.left - b.left);
        return boxes.every(
          (box, index) => index === 0 || boxes[index - 1].right <= box.left,
        );
      });
    expect(headerHasNoOverlap, `nagłówek przy ${width}px`).toBe(true);
    if (width === 650) {
      await toggle.click();
      await expect(dialog).toBeVisible();
    }
  }
});

test("select obsługuje klawiaturę, fokus i zapamiętanie motywu", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await settings(page);
  const level = page.getByLabel("Poziom: Dodawanie", { exact: true });
  await level.focus();
  await level.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("option", { name: "Ekspercki", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(level).toContainText("Ekspercki");
  await expect(level).toBeFocused();
  await level.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("option", { name: "Podstawowy", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(level).toBeFocused();
  await expect(level).toContainText("Ekspercki");
  await page.getByLabel("Motyw", { exact: true }).click();
  await page.getByRole("option", { name: "Ciemny", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await settings(page);
  await expect(
    page.getByLabel("Poziom: Dodawanie", { exact: true }),
  ).toContainText("Ekspercki");
});

test("układ mieści się na telefonie i dużym ekranie", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto("/");
  await ready(page);
  await expect(page.locator(".exercise")).toHaveCSS("font-size", "176px");
  await page.screenshot({
    animations: "disabled",
    path: testInfo.outputPath("trening-desktop.png"),
  });
  await testInfo.attach("trening-desktop", {
    path: testInfo.outputPath("trening-desktop.png"),
    contentType: "image/png",
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await settings(page);
  await page.getByLabel("Motyw", { exact: true }).click();
  await page.getByRole("option", { name: "Ciemny", exact: true }).click();
  await page.getByLabel("Poziom: Dodawanie", { exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(5);
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    animations: "disabled",
    path: testInfo.outputPath("poziomy-mobile.png"),
  });
  await testInfo.attach("poziomy-mobile", {
    path: testInfo.outputPath("poziomy-mobile.png"),
    contentType: "image/png",
  });
  await page.getByRole("option", { name: "Trudny", exact: true }).click();
  await page.getByRole("button", { name: "Otwórz menu" }).click();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  const input = await ready(page);
  await expect(input).toHaveAttribute("inputmode", "numeric");
  await page.getByRole("button", { name: "Pomiń zadanie" }).click();
  await ready(page);
  expect((await readProgress(page)).history[0].skipped).toBe(1);
});

test("menu mobilne: nawigacja, zamykanie i zmiana szerokości", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const input = await ready(page);
  await input.fill("999");
  const equation = await page.locator(".equation").getAttribute("aria-label");
  const toggle = page.locator(".menuToggle");
  const nav = page.getByRole("navigation");
  await expect(nav).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const dialog = page.getByRole("dialog", { name: "Menu" });
  const close = dialog.getByRole("button", { name: "Zamknij menu" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(nav.getByRole("button", { name: "Historia" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect(dialog).toHaveCSS("height", "800px");
  await expect(nav.getByRole("button")).toHaveCount(3);
  await expect(nav.getByRole("button", { name: "Trening" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.screenshot({ path: testInfo.outputPath("menu-mobile.png") });
  await page.keyboard.press("Tab");
  await expect(nav.getByRole("button", { name: "Trening" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await toggle.click();
  await close.click();
  await expect(dialog).toBeHidden();
  await toggle.click();
  await page.getByRole("dialog").click({ position: { x: -20, y: 100 } });
  await expect(nav).toBeHidden();
  await settings(page);
  await expect(
    page.getByRole("heading", { name: "Ustawienia treningu", exact: true }),
  ).toBeVisible();
  await expect(nav).toBeHidden();
  await toggle.click();
  await nav.getByRole("button", { name: "Historia" }).click();
  await expect(nav).toBeHidden();
  await toggle.click();
  await nav.getByRole("button", { name: "Trening" }).click();
  await expect(input).toHaveValue("999");
  await expect(page.locator(".equation")).toHaveAttribute(
    "aria-label",
    equation!,
  );
  await toggle.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(toggle).toBeHidden();
  await expect(nav).toBeVisible();
  await expect(page.getByRole("button", { name: "Zainstaluj" })).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(nav).toBeHidden();
  await toggle.click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const touch of [false, true]) {
  test(`ponowne naciśnięcie selektora zamyka listę (${touch ? "dotyk" : "mysz"})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      hasTouch: touch,
      viewport: { width: 390, height: 844 },
    });
    try {
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:4178/");
      await ready(page);
      await settings(page);
      const level = page.locator("#level-subtract");
      await level.scrollIntoViewIfNeeded();
      const press = async () => {
        const box = await level.boundingBox();
        const x = box!.x + box!.width - 18;
        const y = box!.y + box!.height / 2;
        if (touch) await page.touchscreen.tap(x, y);
        else await page.mouse.click(x, y);
      };
      await press();
      await expect(page.getByRole("listbox")).toBeVisible();
      await press();
      await expect(page.getByRole("listbox")).toBeHidden();
      await expect(level).toHaveAttribute("aria-expanded", "false");
      await expect(level).toBeFocused();
      await press();
      await expect(page.getByRole("listbox")).toBeVisible();
      await page.getByRole("option", { name: "Łatwy", exact: true }).click();
      await expect(level).toContainText("Łatwy");
      await expect(page.getByRole("listbox")).toBeHidden();
    } finally {
      await context.close();
    }
  });
}
