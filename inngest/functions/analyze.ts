import { inngest } from "@/lib/inngest"
import { repos } from "@/lib/services/registry"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { sendEmail } from "@/lib/email"
import { analysisReadyEmail, analysisFailedEmail } from "@/lib/email-templates"
import { revalidatePath } from "next/cache"
import { aiService } from "@/lib/services/ai.service"
import type { InsightType, Severity } from "@prisma/client"

interface AnalysisRequestedData {
  artifactId: string
  traceId: string
}

interface RawInsight {
  type: InsightType
  title: string
  description: string
  severity?: Severity
  evidence?: string
}

export const analyzeArtifact = inngest.createFunction(
  {
    id: "analyze-artifact",
    name: "Analyze Research Artifact",
    triggers: [{ event: "analysis/requested" }],
    cancelOn: [
      { event: "analysis/cancelled", match: "data.traceId" },
    ],
    retries: 1,
  },
  async (ctx) => {
    const { artifactId, traceId } = ctx.event.data as unknown as AnalysisRequestedData
    logger.info({ artifactId, traceId }, "analysis started")

    try {
      await ctx.step.run("mark-processing", async () => {
        logger.info({ traceId }, "step: mark-processing")
        return repos.analysisJob.update(traceId, { status: "PROCESSING" })
      })

      const artifact = await ctx.step.run("get-artifact", async () => {
        logger.info({ artifactId, traceId }, "step: get-artifact")
        return repos.artifact.findById(artifactId)
      })
      if (!artifact) throw new Error("Artifact not found")

      logger.info({ artifactId: artifact.id, hasContent: !!(artifact.content && artifact.content.length >= 50) }, "artifact loaded")

      const content = await ctx.step.run("ensure-content", async () => {
        if (artifact.content && artifact.content.length >= 50) {
          logger.info({ artifactId }, "content already exists, skipping extraction")
          return artifact.content
        }

        if (!artifact.fileUrl || !artifact.fileName) {
          throw new Error("Artifact has no content and no file to extract from.")
        }

        const fileUrl: string = artifact.fileUrl
        const fileName: string = artifact.fileName

        logger.info({ fileName }, "downloading file for extraction")

        const fileBuffer = await withTimeout(
          (async () => {
            const controller = new AbortController()
            const t = setTimeout(() => controller.abort(), 60000)
            try {
              const res = await fetch(fileUrl, { signal: controller.signal })
              if (!res.ok) throw new Error(`Failed to download file: HTTP ${res.status}`)
              return Buffer.from(await res.arrayBuffer())
            } finally {
              clearTimeout(t)
            }
          })(),
          120000,
          "File download timed out after 120s"
        )
        logger.info({ size: fileBuffer.length, fileName }, "file downloaded")

        const ext = fileName.toLowerCase().split(".").pop()

        if (ext === "txt" || ext === "csv" || ext === "md") {
          const text = fileBuffer.toString("utf-8")
          if (text.length >= 50) {
            await prisma.researchArtifact.update({
              where: { id: artifact.id },
              data: { content: text },
            })
            logger.info({ artifactId }, `${ext} content extracted`)
            return text
          }
        } else if (ext === "docx") {
          const { default: mammoth } = await import("mammoth")
          const result = await mammoth.extractRawText({ buffer: fileBuffer })
          if (result.value.length >= 50) {
            await prisma.researchArtifact.update({
              where: { id: artifact.id },
              data: { content: result.value },
            })
            logger.info({ artifactId }, "docx content extracted")
            return result.value
          }
        } else if (ext === "pdf") {
          const pdfText = await extractTextFromPdfBuffer(fileBuffer)
          if (pdfText && pdfText.length >= 50) {
            await prisma.researchArtifact.update({
              where: { id: artifact.id },
              data: { content: pdfText },
            })
            logger.info({ artifactId }, "pdf text extracted")
            return pdfText
          }

          // No text layer found — fail fast instead of attempting OCR
          throw new Error(
            "This looks like a scanned/image PDF — no embedded text was found. " +
            "Please paste the text manually."
          )
        }

        throw new Error(
          "Unsupported file type or empty content. " +
          "Please paste the text manually."
        )
      })

      logger.info({ traceId, contentLength: content?.length ?? 0 }, "content ready, checking cancellation")

      await ctx.step.run("check-not-cancelled", async () => {
        const job = await repos.analysisJob.findByTraceId(traceId)
        if (job?.status === "CANCELLED") throw new Error("Analysis cancelled by user")
      })

      logger.info({ traceId }, "calling AI service")
      const { insights } = await ctx.step.run("call-ai", async () => {
        if (!content) throw new Error("Artifact has no content")
        return withTimeout(
          aiService.analyze(content),
          150000,
          "AI analysis timed out after 150s"
        )
      })

      logger.info({ traceId, insightCount: insights.length }, "AI returned insights")

      const projectId = artifact.projectId

      await ctx.step.run("persist-insights", async () => {
        logger.info({ traceId, count: insights.length }, "persisting insights")
        return repos.insight.createMany(
          insights.map((insight: RawInsight) => ({
            ...insight,
            artifactId: artifactId,
          }))
        )
      })

      await ctx.step.run("mark-completed", async () => {
        logger.info({ traceId }, "marking job completed")
        return repos.analysisJob.update(traceId, { status: "COMPLETED" })
      })

      if (projectId) {
        await ctx.step.run("revalidate-page", async () => {
          try {
            revalidatePath(`/dashboard/projects/${projectId}`)
          } catch {
            // Non-critical
          }
        })
      }

      await ctx.step.run("send-ready-notification", async () => {
        try {
          if (projectId) {
            const project = await repos.project.findByIdSelectAdmin(projectId, { name: true, ownerId: true })
            if (project) {
              const owner = await repos.user.findByIdSelect(project.ownerId, { email: true, name: true })
              if (owner?.email) {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                await sendEmail({
                  to: owner.email,
                  subject: `Your insights for "${project.name}" are ready`,
                  html: analysisReadyEmail(owner.name || "", project.name, `${baseUrl}/dashboard/projects/${projectId}`),
                })
              }
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          logger.error({ err: message, traceId }, "Failed to send analysis-ready notification")
        }
      })

      logger.info({ traceId }, "analysis completed successfully")
      return { success: true, count: insights.length }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ err: message, traceId }, "analysis failed")

      await ctx.step.run("mark-failed", async () => {
        const job = await repos.analysisJob.findByTraceId(traceId)
        if (job?.status !== "CANCELLED") {
          await repos.analysisJob.update(traceId, { status: "FAILED", error: message })
        }
      })

      await ctx.step.run("send-failed-notification", async () => {
        try {
          const job = await repos.analysisJob.findByTraceId(traceId)
          if (job?.projectId) {
            const project = await repos.project.findByIdSelectAdmin(job.projectId, { name: true, ownerId: true })
            if (project) {
              const owner = await repos.user.findByIdSelect(project.ownerId, { email: true, name: true })
              if (owner?.email) {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                await sendEmail({
                  to: owner.email,
                  subject: `We couldn't finish analysing "${project.name}"`,
                  html: analysisFailedEmail(owner.name || "", project.name, `${baseUrl}/dashboard/projects/${job.projectId}`),
                })
              }
            }
          }
        } catch (emailErr) {
          const emsg = emailErr instanceof Error ? emailErr.message : String(emailErr)
          logger.error({ err: emsg, traceId }, "Failed to send analysis-failed notification")
        }
      })

      return { success: false, error: message }
    }
  }
)

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string | null> {
  try {
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    return result.text
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ err: msg }, "pdf-parse extraction failed — file is likely a scanned/image PDF")
    return null
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ])
}
