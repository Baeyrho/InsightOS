import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PLANS, parsePlanTier } from "@/lib/plans"
import { CheckCircle2 } from "lucide-react"
import { ProfileForm } from "./ProfileForm"
import { PasswordForm } from "./PasswordForm"
import { UpgradeButton } from "./UpgradeButton"
import { deleteAccount } from "@/lib/actions/account"
import { Button } from "@/components/ui/Button/Button"
import styles from "./settings.module.css"

function formatPrice(price: number, currency: string): string {
  if (currency === "NGN") {
    return `NGN ${price.toLocaleString("en-NG")}.00`
  }
  return `${currency} ${price}`
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth")
  }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  })

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })
  const currentTier = parsePlanTier(subscription?.tier, "FREE")
  const currentPlan = PLANS[currentTier]

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const userProjectIds = (
    await prisma.project.findMany({ where: { ownerId: userId }, select: { id: true } })
  ).map((p) => p.id)

  const analysisCount = await prisma.analysisJob.count({
    where: {
      projectId: { in: userProjectIds },
      createdAt: { gte: startOfMonth },
      status: "COMPLETED",
    },
  })

  const usagePercent = currentPlan.monthlyAnalyses > 0
    ? Math.min(Math.round((analysisCount / currentPlan.monthlyAnalyses) * 100), 100)
    : 0

  const paidTiers: Array<{ tier: "PRO" | "TEAM"; features: string[] }> = [
    {
      tier: "PRO",
      features: [
        `${PLANS.PRO.monthlyAnalyses} analyses per month`,
        `${(PLANS.PRO.maxFileSize / 1024 / 1024).toFixed(0)}MB per file`,
        "Priority support",
      ],
    },
    {
      tier: "TEAM",
      features: [
        `${PLANS.TEAM.monthlyAnalyses} analyses per month`,
        `${(PLANS.TEAM.maxFileSize / 1024 / 1024).toFixed(0)}MB per file`,
        "Unlimited projects",
        "Team collaboration",
        "Priority support",
      ],
    },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account and subscription</p>
      </header>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Profile</h2>
        </div>
        <ProfileForm name={user?.name ?? null} email={user?.email ?? null} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Subscription</h2>
        </div>

        <div className={styles.currentPlan}>
          <p className={styles.planName}>{currentPlan.name} Plan</p>
          {currentTier !== "FREE" && (
            <p className={styles.planPrice}>
              {formatPrice(currentPlan.price, currentPlan.currency)} / month
            </p>
          )}
        </div>

        <div className={styles.usageSection}>
          <div className={styles.usageHeader}>
            <span className={styles.usageLabel}>Monthly Analysis Usage</span>
            <span className={styles.usageCount}>
              {analysisCount} / {currentPlan.monthlyAnalyses} ({usagePercent}%)
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${usagePercent >= 80 ? styles.progressFillWarn : ""}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        <div className={styles.plansGrid}>
          {paidTiers.map(({ tier, features }) => {
            const plan = PLANS[tier]
            const isCurrent = currentTier === tier
            return (
              <div
                key={tier}
                className={`${styles.planCard} ${isCurrent ? styles.planCardCurrent : ""}`}
              >
                {isCurrent && <span className={styles.planCardBadge}>Current</span>}
                <h3 className={styles.planCardName}>{plan.name}</h3>
                <p className={styles.planCardPrice}>
                  {formatPrice(plan.price, plan.currency)}
                  <span className={styles.planCardCurrency}> / month</span>
                </p>
                <ul className={styles.planCardFeatures}>
                  {features.map((f) => (
                    <li key={f} className={styles.planCardFeature}>
                      <CheckCircle2 size={16} className={styles.planCardFeatureIcon} />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && <UpgradeButton tier={tier} currentTier={currentTier} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Password</h2>
        </div>
        <PasswordForm />
      </div>

      <div className={`${styles.section} ${styles.sectionDanger}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Delete Account</h2>
        </div>
        <p className={styles.dangerText}>
          Once you delete your account, there is no going back. All your projects, artifacts, and insights will be permanently removed.
        </p>
        <form action={deleteAccount}>
          <Button type="submit" variant="primary" size="md">
            Delete Account
          </Button>
        </form>
      </div>
    </div>
  )
}
