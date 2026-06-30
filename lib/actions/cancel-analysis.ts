"use server"

import { auth } from "@/lib/auth"
import { repos } from "@/lib/services/registry"
import { inngest } from "@/lib/inngest"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const CancelAnalysisSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  traceId: z.string().min(1, "Trace ID is required"),
})

export async function cancelAnalysis(projectId: string, traceId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = CancelAnalysisSchema.safeParse({ projectId, traceId })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "))
  }

  const project = await repos.project.findByIdSelect(parsed.data.projectId, session.user.id, {
    id: true,
  })
  if (!project) throw new Error("Project not found")

  const job = await repos.analysisJob.findByTraceId(parsed.data.traceId)
  if (!job || job.projectId !== parsed.data.projectId) throw new Error("Analysis job not found")

  await repos.analysisJob.update(parsed.data.traceId, { status: "CANCELLED" })

  try {
    await inngest.send({
      name: "analysis/cancelled",
      data: { traceId: parsed.data.traceId },
    })
  } catch {
    // Inngest dev server might not be running — DB status is already updated
  }

  revalidatePath(`/dashboard/projects/${parsed.data.projectId}`)
}
