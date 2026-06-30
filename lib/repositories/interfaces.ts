import type { Prisma } from "@prisma/client"

export interface IUserRepository {
  findById(id: string): Promise<{ id: string; name: string | null; email: string | null; passwordHash: string | null } | null>
  findByIdSelect<T extends Prisma.UserSelect>(id: string, select: T): Promise<Prisma.UserGetPayload<{ select: T }> | null>
  findByEmail(email: string): Promise<{ id: string; name: string | null; email: string | null; passwordHash: string | null } | null>
  update(id: string, data: Prisma.UserUpdateInput): Promise<void>
  delete(id: string): Promise<void>
}

export interface IProjectRepository {
  findById(id: string, userId: string): Promise<{ id: string; name: string; description: string | null; status: string; createdAt: Date; updatedAt: Date; deletedAt: Date | null } | null>
  findByIdSelect<T extends Prisma.ProjectSelect>(id: string, userId: string, select: T): Promise<Prisma.ProjectGetPayload<{ select: T }> | null>
  findByIdSelectAdmin<T extends Prisma.ProjectSelect>(id: string, select: T): Promise<Prisma.ProjectGetPayload<{ select: T }> | null>
  findByOwner(userId: string): Promise<{ id: string; name: string; description: string | null; status: string; updatedAt: Date }[]>
  findDeletedByOwner(userId: string, take?: number): Promise<{ id: string; name: string; deletedAt: Date | null }[]>
  create(userId: string, data: { name: string; description?: string }): Promise<{ id: string }>
  softDelete(id: string, userId: string): Promise<void>
  restore(id: string, userId: string): Promise<void>
  archive(id: string, userId: string): Promise<void>
  unarchive(id: string, userId: string): Promise<void>
  hardDelete(id: string, userId: string): Promise<void>
}

export interface ISubscriptionRepository {
  findByUserId(userId: string): Promise<{ tier: string | null; status: string; flwPlanId: string | null; flwSubscriptionId: string | null; flwCustomerEmail: string | null; lastTxRef: string | null; currentPeriodEnd: Date | null; cancelAtPeriodEnd: boolean } | null>
  upsert(userId: string, data: Prisma.SubscriptionCreateInput): Promise<void>
  updateManyByFlwSubId(flwSubscriptionId: string, data: Prisma.SubscriptionUpdateInput): Promise<number>
  findFirstByFlwSubId(flwSubscriptionId: string): Promise<{ id: string; tier: string; currentPeriodEnd: Date | null; user: { email: string | null; name: string | null } } | null>
  findExpiring(now: Date, threeDaysFromNow: Date): Promise<{ id: string; tier: string; status: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: Date | null; user: { email: string | null; name: string | null } }[]>
}

export interface IArtifactRepository {
  findById(id: string): Promise<{ id: string; projectId: string; content: string | null; fileUrl: string | null; fileName: string | null } | null>
  findByIdWithProject(id: string, userId: string): Promise<{ projectId: string } | null>
  create(data: Prisma.ResearchArtifactCreateInput): Promise<void>
  delete(id: string): Promise<void>
}

export interface IAnalysisJobRepository {
  create(data: Prisma.AnalysisJobCreateInput): Promise<void>
  update(traceId: string, data: Prisma.AnalysisJobUpdateInput): Promise<void>
  findByTraceId(traceId: string): Promise<{ projectId: string; status: string } | null>
  existsQueuedOrProcessing(projectId: string): Promise<boolean>
  countCompletedByProjectIds(projectIds: string[], startOfMonth: Date): Promise<number>
}

export interface IInsightRepository {
  createMany(data: Prisma.InsightCreateManyInput[]): Promise<void>
  update(id: string, userId: string, data: Prisma.InsightUpdateInput): Promise<string>
}
