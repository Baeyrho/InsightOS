"use client"

import React from "react"
import { InsightCard } from "@/components/insights/InsightCard/InsightCard"
import styles from "./InsightSections.module.css"

interface InsightData {
  id: string
  type: string
  title: string
  description: string
  severity: string | null
  evidence: string | null
  status: string
}

interface Section {
  key: string
  label: string
  insights: InsightData[]
}

export function InsightSections({ sections }: { sections: Section[] }) {
  const [filter, setFilter] = React.useState("ALL")

  const filteredSections = sections.map((sec) => ({
    ...sec,
    insights: filter === "ALL" ? sec.insights : sec.insights.filter((i) => i.status === filter),
  }))

  const hasAny = filteredSections.some((sec) => sec.insights.length > 0)

  if (!hasAny) return null

  return (
    <>
      <div className={styles.filterBar}>
        <label className={styles.filterLabel}>Show</label>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="NEEDS_REVIEW">Needs Review</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {filteredSections.map((sec) =>
        sec.insights.length > 0 ? (
          <section key={sec.key} className={styles.section}>
            <h2 className={styles.sectionTitle}>{sec.label}</h2>
            <div className={styles.grid}>
              {sec.insights.map((insight) => (
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
        ) : null
      )}
    </>
  )
}
