import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { InsightsFilterable } from "./InsightsFilterable"
import styles from "./Views.module.css"

export default async function InsightsView() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, status: true },
    orderBy: { updatedAt: "desc" },
  })

  const insights = await prisma.insight.findMany({
    where: { artifact: { project: { ownerId: session.user.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      artifact: {
        select: {
          project: { select: { id: true, name: true } },
        },
      },
    },
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Insights</h1>
          <p className={styles.subtitle}>Review generated insights across all projects</p>
        </div>
      </header>

      <InsightsFilterable projects={projects} allInsights={insights} />
    </div>
  )
}
