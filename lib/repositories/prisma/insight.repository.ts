import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { IInsightRepository } from "@/lib/repositories/interfaces"

export class InsightRepository implements IInsightRepository {
  async createMany(data: Prisma.InsightCreateManyInput[]) {
    await prisma.insight.createMany({ data })
  }

  async update(id: string, userId: string, data: Prisma.InsightUpdateInput) {
    const insight = await prisma.insight.findFirst({
      where: { id, artifact: { project: { ownerId: userId } } },
      select: { id: true, artifact: { select: { projectId: true } } },
    })
    if (!insight) throw new Error("Insight not found")
    await prisma.insight.update({ where: { id }, data })
    return insight.artifact.projectId
  }

}
