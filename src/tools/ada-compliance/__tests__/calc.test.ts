import { describe, it, expect } from "vitest";
import { checkAdaCompliance, ADA_REQUIREMENTS, ADA_CATEGORIES } from "../calc";

describe("checkAdaCompliance", () => {
  it("passes a compliant toilet centerline", () => {
    const result = checkAdaCompliance({ measurements: { wc_centerline: 17 } });
    const check = result.checks.find((c) => c.requirement.id === "wc_centerline");
    expect(check).toBeDefined();
    expect(check!.pass).toBe(true);
  });

  it("fails a non-compliant toilet centerline (too close)", () => {
    const result = checkAdaCompliance({ measurements: { wc_centerline: 12 } });
    const check = result.checks.find((c) => c.requirement.id === "wc_centerline");
    expect(check!.pass).toBe(false);
  });

  it("fails a seat height that is too low", () => {
    const result = checkAdaCompliance({ measurements: { seat_height: 15 } });
    const check = result.checks.find((c) => c.requirement.id === "seat_height");
    expect(check!.pass).toBe(false);
  });

  it("passes a compliant doorway width", () => {
    const result = checkAdaCompliance({ measurements: { doorway_width: 36 } });
    const check = result.checks.find((c) => c.requirement.id === "doorway_width");
    expect(check!.pass).toBe(true);
  });

  it("calculates compliance percentage", () => {
    const result = checkAdaCompliance({
      measurements: { wc_centerline: 17, seat_height: 18, doorway_width: 36 },
    });
    expect(result.total).toBe(3);
    expect(result.compliance_pct).toBe(100);
  });

  it("reports failed categories", () => {
    const result = checkAdaCompliance({ measurements: { wc_centerline: 10 } });
    expect(result.failed).toBe(1);
    expect(result.failed_categories).toContain("toilet");
  });

  it("exposes non-empty requirements database", () => {
    expect(ADA_REQUIREMENTS.length).toBeGreaterThan(15);
    expect(ADA_CATEGORIES.length).toBeGreaterThan(3);
  });
});
