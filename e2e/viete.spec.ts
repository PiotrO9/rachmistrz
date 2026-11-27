import { expect, test } from "@playwright/test";
import { readProgress, ready, settings } from "./helpers";

test("Viète is opt-in, accepts either order and keeps progress independently", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await ready(page);
  const tab = page.getByRole("button", { name: "Wzory Viète’a", exact: true });
  await expect(tab).toHaveCount(0);
  await settings(page);
  await page.getByRole("switch", { name: "Wzory Viète’a" }).click();
  await tab.click();
  const equation = page.locator(".viete h2");
  const start = await equation.innerText();
  const roots = Array.from({ length: 19 }, (_, i) => i - 9).filter((x) => {
    const terms = start
      .split(" = ")[0]
      .replaceAll(" ", "")
      .replaceAll("−", "-")
      .match(/[+-]?[^+-]+/g)!;
    return (
      terms.reduce(
        (sum, t) =>
          sum +
          (t === "x²"
            ? x * x
            : t.endsWith("x")
              ? (t === "+x" ? 1 : t === "-x" ? -1 : Number(t.slice(0, -1))) * x
              : Number(t)),
        0,
      ) === 0
    );
  });
  expect(roots).toHaveLength(2);
  const first = page.getByLabel("Pierwszy pierwiastek"),
    second = page.getByLabel("Drugi pierwiastek");
  await first.fill(String(roots[1]));
  await second.fill("99");
  await expect(equation).toHaveText(start);
  await second.fill(String(roots[0]));
  await expect(equation).not.toHaveText(start);
  await first.press("Space");
  await expect
    .poll(async () => (await readProgress(page)).viete)
    .toEqual({ enabled: true, solved: 1, skipped: 1 });
  expect((await readProgress(page)).history).toEqual([]);
  const other = await context.newPage();
  await other.goto("/");
  await settings(other);
  await other.getByRole("switch", { name: "Wzory Viète’a" }).click();
  await expect(tab).toHaveCount(0);
  await ready(page);
  await page.reload();
  await ready(page);
  expect((await readProgress(page)).viete).toEqual({
    enabled: false,
    solved: 1,
    skipped: 1,
  });
});
