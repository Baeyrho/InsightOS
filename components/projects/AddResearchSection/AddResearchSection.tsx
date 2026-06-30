"use client"

import React from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/Button/Button"
import { ResearchIntake } from "@/components/research/ResearchIntake/ResearchIntake"
import { Plus } from "lucide-react"

export function AddResearchSection({ projectId, size = "lg" }: { projectId: string; size?: "sm" | "md" | "lg" }) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {!open && (
        <Button size={size} variant="outline" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add Research
        </Button>
      )}
      {open && mounted && createPortal(
        <ResearchIntake
          projectId={projectId}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />,
        document.getElementById("research-intake-portal")!
      )}
    </>
  )
}
