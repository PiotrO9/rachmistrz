// Apply the last committed theme before CSS/React load, including offline starts.
(() => {
  let preference = "system";
  try {
    const cached = localStorage.getItem("rachmistrz:theme-cache");
    if (["system", "light", "dark"].includes(cached)) preference = cached;
  } catch {
    /* IndexedDB remains authoritative; this is only a render cache. */
  }
  const dark =
    preference === "dark" ||
    (preference === "system" &&
      matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#161d19" : "#f6f5ef");
})();
