"use client"

import React from "react"
import { Search } from "lucide-react"
import { InsightCard } from "@/components/insights/InsightCard/InsightCard"
import styles from "./Views.module.css"

interface ProjectSummary {
  id: string
  name: string
  status: string
}

interface InsightSummary {
  id: string
  type: string
  title: string
  description: string
  severity: string | null
  evidence: string | null
  status: string
  createdAt: Date
  artifact: {
    project: { id: string; name: string }
  }
}

export function InsightsFilterable({
  projects,
  allInsights,
}: {
  projects: ProjectSummary[]
  allInsights: InsightSummary[]
}) {
  const [projectFilter, setProjectFilter] = React.useState("all")
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("newest")

  const filtered = allInsights
    .filter((i) => projectFilter === "all" || i.artifact?.project?.id === projectFilter)
    .filter((i) => typeFilter === "all" || i.type === typeFilter)

  const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sortBy === "severity") {
      const sa = SEVERITY_ORDER[a.severity || ""] ?? 99
      const sb = SEVERITY_ORDER[b.severity || ""] ?? 99
      return sa - sb
    }
    return 0
  })

  const painPoints = sorted.filter((i) => i.type === "PAIN_POINT")
  const jtbd = filtered.filter((i) => i.type === "JTBD")
  const opportunityAreas = filtered.filter((i) => i.type === "OPPORTUNITY")
  const designConsiderations = filtered.filter((i) => i.type === "DESIGN_CONSIDERATION")
  const recommendations = filtered.filter((i) => i.type === "RECOMMENDATION")
  const hasInsights = filtered.length > 0

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="search"
            placeholder="Search insights..."
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          <select
            className={styles.select}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.status === "ARCHIVED" ? "(Archived)" : ""}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="PAIN_POINT">Pain Points</option>
            <option value="JTBD">Jobs-To-Be-Done</option>
            <option value="OPPORTUNITY">Opportunity Areas</option>
            <option value="DESIGN_CONSIDERATION">Design Considerations</option>
          </select>
          <select
            className={styles.select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="severity">Severity (Critical First)</option>
          </select>
        </div>
      </div>

      {!hasInsights ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No insights yet</h2>
          <p className={styles.emptyText}>
            Upload research and run analysis to generate insights.
          </p>
        </div>
      ) : (
        <div className={styles.sections}>
          {painPoints.length > 0 && (
            <section className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                Pain Points
                <span className={styles.count}>{painPoints.length}</span>
              </h2>
              <div className={styles.grid}>
                {painPoints.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insightId={insight.id}
                    status={insight.status as "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_REVIEW"}
                    type={insight.type as "PAIN_POINT" | "JTBD" | "OPPORTUNITY" | "RECOMMENDATION"}
                    title={insight.title}
                    description={insight.description}
                    severity={insight.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined}
                    evidence={insight.evidence || undefined}
                  />
                ))}
              </div>
            </section>
          )}
          {jtbd.length > 0 && (
            <section className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                Jobs-To-Be-Done
                <span className={styles.count}>{jtbd.length}</span>
              </h2>
              <div className={styles.grid}>
                {jtbd.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insightId={insight.id}
                    status={insight.status as "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_REVIEW"}
                    type={insight.type as "PAIN_POINT" | "JTBD" | "OPPORTUNITY" | "RECOMMENDATION"}
                    title={insight.title}
                    description={insight.description}
                    severity={insight.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined}
                    evidence={insight.evidence || undefined}
                  />
                ))}
              </div>
            </section>
          )}
          {opportunityAreas.length > 0 && (
            <section className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                Opportunity Areas
                <span className={styles.count}>{opportunityAreas.length}</span>
              </h2>
              <div className={styles.grid}>
                {opportunityAreas.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insightId={insight.id}
                    status={insight.status as "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_REVIEW"}
                    type={insight.type as "PAIN_POINT" | "JTBD" | "OPPORTUNITY" | "RECOMMENDATION"}
                    title={insight.title}
                    description={insight.description}
                    severity={insight.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined}
                    evidence={insight.evidence || undefined}
                  />
                ))}
              </div>
            </section>
          )}
          {designConsiderations.length > 0 && (
            <section className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                Design Considerations
                <span className={styles.count}>{designConsiderations.length}</span>
              </h2>
              <div className={styles.grid}>
                {designConsiderations.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insightId={insight.id}
                    status={insight.status as "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_REVIEW"}
                    type={insight.type as "PAIN_POINT" | "JTBD" | "OPPORTUNITY" | "RECOMMENDATION" | "DESIGN_CONSIDERATION"}
                    title={insight.title}
                    description={insight.description}
                    severity={insight.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined}
                    evidence={insight.evidence || undefined}
                  />
                ))}
              </div>
            </section>
          )}
          {recommendations.length > 0 && (
            <section className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                Recommendations
                <span className={styles.count}>{recommendations.length}</span>
              </h2>
              <div className={styles.grid}>
                {recommendations.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insightId={insight.id}
                    status={insight.status as "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_REVIEW"}
                    type={insight.type as "PAIN_POINT" | "JTBD" | "OPPORTUNITY" | "RECOMMENDATION" | "DESIGN_CONSIDERATION"}
                    title={insight.title}
                    description={insight.description}
                    severity={insight.severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | undefined}
                    evidence={insight.evidence || undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  )
}
