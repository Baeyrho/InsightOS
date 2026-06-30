"use server"

import { auth } from "@/lib/auth"
import { hashPassword, PasswordSchema } from "@/lib/password"
import { sendEmail } from "@/lib/email"
import { passwordChangedEmail } from "@/lib/email-templates"
import { logger } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { repos } from "@/lib/services/registry"
import { z } from "zod"

const ChangePasswordSchema = z.object({
  current: z.string().min(1, "Current password is required"),
  password: PasswordSchema,
})

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const raw = {
    current: formData.get("current") as string,
    password: formData.get("password") as string,
  }

  const parsed = ChangePasswordSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "))
  }

  const user = await repos.user.findById(session.user.id)
  if (!user?.passwordHash) throw new Error("No password set")

  const { verifyPassword } = await import("@/lib/password")
  const valid = await verifyPassword(parsed.data.current, user.passwordHash)
  if (!valid) throw new Error("Current password is incorrect")

  const passwordHash = await hashPassword(parsed.data.password)
  await repos.user.update(session.user.id, { passwordHash })

  revalidatePath("/dashboard/settings")

  if (user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: "Your InsightOS password was changed",
        html: passwordChangedEmail(user.name || "", "support@insightos.app"),
      })
    } catch {
      logger.warn({ scope: "change-password" }, "Failed to send password-changed notification")
    }
  }
}

export async function deleteAccount() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await repos.user.delete(session.user.id)

  revalidatePath("/auth")
  redirect("/auth")
}
