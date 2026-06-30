"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button/Button"
import styles from "./VerifyEmailForm.module.css"

export function VerifyEmailForm() {
  const router = useRouter()
  
  return (
    <div className={styles.authContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Check your email</h2>
      </div>
      <div className={styles.content}>
        <div className={styles.actionGroup}>
          <p>Didn't receive the email?</p>
          <Button variant="secondary" className={styles.resendButton}>
            Resend verification email
          </Button>
        </div>
      </div>
      <div className={styles.footer}>
        <Link href="/auth?mode=login" className={styles.link}>
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
