/**
 * FunctionGemmaAdapter — production LLM for Plumb. Runs fine-tuned
 * google/functiongemma-270m-it as ONNX INT8 via transformers.js + WebGPU
 * (WASM CPU fallback) in the user's browser.
 *
 * STATUS: stub — real implementation lands after the training session's
 * Phase 8 exports the ONNX artifact. Until then, selectAdapter() never
 * returns this adapter in test or mock paths, and the lazy import() on
 * the production path also won't run in local dev (no ONNX file present).
 *
 * When implementing:
 *   - Load transformers.js only inside this module so it stays in the
 *     lazy chunk (design spec §9.5).
 *   - Model files served from Plumb's static asset origin, NOT HuggingFace
 *     directly (CORS + privacy).
 *   - Apply chat template with `messages + tools` structure per the
 *     training session's chat_template.jinja.
 *   - Parse model output via `parseToolCalls` from
 *     `src/llm/functiongemma-parser.ts`.
 *   - Track loadProgress 0..1 for the "Getting ready" indicator (§7.6).
 *   - Request `navigator.storage.persist()` to reduce eviction risk.
 *
 * Reference: design spec §9.3 (FunctionGemmaAdapter specifics).
 */

import type { LLMAdapter, PlannedToolCall, ComposePlan, FlumRegistry } from "../adapter";
import { planToRequest } from "../adapter";
import { compute } from "../flum";
import type { FlumResponse } from "../flum";

export class FunctionGemmaAdapter implements LLMAdapter {
  readonly name = "functiongemma-onnx";
  available = false;
  loading = true;
  loadProgress = 0;

  constructor() {
    // Real constructor will kick off the transformers.js pipeline load here
    // and update loadProgress via the tokenizer + model download callbacks.
    // Canvas opens in manual mode while loading is true; upgrades when the
    // next user interaction re-reads adapter.available.
  }

  async compose(_prompt: string, _registry: FlumRegistry): Promise<ComposePlan> {
    throw new Error("FunctionGemmaAdapter: not yet implemented — trained ONNX artifact pending from training session Phase 8");
  }

  async runStep(call: PlannedToolCall): Promise<FlumResponse> {
    // compute() is deterministic regardless of adapter — safe to stub.
    return compute(planToRequest(call));
  }

  async *runPlan(plan: readonly PlannedToolCall[]): AsyncIterable<FlumResponse> {
    for (const call of plan) {
      yield await this.runStep(call);
    }
  }

  dispose(): void {
    // Real implementation releases the transformers.js pipeline handles.
  }
}
