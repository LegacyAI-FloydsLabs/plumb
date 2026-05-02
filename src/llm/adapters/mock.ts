/**
 * MockAdapter — deterministic stub for tests, Storybook, and design-time
 * development of the Canvas composer UI. Returns canned plans for the five
 * canonical prompts in docs/references/canonical-prompts.md and a generic
 * fallback for anything else.
 *
 * Reference: design spec §9.2.
 */

import type { LLMAdapter, PlannedToolCall, ComposePlan, FlumRegistry } from "../adapter";
import { planToRequest } from "../adapter";
import { compute } from "../flum";
import type { FlumResponse } from "../flum";

// ── Canned plans for the canonical prompts ──────────────────────────────────

const CANNED: Array<{ match: RegExp; plan: PlannedToolCall[]; confidence: number }> = [
  // P1 — English slope from stations
  {
    match: /stations?.*0 feet.*rod/i,
    plan: [
      {
        tool: "slope",
        action: "compute",
        params: {
          stations: [
            { label: 1, distance: 0, rodReading: 4.5, depth: 3.2 },
            { label: 2, distance: 50, rodReading: 5.75, depth: 4.1 },
          ],
        },
        rationale: "User described two survey stations with distance, rod reading, and depth — route to slope with compute action.",
      },
    ],
    confidence: 0.97,
  },
  // P2 — Fixture count
  {
    match: /\b3\s+bathroom\s+groups?\b/i,
    plan: [
      {
        tool: "fixture_counter",
        action: "count",
        params: { bathroom_groups: 3 },
        rationale: "User asked for DFU count with three bathroom groups — route to fixture_counter with bathroom_groups=3.",
      },
    ],
    confidence: 0.99,
  },
  // P3 — Spanish slope from stations
  {
    match: /estaciones?.*pies/i,
    plan: [
      {
        tool: "slope",
        action: "compute",
        params: {
          stations: [
            { label: 1, distance: 0, rodReading: 4.5, depth: 3.2 },
            { label: 2, distance: 50, rodReading: 5.75, depth: 4.1 },
          ],
        },
        rationale: "Usuario describió dos estaciones con distancia, lectura de regla y profundidad — calcular pendiente.",
      },
    ],
    confidence: 0.95,
  },
  // P4 — Multi-tool bathroom remodel
  {
    match: /bathroom\s+remodel/i,
    plan: [
      {
        tool: "fixture_counter",
        action: "count",
        params: { bathroom_groups: 3 },
        rationale: "First, count fixture load for the stated three bathrooms.",
      },
      {
        tool: "pipe_sizer",
        action: "size",
        params: { wsfu: 24, dfu: 36 },
        rationale: "Size the supply, drain, and vent pipes from step 1's counts.",
      },
      {
        tool: "permit_navigator",
        action: "compute",
        params: { description: "bathroom remodel" },
        rationale: "Identify the permit and fee structure for a residential bathroom remodel in Austin.",
      },
      {
        tool: "bid_generator",
        action: "compute",
        params: {},
        rationale: "Assemble the bid from the material and labor implied by the prior steps.",
      },
    ],
    confidence: 0.85,
  },
  // P5 — Code lookup
  {
    match: /trap\s+arm/i,
    plan: [
      {
        tool: "code_compliance",
        action: "compute",
        params: { query: "trap arm length" },
        rationale: "User wants the code section on trap arm length — direct code_compliance lookup.",
      },
    ],
    confidence: 0.98,
  },
];

// ── MockAdapter ─────────────────────────────────────────────────────────────

export class MockAdapter implements LLMAdapter {
  readonly name = "mock";
  readonly available = true;
  readonly loading = false;
  readonly loadProgress = 1;

  async compose(prompt: string, _registry: FlumRegistry): Promise<ComposePlan> {
    for (const canned of CANNED) {
      if (canned.match.test(prompt)) {
        return {
          plan: canned.plan,
          confidence: canned.confidence,
          estimatedCostUsd: null,
        };
      }
    }
    // Fallback: empty plan with a rationale the UI can surface.
    return {
      plan: [],
      confidence: 0,
      estimatedCostUsd: null,
    };
  }

  async runStep(call: PlannedToolCall): Promise<FlumResponse> {
    return compute(planToRequest(call));
  }

  async *runPlan(plan: readonly PlannedToolCall[]): AsyncIterable<FlumResponse> {
    for (const call of plan) {
      yield await this.runStep(call);
    }
  }

  dispose(): void {
    // no-op for mock
  }
}
