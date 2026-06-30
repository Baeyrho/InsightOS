import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { compare, hash } from "bcryptjs"
import { logger } from "@/lib/logger"
import { PasswordSchema } from "@/lib/password"
import { sendEmail } from "@/lib/email"
import { passwordChangedEmail } from "@/lib/email-templates"

const ResetSchema = z.object({
  token: z.string().min(1),
  password: PasswordSchema,
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    )
  }

  const parsed = ResetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 422 }
    )
  }

  const { token, password } = parsed.data

  // Find all valid, unused tokens that haven't expired
  const validTokens = await prisma.passwordResetToken.findMany({
    where: {
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
  })

  // Compare the submitted token against stored hashes
  let matchedToken: (typeof validTokens)[number] | null = null
  for (const t of validTokens) {
    const matches = await compare(token, t.tokenHash)
    if (matches) {
      matchedToken = t
      break
    }
  }

  if (!matchedToken) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "Invalid or expired reset token" } },
      { status: 400 }
    )
  }

  // Update password and mark token as used in a transaction
  try {
    const passwordHash = await hash(password, 14)
    const userEmail = matchedToken.email

    await prisma.$transaction([
      prisma.user.update({
        where: { email: userEmail },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: matchedToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    logger.info({ email: userEmail }, "Password reset completed")

    // Non-blocking: notify the user their password was changed
    try {
      const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { name: true } })
      await sendEmail({
        to: userEmail,
        subject: "Your InsightOS password was changed",
        html: passwordChangedEmail(user?.name || "", "support@insightos.app"),
      })
    } catch {
      logger.warn({ email: userEmail }, "Failed to send password-changed notification")
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ err: message }, "Failed to reset password")
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to reset password" } },
      { status: 500 }
    )
  }
}
