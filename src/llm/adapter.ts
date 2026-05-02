/**
 * LLM adapter — pluggable interface between Plumb's Canvas composer and
 * whichever LLM implementation is active (local FunctionGemma, BYO cloud
 * key, or none).
 *
 * The adapter absorbs backend differences. Canvas code depends only on
 * this interface; swapping the backend is a one-file change in
 * select-adapter.ts.
 *
 * Reference: design spec §9 (LLM integration architecture).
 */

import type { FlumComputeRequest, FlumResponse, ToolId } from "./flum";
import type { ToolDefinition } from "./tool-registry";

export type FlumRegistry = Record<ToolId, ToolDefinition>;

export interface PlannedToolCall {
  /** Which FLUM tool to invoke. */
  readonly tool: ToolId;
  /** Which action on that tool ("compute", "classify", ...). */
  readonly action: string;
  /** Layer 1 parameter payload. */
  readonly params: Record<string, unknown>;
  /** Human-readable rationale from the adapter; shown in plan-approval UI. */
  readonly rationale: string;
}

export interface ComposePlan {
  readonly plan: PlannedToolCall[];
  /** 0..1 — adapter's self-reported confidence in the plan. */
  readonly confidence: number;
  /**
   * Approximate cost in USD, or null for local adapters where cost is zero.
   * Displayed in plan-approval UI before Ray approves the run.
   */
  readonly estimatedCostUsd: number | null;
}

export interface LLMAdapter {
  /** Stable identifier — "functiongemma-onnx" | "mock" | "anthropic" | "none". */
  readonly name: string;

  /** True if this adapter can currently serve compose/runPlan requests. */
  readonly available: boolean;

  /**
   * True if the adapter is still initializing (model weights downloading,
   * runtime warming up). Canvas opens in manual mode while this is true.
   */
  readonly loading: boolean;

  /**
   * 0..1 — initialization progress, used by the "Getting ready" indicator.
   * For already-ready adapters (mock, anthropic-with-key), this is 1.
   */
  readonly loadProgress: number;

  /**
   * Propose a plan of FLUM tool calls that answer the user's prompt.
   * Called when the user submits a job description in Canvas.
   *
   * @param prompt - raw user utterance (may be English or Spanish)
   * @param registry - current FLUM tool registry (tool schemas)
   * @returns plan + confidence; empty plan if the adapter would refuse
   */
  compose(prompt: string, registry: FlumRegistry): Promise<ComposePlan>;

  /**
   * Execute a single tool call through the deterministic FLUM compute engine.
   * The adapter does NOT do math; it passes through to `compute()` in flum.ts.
   * Kept on the adapter so alternate adapters could intercept for logging/caching.
   */
  runStep(call: PlannedToolCall): Promise<FlumResponse>;

  /**
   * Execute an approved plan sequentially. Yields each result as it completes
   * so the UI can stream sections into the canvas.
   */
  runPlan(plan: readonly PlannedToolCall[]): AsyncIterable<FlumResponse>;

  /**
   * Release held resources — model buffers, event listeners, timers.
   * Called when the Plumb PWA is unmounted or the adapter is being swapped.
   */
  dispose(): void;
}

// ── Conversion helper ──────────────────────────────────────────────────────

/**
 * Convert a PlannedToolCall to the FlumComputeRequest shape that compute()
 * expects. Centralized here so adapters don't reinvent the mapping.
 */
export function planToRequest(call: PlannedToolCall): FlumComputeRequest {
  return {
    tool: call.tool,
    action: call.action,
    params: { ...call.params },
  };
}
