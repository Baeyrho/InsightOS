import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Upload,
  Sparkles,
  FolderKanban,
  FileText,
  Lightbulb,
  Download,
  Search,
  BarChart3,
  RotateCcw,
  Archive,
} from "lucide-react"
import { KpiCard } from "@/components/dashboard/KpiCard/KpiCard"
import { Button } from "@/components/ui/Button/Button"
import { Badge } from "@/components/ui/Badge/Badge"
import { PLANS, parsePlanTier } from "@/lib/plans"
import { restoreProject } from "@/lib/actions/project"
import styles from "./dashboard.module.css"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/auth")
  }

  const userId = session.user.id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
  const userName = user?.name || "User"

  const projects = await prisma.project.findMany({
    where: { ownerId: userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 5,
  })

  const deletedProjects = await prisma.project.findMany({
    where: { ownerId: userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: 5,
  })

  const totalProjects = await prisma.project.count({ where: { ownerId: userId, deletedAt: null } })
  const totalArtifacts = await prisma.researchArtifact.count({
    where: { project: { ownerId: userId } },
  })
  const totalInsights = await prisma.insight.count({
    where: { artifact: { project: { ownerId: userId } } },
  })
  const totalExports = await prisma.export.count({
    where: { userId },
  })

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })
  const tier = parsePlanTier(subscription?.tier, "FREE")
  const plan = PLANS[tier]

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const userProjectIds = (await prisma.project.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true },
  })).map((p) => p.id)

  const analysisCount = await prisma.analysisJob.count({
    where: {
      projectId: { in: userProjectIds },
      createdAt: { gte: startOfMonth },
      status: "COMPLETED",
    },
  })

  const recentInsights = await prisma.insight.findMany({
    where: { artifact: { project: { ownerId: userId } } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      artifact: {
        select: {
          project: { select: { id: true, name: true } },
        },
      },
    },
  })

  const statusBadge: Record<string, { label: string; variant: "default" | "primary" | "success" | "warning" | "error" }> = {
    ACTIVE: { label: "Active", variant: "success" },
    ARCHIVED: { label: "Archived", variant: "warning" },
  }

  const insightTypeLabel: Record<string, string> = {
    PAIN_POINT: "Pain Point",
    JTBD: "Job To Be Done",
    OPPORTUNITY: "Opportunity",
    RECOMMENDATION: "Recommendation",
    DESIGN_CONSIDERATION: "Design",
  }

  const severityVariant: Record<string, "error" | "warning" | "primary" | "default"> = {
    CRITICAL: "error",
    HIGH: "warning",
    MEDIUM: "primary",
    LOW: "default",
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.greeting}>Welcome back, {userName}</h1>
          <p className={styles.subtitle}>Here&apos;s what&apos;s happening across your projects.</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="search"
              placeholder="Search projects..."
              className={styles.searchInput}
            />
          </div>
        </div>
      </header>

      <div className={styles.planBanner}>
        <BarChart3 size={18} />
        <span className={styles.planText}>
          {plan.name} Plan &mdash; {analysisCount} / {plan.monthlyAnalyses} analyses used this month
        </span>
          {tier === "FREE" && (
          <Link href="/dashboard/settings" className={styles.planUpgrade}>
            Upgrade
          </Link>
        )}
      </div>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionCards}>
          <Link href="/dashboard/projects/new" className={styles.actionCard}>
            <div className={styles.actionIconPrimary}>
              <Plus size={24} />
            </div>
            <span className={styles.actionLabel}>Create Project</span>
            <span className={styles.actionDesc}>Start a new research project</span>
          </Link>
          <Link href="/dashboard/projects/new" className={styles.actionCard}>
            <div className={styles.actionIconSecondary}>
              <Upload size={24} />
            </div>
            <span className={styles.actionLabel}>Upload Research</span>
            <span className={styles.actionDesc}>Create a project and upload artifacts</span>
          </Link>
          <Link href="/dashboard/insights" className={styles.actionCard}>
            <div className={styles.actionIconTertiary}>
              <Sparkles size={24} />
            </div>
            <span className={styles.actionLabel}>View Latest Insights</span>
            <span className={styles.actionDesc}>Review generated insights</span>
          </Link>
        </div>
      </section>

      <section className={styles.kpiSection}>
        <KpiCard
          label="Total Projects"
          value={totalProjects}
          icon={<FolderKanban size={20} />}
        />
        <KpiCard
          label="Research Inputs"
          value={totalArtifacts}
          icon={<FileText size={20} />}
        />
        <KpiCard
          label="Insights Generated"
          value={totalInsights}
          icon={<Lightbulb size={20} />}
        />
        <KpiCard
          label="Reports Exported"
          value={totalExports}
          icon={<Download size={20} />}
        />
      </section>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Projects</h2>
          <Link href="/dashboard/projects" className={styles.viewAll}>
            View All
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No projects yet. Create your first project to get started.</p>
            <Link href="/dashboard/projects/new">
              <Button>Create Project</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.tableCell}>Project Name</span>
              <span className={styles.tableCell}>Status</span>
              <span className={styles.tableCell}>Last Updated</span>
              <span className={styles.tableCell}>Actions</span>
            </div>
            {projects.map((project) => (
              <div key={project.id} className={styles.tableRow}>
                <span className={styles.tableCell}>
                  <Link href={`/dashboard/projects/${project.id}`} className={styles.projectLink}>
                    {project.name}
                  </Link>
                </span>
                <span className={styles.tableCell}>
                  <Badge variant={(statusBadge[project.status]?.variant as "success" | "warning") || "default"}>
                    {(statusBadge[project.status]?.label) || project.status}
                  </Badge>
                </span>
                <span className={styles.tableCell}>
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
                <span className={styles.tableCell}>
                  <Link href={`/dashboard/projects/${project.id}`} className={styles.actionLink}>
                    Open
                  </Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Insights</h2>
          <Link href="/dashboard/insights" className={styles.viewAll}>
            View All
          </Link>
        </div>
        {recentInsights.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No insights generated yet. Upload research and run analysis to generate insights.
            </p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.tableCell}>Insight Title</span>
              <span className={styles.tableCell}>Type</span>
              <span className={styles.tableCell}>Severity</span>
              <span className={styles.tableCell}>Project</span>
            </div>
            {recentInsights.map((insight) => (
              <div key={insight.id} className={styles.insightTableRow}>
                <span className={styles.tableCell}>{insight.title}</span>
                <span className={styles.tableCell}>
                  <span className={styles.typeLabel}>
                    {insightTypeLabel[insight.type] ?? insight.type}
                  </span>
                </span>
                <span className={styles.tableCell}>
                  {insight.severity ? (
                    <Badge variant={severityVariant[insight.severity] ?? "default"}>
                      {insight.severity}
                    </Badge>
                  ) : (
                    <span className={styles.naText}>—</span>
                  )}
                </span>
                <span className={styles.tableCell}>
                  <Link href={`/dashboard/projects/${insight.artifact?.project?.id}`} className={styles.projectLink}>
                    {insight.artifact?.project?.name ?? "Unknown"}
                  </Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {deletedProjects.length > 0 && (
        <section className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Recently Deleted
            </h2>
          </div>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.tableCell}>Project Name</span>
              <span className={styles.tableCell}>Deleted</span>
              <span className={styles.tableCell}>Actions</span>
            </div>
            {deletedProjects.map((project) => (
              <div key={project.id} className={styles.tableRow}>
                <span className={styles.tableCell}>{project.name}</span>
                <span className={styles.tableCell}>
                  {project.deletedAt && new Date(project.deletedAt).toLocaleDateString()}
                </span>
                <span className={styles.tableCell}>
                  <form action={restoreProject.bind(null, project.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      <RotateCcw size={14} />
                      Restore
                    </Button>
                  </form>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
