import { describe, it, expect } from "vitest";
import {
  parseDiameter,
  parseSlope,
  parseMaterial,
  parseFixture,
  parsePipeType,
  extract,
} from "../extract";

describe("parseDiameter", () => {
  // DN metric sizes
  it("parses DN50", () => {
    expect(parseDiameter("DN50")).toEqual({ value: 50, unit: "mm" });
  });
  it("parses DN100", () => {
    expect(parseDiameter("DN100")).toEqual({ value: 100, unit: "mm" });
  });
  it("parses dn50 case-insensitive", () => {
    expect(parseDiameter("dn50")).toEqual({ value: 50, unit: "mm" });
  });

  // Millimetres
  it("parses 50mm", () => {
    expect(parseDiameter("50mm")).toEqual({ value: 50, unit: "mm" });
  });
  it("parses 100mm", () => {
    expect(parseDiameter("100mm")).toEqual({ value: 100, unit: "mm" });
  });
  it("parses 75mm with space", () => {
    expect(parseDiameter("75 mm")).toEqual({ value: 75, unit: "mm" });
  });

  // Fractional inches
  it("parses 1/2in", () => {
    expect(parseDiameter("1/2in")).toEqual({ value: 0.5, unit: "inch" });
  });
  it("parses 3/4in", () => {
    expect(parseDiameter("3/4in")).toEqual({ value: 0.75, unit: "inch" });
  });
  it("parses 1/4in", () => {
    expect(parseDiameter("1/4in")).toEqual({ value: 0.25, unit: "inch" });
  });
  it("parses 1/4 inch", () => {
    expect(parseDiameter("1/4 inch")).toEqual({ value: 0.25, unit: "inch" });
  });
  it("parses 1/4 inches", () => {
    expect(parseDiameter("1/4 inches")).toEqual({ value: 0.25, unit: "inch" });
  });
  it("parses 1/8in", () => {
    expect(parseDiameter("1/8in")).toEqual({ value: 0.125, unit: "inch" });
  });
  it("parses 1/16in", () => {
    expect(parseDiameter("1/16in")).toEqual({ value: 0.0625, unit: "inch" });
  });

  // Decimal inches
  it("parses 2in", () => {
    expect(parseDiameter("2in")).toEqual({ value: 2, unit: "inch" });
  });
  it("parses 3 in", () => {
    expect(parseDiameter("3 in")).toEqual({ value: 3, unit: "inch" });
  });
  it("parses 4 inches", () => {
    expect(parseDiameter("4 inches")).toEqual({ value: 4, unit: "inch" });
  });
  it("parses 1.5in", () => {
    expect(parseDiameter("1.5in")).toEqual({ value: 1.5, unit: "inch" });
  });
  it("parses 1.25in", () => {
    expect(parseDiameter("1.25in")).toEqual({ value: 1.25, unit: "inch" });
  });
  it("parses 12in", () => {
    expect(parseDiameter("12in")).toEqual({ value: 12, unit: "inch" });
  });

  // Edge cases
  it("returns null for unrecognized input", () => {
    expect(parseDiameter("foo")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseDiameter("")).toBeNull();
  });
  it("returns null for bare fraction", () => {
    expect(parseDiameter("3/4")).toBeNull();
  });
});

describe("parseSlope", () => {
  // Fractions per foot
  it("parses 1/4 per foot", () => {
    const r = parseSlope("1/4 per foot");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(2.083, 1);
  });
  it("parses 1/4 per ft", () => {
    const r = parseSlope("1/4 per ft");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(2.083, 1);
  });
  it("parses 1/8 per foot", () => {
    const r = parseSlope("1/8 per foot");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(1.042, 1);
  });

  // Percents
  it("parses 2%", () => {
    const r = parseSlope("2%");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(2.0, 1);
  });
  it("parses 0.5%", () => {
    const r = parseSlope("0.5%");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(0.5, 1);
  });
  it("parses 50%", () => {
    const r = parseSlope("50%");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(50, 1);
  });
  it("parses 1.5%", () => {
    const r = parseSlope("1.5%");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(1.5, 1);
  });

  // Ratios
  it("parses 1:48", () => {
    const r = parseSlope("1:48");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(2.083, 1);
  });
  it("parses 1:96", () => {
    const r = parseSlope("1:96");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(1.042, 1);
  });
  it("parses 1/48", () => {
    const r = parseSlope("1/48");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(2.083, 1);
  });

  // Edge cases
  it("returns null for unrecognized input", () => {
    expect(parseSlope("foo")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseSlope("")).toBeNull();
  });
  it("returns null for bare number", () => {
    expect(parseSlope("2.5")).toBeNull();
  });
});

describe("parseMaterial", () => {
  it("normalizes copper", () => {
    expect(parseMaterial("copper")).toBe("Copper");
  });
  it("normalizes copper in phrase", () => {
    expect(parseMaterial("3/4 inch copper pipe")).toBe("Copper");
  });
  it("normalizes PVC", () => {
    expect(parseMaterial("PVC")).toBe("PVC");
  });
  it("normalizes ABS", () => {
    expect(parseMaterial("abs")).toBe("ABS");
  });
  it("normalizes galvanized", () => {
    expect(parseMaterial("galvanized")).toBe("Galvanized Steel");
  });
  it("normalizes galvanized steel", () => {
    expect(parseMaterial("galvanized steel")).toBe("Galvanized Steel");
  });
  it("normalizes cast iron", () => {
    expect(parseMaterial("cast iron")).toBe("Cast Iron");
  });
  it("normalizes GI", () => {
    expect(parseMaterial("GI pipe")).toBe("Galvanized Steel");
  });
  it("normalizes PEX", () => {
    expect(parseMaterial("PEX")).toBe("PEX");
  });
  it("normalizes CPVC", () => {
    expect(parseMaterial("CPVC")).toBe("CPVC");
  });
  it("normalizes stainless steel", () => {
    expect(parseMaterial("stainless steel")).toBe("Stainless Steel");
  });
  it("normalizes stainless steel 316", () => {
    expect(parseMaterial("stainless steel 316")).toBe("Stainless Steel (316)");
  });
  it("normalizes chrome-plated brass", () => {
    expect(parseMaterial("chrome-plated brass")).toBe("Chrome-plated Brass");
  });
  it("normalizes DWv", () => {
    expect(parseMaterial("DWV pipe")).toBe("ABS (DWV)");
  });
  it("returns null for unknown material", () => {
    expect(parseMaterial("unicorn pipe")).toBeNull();
  });
});

