"use client"

import React from "react"
import { Button } from "@/components/ui/Button/Button"
import { exportReport } from "@/lib/actions/export-report"
import { Download } from "lucide-react"

export function ExportButton({ projectId }: { projectId: string }) {
  const [format, setFormat] = React.useState<"MARKDOWN" | "CSV" | "PDF">("MARKDOWN")
  const [pending, setPending] = React.useState(false)

  async function handleExport() {
    setPending(true)
    try {
      const result = await exportReport(projectId, format)
      const data = result.encoding === "base64"
        ? Uint8Array.from(atob(result.content), (c) => c.charCodeAt(0))
        : result.content
      const blob = new Blob([data], { type: result.mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as "MARKDOWN" | "CSV" | "PDF")}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          fontSize: 14,
        }}
      >
        <option value="MARKDOWN">Markdown</option>
        <option value="CSV">CSV</option>
        <option value="PDF">PDF</option>
      </select>
      <Button size="sm" onClick={handleExport} isLoading={pending}>
        <Download size={16} />
        Export Report
      </Button>
    </div>
  )
}
