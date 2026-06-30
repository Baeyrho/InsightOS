"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import styles from "./AuthLayout.module.css"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.centeredLogo}>
            <div className={styles.logoBadge}>IO</div>
            <span className={styles.wordmark}>InsightOS</span>
          </div>
          <span className={styles.eyebrow}>UX RESEARCH INTELLIGENCE</span>
        </div>
        
        {/* Subtle blurred glows */}
        <div className={styles.glow1}></div>
        <div className={styles.glow2}></div>
        <div className={styles.glow3}></div>
      </div>
      
      <div className={styles.formPanel}>
        <div className={styles.topNav}>
          <Link href="/" className={styles.backHome}>
            <ArrowLeft size={16} />
            Back home
          </Link>
        </div>
        <div className={styles.formWrapper}>
          {children}
        </div>
      </div>
    </div>
  )
}
