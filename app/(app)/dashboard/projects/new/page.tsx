import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button/Button"
import { Input } from "@/components/ui/Input/Input"
import { Card, CardTitle } from "@/components/ui/Card/Card"
import { BackButton } from "@/components/ui/BackButton/BackButton"
import { createProject } from "@/lib/actions/project"
import styles from "./new-project.module.css"

export default async function NewProjectPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  return (
    <div className={styles.page}>
      <BackButton />
      <h1 className={styles.title}>Create Project</h1>
      <Card className={styles.card}>
        <CardTitle className={styles.sectionTitle}>Project Details</CardTitle>
        <form action={createProject} className={styles.fields}>
          <Input label="Project Name" name="name" placeholder="Enter project name" />
          <div>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              placeholder="Brief description of this project"
              rows={4}
              className={styles.textarea}
            />
          </div>
          <div className={styles.actions}>
            <Link href="/dashboard/projects">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