describe("parseFixture", () => {
  it("normalizes toilet", () => {
    expect(parseFixture("toilet")).toBe("Water Closet (Toilet)");
  });
  it("normalizes WC", () => {
    expect(parseFixture("WC")).toBe("Water Closet (Toilet)");
  });
  it("normalizes lavatory", () => {
    expect(parseFixture("lavatory")).toBe("Lavatory (Bathroom Sink)");
  });
  it("normalizes bathroom sink", () => {
    expect(parseFixture("bathroom sink")).toBe("Lavatory (Bathroom Sink)");
  });
  it("normalizes kitchen sink", () => {
    expect(parseFixture("kitchen sink")).toBe("Kitchen Sink");
  });
  it("normalizes shower", () => {
    expect(parseFixture("shower")).toBe("Shower Stall");
  });
  it("normalizes bathtub", () => {
    expect(parseFixture("bathtub")).toBe("Bathtub");
  });
  it("normalizes urinal", () => {
    expect(parseFixture("urinal")).toBe("Urinal");
  });
  it("normalizes bidet", () => {
    expect(parseFixture("bidet")).toBe("Bidet");
  });
  it("normalizes washing machine", () => {
    expect(parseFixture("washing machine")).toBe("Clothes Washer");
  });
  it("normalizes dishwasher", () => {
    expect(parseFixture("dishwasher")).toBe("Dishwasher");
  });
  it("normalizes garbage disposal", () => {
    expect(parseFixture("garbage disposal")).toBe("Food Waste Disposer");
  });
  it("normalizes hose bibb", () => {
    expect(parseFixture("hose bibb")).toBe("Hose Bibb (Spigot)");
  });
  it("normalizes drinking fountain", () => {
    expect(parseFixture("drinking fountain")).toBe("Drinking Fountain");
  });
  it("returns null for unknown fixture", () => {
    expect(parseFixture("unicorn fixture")).toBeNull();
  });
});

describe("parsePipeType", () => {
  it("normalizes drain", () => {
    expect(parsePipeType("drain")).toBe("Drain");
  });
  it("normalizes building drain", () => {
    expect(parsePipeType("building drain")).toBe("Building Drain");
  });
  it("normalizes vent", () => {
    expect(parsePipeType("vent")).toBe("Vent");
  });
  it("normalizes vent stack", () => {
    expect(parsePipeType("vent stack")).toBe("Vent Stack");
  });
  it("normalizes soil stack", () => {
    expect(parsePipeType("soil stack")).toBe("Soil Stack");
  });
  it("normalizes waste", () => {
    expect(parsePipeType("waste")).toBe("Waste");
  });
  it("normalizes storm drain", () => {
    expect(parsePipeType("storm")).toBe("Storm Drain");
  });
  it("normalizes supply", () => {
    expect(parsePipeType("supply")).toBe("Water Supply");
  });
  it("normalizes riser", () => {
    expect(parsePipeType("riser")).toBe("Riser");
  });
  it("returns null for unknown pipe type", () => {
    expect(parsePipeType("unicorn pipe")).toBeNull();
  });
});

describe("extract (combined)", () => {
  it("extracts diameter from 'DN50 pipe'", () => {
    const entities = extract("DN50 pipe");
    expect(entities.some((e) => e.type === "diameter")).toBe(true);
  });
  it("extracts material from 'copper pipe'", () => {
    const entities = extract("copper pipe");
    expect(entities.some((e) => e.type === "material")).toBe(true);
  });
  it("extracts fixture from 'toilet and sink'", () => {
    const entities = extract("toilet and sink");
    const fixtures = entities.filter((e) => e.type === "fixture");
    expect(fixtures.length).toBeGreaterThanOrEqual(2);
  });
  it("extracts pipe type from 'drain pipe'", () => {
    const entities = extract("drain pipe");
    expect(entities.some((e) => e.type === "pipe")).toBe(true);
  });
  it("returns non-empty for 'PVC drain at 2% slope'", () => {
    const entities = extract("PVC drain at 2% slope");
    expect(entities.length).toBeGreaterThan(0);
  });
  it("extracts slope from phrase with '1/4 per foot'", () => {
    const entities = extract("1/4 per foot slope");
    expect(entities.some((e) => e.type === "slope")).toBe(true);
  });
  it("extracts diameter from '4 inch PVC'", () => {
    const entities = extract("4 inch PVC");
    expect(entities.some((e) => e.type === "diameter")).toBe(true);
  });
  it("extracts multiple fixture types", () => {
    const entities = extract("shower and bathtub");
    const fixtures = entities.filter((e) => e.type === "fixture");
    const names = fixtures.map((e) => e.normalized);
    expect(names).toContain("Shower Stall");
    expect(names).toContain("Bathtub");
  });
  it("gives high confidence for matched entities", () => {
    const entities = extract("3/4 inch copper pipe");
    const mat = entities.find((e) => e.type === "material");
    expect(mat?.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
