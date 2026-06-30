import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Sparkles, Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/Button/Button"
import { Card, CardTitle, CardDescription } from "@/components/ui/Card/Card"
import { Badge } from "@/components/ui/Badge/Badge"
import { BackButton } from "@/components/ui/BackButton/BackButton"
import { InsightSections } from "@/components/insights/InsightSections/InsightSections"
import { AddResearchSection } from "@/components/projects/AddResearchSection/AddResearchSection"
import { AnalysisPoller } from "@/components/projects/AnalysisPoller/AnalysisPoller"
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton/DeleteProjectButton"
import { ArchiveProjectButton } from "@/components/projects/ArchiveProjectButton/ArchiveProjectButton"
import { runAnalysis } from "@/lib/actions/analysis"
import { cancelAnalysis } from "@/lib/actions/cancel-analysis"
import { deleteArtifact } from "@/lib/actions/artifact"
import { ExportButton } from "@/components/projects/ExportButton/ExportButton"
import styles from "./project-detail.module.css"

interface Props {
  params: Promise<{ id: string }>
}

const JOB_STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "error" | "primary"> = {
  QUEUED: "default",
  PROCESSING: "primary",
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "warning",
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      name: true,
      description: true,
      status: true,
      artifacts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          fileName: true,
          createdAt: true,
          insights: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              severity: true,
              evidence: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
      exports: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          format: true,
          createdAt: true,
        },
      },
    },
  })

  if (!project) notFound()

  const allInsights = project.artifacts.flatMap((a) => a.insights)

  const painPoints = allInsights.filter((i) => i.type === "PAIN_POINT")
  const jtbd = allInsights.filter((i) => i.type === "JTBD")
  const opportunities = allInsights.filter((i) => i.type === "OPPORTUNITY")
  const recommendations = allInsights.filter((i) => i.type === "RECOMMENDATION")
  const designConsiderations = allInsights.filter((i) => i.type === "DESIGN_CONSIDERATION")

  const hasAnalysis = allInsights.length > 0
  const latestJob = await prisma.analysisJob.findFirst({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    select: { status: true, error: true, traceId: true },
  })

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackButton />
      </div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{project.name}</h1>
          {project.description && (
            <p className={styles.description}>{project.description}</p>
          )}
        </div>
        <div className={styles.headerActions}>
          <ArchiveProjectButton projectId={id} isArchived={project.status === "ARCHIVED"} />
          <DeleteProjectButton projectId={id} />
        </div>
      </header>

      <div className={styles.metaGrid}>
        <Card className={styles.metaCard}>
          <span className={styles.metaLabel}>Status</span>
          <span className={styles.metaValue}>
            <Badge variant={project.status === "ACTIVE" ? "success" : "warning"}>
              {project.status}
            </Badge>
          </span>
        </Card>
        <Card className={styles.metaCard}>
          <span className={styles.metaLabel}>Research Inputs</span>
          <span className={styles.metaValue}>{project.artifacts.length}</span>
        </Card>
        <Card className={styles.metaCard}>
          <span className={styles.metaLabel}>Insights Generated</span>
          <span className={styles.metaValue}>{allInsights.length}</span>
        </Card>
        <Card className={styles.metaCard}>
          <span className={styles.metaLabel}>Reports Exported</span>
          <span className={styles.metaValue}>{project.exports.length}</span>
        </Card>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Research Inputs</h2>
        </div>
        <div id="research-intake-portal" className={styles.intakePortal} />
        <div className={styles.descriptionRow}>
          <p className={styles.researchInputsSubtitle}>
            Upload files or paste text to analyse — interviews, surveys, notes.
          </p>
          <AddResearchSection projectId={id} size="sm" />
        </div>
        <Card className={styles.researchInputsCard}>
          {project.artifacts.length === 0 ? (
            <div className={styles.researchInputsEmpty}>
              <p className={styles.emptyText}>
                No research inputs yet. Upload documents or paste research content.
              </p>
            </div>
          ) : (
            <div className={styles.artifactList}>
              {project.artifacts.map((artifact) => (
                <Card key={artifact.id} className={styles.artifactCard}>
                  <div className={styles.artifactHeader}>
                    <CardTitle className={styles.artifactTitle}>{artifact.title}</CardTitle>
                    <div className={styles.artifactBadgeRow}>
                      <Badge variant={artifact.type === "FILE" ? "primary" : "default"}>
                        {artifact.type === "FILE" ? "File" : "Paste"}
                      </Badge>
                      <form action={deleteArtifact.bind(null, artifact.id)}>
                        <button type="submit" className={styles.deleteArtifactButton} aria-label="Delete artifact">
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  </div>
                  <CardDescription>
                    {artifact.fileName || `Added ${new Date(artifact.createdAt).toLocaleDateString()}`}
                  </CardDescription>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </section>

      <AnalysisPoller status={latestJob?.status}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Analysis</h2>
          <div className={styles.analysisActions}>
            <form action={runAnalysis.bind(null, id)}>
              <Button type="submit" size="sm">
                <Sparkles size={16} />
                Generate Insights
              </Button>
            </form>
            {(latestJob?.status === "QUEUED" || latestJob?.status === "PROCESSING") && latestJob?.traceId && (
              <form action={cancelAnalysis.bind(null, id, latestJob.traceId)}>
                <Button type="submit" size="sm" variant="outline">
                  Cancel
                </Button>
              </form>
            )}
          </div>
        </div>
        <Card className={styles.analysisCard}>
          <div className={styles.analysisStatus}>
            <span className={styles.metaLabel}>Status</span>
            <Badge variant={hasAnalysis ? "success" : latestJob?.status === "FAILED" ? "error" : latestJob?.status === "PROCESSING" ? "primary" : "default"}>
              {hasAnalysis ? "Completed" : latestJob?.status === "FAILED" ? "Failed" : latestJob?.status === "PROCESSING" ? "Processing..." : latestJob?.status === "QUEUED" ? "Queued" : "Not started"}
            </Badge>
          </div>
          {latestJob?.status === "FAILED" && latestJob?.error && (
            <p className={styles.analysisError}>
              Error: {latestJob.error}
            </p>
          )}
          {hasAnalysis && (
            <p className={styles.analysisDate}>
              Last analysis: {new Date(allInsights[0].createdAt).toLocaleDateString()}
            </p>
          )}
          {!hasAnalysis && latestJob?.status !== "FAILED" && (
            <p className={styles.analysisHint}>
              Add research inputs and generate insights to start your analysis.
            </p>
          )}
        </Card>
      </section>

      {hasAnalysis && (
        <InsightSections
          sections={[
            { key: "painPoints", label: "Pain Points", insights: painPoints },
            { key: "jtbd", label: "Jobs-To-Be-Done (JTBD)", insights: jtbd },
            { key: "opportunities", label: "Opportunity Areas", insights: opportunities },
            { key: "designConsiderations", label: "Design Considerations", insights: designConsiderations },
            { key: "recommendations", label: "Recommendations", insights: recommendations },
          ]}
        />
      )}
      </AnalysisPoller>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Export</h2>
          <ExportButton projectId={id} />
        </div>
        <Card className={styles.exportCard}>
          <p className={styles.exportText}>
            Generate a downloadable report with all insights and recommendations for this project.
          </p>
        </Card>
        {project.exports.length > 0 && (
          <div className={styles.exportHistory}>
            <h3 className={styles.historyTitle}>
              <Clock size={16} />
              Export History
            </h3>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span className={styles.tableCell}>Format</span>
                <span className={styles.tableCell}>Date</span>
              </div>
              {project.exports.map((exp) => (
                <div key={exp.id} className={styles.tableRow}>
                  <span className={styles.tableCell}>
                    <Badge variant="primary">{exp.format}</Badge>
                  </span>
                  <span className={styles.tableCell}>
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
