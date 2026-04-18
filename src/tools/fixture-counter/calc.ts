/**
 * Fixture Counter Calculation Engine
 *
 * Counts DFU (Drainage Fixture Units) and WSFU (Water Supply Fixture Units)
 * per IPC 2021 / UPC 2021 with bathroom group reduction.
 *
 * Bathroom group: When a water closet, lavatory, and bathtub/shower are in
 * the same room, the DFU total is reduced per IPC Table 709.1.
 */

// ---------------------------------------------------------------------------
// Fixture Database (IPC 2021 Table 709.1 + UPC equivalents)
// ---------------------------------------------------------------------------

export interface FixtureEntry {
  name: string;
  dfu: number;
  wsfu_private: number;  // Private (residential)
  wsfu_public: number;   // Public/commercial
  category: string;
  bathroom_group_eligible: boolean;
}

export const FIXTURES: Record<string, FixtureEntry> = {
  water_closet_tank: { name: "Water Closet (Tank)", dfu: 3, wsfu_private: 2.2, wsfu_public: 2.2, category: "sanitary", bathroom_group_eligible: true },
  water_closet_flushometer: { name: "Water Closet (Flushometer)", dfu: 4, wsfu_private: 2.2, wsfu_public: 2.2, category: "sanitary", bathroom_group_eligible: true },
  lavatory: { name: "Lavatory", dfu: 1, wsfu_private: 0.5, wsfu_public: 0.5, category: "sanitary", bathroom_group_eligible: true },
  bathtub_shower: { name: "Bathtub/Shower", dfu: 2, wsfu_private: 1.4, wsfu_public: 1.4, category: "sanitary", bathroom_group_eligible: true },
  kitchen_sink: { name: "Kitchen Sink", dfu: 1.5, wsfu_private: 1.0, wsfu_public: 1.0, category: "culinary", bathroom_group_eligible: false },
  dishwasher: { name: "Dishwasher", dfu: 1.5, wsfu_private: 1.0, wsfu_public: 1.0, category: "culinary", bathroom_group_eligible: false },
  clothes_washer: { name: "Clothes Washer", dfu: 2, wsfu_private: 1.4, wsfu_public: 1.4, category: "laundry", bathroom_group_eligible: false },
  mop_sink: { name: "Mop/Service Sink", dfu: 2, wsfu_private: 1.0, wsfu_public: 1.0, category: "service", bathroom_group_eligible: false },
  urinal_tank: { name: "Urinal (Tank)", dfu: 2, wsfu_private: 0, wsfu_public: 1.0, category: "sanitary", bathroom_group_eligible: false },
  urinal_flushometer: { name: "Urinal (Flushometer)", dfu: 4, wsfu_private: 0, wsfu_public: 1.0, category: "sanitary", bathroom_group_eligible: false },
  drinking_fountain: { name: "Drinking Fountain", dfu: 0.5, wsfu_private: 0.5, wsfu_public: 0.5, category: "service", bathroom_group_eligible: false },
  hose_bibb: { name: "Hose Bibb", dfu: 1, wsfu_private: 1.0, wsfu_public: 1.0, category: "service", bathroom_group_eligible: false },
  floor_drain: { name: "Floor Drain", dfu: 1, wsfu_private: 0, wsfu_public: 0, category: "drainage", bathroom_group_eligible: false },
  shower_head: { name: "Shower Head", dfu: 2, wsfu_private: 1.4, wsfu_public: 1.4, category: "sanitary", bathroom_group_eligible: true },
  bar_sink: { name: "Bar Sink", dfu: 1, wsfu_private: 0.5, wsfu_public: 0.5, category: "culinary", bathroom_group_eligible: false },
  laundry_tray: { name: "Laundry Tray", dfu: 1.5, wsfu_private: 1.0, wsfu_public: 1.0, category: "laundry", bathroom_group_eligible: false },
  bidet: { name: "Bidet", dfu: 1, wsfu_private: 0.5, wsfu_public: 0.5, category: "sanitary", bathroom_group_eligible: false },
  water_heater_relief: { name: "Water Heater Relief", dfu: 0, wsfu_private: 0, wsfu_public: 0, category: "mechanical", bathroom_group_eligible: false },
};

