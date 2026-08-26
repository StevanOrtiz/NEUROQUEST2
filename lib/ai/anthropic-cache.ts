export type AnthropicCacheStatus =
  | "disabled"
  | "requested_5m"
  | "requested_1h"
  | "skipped_below_minimum"

export type AnthropicCacheTtl = "5m" | "1h"

export interface CacheDecision {
  enabled: boolean
  ttl: AnthropicCacheTtl
  status: AnthropicCacheStatus
  minimumTokens: number
}

/**
 * @anthropic-ai/sdk@0.39.0's CacheControlEphemeral type has no `ttl` field yet
 * (that came in a later SDK release). This is the real shape the API accepts.
 */
export interface CacheControlWithTtl {
  type: "ephemeral"
  ttl?: AnthropicCacheTtl
}

export interface AnthropicUsageSummary {
  uncachedInputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
}

function envFlag(name: string, defaultValue: boolean) {
  const value = process.env[name]
  if (value == null || value === "") return defaultValue
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

export function getCacheTtl(): AnthropicCacheTtl {
  return process.env.ANTHROPIC_CACHE_TTL === "1h" ? "1h" : "5m"
}

export function getMinimumCacheableTokens(model: string) {
  const normalized = model.toLowerCase()

  if (normalized.includes("haiku-4-5") || normalized.includes("opus-4-5") || normalized.includes("opus-4-6") || normalized.includes("opus-4-7") || normalized.includes("mythos")) {
    return 4096
  }

  if (normalized.includes("sonnet-4-6") || normalized.includes("haiku-3-5")) {
    return 2048
  }

  return 1024
}

export function decidePromptCache(model: string, estimatedCacheableTokens: number): CacheDecision {
  const ttl = getCacheTtl()
  const minimumTokens = getMinimumCacheableTokens(model)

  if (!envFlag("ANTHROPIC_PROMPT_CACHE", true)) {
    return { enabled: false, ttl, status: "disabled", minimumTokens }
  }

  if (estimatedCacheableTokens < minimumTokens) {
    return { enabled: false, ttl, status: "skipped_below_minimum", minimumTokens }
  }

  return {
    enabled: true,
    ttl,
    status: ttl === "1h" ? "requested_1h" : "requested_5m",
    minimumTokens,
  }
}

export function buildCacheControl(decision: CacheDecision): CacheControlWithTtl | undefined {
  if (!decision.enabled) return undefined

  return {
    type: "ephemeral",
    ttl: decision.ttl,
  }
}

export function getAnthropicBetaHeaders(decision: CacheDecision) {
  if (decision.enabled && decision.ttl === "1h") {
    return { "anthropic-beta": "extended-cache-ttl-2025-04-11" }
  }

  return undefined
}

export function summarizeAnthropicUsage(usage: unknown): AnthropicUsageSummary {
  const value = (usage ?? {}) as Record<string, unknown>

  return {
    uncachedInputTokens: numberField(value.input_tokens),
    outputTokens: numberField(value.output_tokens),
    cacheCreationInputTokens: numberField(value.cache_creation_input_tokens),
    cacheReadInputTokens: numberField(value.cache_read_input_tokens),
  }
}

function numberField(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}
