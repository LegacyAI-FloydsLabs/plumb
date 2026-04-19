// ==========================================================================
// Entity Extraction — parses natural-language plumbing phrases into
// structured domain data. No LLM required.
// ==========================================================================

export interface ExtractedEntity {
  type: "diameter" | "slope" | "material" | "fixture" | "pipe";
  value: string;
  normalized: string;
  confidence: number;
}

// --------------------------------------------------------------------------
// Diameter parsing
// --------------------------------------------------------------------------

/** Parse "3/4 inch", "2 in", "50mm", "6 inch", "DN50" → { value, unit } */
export function parseDiameter(text: string): { value: number; unit: "inch" | "mm" } | null {
  const lower = text.toLowerCase().trim();

  // DN metric size: "DN50", "dn50", "DN100"
  const dnMatch = lower.match(/^dn(\d+)$/i);
  if (dnMatch) return { value: parseInt(dnMatch[1]), unit: "mm" };

  // Millimetres: "50mm", "100 mm", "75mm"
  const mmMatch = lower.match(/^(\d+)\s*mm$/);
  if (mmMatch) return { value: parseInt(mmMatch[1]), unit: "mm" };

  // Fractional inches: "3/4in", "1/4 inch", "3/4 inches"
  // Unit suffix is REQUIRED — bare "3/4" is ambiguous (could be a slope ratio).
  const fracMatch = lower.match(/^(\d+)\/(\d+)\s*(?:inch(?:es)?|in)$/);
  if (fracMatch) {
    return { value: parseInt(fracMatch[1]) / parseInt(fracMatch[2]), unit: "inch" };
  }

  // Decimal inches: "2in", "2.5in", "3 in", "4 inches"
  const decMatch = lower.match(/^(\d+\.?\d*)\s*(?:inch(?:es)?|in)?$/);
  if (decMatch) return { value: parseFloat(decMatch[1]), unit: "inch" };

  return null;
}

// --------------------------------------------------------------------------
// Slope parsing
// --------------------------------------------------------------------------

/** Parse "1/4 per foot", "2%", "1:48", "0.5%" → normalized slope */
export function parseSlope(text: string): { rise: number; run: number; percent: number } | null {
  const lower = text.toLowerCase().trim();

  // Fraction per foot: "1/4 per foot", "1/4 per ft", "1/4 in/ft"
  const fpMatch = lower.match(/^(\d+)\/(\d+)\s*(?:in(?:ch(?:es)?)?)?\s*(?:\/|per)?\s*(?:foot|ft)$/);
  if (fpMatch) {
    const rise = parseInt(fpMatch[1]) / parseInt(fpMatch[2]);
    return { rise, run: 12, percent: (rise / 12) * 100 };
  }

  // Ratio: "1:48", "1/48"
  const ratioMatch = lower.match(/^(\d+)\s*[:/]\s*(\d+)$/);
  if (ratioMatch) {
    const rise = parseInt(ratioMatch[1]);
    const run = parseInt(ratioMatch[2]);
    return { rise, run, percent: (rise / run) * 100 };
  }

  // Percent: "2%", "0.5%", "50%"
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

// Key must be matched with word boundaries to avoid false positives.
// Sorted longest-first to avoid partial matches.
const MATERIAL_ALIASES: Array<[string, string]> = [
  ["cast iron", "Cast Iron"],
  ["cross-linked polyethylene", "PEX"],
  ["stainless steel 316", "Stainless Steel (316)"],
  ["stainless steel 304", "Stainless Steel (304)"],
  ["stainless steel", "Stainless Steel"],
  ["galvanized steel", "Galvanized Steel"],
  ["no-hub cast iron", "No-Hub Cast Iron"],
  ["copper tubing", "Copper"],
  ["chrome-plated brass", "Chrome-plated Brass"],
  ["copper type l", "Copper (Type L)"],
  ["copper type m", "Copper (Type M)"],
  ["copper type k", "Copper (Type K)"],
  ["polybutylene", "PBT"],
  ["pvc-schedule 40", "PVC (Sch 40)"],
  ["pvc-schedule 80", "PVC (Sch 80)"],
  ["pvc schedule 40", "PVC (Sch 40)"],
  ["pvc schedule 80", "PVC (Sch 80)"],
  ["pvc-sch40", "PVC (Sch 40)"],
  ["pvc-sch80", "PVC (Sch 80)"],
  ["copper", "Copper"],
  ["galvanized", "Galvanized Steel"],
  ["pvc40", "PVC (Sch 40)"],
  ["pvc80", "PVC (Sch 80)"],
  ["polybut", "PBT"],
  ["pvc", "PVC"],
  ["abs", "ABS"],
  ["pex", "PEX"],
  ["cpvc", "CPVC"],
  ["dwv", "ABS (DWV)"],
  ["gi", "Galvanized Steel"],
  ["ci", "Cast Iron"],
  ["ss", "Stainless Steel"],
];

/** Normalize material name. Returns null if no recognized material. */
export function parseMaterial(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const [key, normalized] of MATERIAL_ALIASES) {
    // Match as whole word (preceded by whitespace/punctuation or start, followed by same)
    const re = new RegExp(`(?:^|[\\s/()\\[\\],-])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[\\s/()\\[\\],-])`, "i");
    if (re.test(lower)) return normalized;
  }
  return null;
}

