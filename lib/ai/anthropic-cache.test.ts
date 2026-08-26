import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  decidePromptCache,
  getMinimumCacheableTokens,
  buildCacheControl,
  getAnthropicBetaHeaders,
} from "./anthropic-cache"

const ENV_KEYS = ["ANTHROPIC_PROMPT_CACHE", "ANTHROPIC_CACHE_TTL"] as const
let savedEnv: Record<string, string | undefined>

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

describe("getMinimumCacheableTokens", () => {
  it("uses the 4096 tier for haiku-4-5 and opus-4-5/4-6/4-7", () => {
    expect(getMinimumCacheableTokens("claude-haiku-4-5")).toBe(4096)
    expect(getMinimumCacheableTokens("claude-opus-4-6")).toBe(4096)
  })

  it("uses the 2048 tier for sonnet-4-6 and haiku-3-5", () => {
    expect(getMinimumCacheableTokens("claude-sonnet-4-6")).toBe(2048)
    expect(getMinimumCacheableTokens("claude-haiku-3-5")).toBe(2048)
  })

  it("falls back to 1024 for unrecognized models", () => {
    expect(getMinimumCacheableTokens("claude-2.1")).toBe(1024)
  })
})

describe("decidePromptCache", () => {
  it("disables caching when ANTHROPIC_PROMPT_CACHE is off", () => {
    process.env.ANTHROPIC_PROMPT_CACHE = "false"
    const decision = decidePromptCache("claude-haiku-4-5", 10000)
    expect(decision).toMatchObject({ enabled: false, status: "disabled" })
  })

  it("skips caching when tokens are below the model's minimum", () => {
    process.env.ANTHROPIC_PROMPT_CACHE = "true"
    const decision = decidePromptCache("claude-haiku-4-5", 100)
    expect(decision).toMatchObject({ enabled: false, status: "skipped_below_minimum", minimumTokens: 4096 })
  })

  it("enables caching with a 5m ttl by default when above the minimum", () => {
    process.env.ANTHROPIC_PROMPT_CACHE = "true"
    delete process.env.ANTHROPIC_CACHE_TTL
    const decision = decidePromptCache("claude-haiku-4-5", 5000)
    expect(decision).toMatchObject({ enabled: true, ttl: "5m", status: "requested_5m" })
  })

  it("enables caching with a 1h ttl when ANTHROPIC_CACHE_TTL=1h", () => {
    process.env.ANTHROPIC_PROMPT_CACHE = "true"
    process.env.ANTHROPIC_CACHE_TTL = "1h"
    const decision = decidePromptCache("claude-haiku-4-5", 5000)
    expect(decision).toMatchObject({ enabled: true, ttl: "1h", status: "requested_1h" })
  })
})

describe("buildCacheControl", () => {
  it("returns undefined when the decision disables caching", () => {
    const decision = decidePromptCache("claude-haiku-4-5", 0)
    process.env.ANTHROPIC_PROMPT_CACHE = "false"
    expect(buildCacheControl({ ...decision, enabled: false })).toBeUndefined()
  })

  it("returns an ephemeral cache_control with the decided ttl when enabled", () => {
    expect(
      buildCacheControl({ enabled: true, ttl: "1h", status: "requested_1h", minimumTokens: 4096 })
    ).toEqual({ type: "ephemeral", ttl: "1h" })
  })
})

describe("getAnthropicBetaHeaders", () => {
  it("returns the extended-cache-ttl beta header only for 1h caching", () => {
    expect(
      getAnthropicBetaHeaders({ enabled: true, ttl: "1h", status: "requested_1h", minimumTokens: 4096 })
    ).toEqual({ "anthropic-beta": "extended-cache-ttl-2025-04-11" })
  })

  it("returns undefined for 5m caching or when disabled", () => {
    expect(
      getAnthropicBetaHeaders({ enabled: true, ttl: "5m", status: "requested_5m", minimumTokens: 4096 })
    ).toBeUndefined()
    expect(
      getAnthropicBetaHeaders({ enabled: false, ttl: "1h", status: "disabled", minimumTokens: 4096 })
    ).toBeUndefined()
  })
})
