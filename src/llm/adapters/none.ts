/**
 * NoLLMAdapter — the permanent fallback when no LLM backend is available
 * (no WebGPU, no storage, no BYO key). Canvas stays in manual-scrapbook
 * mode. Users add tool results to their estimate via the tool pages'
 * "Add to this estimate" link; auto-composition is not offered.
 *
 * Reference: design spec §8 (Manual scrapbook canvas).
 */

import type { LLMAdapter, PlannedToolCall, ComposePlan, FlumRegistry } from "../adapter";
import { planToRequest } from "../adapter";
import { compute } from "../flum";
import type { FlumResponse } from "../flum";

export class NoLLMAdapter implements LLMAdapter {
  readonly name = "none";
  readonly available = false;
  readonly loading = false;
  readonly loadProgress = 0;

  async compose(_prompt: string, _registry: FlumRegistry): Promise<ComposePlan> {
    // Canvas UI checks adapter.available before calling compose; this
    // return is defensive only.
    return { plan: [], confidence: 0, estimatedCostUsd: null };
  }

  async runStep(call: PlannedToolCall): Promise<FlumResponse> {
    // Running a single call is still legitimate — the user may have tapped
    // "Add to this estimate" on a tool page result. compute() is deterministic.
    return compute(planToRequest(call));
  }

  async *runPlan(plan: readonly PlannedToolCall[]): AsyncIterable<FlumResponse> {
    for (const call of plan) {
      yield await this.runStep(call);
    }
  }

  dispose(): void {
    // no-op
  }
}
