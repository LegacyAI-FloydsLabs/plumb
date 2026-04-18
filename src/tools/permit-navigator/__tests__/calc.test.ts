import { describe, it, expect } from "vitest";
import { navigatePermit } from "../calc";

describe("navigatePermit", () => {
  it("finds water heater replacement permit", () => {
    const result = navigatePermit({
      description: "replace my water heater", occupancy: "residential",
    });
    expect(result.permits.length).toBeGreaterThan(0);
    expect(result.estimated_fees.low).toBeGreaterThan(0);
    expect(result.required_documents.length).toBeGreaterThan(0);
  });

  it("finds bathroom remodel permit", () => {
    const result = navigatePermit({
      description: "bathroom remodel with new fixtures", occupancy: "residential",
    });
    expect(result.permits.length).toBeGreaterThan(0);
    expect(result.inspections.length).toBeGreaterThan(0);
  });

  it("adds commercial notes for commercial occupancy", () => {
    const result = navigatePermit({
      description: "new plumbing for office building", occupancy: "commercial",
    });
    expect(result.notes.some((n) => n.includes("Commercial"))).toBe(true);
  });

  it("returns results even for vague queries", () => {
    const result = navigatePermit({
      description: "something vague and undefined", occupancy: "residential",
    });
    // Always returns at least one permit match (may be default)
    expect(result.permits.length).toBeGreaterThan(0);
    expect(result.required_documents.length).toBeGreaterThan(0);
  });

  it("includes permit fees", () => {
    const result = navigatePermit({
      description: "gas line installation", occupancy: "residential", project_value: 10000,
    });
    expect(result.estimated_fees.low).toBeGreaterThan(0);
    expect(result.estimated_fees.high).toBeGreaterThanOrEqual(result.estimated_fees.low);
  });
});
