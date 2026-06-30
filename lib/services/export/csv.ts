import type { ExportStrategy, ExportResult } from "./strategies"
import type { ProjectWithArtifacts } from "./types"

function esc(s: string): string {
  return `"${(s || "").replace(/"/g, '""')}"`
}

export const csvStrategy: ExportStrategy = {
  format: "CSV",
  async render(project: ProjectWithArtifacts): Promise<ExportResult> {
    let content = "Type,Title,Description,Severity,Evidence,Artifact\n"
    for (const artifact of project.artifacts) {
      for (const insight of artifact.insights) {
        content += `${esc(insight.type)},${esc(insight.title)},${esc(insight.description)},${esc(insight.severity || "")},${esc(insight.evidence || "")},${esc(artifact.title)}\n`
      }
    }
    return { content, mime: "text/csv", ext: "csv" }
  },
}
