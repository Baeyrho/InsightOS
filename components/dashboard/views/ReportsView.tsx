import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Download } from "lucide-react"
import { Badge } from "@/components/ui/Badge/Badge"
import styles from "./Views.module.css"

export default async function ReportsView() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth")

  const exports = await prisma.export.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, name: true } },
    },
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>Access and manage exported reports</p>
        </div>
      </header>

      {exports.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Download size={40} />
          </div>
          <h2 className={styles.emptyTitle}>No reports yet</h2>
          <p className={styles.emptyText}>
            When you export a report from a project, it will appear here.
          </p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.tableCell}>Project</span>
            <span className={styles.tableCell}>Format</span>
            <span className={styles.tableCell}>Date</span>
            <span className={styles.tableCell}>Actions</span>
          </div>
          {exports.map((exp) => (
            <div key={exp.id} className={styles.tableRow}>
              <span className={styles.tableCell}>
                <Link href={`/dashboard/projects/${exp.project.id}`} className={styles.projectLink}>
                  {exp.project.name}
                </Link>
              </span>
              <span className={styles.tableCell}>
                <Badge variant="primary">{exp.format}</Badge>
              </span>
              <span className={styles.tableCell}>
                {new Date(exp.createdAt).toLocaleDateString()}
              </span>
              <span className={styles.tableCell}>
                {exp.fileUrl ? (
                  <a href={exp.fileUrl} className={styles.actionLink} download>
                    <Download size={16} />
                    Download
                  </a>
                ) : (
                  <span className={styles.textMuted}>Unavailable</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