// --------------------------------------------------------------------------
// Fixture normalization
// --------------------------------------------------------------------------

const FIXTURE_ALIASES: Array<[string, string]> = [
  ["water closet", "Water Closet (Toilet)"],
  ["bathroom sink", "Lavatory (Bathroom Sink)"],
  ["kitchen sink", "Kitchen Sink"],
  ["service sink", "Service Sink"],
  ["bar sink", "Bar Sink"],
  ["mop sink", "Mop Basin"],
  ["shower stall", "Shower Stall"],
  ["bathtub", "Bathtub"],
  ["bidet toilet", "Bidet"],
  ["whirlpool", "Whirlpool Bathtub"],
  ["garbage disposal", "Food Waste Disposer"],
  ["drinking fountain", "Drinking Fountain"],
  ["floor drain", "Floor Drain"],
  ["hose bibb", "Hose Bibb (Spigot)"],
  ["hose bib", "Hose Bibb (Spigot)"],
  ["clothes washer", "Clothes Washer"],
  ["washing machine", "Clothes Washer"],
  ["toilet", "Water Closet (Toilet)"],
  ["lavatory", "Lavatory (Bathroom Sink)"],
  ["urinal", "Urinal"],
  ["bidet", "Bidet"],
  ["shower", "Shower Stall"],
  ["bathtub", "Bathtub"],
  ["dishwasher", "Dishwasher"],
  ["disposal", "Food Waste Disposer"],
  ["sink", "Kitchen Sink"],
  ["faucet", "Faucet"],
  ["cleanout", "Cleanout"],
  ["wc", "Water Closet (Toilet)"],
  ["lav", "Lavatory (Bathroom Sink)"],
];

/** Normalize fixture type. Returns null if unrecognized. */
export function parseFixture(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const [key, normalized] of FIXTURE_ALIASES) {
    const re = new RegExp(`(?:^|[\\s/()\\[\\],-])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[\\s/()\\[\\],-])`, "i");
    if (re.test(lower)) return normalized;
  }
  return null;
}

// --------------------------------------------------------------------------
// Pipe type matching
// --------------------------------------------------------------------------

const PIPE_TYPES: Array<[string, string]> = [
  ["building drain", "Building Drain"],
  ["fixture drain", "Fixture Drain"],
  ["horizontal drain", "Horizontal Drain"],
  ["soil stack", "Soil Stack"],
  ["building waste", "Building Waste"],
  ["fixture waste", "Fixture Waste"],
  ["vent stack", "Vent Stack"],
  ["branch vent", "Branch Vent"],
  ["individual vent", "Individual Vent"],
  ["relief vent", "Relief Vent"],
  ["stack vent", "Stack Vent"],
  ["waste vent", "Waste Vent"],
  ["building storm drain", "Building Storm Drain"],
  ["cold water supply", "Cold Water Supply"],
  ["hot water supply", "Hot Water Supply"],
  ["branch supply", "Branch Supply"],
  ["main supply", "Main Supply"],
  ["water riser", "Water Riser"],
  ["fixture branch", "Fixture Branch"],
  ["building main", "Building Main"],
  ["building sewer", "Building Sewer"],
  ["soil", "Soil"],
  ["waste", "Waste"],
  ["vent", "Vent"],
  ["riser", "Riser"],
  ["branch", "Branch"],
  ["storm", "Storm Drain"],
  ["drain", "Drain"],
  ["leader", "Leader"],
  ["supply", "Water Supply"],
  ["main", "Main"],
];

