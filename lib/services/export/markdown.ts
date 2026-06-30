import type { ExportStrategy, ExportResult } from "./strategies"
import type { ProjectWithArtifacts } from "./types"

export const markdownStrategy: ExportStrategy = {
  format: "MARKDOWN",
  async render(project: ProjectWithArtifacts): Promise<ExportResult> {
    let content = `# ${project.name}\n\n`
    if (project.description) content += `${project.description}\n\n`
    content += `> Generated on ${new Date().toISOString().slice(0, 10)}\n\n---\n\n`

    for (const artifact of project.artifacts) {
      content += `## ${artifact.title}\n\n`
      if (artifact.content) {
        content += `${artifact.content.slice(0, 500)}${artifact.content.length > 500 ? "..." : ""}\n\n`
      }
      for (const insight of artifact.insights) {
        content += `### [${insight.type}] ${insight.title}\n\n`
        content += `${insight.description}\n\n`
        if (insight.severity) content += `*Severity: ${insight.severity}*\n\n`
        if (insight.evidence) content += `> "${insight.evidence}"\n\n`
      }
    }

    return { content, mime: "text/markdown", ext: "md" }
  },
}
