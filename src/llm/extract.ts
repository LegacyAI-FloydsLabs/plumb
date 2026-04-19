// ==========================================================================
// Entity Extraction — parses natural-language plumbing phrases into
// structured domain data. No LLM required.
// ==========================================================================

export interface ExtractedEntity {
  type: "diameter" | "slope" | "material" | "fixture" | "pipe" | "measurement";
  value: string;
  normalized: string;
  confidence: number;
}

// --------------------------------------------------------------------------
// Diameter parsing
// --------------------------------------------------------------------------

/** Parse "3/4 inch", "2 in", "50mm", "6 inch" → { value, unit } */
export function parseDiameter(text: string): { value: number; unit: "inch" | "mm" } | null {
  const lower = text.toLowerCase().replace(/\s+/g, "");

  // Fractional inches: "3/4in", "1/4 in", "1/2in", "2in"
  const fracMatch = lower.match(/^(\d+)[\/](\d+)\s*(in(?:ch(?:es)?)?)?$/);
  if (fracMatch) {
    return { value: parseInt(fracMatch[1]) / parseInt(fracMatch[2]), unit: "inch" };
  }

  // Decimal inches: "2in", "2.5in", "3 in"
  const decMatch = lower.match(/^([\d.]+)\s*(in(?:ch(?:es)?)?)$/);
  if (decMatch) {
    return { value: parseFloat(decMatch[1]), unit: "inch" };
  }

  // Millimetres: "50mm", "100 mm", "DN50"
  const mmMatch = lower.match(/^(\d+)\s*(mm|dn(\d+))$/);
  if (mmMatch) {
    const mmVal = mmMatch[3] ? parseInt(mmMatch[3]) : parseInt(mmMatch[1]);
    return { value: mmVal, unit: "mm" };
  }

  return null;
}

// --------------------------------------------------------------------------
// Slope parsing
// --------------------------------------------------------------------------

/** Parse "1/4 per foot", "2%", "1:48", "0.5%" → normalized slope */
export function parseSlope(text: string): { rise: number; run: number; percent: number } | null {
  const lower = text.toLowerCase();

  // Fraction per foot: "1/4 per foot", "1/4 per ft"
  const fpMatch = lower.match(/^(\d+)[\/](\d+)\s*(?:in(?:ch(?:es)?)?)?\s*(?:per)?\s*(?:foot|ft)$/);
  if (fpMatch) {
    const rise = parseInt(fpMatch[1]) / parseInt(fpMatch[2]);
    return { rise, run: 12, percent: (rise / 12) * 100 };
  }

  // Ratio: "1:48"
  const ratioMatch = lower.match(/^(\d+)[\:](\d+)$/);
  if (ratioMatch) {
    const rise = parseInt(ratioMatch[1]);
    const run = parseInt(ratioMatch[2]);
    return { rise, run, percent: (rise / run) * 100 };
  }

  // Percent: "2%", "0.5%"
  const pctMatch = lower.match(/^([\d.]+)%$/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    return { rise: pct / 100 * 12, run: 12, percent: pct };
  }

  return null;
}

// --------------------------------------------------------------------------
// Material matching
// --------------------------------------------------------------------------

const MATERIAL_ALIASES: Record<string, string> = {
  copper: "Copper",
  coppertubing: "Copper",
  typel: "Copper (Type L)",
  typem: "Copper (Type M)",
  typek: "Copper (Type K)",
  l: "Copper (Type L)",
  m: "Copper (Type M)",
  k: "Copper (Type K)",
  pvc: "PVC",
  pvcschedule40: "PVC (Sch 40)",
  pvcschedule80: "PVC (Sch 80)",
  pvc40: "PVC (Sch 40)",
  pvc80: "PVC (Sch 80)",
  abs: "ABS",
  absdwv: "ABS (DWV)",
  dwv: "ABS (DWV)",
  galvanized: "Galvanized Steel",
  galv: "Galvanized Steel",
  gi: "Galvanized Steel",
  castiron: "Cast Iron",
  ci: "Cast Iron",
  nohub: "No-Hub Cast Iron",
  ductile: "Ductile Iron",
  pex: "PEX",
  crosslinkedpolyethylene: "PEX",
  cpvc: "CPVC",
  pbt: "PBT",
  polybutylene: "PBT",
  stainless: "Stainless Steel",
  stainless304: "Stainless Steel (304)",
  stainless316: "Stainless Steel (316)",
  ss: "Stainless Steel",
  brass: "Brass",
  chromed: "Chrome-plated Brass",
  chrome: "Chrome-plated Brass",
};

