"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import styles from "./BackButton.module.css"

export function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className={styles.backButton}
      aria-label="Go back"
    >
      <ArrowLeft size={18} />
    </button>
  )
}
