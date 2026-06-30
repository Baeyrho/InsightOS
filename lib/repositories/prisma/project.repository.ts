import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { IProjectRepository } from "@/lib/repositories/interfaces"

export class ProjectRepository implements IProjectRepository {
  async findById(id: string, userId: string) {
    return prisma.project.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    })
  }

  async findByIdSelect<T extends Prisma.ProjectSelect>(id: string, userId: string, select: T) {
    return prisma.project.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
      select,
    }) as Promise<Prisma.ProjectGetPayload<{ select: T }> | null>
  }

  async findByIdSelectAdmin<T extends Prisma.ProjectSelect>(id: string, select: T) {
    return prisma.project.findUnique({
      where: { id },
      select,
    }) as Promise<Prisma.ProjectGetPayload<{ select: T }> | null>
  }

  async findByOwner(userId: string) {
    return prisma.project.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, description: true, status: true, updatedAt: true },
    })
  }

  async findDeletedByOwner(userId: string, take?: number) {
    return prisma.project.findMany({
      where: { ownerId: userId, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take,
      select: { id: true, name: true, deletedAt: true },
    })
  }

  async create(userId: string, data: { name: string; description?: string }) {
    return prisma.project.create({
      data: { ...data, ownerId: userId },
      select: { id: true },
    })
  }

  async softDelete(id: string, userId: string) {
    await prisma.project.updateMany({
      where: { id, ownerId: userId },
      data: { deletedAt: new Date() },
    })
  }

  async restore(id: string, userId: string) {
    await prisma.project.updateMany({
      where: { id, ownerId: userId },
      data: { deletedAt: null },
    })
  }

  async archive(id: string, userId: string) {
    await prisma.project.updateMany({
      where: { id, ownerId: userId },
      data: { status: "ARCHIVED" },
    })
  }

  async unarchive(id: string, userId: string) {
    await prisma.project.updateMany({
      where: { id, ownerId: userId },
      data: { status: "ACTIVE" },
    })
  }

  async hardDelete(id: string, userId: string) {
    await prisma.project.deleteMany({ where: { id, ownerId: userId } })
  }
}
