import { useEffect } from "react";
import type { Theme } from "./domain";

export function useTheme(preference: Theme, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved =
        preference === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preference;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", resolved === "dark" ? "#161d19" : "#f6f5ef");
      // Render cache only. The authoritative preference is saved transactionally in IndexedDB.
      try {
        localStorage.setItem("rachmistrz:theme-cache", preference);
      } catch {
        /* The theme still works when this cache is unavailable. */
      }
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference, ready]);
}
