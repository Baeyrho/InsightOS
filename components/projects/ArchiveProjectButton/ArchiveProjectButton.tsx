"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button/Button"
import { archiveProject, unarchiveProject } from "@/lib/actions/project"
import { Archive, RotateCcw } from "lucide-react"

export function ArchiveProjectButton({ projectId, isArchived }: { projectId: string; isArchived: boolean }) {
  const router = useRouter()

  async function handleClick() {
    if (isArchived) {
      await unarchiveProject(projectId)
    } else {
      await archiveProject(projectId)
    }
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      {isArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
      {isArchived ? "Unarchive" : "Archive"}
    </Button>
  )
}