/** Bathroom group DFU per IPC Table 709.1 (replaces individual fixture counts) */
const BATHROOM_GROUP_DFU: Record<number, number> = {
  1: 6,   // 1 bathroom group
  2: 9,   // 2 bathroom groups
  3: 12,  // 3+ uses the same 12 DFU per group
};

// ---------------------------------------------------------------------------
// Input / Output
// ---------------------------------------------------------------------------

export interface FixtureCountInput {
  /** Map of fixture key → count */
  fixtures: Record<string, number>;
  /** Number of complete bathroom groups (WC + lav + tub/shower in same room) */
  bathroom_groups: number;
  /** Private (residential) or public/commercial */
  occupancy: "private" | "public";
  /** Code edition */
  code: "ipc-2021" | "upc-2021";
}

export interface FixtureCountOutput {
  /** Total drainage fixture units */
  total_dfu: number;
  /** Total water supply fixture units */
  total_wsfu: number;
  /** Breakdown by fixture */
  breakdown: { fixture: string; count: number; dfu: number; wsfu: number }[];
  /** Bathroom group reduction applied (DFU saved) */
  group_reduction: number;
  /** Warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function countFixtures(input: FixtureCountInput): FixtureCountOutput {
  const { fixtures, bathroom_groups, occupancy, code } = input;
  const warnings: string[] = [];
  const breakdown: FixtureCountOutput["breakdown"] = [];

  let totalDfu = 0;
  let totalWsfu = 0;
  let groupReduction = 0;

  // Identify bathroom group fixtures to exclude from individual count
  const groupEligibleKeys = new Set<string>();
  if (bathroom_groups > 0) {
    for (const [key, entry] of Object.entries(FIXTURES)) {
      if (entry.bathroom_group_eligible && (fixtures[key] ?? 0) > 0) {
        groupEligibleKeys.add(key);
      }
    }
  }

  // Count individual fixtures (excluding those absorbed into bathroom groups)
  for (const [key, count] of Object.entries(fixtures)) {
    const entry = FIXTURES[key];
    if (!entry) {
      warnings.push(`Unknown fixture: "${key}" — skipped`);
      continue;
    }
    if (count <= 0) continue;

    const wsfu = occupancy === "private" ? entry.wsfu_private : entry.wsfu_public;
    const fixtureDfu = entry.dfu * count;
    const fixtureWsfu = wsfu * count;

    // If this fixture is part of a bathroom group, don't add individual DFU
    if (entry.bathroom_group_eligible && groupEligibleKeys.has(key)) {
      breakdown.push({
        fixture: entry.name,
        count,
        dfu: 0, // absorbed into group
        wsfu: fixtureWsfu,
      });
      totalWsfu += fixtureWsfu;
    } else {
      breakdown.push({
        fixture: entry.name,
        count,
        dfu: fixtureDfu,
        wsfu: fixtureWsfu,
      });
      totalDfu += fixtureDfu;
      totalWsfu += fixtureWsfu;
    }
  }

  // Apply bathroom group DFU
  if (bathroom_groups > 0) {
    const groupDfu = BATHROOM_GROUP_DFU[Math.min(bathroom_groups, 3)]
      ?? BATHROOM_GROUP_DFU[3]
      ?? 12;
    const calculatedGroupDfu = groupDfu * bathroom_groups;

    // Calculate what the individual fixtures would have contributed
    let individualGroupDfu = 0;
    for (const key of groupEligibleKeys) {
      const entry = FIXTURES[key];
      if (entry && entry.bathroom_group_eligible) {
        individualGroupDfu += entry.dfu * (fixtures[key] ?? 0);
      }
    }

    groupReduction = individualGroupDfu - calculatedGroupDfu;
    if (groupReduction < 0) groupReduction = 0;

    totalDfu += calculatedGroupDfu;

    breakdown.push({
      fixture: `Bathroom Group ×${bathroom_groups}`,
      count: bathroom_groups,
      dfu: calculatedGroupDfu,
      wsfu: 0, // WSFU already counted individually
    });
  }

  if (code === "upc-2021") {
    warnings.push("UPC may apply different DFU values for some fixtures. Verify local amendments.");
  }

  return {
    total_dfu: totalDfu,
    total_wsfu: Math.round(totalWsfu * 10) / 10,
    breakdown,
    group_reduction: groupReduction,
    warnings,
  };
}
