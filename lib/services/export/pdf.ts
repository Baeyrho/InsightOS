import type { ExportStrategy, ExportResult } from "./strategies"
import type { ProjectWithArtifacts } from "./types"

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace("#", ""), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function lineHeight(size: number) { return size * 1.4 }

export const pdfStrategy: ExportStrategy = {
  format: "PDF",
  async render(project: ProjectWithArtifacts): Promise<ExportResult> {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    function writeLine(text: string, size: number, isBold = false, color?: string) {
      if (y + size > 280) { doc.addPage(); y = 20 }
      doc.setFontSize(size)
      doc.setFont("helvetica", isBold ? "bold" : "normal")
      if (color) {
        const [r, g, b] = hexToRgb(color)
        doc.setTextColor(r, g, b)
      }
      doc.text(text, margin, y)
      y += lineHeight(size)
    }

    function writeBlock(text: string, size: number, isBold = false, color?: string) {
      doc.setFontSize(size)
      doc.setFont("helvetica", isBold ? "bold" : "normal")
      if (color) {
        const [r, g, b] = hexToRgb(color)
        doc.setTextColor(r, g, b)
      }
      const lines = doc.splitTextToSize(text, maxWidth)
      for (const line of lines) {
        if (y + size > 280) { doc.addPage(); y = 20 }
        doc.text(line, margin, y)
        y += lineHeight(size)
      }
    }

    function gap(pts: number) { y += pts }

    writeLine(project.name, 20, true)
    gap(4)
    if (project.description) {
      writeLine(project.description, 10, false, "#666666")
      gap(2)
    }
    writeLine(`Generated on ${new Date().toISOString().slice(0, 10)}`, 9, false, "#999999")
    gap(10)

    for (const [ai, artifact] of project.artifacts.entries()) {
      if (ai > 0) doc.addPage()
      y = 20
      writeLine(artifact.title, 16, true)
      gap(4)
      if (artifact.content) {
        writeBlock(artifact.content.slice(0, 500) + (artifact.content.length > 500 ? "..." : ""), 10, false, "#333333")
        gap(4)
      }
      for (const insight of artifact.insights) {
        writeLine(`[${insight.type}] ${insight.title}`, 11, true)
        writeBlock(insight.description, 10, false, "#333333")
        if (insight.severity) {
          writeLine(`Severity: ${insight.severity}`, 9, false, "#666666")
        }
        if (insight.evidence) {
          writeBlock(`"${insight.evidence}"`, 9, false, "#555555")
        }
        gap(6)
      }
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))
    return { content: pdfBuffer.toString("base64"), mime: "application/pdf", ext: "pdf", encoding: "base64" }
  },
}
