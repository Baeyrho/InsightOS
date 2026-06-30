import type { ExportStrategy } from "./strategies"
import { markdownStrategy } from "./markdown"
import { csvStrategy } from "./csv"
import { pdfStrategy } from "./pdf"

const strategies: ExportStrategy[] = [markdownStrategy, csvStrategy, pdfStrategy]
const strategyMap = new Map(strategies.map((s) => [s.format, s]))

export function getExportStrategy(format: string): ExportStrategy | undefined {
  return strategyMap.get(format)
}
