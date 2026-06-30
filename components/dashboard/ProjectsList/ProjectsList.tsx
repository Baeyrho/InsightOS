"use client"

import { useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/Button/Button"
import { Card, CardTitle, CardDescription } from "@/components/ui/Card/Card"
import { Badge } from "@/components/ui/Badge/Badge"
import styles from "./ProjectsList.module.css"

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "default" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  ARCHIVED: { label: "Archived", variant: "warning" },
}

import type { Project } from "@prisma/client"
type ProjectSummary = Pick<Project, "id" | "name" | "description" | "status" | "updatedAt">

export function ProjectsList({ projects }: { projects: ProjectSummary[] }) {
  const [filter, setFilter] = useState("all")

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter)

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="search"
            placeholder="Search projects..."
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          <select
            className={styles.select}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>
            {filter === "all" ? "No projects yet" : "No archived projects"}
          </h2>
          <p className={styles.emptyText}>
            {filter === "all"
              ? "Create your first project to start generating insights."
              : "Archived projects will appear here."}
          </p>
          {filter === "all" && (
            <Link href="/dashboard/projects/new">
              <Button>Create Project</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className={styles.card}>
                <div className={styles.cardHeader}>
                  <CardTitle className={styles.cardTitle}>{project.name}</CardTitle>
                  <Badge variant={STATUS_LABELS[project.status]?.variant || "default"}>
                    {STATUS_LABELS[project.status]?.label || project.status}
                  </Badge>
                </div>
                <CardDescription>{project.description || "No description"}</CardDescription>
                <div className={styles.cardMeta}>
                  <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
