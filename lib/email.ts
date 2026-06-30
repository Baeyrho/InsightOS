import nodemailer from "nodemailer"
import { logger } from "@/lib/logger"

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    logger.warn({ scope: "email" }, "SMTP not configured — emails will not be sent")
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: SendEmailOptions) {
  const from = process.env.SMTP_FROM || "noreply@insightos.app"
  const transporter = getTransporter()

  if (!transporter) {
    logger.info(
      { to: options.to, subject: options.subject },
      "[email mock] would send email"
    )
    return { sent: false, mocked: true }
  }

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
      html: options.html,
    })
    logger.info({ to: options.to, subject: options.subject }, "Email sent")
    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ err: message, to: options.to }, "Failed to send email")
    throw new Error("Failed to send email")
  }
}
