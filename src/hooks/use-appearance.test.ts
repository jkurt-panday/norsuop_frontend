import { describe, expect, it } from "vitest";
import { initializeTheme } from "./use-appearance";

describe("use-appearance hook", () => {
  it("initializes theme to light by default and updates document class", () => {
    localStorage.clear();
    initializeTheme();
    expect(localStorage.getItem("appearance")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
