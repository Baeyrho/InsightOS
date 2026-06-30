"use server"

import { auth } from "@/lib/auth"
import { repos } from "@/lib/services/registry"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const UpdateInsightStatusSchema = z.object({
  insightId: z.string().min(1, "Insight ID is required"),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "NEEDS_REVIEW"]),
})

export async function updateInsightStatus(insightId: string, status: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = UpdateInsightStatusSchema.safeParse({ insightId, status })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "))
  }

  const projectId = await repos.insight.update(parsed.data.insightId, session.user.id, { status: parsed.data.status })

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/projects/${projectId}`)
}
