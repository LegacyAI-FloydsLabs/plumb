import { describe, it, expect } from "vitest";
import {
  parseDiameter,
  parseSlope,
  parseMaterial,
  parseFixture,
  parsePipeType,
  extract,
} from "./extract";

describe("parseDiameter", () => {
  // Fractional inches
  it("parses 1/2 inch", () => {
    expect(parseDiameter("1/2 inch")).toEqual({ value: 0.5, unit: "inch" });
  });
  it("parses 3/4 inch", () => {
    expect(parseDiameter("3/4 inch")).toEqual({ value: 0.75, unit: "inch" });
  });
  it("parses 1/4 per foot", () => {
    expect(parseDiameter("1/4 in")).toEqual({ value: 0.25, unit: "inch" });
  });
  it("parses 2 inches", () => {
    expect(parseDiameter("2 inches")).toEqual({ value: 2, unit: "inch" });
  });
  it("parses 3in", () => {
    expect(parseDiameter("3in")).toEqual({ value: 3, unit: "inch" });
  });
  it("parses 1.5 inches", () => {
    expect(parseDiameter("1.5 inches")).toEqual({ value: 1.5, unit: "inch" });
  });
  it("parses 6 inch", () => {
    expect(parseDiameter("6 inch")).toEqual({ value: 6, unit: "inch" });
  });
  it("parses 4inches", () => {
    expect(parseDiameter("4inches")).toEqual({ value: 4, unit: "inch" });
  });
  it("parses 12in", () => {
    expect(parseDiameter("12in")).toEqual({ value: 12, unit: "inch" });
  });
  it("parses 1/16 inch", () => {
    expect(parseDiameter("1/16 inch")).toEqual({ value: 0.0625, unit: "inch" });
  });
  it("parses 1.25 inch", () => {
    expect(parseDiameter("1.25 inch")).toEqual({ value: 1.25, unit: "inch" });
  });

  // Millimetres
  it("parses 50mm", () => {
    expect(parseDiameter("50mm")).toEqual({ value: 50, unit: "mm" });
  });
  it("parses 100mm", () => {
    expect(parseDiameter("100mm")).toEqual({ value: 100, unit: "mm" });
  });
  it("parses DN50", () => {
    expect(parseDiameter("DN50")).toEqual({ value: 50, unit: "mm" });
  });
  it("parses DN100", () => {
    expect(parseDiameter("DN100")).toEqual({ value: 100, unit: "mm" });
  });

  // Edge cases
  it("returns null for unrecognized input", () => {
    expect(parseDiameter("foo")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseDiameter("")).toBeNull();
  });
});

