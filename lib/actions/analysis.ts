"use server"

import crypto from "crypto"
import { auth } from "@/lib/auth"
import { repos } from "@/lib/services/registry"
import { inngest } from "@/lib/inngest"
import { revalidatePath } from "next/cache"
import { QuotaService } from "@/lib/quota"
import { z } from "zod"

const RunAnalysisSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
})

export async function runAnalysis(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = RunAnalysisSchema.safeParse({ projectId })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "))
  }

  const project = await repos.project.findByIdSelect(parsed.data.projectId, session.user.id, {
    id: true,
    artifacts: {
      where: { insights: { none: {} } },
      select: { id: true },
    },
  })
  if (!project) throw new Error("Project not found")

  const inFlight = await repos.analysisJob.existsQueuedOrProcessing(parsed.data.projectId)
  if (inFlight) throw new Error("Analysis is already running for this project")

  await QuotaService.assertCanRunAnalysis(session.user.id)
  await QuotaService.sendQuotaWarningIfNeeded(session.user.id)

  for (const artifact of project.artifacts) {
    const traceId = crypto.randomUUID()
    const idempotencyKey = crypto.randomUUID()

    await repos.analysisJob.create({
      traceId,
      idempotencyKey,
      projectId: parsed.data.projectId,
      status: "QUEUED",
    })

    try {
      await inngest.send({
        name: "analysis/requested",
        data: { artifactId: artifact.id, traceId },
      })
    } catch (e) {
      await repos.analysisJob.update(traceId, {
        status: "FAILED",
        error: e instanceof Error ? e.message : "Failed to dispatch analysis",
      })
    }
  }

  revalidatePath(`/dashboard/projects/${parsed.data.projectId}`)
}
