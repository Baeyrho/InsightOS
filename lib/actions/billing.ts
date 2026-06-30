"use server"

import { auth } from "@/lib/auth"
import { repos } from "@/lib/services/registry"
import type { PlanTier } from "@/lib/plans"
import { FlutterwaveGateway } from "@/lib/flutterwave/gateway"
import { z } from "zod"

const CheckoutPlanSchema = z.enum(["PRO", "TEAM"])

const gateway = new FlutterwaveGateway()

export async function createCheckoutSession(planTier: "PRO" | "TEAM") {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = CheckoutPlanSchema.safeParse(planTier)
  if (!parsed.success) throw new Error("Invalid plan tier")

  const user = await repos.user.findByIdSelect(session.user.id, { email: true, name: true })
  if (!user?.email) throw new Error("User email not found")

  return gateway.createCheckout(parsed.data as PlanTier, session.user.id, user.email, user.name ?? undefined)
}
