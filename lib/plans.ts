import { z } from "zod"

/**
 * Plan definitions — safe for client import (no process.env).
 * flwPlanId is resolved server-only via getFlwPlanId().
 */
export const PLANS = {
  FREE: {
    tier: "FREE",
    name: "Free",
    monthlyAnalyses: 5,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    price: 0,
    currency: "USD",
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    monthlyAnalyses: 50,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    price: 5000,
    currency: "NGN",
  },
  TEAM: {
    tier: "TEAM",
    name: "Team",
    monthlyAnalyses: 200,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    price: 10000,
    currency: "NGN",
  },
} as const;

export type PlanTier = keyof typeof PLANS;

/** Server-only: resolve Flutterwave plan ID for a given tier. */
function getFlwPlanId(tier: PlanTier): string | undefined {
  if (tier === "PRO") return process.env.FLUTTERWAVE_PRO_PLAN_ID
  if (tier === "TEAM") return process.env.FLUTTERWAVE_TEAM_PLAN_ID
  return undefined
}

export interface PlanConfig {
  tier: PlanTier
  name: string
  monthlyAnalyses: number
  maxFileSize: number
  price: number
  currency: string
  flwPlanId?: string
}

const registry = new Map<PlanTier, PlanConfig>()

let initialized = false
function ensureInitialized() {
  if (initialized) return
  for (const [tier, plan] of Object.entries(PLANS)) {
    registry.set(tier as PlanTier, {
      tier: plan.tier as PlanTier,
      name: plan.name,
      monthlyAnalyses: plan.monthlyAnalyses,
      maxFileSize: plan.maxFileSize,
      price: plan.price,
      currency: plan.currency,
      flwPlanId: getFlwPlanId(tier as PlanTier),
    })
  }
  initialized = true
}

export class PlanRegistry {
  static get(tier: PlanTier): PlanConfig {
    ensureInitialized()
    const config = registry.get(tier)
    if (!config) throw new Error(`Unknown plan tier: ${tier}`)
    return config
  }

  static amount(tier: PlanTier): { amount: number; currency: string } {
    const config = PlanRegistry.get(tier)
    return { amount: config.price, currency: config.currency }
  }

  static label(tier: PlanTier): string {
    return PlanRegistry.get(tier).name
  }

  static flwPlanId(tier: PlanTier): string | undefined {
    return PlanRegistry.get(tier).flwPlanId
  }

  static fromFlwPlanId(flwPlanId: string): PlanTier | undefined {
    ensureInitialized()
    for (const [tier, config] of registry) {
      if (config.flwPlanId === flwPlanId) return tier
    }
    return undefined
  }

  static fromAmount(amount: number, currency: string): PlanTier | null {
    ensureInitialized()
    const tiers: PlanTier[] = ["TEAM", "PRO"]
    for (const tier of tiers) {
      const expected = PlanRegistry.amount(tier)
      if (amount >= expected.amount && currency.toUpperCase() === expected.currency.toUpperCase()) {
        return tier
      }
    }
    return null
  }
}

/** Runtime-validate a string is a valid PlanTier. Returns fallback on bad data. */
const PlanTierSchema = z.enum(["FREE", "PRO", "TEAM"])
export function parsePlanTier(raw: string | null | undefined, fallback: PlanTier = "FREE"): PlanTier {
  const result = PlanTierSchema.safeParse(raw)
  return result.success ? result.data : fallback
}
