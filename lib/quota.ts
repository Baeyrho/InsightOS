import { repos } from "@/lib/services/registry"
import { PlanRegistry } from "@/lib/plans"
import type { PlanTier } from "@/lib/plans"
import { logger } from "@/lib/logger"
import { sendEmail } from "@/lib/email"
import { quotaNearlyReachedEmail } from "@/lib/email-templates"

async function getMonthlyUsage(userId: string): Promise<{ count: number; limit: number; tier: PlanTier }> {
  const subscription = await repos.subscription.findByUserId(userId)
  const tier = (subscription?.tier || "FREE") as PlanTier
  const config = PlanRegistry.get(tier)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const userProjectIds = (
    await repos.project.findByOwner(userId)
  ).map((p) => p.id)

  const count = await repos.analysisJob.countCompletedByProjectIds(userProjectIds, startOfMonth)

  return { count, limit: config.monthlyAnalyses, tier }
}

export class QuotaService {
  static async assertCanRunAnalysis(userId: string) {
    const { count, limit, tier } = await getMonthlyUsage(userId)
    const config = PlanRegistry.get(tier)

    if (count >= limit) {
      throw new Error(`Quota exceeded: Your ${config.name} plan allows ${config.monthlyAnalyses} analyses per month.`)
    }

    return true
  }

  static async sendQuotaWarningIfNeeded(userId: string) {
    const { count, limit, tier } = await getMonthlyUsage(userId)
    if (tier === "FREE" && limit === 0) return

    const threshold = Math.ceil(limit * 0.8)
    if (count < threshold) return

    let redisClient: import("@upstash/redis").Redis
    try {
      redisClient = (await import("@/lib/redis")).redis
    } catch {
      return
    }

    const period = new Date().toISOString().slice(0, 7)
    const dedupKey = `quota:warn:${userId}:${period}`
    const alreadySent = await redisClient.get(dedupKey)
    if (alreadySent) return

    const user = await repos.user.findByIdSelect(userId, { email: true, name: true })
    if (!user?.email) return

    try {
      const billingLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings`
      await sendEmail({
        to: user.email,
        subject: "You've used 80% of your monthly analyses",
        html: quotaNearlyReachedEmail(user.name || "", count, limit, billingLink),
      })
      await redisClient.set(dedupKey, "1", { ex: 62 * 24 * 3600 })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ err: message, userId }, "Failed to send quota warning email")
    }
  }
}
