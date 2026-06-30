import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "demo@insightos.app"
  const passwordHash = await hash("Password123!", 14)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Demo User",
      email,
      passwordHash,
      emailVerified: new Date(),
    },
  })

  console.log(`Seeded user: ${user.email} (id: ${user.id})`)

  const project = await prisma.project.upsert({
    where: { id: "demo-project-id" },
    update: {},
    create: {
      id: "demo-project-id",
      name: "SaaS Onboarding Research",
      description: "Customer interviews about the onboarding flow for a B2B SaaS product.",
      ownerId: user.id,
    },
  })

  console.log(`Seeded project: ${project.name}`)

  const artifact = await prisma.researchArtifact.upsert({
    where: { id: "demo-artifact-id" },
    update: {},
    create: {
      id: "demo-artifact-id",
      title: "Customer Interview #1",
      type: "PASTE",
      content: "User found the signup flow confusing. They expected a single sign-on option but had to create an account manually. The dashboard was overwhelming with too many options.",
      projectId: project.id,
    },
  })

  console.log(`Seeded artifact: ${artifact.title}`)

  const insights = [
    {
      type: "PAIN_POINT" as const,
      title: "Confusing signup flow",
      description: "Users expect SSO options during signup and find manual account creation frustrating.",
      severity: "HIGH" as const,
      evidence: "User found the signup flow confusing. They expected a single sign-on option.",
      artifactId: artifact.id,
    },
    {
      type: "JTBD" as const,
      title: "Quickly access the product without friction",
      description: "Users want to bypass account creation and get straight to value using existing credentials.",
      artifactId: artifact.id,
    },
    {
      type: "OPPORTUNITY" as const,
      title: "Add SSO providers to signup",
      description: "Integrating Google and GitHub OAuth could reduce signup abandonment.",
      artifactId: artifact.id,
    },
    {
      type: "RECOMMENDATION" as const,
      title: "Simplify the initial dashboard",
      description: "Reduce cognitive load by showing only essential widgets on first login with a progressive disclosure pattern.",
      severity: "MEDIUM" as const,
      evidence: "The dashboard was overwhelming with too many options.",
      artifactId: artifact.id,
    },
  ]

  for (const insight of insights) {
    await prisma.insight.create({ data: insight })
  }

  console.log(`Seeded ${insights.length} insights`)

  await prisma.analysisJob.create({
    data: {
      traceId: "demo-trace-id",
      idempotencyKey: "demo-idempotency-key",
      projectId: project.id,
      status: "COMPLETED",
    },
  })

  console.log("Seed complete!")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
  })
  .finally(() => prisma.$disconnect())
