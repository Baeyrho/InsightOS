import type { ResearchArtifact, Insight } from "@prisma/client"

export interface ProjectWithArtifacts {
  name: string
  description: string | null
  artifacts: (Pick<ResearchArtifact, "title" | "content" | "type"> & { insights: Pick<Insight, "type" | "title" | "description" | "severity" | "evidence">[] })[]
}
