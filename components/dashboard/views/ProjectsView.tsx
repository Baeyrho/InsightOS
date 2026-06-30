import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/Button/Button"
import { ProjectsList } from "@/components/dashboard/ProjectsList/ProjectsList"
import styles from "./Views.module.css"

export default async function ProjectsView() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  let projects: Awaited<ReturnType<typeof prisma.project.findMany>>
  try {
    projects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })
  } catch {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>Manage your research projects</p>
        </header>
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Unable to load projects</h2>
          <p className={styles.emptyText}>
            The database is currently unreachable. Please check your connection and try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>Manage your research projects</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus size={18} />
            Create Project
          </Button>
        </Link>
      </header>

      <ProjectsList projects={projects} />
    </div>
  )
}
