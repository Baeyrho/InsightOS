import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { ISubscriptionRepository } from "@/lib/repositories/interfaces"

export class SubscriptionRepository implements ISubscriptionRepository {
  async findByUserId(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      select: {
        tier: true,
        status: true,
        flwPlanId: true,
        flwSubscriptionId: true,
        flwCustomerEmail: true,
        lastTxRef: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    })
  }

  async upsert(userId: string, data: Prisma.SubscriptionCreateInput) {
    await prisma.subscription.upsert({
      where: { userId },
      create: data,
      update: data as Prisma.SubscriptionUpdateInput,
    })
  }

  async updateManyByFlwSubId(flwSubscriptionId: string, data: Prisma.SubscriptionUpdateInput) {
    const result = await prisma.subscription.updateMany({
      where: { flwSubscriptionId },
      data,
    })
    return result.count
  }

  async findFirstByFlwSubId(flwSubscriptionId: string) {
    return prisma.subscription.findFirst({
      where: { flwSubscriptionId },
      select: { id: true, tier: true, currentPeriodEnd: true, user: { select: { email: true, name: true } } },
    })
  }

  async findExpiring(now: Date, threeDaysFromNow: Date) {
    return prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { gte: now, lte: threeDaysFromNow },
      },
      select: {
        id: true,
        tier: true,
        status: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: true,
        user: { select: { email: true, name: true } },
      },
    })
  }
}
