import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { hash } from "bcryptjs"
import { logger } from "@/lib/logger"
import { sendEmail } from "@/lib/email"
import { resetPasswordEmail } from "@/lib/email-templates"

const RequestSchema = z.object({
  email: z.string().email(),
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

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 422 }
    )
  }

  const { email } = parsed.data

  // Always return 200 to prevent email enumeration (security.md rule)
  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    try {
      const rawToken = crypto.randomBytes(32).toString("hex")
      const tokenHash = await hash(rawToken, 12)

      await prisma.passwordResetToken.create({
        data: {
          email,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      })

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const resetUrl = `${baseUrl}/auth?mode=forgot-password&token=${rawToken}`

      await sendEmail({
        to: email,
        subject: "Reset your InsightOS password",
        html: resetPasswordEmail(user.name || "", resetUrl),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ err: message, email }, "Failed to process password reset request")
    }
  }

  return NextResponse.json({ success: true })
}
