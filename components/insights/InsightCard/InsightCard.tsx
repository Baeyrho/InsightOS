"use client"

import React from "react"
import { FlagButtons } from "@/components/insights/FlagButtons/FlagButtons"
import styles from "./InsightCard.module.css"

export type InsightType = "PAIN_POINT" | "JTBD" | "OPPORTUNITY" | "RECOMMENDATION" | "DESIGN_CONSIDERATION"
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
export type InsightStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_REVIEW"

interface InsightCardProps {
  insightId: string
  status?: InsightStatus
  type: InsightType
  title: string
  description: string
  severity?: Severity
  evidence?: string
}

const SEVERITY_CLASS: Record<Severity, string> = {
  CRITICAL: styles.severityCritical,
  HIGH: styles.severityHigh,
  MEDIUM: styles.severityMedium,
  LOW: styles.severityLow,
}

const STATUS_BADGE: Record<string, string> = {
  ACCEPTED: styles.statusAccepted,
  REJECTED: styles.statusRejected,
  NEEDS_REVIEW: styles.statusNeedsReview,
  PENDING: styles.statusPending,
}

const STATUS_LABEL: Record<string, string> = {
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  NEEDS_REVIEW: "Needs Review",
  PENDING: "Pending",
}

export function InsightCard({ insightId, status: initialStatus, type, title, description, severity, evidence }: InsightCardProps) {
  const [status, setStatus] = React.useState(initialStatus)
  const cardClass = status === "REJECTED" ? `${styles.card} ${styles.rejected}` : styles.card

  return (
    <article className={cardClass}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.headerRight}>
          {status && (
            <span className={`${styles.statusBadge} ${STATUS_BADGE[status]}`}>
              {STATUS_LABEL[status]}
            </span>
          )}
          {severity && (
            <span className={`${styles.badge} ${SEVERITY_CLASS[severity]}`}>
              {severity}
            </span>
          )}
        </div>
      </header>
      <p className={styles.description}>{description}</p>
      {evidence && (
        <blockquote className={styles.evidence}>
          &ldquo;{evidence}&rdquo;
        </blockquote>
      )}
      <FlagButtons insightId={insightId} currentStatus={status || "PENDING"} onStatusChange={setStatus} />
    </article>
  )
}
