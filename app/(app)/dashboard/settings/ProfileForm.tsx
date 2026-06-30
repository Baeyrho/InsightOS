"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfile, type UpdateProfileResult } from "@/lib/actions/user"
import { Toast } from "@/components/ui/Toast/Toast"
import { Button } from "@/components/ui/Button/Button"
import styles from "./settings.module.css"

export function ProfileForm({ name, email }: { name: string | null; email: string | null }) {
  const router = useRouter()
  const [state, setState] = useState<UpdateProfileResult>({ success: true })
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setState({ success: true })
    setToast(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    setState(result)

    if (result.success) {
      setToast({ message: "Profile updated", type: "success" })
      router.refresh()
    } else if (result.error) {
      setToast({ message: result.error, type: "error" })
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="name" className={styles.label}>Name</label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={name ?? ""}
          className={styles.input}
        />
        {!state.success && state.fieldErrors?.name && (
          <p className={styles.fieldError}>{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={email ?? ""}
          className={styles.input}
        />
        {!state.success && state.fieldErrors?.email && (
          <p className={styles.fieldError}>{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className={styles.formActions}>
        <Button type="submit" variant="primary" size="md" isLoading={loading}>Save</Button>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </form>
  )
}
