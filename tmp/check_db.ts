import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const email = "test@example.com"
    console.log("Checking User...")
    const existing = await prisma.user.findUnique({ where: { email } })
    console.log("User check passed:", existing)

    console.log("Checking RetiredEmail...")
    const retired = await prisma.retiredEmail.findUnique({ where: { email } })
    console.log("RetiredEmail check passed:", retired)
  } catch (error) {
    console.error("Prisma check failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
