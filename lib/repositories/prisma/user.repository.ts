import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { IUserRepository } from "@/lib/repositories/interfaces"

export class UserRepository implements IUserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } })
  }

  async findByIdSelect<T extends Prisma.UserSelect>(id: string, select: T) {
    return prisma.user.findUnique({ where: { id }, select }) as Promise<Prisma.UserGetPayload<{ select: T }> | null>
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } })
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    await prisma.user.update({ where: { id }, data })
  }

  async delete(id: string) {
    await prisma.user.delete({ where: { id } })
  }
}
