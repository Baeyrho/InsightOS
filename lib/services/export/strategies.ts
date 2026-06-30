import type { ProjectWithArtifacts } from "./types"

export interface ExportResult {
  content: string
  mime: string
  ext: string
  encoding?: string
}

export interface ExportStrategy {
  format: string
  render(project: ProjectWithArtifacts): Promise<ExportResult>
}
