"use client"

import React from "react"
import { Button } from "@/components/ui/Button/Button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog"
import { deleteProject } from "@/lib/actions/project"
import { Trash2 } from "lucide-react"

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false)

  async function handleConfirm() {
    await deleteProject(projectId)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Trash2 size={16} />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete project?"
        message="This project and all its research inputs and insights will be moved to Recently Deleted. You can restore it from your dashboard within 30 days."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
