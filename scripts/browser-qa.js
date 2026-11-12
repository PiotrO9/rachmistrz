async (page) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.context().addInitScript(() => {
    if (location.hostname === "127.0.0.1" && !localStorage.getItem("seeded")) {
      const modules = Object.fromEntries(
        ["add", "subtract", "multiply", "divide"].map((op) => [
          op,
          { enabled: true, level: 2, adaptive: true, block: [] },
        ]),
      );
      localStorage.setItem(
        "rachmistrz:v1",
        JSON.stringify({
          version: 1,
          modules,
          history: [
            {
              date: "2026-11-09",
              solved: 3,
              skipped: 1,
              corrections: 2,
              modules: { add: 4, subtract: 0, multiply: 0, divide: 0 },
            },
          ],
        }),
      );
      localStorage.setItem("seeded", "yes");
    }
  });
  await page.goto("http://127.0.0.1:4178/");
  const ready = async (p) =>
    p.waitForFunction(() => {
      const el = document.querySelector("input[name=answer]");
      return el && !el.readOnly && el.getAttribute('aria-busy') !== 'true';
    });
  const read = async () =>
    page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const r = indexedDB.open("rachmistrz", 1);
          r.onsuccess = () => {
            const db = r.result;
            const t = db.transaction("progress");
            const get = t.objectStore("progress").get("state");
            get.onsuccess = () => {
              resolve(get.result);
              db.close();
            };
            get.onerror = () => reject(get.error);
          };
        }),
    );
  await ready(page);
  let saved = await read();
  if (saved.version !== 2 || saved.history[0].solved !== 3)
    throw Error("Migration failed");
  const other = await page.context().newPage();
  await other.goto("http://127.0.0.1:4178/");
  await ready(other);
  await Promise.all([
    page.getByRole("textbox", { name: "Twoja odpowiedź" }).press("Enter"),
    other.getByRole("textbox", { name: "Twoja odpowiedź" }).press("Enter"),
  ]);
  await ready(page);
  await ready(other);
  saved = await read();
  if (saved.history.find((d) => d.date !== "2026-11-09").skipped !== 2)
    throw Error("Two tabs lost an event");
  const box = page.getByRole("textbox", { name: "Twoja odpowiedź" });
  await box.fill("999999");
  const equation = await page.locator(".equation").getAttribute("aria-label");
  await page.getByRole("button", { name: "Ustawienia", exact: true }).click();
  await page.getByLabel("Poziom: Dodawanie", { exact: true }).click();
  await page.getByRole('option',{name:'Trudny',exact:true}).click();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await ready(page);
  if (
    (await box.inputValue()) !== "999999" ||
    (await page.locator(".equation").getAttribute("aria-label")) !== equation
  )
    throw Error("Settings erased task");
  const [a, op, b] = equation.split(" "),
    answer =
      op === "+"
        ? +a + +b
        : op === "−"
          ? +a - +b
          : op === "×"
            ? +a * +b
            : +a / +b;
  await box.fill(String(answer));
  await ready(page);
  if ((await box.inputValue()) !== "")
    throw Error("Correct answer did not advance");
  if (await box.evaluate((el) => el !== document.activeElement))
    throw Error("Focus lost");
  await page.getByRole("button", { name: "Ustawienia", exact: true }).click();
  await page
    .getByRole("switch", {
      name: "Pokazuj rozwiązanie po pominięciu",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await ready(page);
  await box.press("Enter");
  await page.getByRole("button", { name: /Następne zadanie/ }).waitFor();
  const revealed = await read();
  const skipped = revealed.history[0].skipped;
  if (
    !(await box.getAttribute("readonly")) &&
    !(await box.evaluate((el) => el.readOnly))
  )
    throw Error("Solution editable");
  await box.press("Enter");
  await ready(page);
  if ((await read()).history[0].skipped !== skipped)
    throw Error("Solution counted twice");
  await page.getByRole("button", { name: "Historia", exact: true }).click();
  await page.getByLabel("Działanie", { exact: true }).click();
  await page.getByRole('option',{name:'Dodawanie',exact:true}).click();
  await page.getByText("Zmiany poziomów", { exact: false }).click();
  await page.screenshot({
    path: "output/playwright/v2-history.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ustawienia", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Eksportuj postęp", exact: true })
    .click();
  const download = await downloadPromise;
  const path = await download.path();
  await page
    .getByLabel("Plik z kopią postępu", { exact: true })
    .setInputFiles(path);
  await page
    .getByRole("button", { name: "Zastąp obecny postęp", exact: true })
    .waitFor();
  const before = await read();
  await page
    .getByRole("button", { name: "Anuluj import", exact: true })
    .click();
  if (JSON.stringify(await read()) !== JSON.stringify(before))
    throw Error("Cancelled import changed state");
  await page
    .getByLabel("Plik z kopią postępu", { exact: true })
    .setInputFiles(path);
  await page
    .getByRole("button", { name: "Zastąp obecny postęp", exact: true })
    .click();
  await page
    .getByText("Postęp został zaimportowany.", { exact: true })
    .waitFor();
  const imported = await read();
  if (imported.history[0].skipped !== before.history[0].skipped)
    throw Error("Roundtrip changed history");
  await page
    .getByLabel("Plik z kopią postępu", { exact: true })
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{bad"),
    });
  if (JSON.stringify(await read()) !== JSON.stringify(imported))
    throw Error("Invalid import changed saved data");
  await other.getByRole("button", { name: "Ustawienia", exact: true }).click();
  await other
    .getByRole("switch", {
      name: "Pokazuj rozwiązanie po pominięciu",
      exact: true,
    })
    .waitFor();
  if (
    (await other
      .getByRole("switch", {
        name: "Pokazuj rozwiązanie po pominięciu",
        exact: true,
      })
      .getAttribute("aria-checked")) !== "true"
  )
    throw Error("Other tab not synchronized");
  await other.close();
  await page.screenshot({
    path: "output/playwright/v2-settings.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Trening", exact: true }).click();
  await ready(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await ready(page);
  await page.context().setOffline(true);
  const offline = await page.context().newPage();
  await offline.goto("http://127.0.0.1:4178/");
  await ready(offline);
  await offline.close();
  await page.reload();
  await ready(page);
  await page.context().setOffline(false);
  const widths = [];
  for (const width of [320, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ["Ustawienia", "Historia", "Trening"]) {
      await page.getByRole("button", { name, exact: true }).click();
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw Error(name + " overflows at " + width);
    }
    await page.screenshot({
      path: `output/playwright/v2-${width}.png`,
      fullPage: true,
    });
    widths.push(width);
  }
  if (errors.length) throw Error(errors.join(";"));
  return {
    passed: true,
    migration: true,
    multiTab: true,
    preservedInput: true,
    solution: true,
    exportImport: true,
    invalidImportSafe: true,
    offline: true,
    widths,
  };
}
