import { describe, it, expect } from "vitest";
import { lookupCode, CODE_CATEGORIES } from "../calc";

describe("lookupCode", () => {
  it("finds slope requirements", () => {
    const result = lookupCode({ query: "slope horizontal drainage", code: "ipc-2021" });
    expect(result.total_matches).toBeGreaterThan(0);
    expect(result.matches[0].section).toContain("IPC");
    expect(result.matches[0].plain_language).toBeTruthy();
  });

  it("finds trap arm limits", () => {
    const result = lookupCode({ query: "trap arm length", code: "ipc-2021" });
    expect(result.total_matches).toBeGreaterThan(0);
    expect(result.matches[0].category).toBe("trap");
  });

  it("returns suggestions when no matches", () => {
    const result = lookupCode({ query: "xylophone underwater", code: "ipc-2021" });
    expect(result.total_matches).toBe(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("filters by category", () => {
    const result = lookupCode({ query: "requirements", code: "ipc-2021", category: "vent" });
    if (result.total_matches > 0) {
      result.matches.forEach((m) => expect(m.category).toBe("vent"));
    }
  });

  it("searches both codes when code is 'both'", () => {
    const result = lookupCode({ query: "slope", code: "both" });
    expect(result.total_matches).toBeGreaterThan(0);
  });

  it("exposes non-empty categories", () => {
    expect(CODE_CATEGORIES.length).toBeGreaterThan(3);
  });
});
