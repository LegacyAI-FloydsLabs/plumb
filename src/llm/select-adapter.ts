/**
 * Adapter selection — called once at app boot. Returns the best available
 * backend given the runtime environment. Swapping backends is a one-file
 * change here.
 *
 * Reference: design spec §9.2.
 */

import type { LLMAdapter } from "./adapter";
import { MockAdapter } from "./adapters/mock";
import { NoLLMAdapter } from "./adapters/none";

export interface Env {
  getSetting(key: string): string | null;
  supportsWebGPU(): Promise<boolean>;
  estimatedStorageBytes(): Promise<number>;
  isTestEnvironment(): boolean;
}

const FUNCTIONGEMMA_CHUNK_MIN_STORAGE = 500_000_000; // 500 MB — iOS IndexedDB default

/**
 * Select the active adapter.
 *
 * Priority order:
 *   1. Test environment → MockAdapter (deterministic, no I/O).
 *   2. BYO-LLM key set in settings → AnthropicAdapter (lazy-loaded).
 *   3. WebGPU + enough storage → FunctionGemmaAdapter (lazy-loaded).
 *   4. Otherwise → NoLLMAdapter (Canvas runs in manual-scrapbook mode).
 */
export async function selectAdapter(env: Env): Promise<LLMAdapter> {
  if (env.isTestEnvironment()) {
    return new MockAdapter();
  }

  const userKey = env.getSetting("llm.advanced.key");
  if (userKey) {
    // Lazy-load the Anthropic adapter module; it's larger than the mock
    // and only wanted when a user has explicitly opted into BYO-LLM.
    const { AnthropicAdapter } = await import("./adapters/anthropic");
    return new AnthropicAdapter(userKey);
  }

  const [hasWebGPU, storageBytes] = await Promise.all([
    env.supportsWebGPU(),
    env.estimatedStorageBytes(),
  ]);

  if (hasWebGPU && storageBytes >= FUNCTIONGEMMA_CHUNK_MIN_STORAGE) {
    // Lazy-load the FunctionGemma adapter. This triggers the transformers.js
    // chunk per design spec §9.5 — only loaded when we're about to use it.
    const { FunctionGemmaAdapter } = await import("./adapters/functiongemma");
    return new FunctionGemmaAdapter();
  }

  return new NoLLMAdapter();
}