describe("parseSlope", () => {
  // Fractions per foot
  it("parses 1/4 per foot", () => {
    const r = parseSlope("1/4 per foot");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(2.083, 1);
  });
  it("parses 1/8 per foot", () => {
    const r = parseSlope("1/8 per foot");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(1.042, 1);
  });
  it("parses 1/4 per ft", () => {
    const r = parseSlope("1/4 per ft");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(2.083, 1);
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
  it("parses 1:48 ratio", () => {
    const r = parseSlope("1:48");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(2.083, 1);
  });
  it("parses 1:96 ratio", () => {
    const r = parseSlope("1:96");
    expect(r).not.toBeNull();
    expect(r!.percent).toBeCloseTo(1.042, 1);
  });

  // Edge cases
  it("returns null for unrecognized input", () => {
    expect(parseSlope("foo")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseSlope("")).toBeNull();
  });
  it("returns null for raw number", () => {
    expect(parseSlope("2.5")).toBeNull();
  });
});

describe("parseMaterial", () => {
  it("normalizes copper", () => {
    expect(parseMaterial("copper")).toBe("Copper");
  });
  it("normalizes PVC", () => {
    expect(parseMaterial("pvc")).toBe("PVC");
  });
  it("normalizes ABS", () => {
    expect(parseMaterial("abs")).toBe("ABS");
  });
  it("normalizes galvanized", () => {
    expect(parseMaterial("galvanized")).toBe("Galvanized Steel");
  });
  it("normalizes cast iron", () => {
    expect(parseMaterial("cast iron")).toBe("Cast Iron");
  });
  it("normalizes GI", () => {
    expect(parseMaterial("gi")).toBe("Galvanized Steel");
  });
  it("normalizes Type L", () => {
    expect(parseMaterial("type l")).toBe("Copper (Type L)");
  });
  it("normalizes PEX case-insensitive", () => {
    expect(parseMaterial("PEX")).toBe("PEX");
  });
  it("normalizes CPVC", () => {
    expect(parseMaterial("CPVC")).toBe("CPVC");
  });
  it("normalizes stainless steel", () => {
    expect(parseMaterial("stainless")).toBe("Stainless Steel");
  });
  it("returns null for unknown material", () => {
    expect(parseMaterial("unicorn")).toBeNull();
  });
  it("normalizes chrome plated brass", () => {
    expect(parseMaterial("chrome")).toBe("Chrome-plated Brass");
  });
  it("normalizes DWV as ABS", () => {
    expect(parseMaterial("dwv")).toBe("ABS (DWV)");
  });
});

describe("parseFixture", () => {
  it("normalizes toilet", () => {
    expect(parseFixture("toilet")).toBe("Water Closet (Toilet)");
  });
  it("normalizes WC", () => {
    expect(parseFixture("wc")).toBe("Water Closet (Toilet)");
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
  it("normalizes shower stall", () => {
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
  it("normalizes washer", () => {
    expect(parseFixture("washer")).toBe("Clothes Washer");
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
  it("extracts diameter from '3/4 inch copper pipe'", () => {
    const entities = extract("3/4 inch copper pipe");
    const diameters = entities.filter((e) => e.type === "diameter");
    expect(diameters.length).toBeGreaterThan(0);
    expect(diameters[0].normalized).toContain("0.75in");
  });
  it("extracts material from '3/4 inch copper pipe'", () => {
    const entities = extract("3/4 inch copper pipe");
    const materials = entities.filter((e) => e.type === "material");
    expect(materials.length).toBeGreaterThan(0);
    expect(materials[0].normalized).toBe("Copper");
  });
  it("extracts slope from '2% slope'", () => {
    const entities = extract("2% slope");
    const slopes = entities.filter((e) => e.type === "slope");
    expect(slopes.length).toBeGreaterThan(0);
  });
  it("extracts fixture from 'toilet and sink'", () => {
    const entities = extract("toilet and sink");
    const fixtures = entities.filter((e) => e.type === "fixture");
    expect(fixtures.length).toBeGreaterThanOrEqual(2);
  });
  it("extracts pipe type from 'drain pipe'", () => {
    const entities = extract("drain pipe");
    const pipes = entities.filter((e) => e.type === "pipe");
    expect(pipes.length).toBeGreaterThan(0);
  });
  it("extracts diameter from '50mm PVC'", () => {
    const entities = extract("50mm PVC");
    const diameters = entities.filter((e) => e.type === "diameter");
    expect(diameters.some((e) => e.normalized.includes("50mm"))).toBe(true);
  });
  it("extracts material from 'PVC schedule 40'", () => {
    const entities = extract("PVC schedule 40");
    const materials = entities.filter((e) => e.type === "material");
    expect(materials.some((e) => e.normalized === "PVC (Sch 40)")).toBe(true);
  });
  it("extracts slope from '1/4 per foot slope'", () => {
    const entities = extract("1/4 per foot slope");
    const slopes = entities.filter((e) => e.type === "slope");
    expect(slopes.length).toBeGreaterThan(0);
  });
  it("extracts multiple fixture types", () => {
    const entities = extract("shower and bathtub");
    const fixtures = entities.filter((e) => e.type === "fixture");
    const names = fixtures.map((e) => e.normalized);
    expect(names).toContain("Shower Stall");
    expect(names).toContain("Bathtub");
  });
  it("returns empty array for unrecognized text", () => {
    expect(extract("unicorn plumbing fantasy")).toEqual([]);
  });
  it("extracts diameter from '4 inch pipe'", () => {
    const entities = extract("4 inch pipe");
    const diameters = entities.filter((e) => e.type === "diameter");
    expect(diameters.length).toBeGreaterThan(0);
  });
  it("extracts diameter from 'DN100 cast iron'", () => {
    const entities = extract("DN100 cast iron");
    const diameters = entities.filter((e) => e.type === "diameter");
    expect(diameters.some((e) => e.normalized.includes("100mm"))).toBe(true);
    const materials = entities.filter((e) => e.type === "material");
    expect(materials.some((e) => e.normalized === "Cast Iron")).toBe(true);
  });
  it("extracts pipe type from 'waste stack'", () => {
    const entities = extract("waste stack");
    const pipes = entities.filter((e) => e.type === "pipe");
    expect(pipes.length).toBeGreaterThan(0);
  });
  it("gives high confidence for full matches", () => {
    const entities = extract("3/4 inch copper pipe");
    const diameter = entities.find((e) => e.type === "diameter");
    expect(diameter?.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
