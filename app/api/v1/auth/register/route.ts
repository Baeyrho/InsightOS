import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { hashPassword, PasswordSchema } from "@/lib/password"
import { logger } from "@/lib/logger"
import { sendEmail } from "@/lib/email"
import { welcomeEmail } from "@/lib/email-templates"

const RegisterSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email(),
  password: PasswordSchema,
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ reason: message }, "Failed to parse request body")
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    )
  }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 422 }
    )
  }

  const { name, email, password } = parsed.data

  try {
    await prisma.$connect()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ reason: message }, "Database connection failed")
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "Database connection failed" } },
      { status: 503 }
    )
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Email already registered" } },
        { status: 409 }
      )
    }

    const retired = await prisma.retiredEmail.findUnique({ where: { email } })
    if (retired) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Email already registered" } },
        { status: 409 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ reason: message }, "Failed to check email availability")
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not verify email availability" } },
      { status: 500 }
    )
  }

  let passwordHash: string
  try {
    passwordHash = await hashPassword(password)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ reason: message }, "Failed to hash password")
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to process password" } },
      { status: 500 }
    )
  }

  try {
    await prisma.user.create({
      data: {
        name: name ?? null,
        email,
        passwordHash,
      },
    })

    // Non-blocking: send welcome email
    sendEmail({
      to: email,
      subject: "Welcome to InsightOS",
      html: welcomeEmail(name || ""),
    }).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      logger.warn({ err: message }, "Failed to send welcome email")
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ reason: message }, "Failed to create user in database")
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create account" } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
