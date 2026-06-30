import { inngest } from "@/lib/inngest"
import { repos } from "@/lib/services/registry"
import { logger } from "@/lib/logger"
import { sendEmail } from "@/lib/email"
import { renewalReminderEmail } from "@/lib/email-templates"
import { PlanRegistry } from "@/lib/plans"
import type { PlanTier } from "@/lib/plans"

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export const sendRenewalReminders = inngest.createFunction(
  {
    id: "send-renewal-reminders",
    name: "Send Subscription Renewal Reminders",
    triggers: [{ cron: "0 12 * * *" }], // Daily at 12:00 UTC
  },
  async () => {
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const subscriptions = await repos.subscription.findExpiring(now, threeDaysFromNow)

    let sent = 0
    let skipped = 0

    for (const sub of subscriptions) {
      if (!sub.user.email) {
        skipped++
        continue
      }

      // Dedupe via Redis so we don't send more than once per sub per period
      try {
        const { redis } = await import("@/lib/redis")
        const periodKey = sub.currentPeriodEnd?.toISOString().slice(0, 10) ?? ""
        const dedupKey = `renewal:reminder:${sub.id}:${periodKey}`
        const alreadySent = await redis.get(dedupKey)
        if (alreadySent) {
          skipped++
          continue
        }

        const label = PlanRegistry.label(sub.tier as PlanTier)
        const renewDate = sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "soon"
        const billingLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings`

        await sendEmail({
          to: sub.user.email,
          subject: sub.cancelAtPeriodEnd
            ? `Your InsightOS ${label} ends on ${renewDate}`
            : `Your InsightOS ${label} renews on ${renewDate}`,
          html: renewalReminderEmail(sub.user.name || "", label, renewDate, billingLink, sub.cancelAtPeriodEnd),
        })

        await redis.set(dedupKey, "1", { ex: 7 * 24 * 3600 })
        sent++
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        logger.error({ err: message, subId: sub.id }, "Failed to send renewal reminder")
        skipped++
      }
    }

    logger.info({ sent, skipped, total: subscriptions.length }, "Renewal reminders processed")
    return { sent, skipped }
  }
)
