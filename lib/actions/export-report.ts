"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { repos } from "@/lib/services/registry"
import { revalidatePath } from "next/cache"
import { getExportStrategy } from "@/lib/services/export"
import { z } from "zod"

const ExportReportSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  format: z.enum(["PDF", "MARKDOWN", "CSV"], { message: "Invalid export format" }),
})

export async function exportReport(projectId: string, format: "PDF" | "MARKDOWN" | "CSV") {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = ExportReportSchema.safeParse({ projectId, format })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "))
  }

  const project = await repos.project.findByIdSelect(parsed.data.projectId, session.user.id, {
    name: true,
    description: true,
    artifacts: {
      select: {
        title: true,
        content: true,
        type: true,
        insights: {
          select: {
            type: true,
            title: true,
            description: true,
            severity: true,
            evidence: true,
          },
        },
      },
    },
  })
  if (!project) throw new Error("Project not found")

  const strategy = getExportStrategy(parsed.data.format)
  if (!strategy) throw new Error(`Unsupported export format: ${parsed.data.format}`)

  const result = await strategy.render(project)

  await prisma.export.create({
    data: {
      project: { connect: { id: parsed.data.projectId } },
      user: { connect: { id: session.user.id } },
      format: parsed.data.format,
    },
  })

  revalidatePath(`/dashboard/projects/${parsed.data.projectId}`)
  revalidatePath("/dashboard/reports")

  return {
    ...result,
    filename: `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_report.${result.ext}`,
  }
}
