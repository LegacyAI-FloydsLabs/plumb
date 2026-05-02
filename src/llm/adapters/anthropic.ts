/**
 * AnthropicAdapter — hidden BYO-LLM power-user path. Routes Canvas compose
 * requests to the Anthropic API using a key the user pasted into
 * /about#advanced settings. Never surfaced in default navigation.
 *
 * STATUS: stub — implement when a user actually requests BYO key support.
 * For v1.0 ship we default to FunctionGemmaAdapter for capable devices and
 * NoLLMAdapter otherwise; the Anthropic path is a v1.1 feature.
 *
 * When implementing:
 *   - Use the Anthropic messages API with `tools` parameter set from the
 *     FLUM registry's Layer 2 schemas (the cloud LLM can handle the full
 *     surface, unlike the Layer-1-trained local model).
 *   - Never log or persist the API key to disk beyond localStorage.
 *   - Surface the per-call cost estimate (estimatedCostUsd) in
 *     plan-approval UI so the user sees what they're spending.
 *   - Honor the no-telemetry rule (C8): no usage stats leave the device.
 *
 * Reference: design spec §9.6 (BYO-LLM hidden path).
 */

import type { LLMAdapter, PlannedToolCall, ComposePlan, FlumRegistry } from "../adapter";
import { planToRequest } from "../adapter";
import { compute } from "../flum";
import type { FlumResponse } from "../flum";

export class AnthropicAdapter implements LLMAdapter {
  readonly name = "anthropic";
  readonly available = true;
  readonly loading = false;
  readonly loadProgress = 1;

  // Stored for use in compose() / runPlan() once this adapter is implemented.
  // Intentionally not prefixed with underscore so the public reference in
  // the future compose implementation reads cleanly.
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("AnthropicAdapter requires a non-empty API key");
    }
    this.apiKey = apiKey;
  }

  /** @internal — exposed for future compose() implementation. */
  getKey(): string {
    return this.apiKey;
  }

  async compose(_prompt: string, _registry: FlumRegistry): Promise<ComposePlan> {
    throw new Error("AnthropicAdapter: not yet implemented — v1.1 feature");
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
    // no-op
  }
}
