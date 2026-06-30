import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { IAnalysisJobRepository } from "@/lib/repositories/interfaces"

export class AnalysisJobRepository implements IAnalysisJobRepository {
  async create(data: Prisma.AnalysisJobCreateInput) {
    await prisma.analysisJob.create({ data })
  }

  async update(traceId: string, data: Prisma.AnalysisJobUpdateInput) {
    await prisma.analysisJob.update({ where: { traceId }, data })
  }

  async existsQueuedOrProcessing(projectId: string) {
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000)
    const job = await prisma.analysisJob.findFirst({
      where: {
        projectId,
        status: { in: ["QUEUED", "PROCESSING"] },
        createdAt: { gte: staleThreshold },
      },
      select: { id: true },
    })
    if (!job) {
      await prisma.analysisJob.updateMany({
        where: {
          projectId,
          status: { in: ["QUEUED", "PROCESSING"] },
          createdAt: { lt: staleThreshold },
        },
        data: { status: "FAILED", error: "Stale job timed out" },
      })
    }
    return job !== null
  }

  async findByTraceId(traceId: string) {
    return prisma.analysisJob.findUnique({
      where: { traceId },
      select: { projectId: true, status: true },
    })
  }

  async countCompletedByProjectIds(projectIds: string[], startOfMonth: Date) {
    return prisma.analysisJob.count({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: startOfMonth },
        status: "COMPLETED",
      },
    })
  }
}
