"use client"

import { X } from "lucide-react"
import styles from "./PasswordRequirements.module.css"

interface Requirement {
  label: string
  test: (value: string) => boolean
}

const requirements: Requirement[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One special character", test: (v) => /[^a-zA-Z0-9]/.test(v) },
]

export function PasswordRequirements({ value }: { value: string }) {
  if (!value) return null

  const failing = requirements.filter((r) => !r.test(value))
  if (failing.length === 0) return null

  return (
    <ul className={styles.list} aria-label="Password requirements">
      {failing.map((req) => (
        <li key={req.label} className={styles.item}>
          <X size={12} className={styles.icon} />
          {req.label}
        </li>
      ))}
    </ul>
  )
}