/** Normalize material name. Returns null if no recognized material. */
export function parseMaterial(text: string): string | null {
  const key = text.toLowerCase().replace(/\s+/g, "");
  if (MATERIAL_ALIASES[key]) return MATERIAL_ALIASES[key];
  // Partial match
  for (const [k, v] of Object.entries(MATERIAL_ALIASES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// --------------------------------------------------------------------------
// Fixture normalization
// --------------------------------------------------------------------------

const FIXTURE_ALIASES: Record<string, string> = {
  toilet: "Water Closet (Toilet)",
  wc: "Water Closet (Toilet)",
  water_closet: "Water Closet (Toilet)",
  watercloset: "Water Closet (Toilet)",
  lavatory: "Lavatory (Bathroom Sink)",
  lav: "Lavatory (Bathroom Sink)",
  bathroomsink: "Lavatory (Bathroom Sink)",
  sink: "Kitchen Sink",
  kitchensink: "Kitchen Sink",
  bar_sink: "Bar Sink",
  barsink: "Bar Sink",
  service_sink: "Service Sink",
  servicesink: "Service Sink",
  mop_sink: "Mop Basin",
  mopsink: "Mop Basin",
  shower: "Shower Stall",
  showerstall: "Shower Stall",
  bathtub: "Bathtub",
  bath_tub: "Bathtub",
  bathub: "Bathtub",
  spa: "Whirlpool Bathtub",
  urinal: "Urinal",
  bidet: "Bidet",
  bidettoilet: "Bidet",
  washingmachine: "Clothes Washer",
  washer: "Clothes Washer",
  dishwasher: "Dishwasher",
  garbage_disposal: "Food Waste Disposer",
  garbagedisposal: "Food Waste Disposer",
  disposal: "Food Waste Disposer",
  hosebibb: "Hose Bibb (Spigot)",
  hosebib: "Hose Bibb (Spigot)",
  faucet: "Faucet",
  drinkingfountain: "Drinking Fountain",
  floordrain: "Floor Drain",
  cleanout: "Cleanout",
};

/** Normalize fixture type. Returns null if unrecognized. */
export function parseFixture(text: string): string | null {
  const key = text.toLowerCase().replace(/[\s_-]+/g, "");
  if (FIXTURE_ALIASES[key]) return FIXTURE_ALIASES[key];
  for (const [k, v] of Object.entries(FIXTURE_ALIASES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// --------------------------------------------------------------------------
// Pipe type matching
// --------------------------------------------------------------------------

const PIPE_TYPES: Record<string, string> = {
  drain: "Drain",
  buildingdrain: "Building Drain",
  fixturedrain: "Fixture Drain",
  horizontaldrain: "Horizontal Drain",
  soil: "Soil",
  soilstack: "Soil Stack",
  waste: "Waste",
  buildingwaste: "Building Waste",
  fixturewaste: "Fixture Waste",
  vent: "Vent",
  ventstack: "Vent Stack",
  branchvent: "Branch Vent",
  individualvent: "Individual Vent",
  reliefvent: "Relief Vent",
  stackvent: "Stack Vent",
  wastevent: "Waste Vent",
  storm: "Storm Drain",
  buildingstormdrain: "Building Storm Drain",
  conductor: "Conductor",
  leader: "Leader",
  overflow: "Overflow",
  supply: "Water Supply",
  coldsupply: "Cold Water Supply",
  hotsupply: "Hot Water Supply",
  branchsupply: "Branch Supply",
  mainsupply: "Main Supply",
  riser: "Riser",
  waterriser: "Water Riser",
  branch: "Branch",
  fixturebranch: "Fixture Branch",
  main: "Main",
  buildingmain: "Building Main",
};

/** Normalize pipe type. Returns null if unrecognized. */
export function parsePipeType(text: string): string | null {
  const key = text.toLowerCase().replace(/[\s_-]+/g, "");
  if (PIPE_TYPES[key]) return PIPE_TYPES[key];
  for (const [k, v] of Object.entries(PIPE_TYPES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

// --------------------------------------------------------------------------
// Combined extraction
// --------------------------------------------------------------------------

/** Extract all known entities from a natural-language plumbing phrase. */
export function extract(text: string): ExtractedEntity[] {
  const results: ExtractedEntity[] = [];

  // Diameter
  const diaRegex = /(\d+[\/]\d+|\d+\.?\d*)\s*(inch(?:es)?|in|mm|cm|DN\d+)/gi;
  let m: RegExpExecArray | null;
  while ((m = diaRegex.exec(text)) !== null) {
    const parsed = parseDiameter(m[0]);
    results.push({
      type: "diameter",
      value: m[0],
      normalized: parsed ? `${parsed.value.toFixed(2)}${parsed.unit === "mm" ? "mm" : "in"}` : m[0],
      confidence: parsed ? 0.9 : 0.4,
    });
  }

  // Slope
  const slopeRegex =
    /(\d+[\/]\d+)\s*(?:in(?:ch(?:es)?)?\s*(?:per)?\s*(?:foot|ft))|(\d+\.?\d*)%/gi;
  while ((m = slopeRegex.exec(text)) !== null) {
    const parsed = parseSlope(m[0]);
    results.push({
      type: "slope",
      value: m[0],
      normalized: parsed
        ? `${parsed.percent.toFixed(2)}% (${parsed.rise.toFixed(3)}"/${parsed.run}")`
        : m[0],
      confidence: parsed ? 0.9 : 0.4,
    });
  }

  // Material
  const matLower = text.toLowerCase().replace(/\s+/g, "");
  for (const key of Object.keys(MATERIAL_ALIASES)) {
    if (matLower.includes(key)) {
      results.push({
        type: "material",
        value: key,
        normalized: MATERIAL_ALIASES[key],
        confidence: key.length >= 3 ? 0.95 : 0.7,
      });
    }
  }

  // Fixture
  for (const key of Object.keys(FIXTURE_ALIASES)) {
    if (matLower.includes(key)) {
      results.push({
        type: "fixture",
        value: key,
        normalized: FIXTURE_ALIASES[key],
        confidence: 0.95,
      });
    }
  }

  // Pipe type
  for (const key of Object.keys(PIPE_TYPES)) {
    if (matLower.includes(key)) {
      results.push({
        type: "pipe",
        value: key,
        normalized: PIPE_TYPES[key],
        confidence: 0.9,
      });
    }
  }

  return results;
}
