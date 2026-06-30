import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { IArtifactRepository } from "@/lib/repositories/interfaces"

export class ArtifactRepository implements IArtifactRepository {
  async findById(id: string) {
    return prisma.researchArtifact.findUnique({
      where: { id },
      select: { id: true, projectId: true, content: true, fileUrl: true, fileName: true },
    })
  }

  async findByIdWithProject(id: string, userId: string) {
    return prisma.researchArtifact.findFirst({
      where: { id, project: { ownerId: userId } },
      select: { projectId: true },
    })
  }

  async create(data: Prisma.ResearchArtifactCreateInput) {
    await prisma.researchArtifact.create({ data })
  }

  async delete(id: string) {
    await prisma.researchArtifact.delete({ where: { id } })
  }
}
