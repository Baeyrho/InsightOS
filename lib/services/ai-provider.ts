import { z } from "zod"

export const InsightSchema = z.object({
  insights: z.array(z.object({
    type: z.enum(["PAIN_POINT", "JTBD", "OPPORTUNITY", "RECOMMENDATION", "DESIGN_CONSIDERATION"]),
    title: z.string(),
    description: z.string(),
    severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
    evidence: z.string().optional(),
  }))
})

export type AnalyzeResult = z.infer<typeof InsightSchema>

export interface AiProvider {
  analyze(content: string): Promise<AnalyzeResult>
}
