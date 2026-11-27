import { test, expect } from "@playwright/test";
import { defaults } from "../src/domain";
import { ready, readProgress, settings, upload } from "./helpers";

test.use({ hasTouch: true });

for (const example of [
  {
    level: 1,
    equation: "9/10 × 9/10",
    answer: "162/200",
    step: "9/10 × 9/10 = 81/100",
  },
  {
    level: 2,
    equation: "10/12 ÷ 11/12",
    answer: "20/22",
    step: "10/12 × 12/11 = 120/132",
  },
] as const) {
  test(
    example.equation +
      " accepts equivalent answers and explains the calculation",
    async ({ page }) => {
      await page.addInitScript(() => {
        Math.random = () => 0.9999;
      });
      await page.goto("/");
      await ready(page);
      await settings(page);
      const saved = defaults();
      for (const module of Object.values(saved.modules)) module.enabled = false;
      saved.modules.fraction.enabled = true;
      saved.modules.fraction.level = example.level;
      saved.showSolution = true;
      await upload(page, saved);
      await page.getByRole("button", { name: "Zastąp obecny postęp" }).click();
      await expect(
        page.getByText("Postęp został zaimportowany."),
      ).toBeVisible();
      await page.getByRole("button", { name: "Trening", exact: true }).click();
      const field = await ready(page);
      await expect(page.locator(".equation")).toHaveAttribute(
        "aria-label",
        example.equation,
      );
      await field.fill(example.answer);
      await expect(field).toHaveValue("");
      await field.press("Enter");
      await page.getByText("Pokaż sposób liczenia").click();
      await expect(page.locator(".solutionMethod ol")).toContainText(
        example.step,
      );
      expect(
        (await readProgress(page)).history[0].details?.fraction,
      ).toMatchObject({ solved: 1, skipped: 1 });
    },
  );
}

test("optional fractions accept equivalent answers and keep progress across reloads", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");
  await ready(page);
  const equation = page.locator(".equation");
  const first = await equation.getAttribute("aria-label");
  await settings(page);
  const toggle = page.getByRole("switch", {
    name: "Włącz ułamki",
    exact: true,
  });
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
  const training = page.getByRole("button", { name: "Trening", exact: true });
  await training.click();
  await expect(equation).toHaveAttribute("aria-label", first!);
  await settings(page);
  for (const name of ["dodawanie", "odejmowanie", "mnożenie", "dzielenie"]) {
    await page
      .getByRole("switch", { name: "Włącz " + name, exact: true })
      .click();
  }
  await page
    .getByRole("switch", { name: "Pokazuj rozwiązanie po pominięciu" })
    .click();
  await training.click();
  const field = await ready(page);
  await expect(equation).toHaveAttribute("aria-label", "1/3 + 1/3");
  await page.setViewportSize({ width: 320, height: 640 });
  await field.tap();
  await field.fill("4");
  await page.getByRole("button", { name: "Wstaw kreskę ułamkową" }).tap();
  await expect(field).toHaveValue("4/");
  await field.press("0");
  await expect(field).toHaveValue("4/0");
  expect((await readProgress(page)).history).toHaveLength(0);
  await field.press("Backspace");
  await field.press("6");
  await expect(field).toHaveValue("");
  await field.press("Enter");
  await expect(field).toHaveValue("2/3");
  await page.getByText("Pokaż sposób liczenia").click();
  await expect(page.locator(".solutionMethod ol")).toContainText(
    "1/3 + 1/3 = 2/3",
  );
  await page.reload();
  await ready(page);
  const saved = await readProgress(page);
  expect(saved.modules.fraction.enabled).toBe(true);
  expect(saved.history[0].details?.fraction).toEqual({
    solved: 1,
    skipped: 1,
    corrections: 1,
    clean: 0,
  });
});
