"use client"

import React from "react"
import { updateInsightStatus } from "@/lib/actions/insight"
import { Check, X, AlertCircle } from "lucide-react"
import styles from "./FlagButtons.module.css"

type Status = "PENDING" | "ACCEPTED" | "REJECTED" | "NEEDS_REVIEW"

interface FlagButtonsProps {
  insightId: string
  currentStatus: Status
  onStatusChange?: (newStatus: Status) => void
}

export function FlagButtons({ insightId, currentStatus, onStatusChange }: FlagButtonsProps) {
  const [status, setStatus] = React.useState<Status>(currentStatus)
  const [pending, setPending] = React.useState(false)

  async function handleFlag(newStatus: Status) {
    if (pending || newStatus === status) return
    setPending(true)
    try {
      await updateInsightStatus(insightId, newStatus)
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    } catch {
      // revert
    } finally {
      setPending(false)
    }
  }

  const buttons: { status: Status; icon: React.ReactNode; label: string; className: string }[] = [
    { status: "ACCEPTED", icon: <Check size={14} />, label: "Accept", className: styles.accept },
    { status: "REJECTED", icon: <X size={14} />, label: "Reject", className: styles.reject },
    { status: "NEEDS_REVIEW", icon: <AlertCircle size={14} />, label: "Needs Review", className: styles.review },
  ]

  return (
    <div className={styles.container}>
      {buttons.map((btn) => (
        <button
          key={btn.status}
          type="button"
          className={`${styles.button} ${btn.className} ${status === btn.status ? styles.active : ""}`}
          onClick={() => handleFlag(btn.status)}
          disabled={pending}
          aria-label={btn.label}
          title={btn.label}
        >
          {btn.icon}
          <span className={styles.label}>{btn.label}</span>
        </button>
      ))}
    </div>
  )
}
