import OpenAI from "openai"
import { logger } from "@/lib/logger"
import { InsightSchema, type AiProvider, type AnalyzeResult } from "./ai-provider"

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is not configured")
    }
    _client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
      timeout: 120000,
      maxRetries: 0,
    })
  }
  return _client
}

export class AIService implements AiProvider {
  async analyze(content: string): Promise<AnalyzeResult> {
    if (process.env.AI_MOCK === "true") {
      logger.info({ scope: "ai-service" }, "AI_MOCK is active — returning mock insights")
      return {
        insights: [
          {
            type: "PAIN_POINT",
            title: "Overwhelming onboarding page",
            description: "Users reported that the initial onboarding page had too many choices and felt overwhelming.",
            severity: "HIGH",
            evidence: content.substring(0, 150) || "The dashboard was overwhelming with too many options."
          },
          {
            type: "JTBD",
            title: "Sign up quickly with SSO",
            description: "Users want to log in using standard SSO options, rather than filling down a manual signup form.",
            evidence: content.substring(0, 150) || "They expected a single sign-on option but had to create an account manually."
          },
          {
            type: "OPPORTUNITY",
            title: "Google/GitHub SSO integration",
            description: "Implement OAuth providers to enable seamless one-click login/signup options."
          },
          {
            type: "RECOMMENDATION",
            title: "Simplify initial onboarding widgets",
            description: "Reduce cognitive load by simplifying the dashboard cards displayed to new users.",
            severity: "MEDIUM",
            evidence: content.substring(0, 150) || "The dashboard was overwhelming."
          }
        ]
      }
    }

    const prompt = `
      You are an expert UX Researcher. Analyze the following research input and extract structured insights.
      
      Research Input:
      <research_input>
      ${content}
      </research_input>
      
      Output ONLY a JSON object with a key "insights" containing an array of insights.
      Each insight must have:
      - type: "PAIN_POINT", "JTBD", "OPPORTUNITY", "RECOMMENDATION", or "DESIGN_CONSIDERATION"
      - title: A concise headline
      - description: Detailed explanation
      - severity: (Only for PAIN_POINT) "CRITICAL", "HIGH", "MEDIUM", or "LOW"
      - evidence: A direct quote or reference from the text
    `

    const client = getClient()
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.choices[0]?.message?.content || "{}"

    try {
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text
      return InsightSchema.parse(JSON.parse(jsonStr)) as AnalyzeResult
    } catch (error) {
      logger.error({ err: error instanceof Error ? error.message : "Unknown error" }, "AI Output Parsing Failed")
      throw new Error("Failed to parse AI response")
    }
  }
}

export const aiService: AiProvider = new AIService()
