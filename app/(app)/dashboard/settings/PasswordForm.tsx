"use client"

import { useState } from "react"
import { changePassword } from "@/lib/actions/account"
import { Button } from "@/components/ui/Button/Button"
import styles from "./settings.module.css"

export function PasswordForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      await changePassword(formData)
      setSuccess(true)
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="current" className={styles.label}>Current Password</label>
        <input
          id="current"
          name="current"
          type="password"
          className={styles.input}
          required
          minLength={1}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>New Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className={styles.input}
          required
          minLength={8}
        />
      </div>

      <div className={styles.formActions}>
        <Button type="submit" variant="primary" size="md" isLoading={loading}>
          Change Password
        </Button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>Password changed</p>}
    </form>
  )
}
