import { prisma } from "@/lib/prisma"
import { extractText } from "@/lib/services/text-extraction"

async function main() {
  const artifacts = await prisma.researchArtifact.findMany({
    where: { type: "FILE", content: null },
  })

  console.log(`Found ${artifacts.length} artifacts with no content`)

  for (const a of artifacts) {
    if (!a.fileUrl || !a.fileName) {
      console.log(`Skipping ${a.id}: missing fileUrl or fileName`)
      continue
    }
    console.log(`Processing ${a.fileName}...`)
    const content = await extractText(a.fileUrl, a.fileName)
    if (content) {
      await prisma.researchArtifact.update({
        where: { id: a.id },
        data: { content },
      })
      console.log(`  ✓ Updated — ${content.slice(0, 100)}...`)
    } else {
      console.log(`  ✗ No text extracted`)
    }
  }

  console.log("Done")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