/** Normalize pipe type. Returns null if unrecognized. */
export function parsePipeType(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const [key, normalized] of PIPE_TYPES) {
    const re = new RegExp(`(?:^|[\\s/()\\[\\],-])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[\\s/()\\[\\],-])`, "i");
    if (re.test(lower)) return normalized;
  }
  return null;
}

// --------------------------------------------------------------------------
// Combined extraction
// --------------------------------------------------------------------------

/** Scan text for ALL non-overlapping matches from an alias table (longest first). */
function scanMultiMatch(
  text: string,
  aliases: ReadonlyArray<readonly [string, string]>,
): Array<{ matched: string; normalized: string }> {
  const results: Array<{ matched: string; normalized: string }> = [];
  const matched = new Set<number>(); // character offsets already claimed
  const lower = text.toLowerCase();

  for (const [key, normalized] of aliases) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[\\s/()\\[\\],-])(${escaped})(?:$|[\\s/()\\[\\],-])`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      // Check that the matched span doesn't overlap with a prior match
      const start = m.index + m[0].indexOf(m[1]);
      const end = start + m[1].length;
      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (matched.has(i)) { overlaps = true; break; }
      }
      if (!overlaps) {
        for (let i = start; i < end; i++) matched.add(i);
        results.push({ matched: m[1], normalized });
      }
    }
  }

  return results;
}

/** Extract all known entities from a natural-language plumbing phrase. */
export function extract(text: string): ExtractedEntity[] {
  const results: ExtractedEntity[] = [];

  // Diameter — scan with a non-greedy sliding window (words up to 10 chars)
  const diaWords = ["dn50", "dn75", "dn100", "dn150", "dn200",
    "50mm", "75mm", "100mm", "150mm", "200mm",
    "3/4in", "3/4in", "1/2in", "1/4in", "2in", "3in", "4in", "6in",
    "3/4in", "1/2in", "1/4in", "1/8in", "5/8in", "3in", "4in", "6in",
    "1/2", "3/4", "1/4", "1/8", "5/8", "2", "3", "4", "6", "8", "10", "12",
    "1.5in", "1.25in", "2.5in", "1.5", "1.25", "2.5",
  ];
  for (const w of diaWords) {
    if (text.toLowerCase().includes(w)) {
      const parsed = parseDiameter(w);
      if (parsed) {
        results.push({
          type: "diameter",
          value: w,
          normalized: `${parsed.value.toFixed(parsed.unit === "mm" ? 0 : 2)}${parsed.unit}`,
          confidence: 0.9,
        });
      }
    }
  }

  // Slope — scan for fraction+unit patterns
  const slopePhrases = [
    "1/4 per foot", "1/4 per ft", "1/4in/ft", "1/4in/ft",
    "1/8 per foot", "1/8 per ft", "1/8in/ft",
    "1/4\" per foot", "1/8\" per foot",
    "1:48", "1:96", "1:100", "1:50", "1/48", "1/96",
    "0.5%", "1%", "1.5%", "2%", "2.5%", "3%", "50%", "0.25%",
  ];
  for (const p of slopePhrases) {
    if (text.toLowerCase().includes(p)) {
      const parsed = parseSlope(p);
      if (parsed) {
        results.push({
          type: "slope",
          value: p,
          normalized: `${parsed.percent.toFixed(2)}% (${parsed.rise.toFixed(3)}"/${parsed.run}")`,
          confidence: 0.9,
        });
      }
    }
  }

  // Material
  const mat = parseMaterial(text);
  if (mat) {
    results.push({ type: "material", value: text, normalized: mat, confidence: 0.95 });
  }

  // Fixtures — scan for ALL occurrences, not just the first.
  const fixtureMatches = scanMultiMatch(text, FIXTURE_ALIASES);
  for (const fm of fixtureMatches) {
    results.push({ type: "fixture", value: fm.matched, normalized: fm.normalized, confidence: 0.95 });
  }


  // Pipe types — scan for ALL occurrences.
  const pipeMatches = scanMultiMatch(text, PIPE_TYPES);
  for (const pm of pipeMatches) {
    results.push({ type: "pipe", value: pm.matched, normalized: pm.normalized, confidence: 0.9 });
  }

  return results;
}
